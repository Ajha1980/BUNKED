# BUNKED. — Attendance Control Room (V2)

The final V2 dashboard matching the supplied local reference: charcoal backdrop, sand paper input card, electric-blue bunk budget, paper-cut accents, and a responsive attendance control room.

## What's included
- Multi-subject attendance tracking with configurable attendance targets.
- Add, switch, rename, and delete subjects.
- Live bunk budget and recovery calculation.
- One-click attended / missed class logging.
- SQLite persistence and per-subject class history.
- Interactive what-if absence forecast.
- Contrast toggle and responsive paper-cut dashboard.
- Python Flask backend, HTML, CSS, JavaScript and a standalone C++ calculation engine.

## Run locally
```bash
python -m pip install -r requirements.txt
python app.py
```
Then open http://127.0.0.1:5000.

The app stores its local database in `bunked.db` beside `app.py`.

## Vercel deployment note

The hosted Flask function uses the writable `/tmp` directory for SQLite. This is temporary serverless storage and is not durable or shared across all function instances. Subjects or class logs can reset or appear inconsistent after cold starts or when requests reach different instances. Connect a managed database such as Neon Postgres or Turso before relying on hosted attendance records as your only copy.
