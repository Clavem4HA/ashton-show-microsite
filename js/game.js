let triviaData = null;
let currentQ = 0;
let score = 0;
let answered = false;

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
  score = 0;
  showScreen('screen-question');
  renderQuestion();
}

function renderQuestion() {
  const q = triviaData.questions[currentQ];
  const total = triviaData.questions.length;

  // Progress
  const pct = (currentQ / total) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `Question ${currentQ + 1} of ${total}`;

  // Question text
  document.getElementById('question-text').textContent = q.question;

  // Answer buttons
  const container = document.getElementById('answer-options');
  container.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.innerHTML = `<span class="answer-letter">${letters[i]}</span><span>${opt}</span>`;
    btn.addEventListener('click', () => selectAnswer(i));
    container.appendChild(btn);
  });

  // Hide explanation
  const exp = document.getElementById('explanation');
  exp.classList.remove('visible');
  exp.textContent = '';

  // Hide next button
  document.getElementById('next-btn').style.display = 'none';

  answered = false;
}

function selectAnswer(index) {
  if (answered) return;
  answered = true;

  const q = triviaData.questions[currentQ];
  const buttons = document.querySelectorAll('.answer-btn');

  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correctIndex) btn.classList.add('correct');
    if (i === index && index !== q.correctIndex) btn.classList.add('incorrect');
  });

  if (index === q.correctIndex) score++;

  // Show explanation
  const exp = document.getElementById('explanation');
  exp.textContent = q.explanation;
  exp.classList.add('visible');

  // Show next or finish
  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = 'block';
  const isLast = currentQ === triviaData.questions.length - 1;
  nextBtn.textContent = isLast ? 'See my results' : 'Next question';
}

function nextQuestion() {
  currentQ++;
  if (currentQ >= triviaData.questions.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

function showResults() {
  showScreen('screen-end');

  const total = triviaData.questions.length;
  document.getElementById('score-number').textContent = score;
  document.getElementById('score-denom').textContent = `/ ${total}`;

  // Messaging based on score
  const pct = score / total;
  let title, sub;
  if (pct >= 0.875) {
    title = 'Dealer bond expert.';
    sub = 'You clearly know your requirements. Your Ashton agent is going to love working with you.';
  } else if (pct >= 0.625) {
    title = 'Pretty solid knowledge.';
    sub = 'A few gaps in the details — but nothing a quick call to Ashton can\'t fill in.';
  } else if (pct >= 0.375) {
    title = 'You know the basics.';
    sub = 'Bond rules are more nuanced than most people realize. That\'s exactly what Ashton is here for.';
  } else {
    title = 'Glad you stopped by.';
    sub = 'Dealer bonding requirements are a lot. You don\'t have to know it all — just know who to call.';
  }

  document.getElementById('end-title').textContent = title;
  document.getElementById('end-sub').textContent = sub;

  // Always award 3x entries for completing the game
  document.getElementById('entries-badge').style.display = 'inline-flex';
}

function playAgain() {
  currentQ = 0;
  score = 0;
  showScreen('screen-question');
  renderQuestion();
}

// Entry form
document.getElementById('entry-form')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('entry-name')?.value.trim();
  const phone = document.getElementById('entry-phone')?.value.trim();
  const email = document.getElementById('entry-email')?.value.trim();
  const company = document.getElementById('entry-company')?.value.trim();

  if (!name || !phone || !email) return;

  // Store entry in localStorage (to prevent duplicate submissions this session)
  const entry = {
    name, phone, email, company,
    score,
    entries: 3, // completed game
    submittedAt: new Date().toISOString(),
    show: document.querySelector('[data-show-name]')?.textContent || 'Show'
  };

  localStorage.setItem('ashton-entry', JSON.stringify(entry));

  // Show success
  document.getElementById('entry-form').style.display = 'none';
  document.getElementById('form-success').classList.add('visible');
});

// Check if already submitted
window.addEventListener('DOMContentLoaded', async () => {
  await loadTrivia();
  showScreen('screen-intro');

  document.getElementById('start-btn')?.addEventListener('click', startGame);
  document.getElementById('next-btn')?.addEventListener('click', nextQuestion);
  document.getElementById('play-again-btn')?.addEventListener('click', playAgain);

  const existing = localStorage.getItem('ashton-entry');
  if (existing) {
    document.getElementById('entry-form').style.display = 'none';
    document.getElementById('form-success').classList.add('visible');
  }
});
