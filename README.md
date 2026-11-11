# BUNKED. — Skip Smart. Stay Safe.

A student attendance and bunk calculator, built in two versions.

## Versions

- **V1.0.0** — Standalone HTML/CSS/JavaScript calculator in [`v1/`](v1/).
- **V2.1.0** — Final multi-subject Attendance Control Room in [`v2/`](v2/), using Flask, SQLite, class logging, history, bunk calculations, and future-absence forecasting.

The `main` branch contains both versions. Release branches preserve version snapshots.

## Run V1

Open `v1/index.html` in a browser.

## Run V2

```bash
cd v2
python -m pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000.

## Project layout

```
BUNKED/
├── v1/index.html
└── v2/
    ├── app.py
    ├── requirements.txt
    ├── cpp/attendance_engine.cpp
    ├── public/static/       # Vercel static assets
    ├── static/              # Flask local static assets
    └── templates/index.html
```

For Vercel, V2 currently uses temporary SQLite storage under `/tmp`; use a managed database for durable records.
