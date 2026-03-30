import {
  GRID_SIZE,
  createInitialState,
  queueDirection,
  stepGame,
  togglePause,
} from "./gameLogic.js";

const TICK_MS = 140;
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
const status = document.querySelector("#status");
const overlay = document.querySelector("#overlay");
const overlayText = document.querySelector("#overlay-text");
const restartButton = document.querySelector("#restart-button");
const overlayButton = document.querySelector("#overlay-button");
const controlButtons = document.querySelectorAll("[data-direction]");

let state = createInitialState();
let timerId = null;

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

function initializeBoard() {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < GRID_SIZE * GRID_SIZE; index += 1) {
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
    if (!cell) {
      return;
    }
    cell.classList.add("cell--snake");
    if (index === 0) {
      cell.classList.add("cell--head");
    }
  });

  if (state.food) {
    const foodCell = cells[toIndex(state.food)];
    foodCell?.classList.add("cell--food");
  }

  score.textContent = String(state.score);
  status.textContent = state.isGameOver
    ? "Game Over"
    : state.isPaused
      ? "Paused"
      : "Running";

  const showOverlay = state.isGameOver || state.isPaused;
  overlay.hidden = !showOverlay;
  overlayText.textContent = state.isGameOver
    ? "Game over. Press restart to play again."
    : "Paused";
}

function startLoop() {
  stopLoop();
  timerId = window.setInterval(() => {
    state = stepGame(state);
    if (state.isGameOver) {
      stopLoop();
    }
    render();
  }, TICK_MS);
}

function stopLoop() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function restartGame() {
  state = createInitialState();
  render();
  startLoop();
}

function handleKeydown(event) {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === " ") {
    if (isInteractiveElement(event.target)) {
      return;
    }
    event.preventDefault();
    state = togglePause(state);
    if (state.isPaused) {
      stopLoop();
    } else if (!state.isGameOver) {
      startLoop();
    }
    render();
    return;
  }

  const nextDirection = KEY_DIRECTIONS[key];
  if (!nextDirection) {
    return;
  }

  event.preventDefault();
  state = queueDirection(state, nextDirection);
}

function toIndex(position) {
  return position.y * GRID_SIZE + position.x;
}

function isInteractiveElement(target) {
  return target instanceof HTMLElement &&
    (target.matches("button, input, select, textarea, a") ||
      target.isContentEditable);
}
