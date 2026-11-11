# BUNKED V3 — Attendance Control Room

V3 fixes attendance logging, history, subject creation/cancellation, and the full dark/light theme.

## Run locally
```bash
python -m pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000.

## V3 behavior
- Subject details and class history persist in this browser's local storage.
- Each **I ATTENDED** click adds exactly one held class, one attended class, and one PRESENT history entry.
- Each **I MISSED** click adds exactly one held class, no attended class, and one ABSENT history entry.
- Editing counts manually updates the calculator but does not invent history records.
- Subjects can be added, cancelled, renamed, switched, or deleted.
- The dark/light switch changes the whole interface, including paper-cut labels, result panel, forecast, formula, history, dialog, and footer.
- The forecast, bunk budget, attendance meter, and status recalculate from the selected subject.

## Data storage note
V3 uses browser local storage, so data stays in the same browser profile on this device. It is not synced across different browsers/devices, and clearing site data can remove it. Export/backup and cloud sync can be added in a later release.
