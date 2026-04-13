import {
  GRID_SIZE,
  createInitialState,
  queueDirection,
  stepGame,
  togglePause,
} from "./gameLogic.js";

const BASE_TICK_MS = 150;
const MIN_TICK_MS = 62;
const SPEED_STEP = 7;
const HIGH_SCORE_KEY = "snake-high-score";
const THEME_KEY = "snake-theme";
const THEMES = new Set(["classic", "dark", "neon"]);
const MUSIC_NOTES = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 392];
const MUSIC_STEP_SECONDS = 0.22;
const MUSIC_VOLUME = 0.045;

const KEY_DIRECTIONS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
};

const board = document.querySelector("#board");
const score = document.querySelector("#score");
const highScore = document.querySelector("#high-score");
const speed = document.querySelector("#speed");
const status = document.querySelector("#status");
const overlay = document.querySelector("#overlay");
const overlayText = document.querySelector("#overlay-text");
const restartButton = document.querySelector("#restart-button");
const overlayButton = document.querySelector("#overlay-button");
const musicButton = document.querySelector("#music-button");
const controlButtons = document.querySelectorAll("[data-direction]");
const actionButtons = document.querySelectorAll("[data-action]");
const themeButtons = document.querySelectorAll("[data-theme]");

let state = createInitialState();
let animationId = null;
let lastFrameTime = 0;
let elapsedSinceStep = 0;
let bestScore = readNumber(HIGH_SCORE_KEY);
let isMusicEnabled = false;
let audioContext = null;
let musicTimerId = null;
let musicNoteIndex = 0;
let musicNextNoteTime = 0;

let touchStartX = 0;
let touchStartY = 0;

applyTheme(readTheme());
initializeBoard();
render();
startLoop();

document.addEventListener("keydown", handleKeydown);

restartButton.addEventListener("click", restartGame);
overlayButton.addEventListener("click", restartGame);

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state = queueDirection(state, button.dataset.direction);
  });
});

actionButtons.forEach((button) => {
  button.addEventListener("click", handlePauseToggle);
});

musicButton.addEventListener("click", () => {
  isMusicEnabled = !isMusicEnabled;

  if (isMusicEnabled && !state.isPaused && !state.isGameOver) {
    startMusic();
  } else {
    stopMusic();
  }

  render();
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyTheme(button.dataset.theme);
  });
});

board.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

board.addEventListener("touchend", (e) => {
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    state = queueDirection(state, dx > 0 ? "right" : "left");
  } else {
    state = queueDirection(state, dy > 0 ? "down" : "up");
  }
});

function initializeBoard() {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    fragment.appendChild(cell);
  }

  board.appendChild(fragment);
}

function render() {
  const cells = board.children;

  for (const cell of cells) {
    cell.className = "cell";
  }

  state.snake.forEach((segment, index) => {
    const cell = cells[toIndex(segment)];
    if (!cell) return;

    cell.classList.add("cell--snake");
    if (index === 0) cell.classList.add("cell--head");
  });

  if (state.food) {
    const foodCell = cells[toIndex(state.food)];
    foodCell?.classList.add("cell--food");
  }

  if (state.score > bestScore) {
    bestScore = state.score;
    localStorage.setItem(HIGH_SCORE_KEY, String(bestScore));
  }

  score.textContent = String(state.score);
  highScore.textContent = String(bestScore);
  speed.textContent = `${getSpeedMultiplier(state.score)}x`;

  status.textContent = state.isGameOver
    ? "Game Over"
    : state.isPaused
    ? "Paused"
    : "Running";

  const showOverlay = state.isGameOver || state.isPaused;
  overlay.hidden = !showOverlay;
  overlay.style.display = showOverlay ? "grid" : "none";

  overlayText.textContent = state.isGameOver
    ? "Game over. Press Space, Enter, or Restart."
    : "Paused. Press Space or Enter to resume.";

  musicButton.textContent = isMusicEnabled ? "Music On" : "Music Off";
  musicButton.setAttribute("aria-pressed", String(isMusicEnabled));
}

function startLoop() {
  if (animationId !== null) return;

  lastFrameTime = performance.now();
  animationId = requestAnimationFrame(runFrame);
}

function runFrame(timestamp) {
  if (state.isPaused || state.isGameOver) {
    stopMusic();
    animationId = null;
    return;
  }

  elapsedSinceStep += timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  const tickMs = getTickMs(state.score);
  if (elapsedSinceStep >= tickMs) {
    elapsedSinceStep %= tickMs;

    state = stepGame(state);

    render();

    if (state.isGameOver) {
      stopLoop();
      stopMusic();
      playGameOverSound();
      return;
    }
  }

  animationId = requestAnimationFrame(runFrame);
}

function stopLoop() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function restartGame() {
  state = createInitialState();
  elapsedSinceStep = 0;
  render();
  startLoop();
  if (isMusicEnabled) startMusic();
}

function handleKeydown(event) {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === " " || key === "Enter") {
    if (isInteractiveElement(event.target)) return;

    event.preventDefault();

    if (state.isGameOver) {
      restartGame();
    } else if (state.isPaused) {
      handlePauseToggle();
    } else if (key === " ") {
      handlePauseToggle();
    }

    return;
  }

  const nextDirection = KEY_DIRECTIONS[key];
  if (!nextDirection) return;

  event.preventDefault();
  state = queueDirection(state, nextDirection);
}

function handlePauseToggle() {
  state = togglePause(state);

  if (state.isPaused) {
    stopLoop();
    stopMusic();
  } else if (!state.isGameOver) {
    startLoop();
    if (isMusicEnabled) startMusic();
  }

  render();
}

function toIndex(position) {
  return position.y * GRID_SIZE + position.x;
}

function getTickMs(currentScore) {
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - currentScore * SPEED_STEP);
}

function getSpeedMultiplier(currentScore) {
  return (BASE_TICK_MS / getTickMs(currentScore)).toFixed(1);
}

function readNumber(key) {
  return Number(localStorage.getItem(key)) || 0;
}

function readTheme() {
  const theme = localStorage.getItem(THEME_KEY);
  return THEMES.has(theme) ? theme : "classic";
}

function applyTheme(theme) {
  const nextTheme = THEMES.has(theme) ? theme : "classic";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);

  themeButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.theme === nextTheme)
    );
  });
}

function startMusic() {
  if (musicTimerId !== null) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext ??= new AudioContextClass();
  audioContext.resume();
  musicNextNoteTime = audioContext.currentTime;
  musicTimerId = window.setInterval(scheduleMusic, 80);
  scheduleMusic();
}

function stopMusic() {
  if (musicTimerId !== null) {
    clearInterval(musicTimerId);
    musicTimerId = null;
  }
}

function scheduleMusic() {
  if (!audioContext) return;

  const scheduleUntil = audioContext.currentTime + 0.35;
  while (musicNextNoteTime < scheduleUntil) {
    playMusicNote(MUSIC_NOTES[musicNoteIndex], musicNextNoteTime);
    musicNoteIndex = (musicNoteIndex + 1) % MUSIC_NOTES.length;
    musicNextNoteTime += MUSIC_STEP_SECONDS;
  }
}

function playMusicNote(frequency, startTime) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(MUSIC_VOLUME, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.2);
}

function isInteractiveElement(target) {
  return (
    target instanceof HTMLElement &&
    (target.matches("button, input, select, textarea, a") ||
      target.isContentEditable)
  );
}

function playGameOverSound() {
  // new Audio('gameover.mp3').play();
}
