const startBtn = document.getElementById("startBtn");
const quizSection = document.getElementById("quiz");
const introSection = document.getElementById("intro");
const resultSection = document.getElementById("result");
const questionText = document.getElementById("questionText");
const answersDiv = document.getElementById("answers");
const nextBtn = document.getElementById("nextBtn");
const scoreValue = document.getElementById("scoreValue");
const finalScore = document.getElementById("finalScore");
const currentQ = document.getElementById("current");
const totalQ = document.getElementById("total");
const topicSelect = document.getElementById("topic");
const countSelect = document.getElementById("count");
const difficultySelect = document.getElementById("difficulty");
const timerToggle = document.getElementById("timerToggle");
const timerDiv = document.getElementById("timer");
const timeLeftSpan = document.getElementById("timeLeft");
const restartBtn = document.getElementById("restartBtn");
const saveScoreBtn = document.getElementById("saveScoreBtn");
const playerNameInput = document.getElementById("playerName");
const leaderboardList = document.getElementById("leaderboard");
const progressBar = document.querySelector(".progress-bar");

let questions = [];
let currentIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 15;
let timerEnabled = false;

// Fetch questions from Open Trivia DB API
async function fetchQuestions(category, count, difficulty) {
  const categoryMap = {
    general: 9,
    tech: 18,
    science: 17,
    history: 23,
    sports: 21,
    movies: 11
  };
  const url = `https://opentdb.com/api.php?amount=${count}&category=${categoryMap[category]}&difficulty=${difficulty}&type=multiple`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results.map(q => {
    const answers = [...q.incorrect_answers];
    const randomIndex = Math.floor(Math.random() * (answers.length + 1));
    answers.splice(randomIndex, 0, q.correct_answer);
    return {
      question: decodeHTML(q.question),
      answers: answers.map(a => decodeHTML(a)),
      correct: decodeHTML(q.correct_answer)
    };
  });
}

function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function startQuiz() {
  const topic = topicSelect.value;
  const count = parseInt(countSelect.value);
  const difficulty = difficultySelect.value;
  timerEnabled = timerToggle.checked;

  fetchQuestions(topic, count, difficulty).then(qs => {
    questions = qs;
    currentIndex = 0;
    score = 0;
    scoreValue.textContent = score;
    totalQ.textContent = questions.length;
    introSection.classList.add("hidden");
    resultSection.classList.add("hidden");
    quizSection.classList.remove("hidden");
    loadQuestion();
  });
}

function loadQuestion() {
  clearInterval(timerInterval);
  if (currentIndex >= questions.length) {
    endQuiz();
    return;
  }
  const q = questions[currentIndex];
  currentQ.textContent = currentIndex + 1;
  questionText.textContent = q.question;
  answersDiv.innerHTML = "";
  q.answers.forEach(ans => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.innerHTML = `<span class="label">${ans}</span>`;
    btn.onclick = () => selectAnswer(btn, ans === q.correct);
    answersDiv.appendChild(btn);
  });
  updateProgressBar();
  if (timerEnabled) startTimer();
}

function startTimer() {
  timeLeft = 15;
  timerDiv.classList.remove("hidden");
  timeLeftSpan.textContent = timeLeft;
  timerInterval = setInterval(() => {
    timeLeft--;
    timeLeftSpan.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      nextBtn.click();
    }
  }, 1000);
}

function selectAnswer(btn, isCorrect) {
  [...answersDiv.children].forEach(b => b.disabled = true);
  if (isCorrect) {
    btn.classList.add("correct");
    score++;
    scoreValue.textContent = score;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  } else {
    btn.classList.add("wrong");
    // Wrong answer shake
    questionText.parentElement.classList.add("shake");
    setTimeout(() => {
      questionText.parentElement.classList.remove("shake");
    }, 400);
  }
}

function updateProgressBar() {
  const progress = ((currentIndex) / questions.length) * 100;
  progressBar.style.width = progress + "%";
}

nextBtn.addEventListener("click", () => {
  currentIndex++;
  loadQuestion();
});

function endQuiz() {
  clearInterval(timerInterval);
  quizSection.classList.add("hidden");
  resultSection.classList.remove("hidden");
  finalScore.textContent = score;
  progressBar.style.width = "100%";
  displayLeaderboard(); // Show leaderboard immediately
}


restartBtn.addEventListener("click", () => {
  introSection.classList.remove("hidden");
  resultSection.classList.add("hidden");
  progressBar.style.width = "0";
});

saveScoreBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim() || "Anonymous";

  let scores = JSON.parse(localStorage.getItem("quizScores") || "[]");

  // Add new score
  scores.push({ name, score });

  // Sort high to low
  scores.sort((a, b) => b.score - a.score);

  // Save updated list
  localStorage.setItem("quizScores", JSON.stringify(scores));

  // Show leaderboard instantly
  displayLeaderboard();
});

function displayLeaderboard() {
  const scores = JSON.parse(localStorage.getItem("quizScores") || "[]");
  leaderboardList.innerHTML = "";

  if (scores.length === 0) {
    leaderboardList.innerHTML = "<li>No scores yet</li>";
    return;
  }

  // Get the most recent score object
  const lastEntry = scores[scores.length - 1];

  scores.forEach((entry, index) => {
    const li = document.createElement("li");

    // If name is purely numeric, prefix it to avoid confusion like 1.1
    let safeName = entry.name;
    if (/^\d+$/.test(safeName)) {
      safeName = `Player ${safeName}`;
    }

    // Use a clearer separator than "."
    li.textContent = `${safeName} — ${Number(entry.score)}`;

 
    leaderboardList.appendChild(li);
  });
}


startBtn.addEventListener("click", startQuiz);
