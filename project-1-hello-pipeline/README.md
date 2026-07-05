# Hello Pipeline

A tiny calculator app used to learn CI/CD basics — lint + test on every push and PR.

## Structure

```
hello-pipeline/
├── app/
│   ├── __init__.py
│   └── calculator.py
├── tests/
│   ├── __init__.py
│   └── test_calculator.py
├── requirements.txt
└── .flake8
```

## Local setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

flake8 .                        # lint — should print nothing (= clean)
pytest -v                       # tests — should show 4 passed
```
