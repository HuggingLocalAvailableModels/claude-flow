# Codex Snake Game Example

This example demonstrates using the OpenAI API (Codex) to generate a simple Snake game in Python.

## Prerequisites
- Node.js 20+
- An OpenAI API key available as the `OPENAI_API_KEY` environment variable.

## Usage
```bash
node generateSnakeGame.js
```
This will call the OpenAI API and write the resulting game code to `snake_game.py`.

You can then run the game (requires a terminal environment that supports `curses`):
```bash
python snake_game.py
```
