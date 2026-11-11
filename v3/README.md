# BUNKED V3.0.4 — Attendance Control Room

A full-featured responsive attendance planner for desktop, tablets and phones.

## Features
- Multiple subjects with horizontally swipeable subject tabs on narrow screens.
- Individual classes-held, classes-attended and attendance-target controls.
- One-tap Present and Missed logging with matching history entries and timestamps.
- Browser-local saving of subjects and class history.
- Live attendance percentage, safe bunk budget, recovery estimate and semester meter.
- Future absence forecast slider and formula explanation.
- Full dark/light theme, including paper-cut accents and the Sound Deck.
- Sound Deck with master mute, separate mouse-click and mechanical-keyboard channels, 0–100 gain and test buttons.
- Uploaded ASMR MOUSE recording for real left-click, right-click and side-button samples.
- Synthesized mechanical typing sounds, including mobile virtual-keyboard input events.
- Touch-sized controls, scrollable subject tabs, phone-friendly dialog and landscape handling.
- Restrained hover/focus feedback on pointer devices and tap feedback on touch devices.

## Live website
https://bunked-arp21.vercel.app

## Run locally
```powershell
python -m pip install -r requirements.txt
python app.py
```
Open the local development address printed by Flask (normally `http://127.0.0.1:5000`).

## Sound pack credit
The mouse click samples are from the user-supplied **ASMR MOUSE** Mechvibes pack by Angel Lozano. The config's left/right/side sample timing ranges are preserved in `static/audio/asmr-mouse.config.json`.

## Data
Subjects, attendance counts and class history save in browser local storage. Data stays in the same browser profile; it does not automatically sync between devices. Clearing site data may remove it.
