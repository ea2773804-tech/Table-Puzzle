const characters = [
  { id: 'ana', name: 'Ana', desc: 'Gosta de Bruno, evita Igor.' },
  { id: 'bruno', name: 'Bruno', desc: 'Prefere sentar com Ana, evita Carla.' },
  { id: 'carla', name: 'Carla', desc: 'Se dá bem com Diego, não vai com Bruno.' },
  { id: 'diego', name: 'Diego', desc: 'Gosta de Carla, evita Helena.' },
  { id: 'elisa', name: 'Elisa', desc: 'Evita Fábio e gosta de Lívia.' },
  { id: 'fabio', name: 'Fábio', desc: 'Evita Elisa, sem conflito com João.' },
  { id: 'gabriela', name: 'Gabriela', desc: 'Não se dá bem com Marcos.' },
  { id: 'helena', name: 'Helena', desc: 'Evita Diego e Igor.' },
  { id: 'igor', name: 'Igor', desc: 'Evita Ana e Helena.' },
  { id: 'joao', name: 'João', desc: 'Conflito com Karina.' },
  { id: 'karina', name: 'Karina', desc: 'Conflito com João.' },
  { id: 'livia', name: 'Lívia', desc: 'Gosta de Elisa, evita Marcos.' },
  { id: 'marcos', name: 'Marcos', desc: 'Conflito com Gabriela e Lívia.' },
  { id: 'nina', name: 'Nina', desc: 'Observadora, sem conflitos diretos.' }
];

const incompatibilities = new Map([
  ['ana', ['igor']],
  ['bruno', ['carla']],
  ['carla', ['bruno']],
  ['diego', ['helena']],
  ['elisa', ['fabio']],
  ['fabio', ['elisa']],
  ['gabriela', ['marcos']],
  ['helena', ['diego', 'igor']],
  ['igor', ['ana', 'helena']],
  ['joao', ['karina']],
  ['karina', ['joao']],
  ['livia', ['marcos']],
  ['marcos', ['gabriela', 'livia']],
  ['nina', []]
]);

const TABLE_COUNT = 7;
const SEATS_PER_TABLE = 4;

const state = {
  draggedId: null
};

const pool = document.getElementById('character-pool');
const tablesRoot = document.getElementById('tables');
const statusEl = document.getElementById('status');

function createCharacterCard(character) {
  const tmpl = document.getElementById('character-template');
  const node = tmpl.content.firstElementChild.cloneNode(true);
  node.dataset.characterId = character.id;
  node.querySelector('h3').textContent = character.name;
  node.querySelector('.description').textContent = character.desc;

  node.addEventListener('dragstart', () => {
    state.draggedId = character.id;
    node.classList.add('dragging');
  });

  node.addEventListener('dragend', () => {
    node.classList.remove('dragging');
  });

  return node;
}

function buildPool() {
  characters.forEach((character) => {
    pool.appendChild(createCharacterCard(character));
  });
}

function makeDropzone(el, onDrop) {
  el.addEventListener('dragover', (event) => {
    event.preventDefault();
    el.classList.add('drag-over');
  });

  el.addEventListener('dragleave', () => {
    el.classList.remove('drag-over');
  });

  el.addEventListener('drop', (event) => {
    event.preventDefault();
    el.classList.remove('drag-over');

    if (!state.draggedId) return;
    onDrop(state.draggedId);
    state.draggedId = null;
  });
}

function moveCharacterToSeat(characterId, seatEl) {
  const card = document.querySelector(`[data-character-id="${characterId}"]`);
  if (!card || seatEl.querySelector('.character')) return;
  seatEl.appendChild(card);
  evaluateAllTables();
}

function moveCharacterToPool(characterId) {
  const card = document.querySelector(`[data-character-id="${characterId}"]`);
  if (!card) return;
  pool.appendChild(card);
  evaluateAllTables();
}

function buildTables() {
  const tmpl = document.getElementById('table-template');

  for (let i = 1; i <= TABLE_COUNT; i += 1) {
    const tableNode = tmpl.content.firstElementChild.cloneNode(true);
    tableNode.dataset.tableId = String(i);
    tableNode.querySelector('h3').textContent = `Mesa ${i}`;
    const seatsNode = tableNode.querySelector('.table-seats');

    for (let seat = 1; seat <= SEATS_PER_TABLE; seat += 1) {
      const seatNode = document.createElement('div');
      seatNode.className = 'seat';
      seatNode.dataset.seat = String(seat);
      makeDropzone(seatNode, (characterId) => moveCharacterToSeat(characterId, seatNode));
      seatsNode.appendChild(seatNode);
    }

    tablesRoot.appendChild(tableNode);
  }
}

function findConflicts(idsAtTable) {
  const conflicts = [];

  for (let i = 0; i < idsAtTable.length; i += 1) {
    for (let j = i + 1; j < idsAtTable.length; j += 1) {
      const a = idsAtTable[i];
      const b = idsAtTable[j];
      const aList = incompatibilities.get(a) || [];
      const bList = incompatibilities.get(b) || [];

      if (aList.includes(b) || bList.includes(a)) {
        conflicts.push([a, b]);
      }
    }
  }

  return conflicts;
}

function idToName(id) {
  return characters.find((person) => person.id === id)?.name || id;
}

function evaluateAllTables() {
  const tableNodes = [...document.querySelectorAll('.table-wrap')];
  let hasConflict = false;

  tableNodes.forEach((tableNode) => {
    const ids = [...tableNode.querySelectorAll('.character')].map((node) => node.dataset.characterId);
    const feedback = tableNode.querySelector('.table-feedback');
    const conflicts = findConflicts(ids);

    if (conflicts.length > 0) {
      hasConflict = true;
      feedback.classList.add('error');
      const names = conflicts.map(([a, b]) => `${idToName(a)} × ${idToName(b)}`).join(', ');
      feedback.textContent = `Conflitos: ${names}`;
    } else {
      feedback.classList.remove('error');
      feedback.textContent = ids.length > 0 ? 'Sem conflitos nesta mesa.' : '';
    }
  });

  const seatedCount = document.querySelectorAll('.seat .character').length;
  const everyoneSeated = seatedCount === characters.length;

  if (everyoneSeated && !hasConflict) {
    statusEl.textContent = '🏆 Vitória! Todos os personagens foram acomodados sem conflitos.';
    statusEl.classList.add('win');
  } else {
    statusEl.classList.remove('win');
    statusEl.textContent = `Personagens sentados: ${seatedCount}/${characters.length}. ${
      hasConflict ? 'Existem conflitos para resolver.' : 'Nenhum conflito até agora.'
    }`;
  }
}

makeDropzone(pool, moveCharacterToPool);
buildPool();
buildTables();
evaluateAllTables();
