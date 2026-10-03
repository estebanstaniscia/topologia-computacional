# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`tcomp` is a Python package for computational topology notes/experiments ("Apuntes" = course notes). It's a freshly scaffolded `uv` project: `src/tcomp/__init__.py` holds only a placeholder `hello()` and there are no tests or modules yet, so most structure still needs to be decided.

Main dependencies and what they're for:
- **gudhi**, **ripser**, **persim**: persistent homology (simplicial complexes, Vietoris–Rips/alpha filtrations, persistence diagrams, and distances between them)
- **numpy**, **scipy**, **networkx**: numerics, distance matrices, graphs
- **matplotlib**: static plots; **manim**: animations
- **marimo** (and **jupyter** in the dev group): interactive notebooks

## Commands

Uses `uv` with Python 3.12 (`.python-version`) and the `uv_build` backend (src layout).

```bash
uv sync                          # install deps + dev group into .venv
uv run python -c "import tcomp"  # run code against the package
uv run pytest                    # run tests (no tests/ dir exists yet)
uv run pytest path/to/test_x.py::test_name   # single test
uv run ruff check . && uv run ruff format .  # lint / format (default ruff config)
uv run marimo edit notebook.py   # edit a marimo notebook
uv run manim -pql scene.py SceneName  # render a manim scene (low quality preview)
uv add <pkg> / uv add --dev <pkg>     # add dependencies
```
