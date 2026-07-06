# Hello Pipeline

![CI](https://github.com/munnavuyyuru/hello-pipeline/actions/workflows/project-1-ci.yml/badge.svg)

A hands-on CI/CD learning project — lint + test + coverage on every push and PR.

## What This Repo Contains

- `app/` — a small Python package (calculator + statistics utilities)
- `tests/` — pytest test suite with 100% coverage
- `.github/workflows/project-1-ci.yml` — GitHub Actions pipeline

## Pipeline Overview

```
push / PR
   │
   ▼
┌──────┐     ┌─────────────────┐
│ lint │ ──► │ test (py 3.10)  │
└──────┘     │ test (py 3.11)  │ ──► 📦 coverage artifacts
             │ test (py 3.12)  │
             └─────────────────┘
```

- **Lint:** flake8
- **Test:** pytest across Python 3.10 / 3.11 / 3.12 (matrix)
- **Cache:** pip dependencies, keyed on `requirements.txt`
- **Artifacts:** HTML coverage reports (7-day retention)

## Run Locally

```bash
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt

flake8 .                                    # lint
pytest -v --cov --cov-report=term           # test + coverage
pytest -v --cov --cov-report=html           # HTML coverage report
```
