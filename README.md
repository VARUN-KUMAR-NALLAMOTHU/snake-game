# Snake

Small classic Snake game built with plain HTML, CSS, and JavaScript.

## Run

Start a local static server from the repo root:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Test

Run the core game-logic tests with:

```bash
node --test tests/gameLogic.test.mjs
```

## Manual checklist

- Move with arrow keys and `WASD`.
- Confirm the snake grows and score increases after eating food.
- Confirm `Space` pauses and resumes the game.
- Confirm hitting a wall or the snake body ends the game.
- Confirm `Restart` starts a fresh run from the initial state.
- Confirm touch buttons work on smaller/mobile layouts.
