# BUNKED V3.0.1 — Attendance Control Room

The latest BUNKED version, separated from V2.

## Features
- Multiple subjects with individual held/attended counts and target percentages.
- One-click Present and Missed attendance logging.
- Matching history entries with timestamps.
- Browser-local subject and history persistence.
- Fully coordinated dark/light themes.
- Subtle synthesized click sounds and mechanical typing taps.
- Sound toggle, restrained hover feedback, and keyboard focus states.
- Future-absence forecast and bunk budget calculation.

## Run locally

```powershell
python -m pip install -r requirements.txt
python app.py
```

Open the local development address printed by Flask (normally `http://127.0.0.1:5000`).

## Live website

https://bunked-arp21.vercel.app

## Storage

V3 stores attendance records in browser local storage. Records persist in the same browser profile but are not synced across devices. Clearing site data may delete them.
