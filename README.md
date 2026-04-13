# Snake

Small classic Snake game built with plain HTML, CSS, and JavaScript.

## Run

Start a local static server from the repo root:

```bash
python3 -m http.server 8001 --bind 127.0.0.1
```

Then open [http://127.0.0.1:8001](http://127.0.0.1:8001).

## Test

Run the core game-logic tests with:

```bash
node --test tests/gameLogic.test.mjs
```

## Manual checklist

- Move with arrow keys and `WASD`.
- Confirm the snake grows and score increases after eating food.
- Confirm `Space` pauses and resumes the game.
- Confirm `Space` or `Enter` resumes while paused and restarts after game over.
- Confirm hitting a wall or the snake body ends the game.
- Confirm `Restart` starts a fresh run from the initial state.
- Confirm touch buttons work on smaller/mobile layouts.
- Confirm speed increases as the score grows.
- Confirm `Music Off` starts and stops the in-game music.
- Confirm best score persists after refresh.
- Confirm Classic, Dark, and Neon themes switch correctly.
