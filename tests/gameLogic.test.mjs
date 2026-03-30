import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialState,
  placeFood,
  queueDirection,
  stepGame,
} from "../src/gameLogic.js";

test("snake advances one cell in the current direction", () => {
  const state = createInitialState(() => 0);
  const next = stepGame(state, () => 0);

  assert.deepEqual(next.snake[0], { x: 8, y: 8 });
  assert.equal(next.snake.length, state.snake.length);
});

test("snake grows and score increments when it eats food", () => {
  const state = {
    ...createInitialState(() => 0),
    food: { x: 8, y: 8 },
  };

  const next = stepGame(state, () => 0);

  assert.equal(next.score, 1);
  assert.equal(next.snake.length, state.snake.length + 1);
  assert.notDeepEqual(next.food, state.food);
});

test("queued opposite direction is ignored", () => {
  const state = createInitialState(() => 0);
  const next = queueDirection(state, "left");

  assert.equal(next.pendingDirection, "right");
});

test("wall collisions end the game", () => {
  const state = {
    ...createInitialState(() => 0),
    snake: [{ x: 15, y: 8 }, { x: 14, y: 8 }, { x: 13, y: 8 }],
    direction: "right",
    pendingDirection: "right",
  };

  const next = stepGame(state, () => 0);
  assert.equal(next.isGameOver, true);
});

test("self collisions end the game", () => {
  const state = {
    ...createInitialState(() => 0),
    snake: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 3, y: 4 },
    ],
    food: { x: 10, y: 10 },
    direction: "down",
    pendingDirection: "down",
  };

  const next = stepGame(state, () => 0);
  assert.equal(next.isGameOver, true);
});

test("moving into the previous tail cell is allowed when not growing", () => {
  const state = {
    ...createInitialState(() => 0),
    snake: [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
    ],
    direction: "left",
    pendingDirection: "left",
    food: { x: 10, y: 10 },
  };

  const next = stepGame(state, () => 0);
  assert.equal(next.isGameOver, false);
  assert.deepEqual(next.snake[0], { x: 1, y: 1 });
});

test("food placement skips occupied cells", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];

  const food = placeFood(snake, 2, () => 0);
  assert.deepEqual(food, { x: 1, y: 1 });
});
