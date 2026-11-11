# BUNKED. — Skip Smart. Stay Safe.

A student attendance and bunk calculator, released in versions.

## Releases
- **V1.0.0** — Standalone calculator in [`v1/`](v1/).
- **V2.0.0** — Multi-subject Flask attendance control room in [`v2/`](v2/).
- **V2.1.0 / V2.1.1** — UI, Add Subject and hero-layout fixes.
- **V3.0.0** — Correct one-click attendance/history behavior, functional subject dialog and cancellation, full dark/light theme, and browser-local persistence.

## Run V1
Open `v1/index.html` in a browser.

## Run V2/V3
```bash
cd v2
python -m pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000.

## V3 storage
V3 saves its subjects and class log in browser local storage. It stays in the same browser profile and is not a cross-device cloud sync.

The `main` branch contains all versions. Version snapshots are preserved in the V1, V2 and V3 release branches.
