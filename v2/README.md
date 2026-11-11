# BUNKED. — Attendance Control Room (V2)

A locally runnable attendance planner styled to match the supplied BUNKED charcoal, sand and electric-blue reference.

## What's included
- Multi-subject attendance tracking with configurable attendance targets.
- Live bunk budget and recovery calculation.
- One-click attended / missed class logging.
- SQLite persistence and per-subject class history.
- Interactive what-if absence forecast.
- Responsive grunge / paper-cut inspired interface.
- Python Flask backend, HTML, CSS, JavaScript and a standalone C++ calculation engine.

## Run locally
```bash
python -m pip install -r requirements.txt
python app.py
```
Then open http://127.0.0.1:5000.

The app stores its local database in `bunked.db` beside `app.py`.
