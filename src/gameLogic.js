export const GRID_SIZE = 16;
export const INITIAL_DIRECTION = "right";

export const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function createInitialState(random = Math.random) {
  const snake = [
    { x: 7, y: 8 },
    { x: 6, y: 8 },
    { x: 5, y: 8 },
  ];

  return {
    gridSize: GRID_SIZE,
    snake,
    direction: INITIAL_DIRECTION,
    pendingDirection: INITIAL_DIRECTION,
    food: placeFood(snake, GRID_SIZE, random),
    score: 0,
    isGameOver: false,
    isPaused: false,
  };
}

export function queueDirection(state, nextDirection) {
  if (!DIRECTION_VECTORS[nextDirection]) {
    return state;
  }

  const referenceDirection = state.pendingDirection ?? state.direction;
  if (OPPOSITES[referenceDirection] === nextDirection) {
    return state;
  }

  return {
    ...state,
    pendingDirection: nextDirection,
  };
}

export function togglePause(state) {
  if (state.isGameOver) {
    return state;
  }

  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function stepGame(state, random = Math.random) {
  if (state.isGameOver || state.isPaused) {
    return state;
  }

  const direction = state.pendingDirection ?? state.direction;
  const vector = DIRECTION_VECTORS[direction];
  const nextHead = {
    x: state.snake[0].x + vector.x,
    y: state.snake[0].y + vector.y,
  };
  const ateFood = positionsEqual(nextHead, state.food);

  if (
    hitsWall(nextHead, state.gridSize) ||
    hitsSnake(nextHead, state.snake, ateFood)
  ) {
    return {
      ...state,
      direction,
      pendingDirection: direction,
      isGameOver: true,
    };
  }

  const nextSnake = [nextHead, ...state.snake];

  if (!ateFood) {
    nextSnake.pop();
  }

  return {
    ...state,
    snake: nextSnake,
    direction,
    pendingDirection: direction,
    food: ateFood ? placeFood(nextSnake, state.gridSize, random) : state.food,
    score: ateFood ? state.score + 1 : state.score,
  };
}

export function placeFood(snake, gridSize, random = Math.random) {
  const occupied = new Set(snake.map(toKey));
  const openCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const cell = { x, y };
      if (!occupied.has(toKey(cell))) {
        openCells.push(cell);
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  const index = Math.floor(random() * openCells.length);
  return openCells[index];
}

export function positionsEqual(a, b) {
  return Boolean(a && b) && a.x === b.x && a.y === b.y;
}

function hitsWall(position, gridSize) {
  return (
    position.x < 0 ||
    position.x >= gridSize ||
    position.y < 0 ||
    position.y >= gridSize
  );
}

function hitsSnake(position, snake, ateFood) {
  const segmentsToCheck = ateFood ? snake : snake.slice(0, -1);
  return segmentsToCheck.some((segment) => positionsEqual(segment, position));
}

function toKey(position) {
  return `${position.x},${position.y}`;
}
