let triviaData = null;
let currentQ = 0;
let points = 0;
let answered = false;

// Bonus state
let bonusCards = [];
let bonusFlipsLeft = 4;
let bonusMatchFound = false;
let bonusCallback = null;

async function loadTrivia() {
  const res = await fetch('data/trivia.json');
  triviaData = await res.json();
}

function showScreen(id) {
  document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

function startGame() {
  currentQ = 0;
  points = 0;
  showScreen('screen-question');
  renderQuestion();
}

function renderQuestion() {
  const q = triviaData.questions[currentQ];
  const total = triviaData.questions.length;

  document.getElementById('progress-fill').style.width = ((currentQ / total) * 100) + '%';
  document.getElementById('progress-label').textContent =
    `Question ${currentQ + 1} of ${total} · ${points} pts`;

  document.getElementById('question-text').textContent = q.question;

  const container = document.getElementById('answer-options');
  container.innerHTML = '';
  ['A', 'B', 'C', 'D'].forEach((letter, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.innerHTML = `<span class="answer-letter">${letter}</span><span>${q.options[i]}</span>`;
    btn.addEventListener('click', () => selectAnswer(i));
    container.appendChild(btn);
  });

  const exp = document.getElementById('explanation');
  exp.classList.remove('visible');
  exp.textContent = '';
  document.getElementById('next-btn').style.display = 'none';
  answered = false;
}

function selectAnswer(index) {
  if (answered) return;
  answered = true;

  const q = triviaData.questions[currentQ];
  document.querySelectorAll('.answer-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correctIndex) btn.classList.add('correct');
    if (i === index && index !== q.correctIndex) btn.classList.add('incorrect');
  });

  if (index === q.correctIndex) points += 10;

  const exp = document.getElementById('explanation');
  exp.textContent = q.explanation;
  exp.classList.add('visible');

  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = 'block';
  const isLast = currentQ === triviaData.questions.length - 1;
  nextBtn.textContent = isLast ? 'Finish — bonus round' :
    currentQ === 3 ? 'Bonus round!' : 'Next question';
}

function nextQuestion() {
  currentQ++;
  if (currentQ === 4) {
    startBonusRound(1, () => { showScreen('screen-question'); renderQuestion(); });
  } else if (currentQ >= triviaData.questions.length) {
    startBonusRound(2, () => showResults());
  } else {
    renderQuestion();
  }
}

// ─── Bonus round ─────────────────────────────────────────────────────────────

const BONUS_PAIRS = ['$10k', '$25k', '$50k', '$15k'];

function buildBonusDeck() {
  const deck = [...BONUS_PAIRS, ...BONUS_PAIRS, '★'];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function startBonusRound(roundNum, callback) {
  bonusCallback = callback;
  bonusFlipsLeft = 4;
  bonusMatchFound = false;

  bonusCards = buildBonusDeck().map((value, index) => ({
    index, value, faceUp: false, matched: false
  }));

  document.getElementById('bonus-round-label').textContent = `Bonus Round ${roundNum} of 2`;
  document.getElementById('bonus-flips-count').textContent = '4';
  document.getElementById('bonus-feedback').textContent = '';
  document.getElementById('bonus-feedback').className = 'bonus-feedback';
  document.getElementById('bonus-continue-btn').style.display = 'none';
  document.getElementById('bonus-continue-btn').textContent =
    roundNum === 2 ? 'See my results' : 'Continue';

  renderBonusGrid();
  showScreen('screen-bonus');
}

function renderBonusGrid() {
  const grid = document.getElementById('bonus-grid');
  grid.innerHTML = '';
  bonusCards.forEach(card => {
    const btn = document.createElement('button');
    let cls = 'bonus-card';
    if (card.faceUp) cls += ' face-up';
    if (card.matched) cls += ' matched';
    btn.className = cls;
    btn.dataset.index = card.index;
    btn.innerHTML = `<div class="bonus-card-back">?</div><div class="bonus-card-front">${card.value}</div>`;
    if (!card.matched && !bonusMatchFound) {
      btn.addEventListener('click', () => handleBonusCardClick(card.index));
    }
    grid.appendChild(btn);
  });
}

function handleBonusCardClick(index) {
  if (bonusMatchFound) return;
  const card = bonusCards[index];

  if (card.faceUp) {
    // Flip back down — free, no cost
    card.faceUp = false;
    updateBonusCardEl(index);
    return;
  }

  if (bonusFlipsLeft <= 0) return;

  card.faceUp = true;
  bonusFlipsLeft--;
  document.getElementById('bonus-flips-count').textContent = bonusFlipsLeft;
  updateBonusCardEl(index);

  const faceUp = bonusCards.filter(c => c.faceUp && !c.matched);
  const match = findBonusMatch(faceUp);

  if (match) {
    bonusMatchFound = true;
    match.forEach(c => { c.matched = true; });
    points += 25;
    renderBonusGrid();
    const fb = document.getElementById('bonus-feedback');
    fb.innerHTML = '<strong>+25 pts</strong> — matched!';
    fb.className = 'bonus-feedback win';
    document.getElementById('bonus-continue-btn').style.display = 'block';
  } else if (bonusFlipsLeft === 0) {
    renderBonusGrid(); // re-render to remove click listeners
    const fb = document.getElementById('bonus-feedback');
    fb.textContent = 'No match this time — the bond market is tricky.';
    fb.className = 'bonus-feedback miss';
    document.getElementById('bonus-continue-btn').style.display = 'block';
  }
}

function findBonusMatch(cards) {
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].value === cards[j].value && cards[i].value !== '★') {
        return [cards[i], cards[j]];
      }
    }
  }
  return null;
}

function updateBonusCardEl(index) {
  const btn = document.getElementById('bonus-grid')?.children[index];
  if (!btn) return;
  btn.classList.toggle('face-up', bonusCards[index].faceUp);
}

// ─── Results ─────────────────────────────────────────────────────────────────

function showResults() {
  showScreen('screen-end');
  document.getElementById('score-number').textContent = points;
  document.getElementById('score-denom').textContent = '/ 130';

  let title, sub;
  if (points >= 100) {
    title = 'Dealer bond expert.';
    sub = 'You clearly know your requirements. Your Ashton agent is going to love working with you.';
  } else if (points >= 70) {
    title = 'Pretty solid knowledge.';
    sub = 'A few gaps in the details — but nothing a quick conversation with Ashton can\'t fill in.';
  } else if (points >= 40) {
    title = 'You know the basics.';
    sub = 'Bond rules are more nuanced than most people realize. That\'s exactly what Ashton is here for.';
  } else {
    title = 'Glad you stopped by.';
    sub = 'Dealer bonding requirements are a lot. You don\'t have to know it all — just know who to call.';
  }
  document.getElementById('end-title').textContent = title;
  document.getElementById('end-sub').textContent = sub;
}

function playAgain() {
  currentQ = 0;
  points = 0;
  showScreen('screen-question');
  renderQuestion();
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadTrivia();
  showScreen('screen-intro');
  document.getElementById('start-btn')?.addEventListener('click', startGame);
  document.getElementById('next-btn')?.addEventListener('click', nextQuestion);
  document.getElementById('bonus-continue-btn')?.addEventListener('click', () => {
    if (bonusCallback) bonusCallback();
  });
  document.getElementById('play-again-btn')?.addEventListener('click', playAgain);
});
