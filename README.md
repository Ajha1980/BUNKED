# BUNKED. — Skip Smart. Stay Safe.

A student attendance and bunk calculator, built in two versions.

## Versions

- **V1.0.0** — A standalone HTML/CSS/JavaScript calculator in [`v1/`](v1/). No installation or backend required.
- **V2.0.0** — The full-stack Attendance Control Room in [`v2/`](v2/), with a Flask API, SQLite persistence, multi-subject attendance tracking, class-by-class logging, history, and an absence forecast.

The `main` branch contains both versions. The `v1.0.0` and `v2.0.0` branches preserve the respective version snapshots.

## Run V1

Open `v1/index.html` directly in any modern browser.

## Run V2

```bash
cd v2
python -m pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000.

V2 stores its local database in `v2/bunked.db` after the app is first run.

## Project layout

```
BUNKED/
├── v1/
│   └── index.html
└── v2/
    ├── app.py
    ├── requirements.txt
    ├── cpp/
    │   └── attendance_engine.cpp
    ├── static/
    │   ├── app.js
    │   └── style.css
    └── templates/
        └── index.html
```

## Calculation

For a target attendance percentage (T), classes held (H), and classes attended (A):

```
Maximum additional absences = floor((A - (T/100 × H)) / (T/100))
```

For a 75% target this is `floor((4A - 3H) / 3)`. The calculator rounds down to a whole class. Always verify your institution's official attendance rules before making attendance decisions.
