# BUNKED V3.0.5 — Attendance Control Room

A full-featured responsive attendance planner for desktop, tablets and phones.

## Features
- Multiple subjects, individual attendance targets, held/attended counters and safe-bunk budget.
- One-tap Present/Missed logging with matching recent-history timestamps.
- Browser-local persistence, forecast slider, formula explanation and semester meter.
- Full dark/light theme with coordinated paper-cut details.
- Sound Deck with master mute, separate mouse and keyboard channels, 0–100 gain and test buttons.
- Uploaded ASMR MOUSE click samples and real keyboard-key samples from the AULA F75 MAX / Leobog Reaper pack.
- Dedicated recordings for Space, digits 1–8, Backspace, Enter and Shift.
- Keyboard letters and punctuation follow the mappings in the supplied Mechvibes configuration.
- Mobile virtual-keyboard input maps text characters to the corresponding keyboard sound where the browser provides input data.
- Touch-first responsive layout, swipeable subjects, mobile dialog and landscape handling.

## Live website
https://bunked-arp21.vercel.app

## Run locally
```powershell
python -m pip install -r requirements.txt
python app.py
```
Open the local development address printed by Flask (normally `http://127.0.0.1:5000`).

## Sound pack credits
- Mouse: **ASMR MOUSE** by Angel Lozano, supplied by the user.
- Keyboard: **aula f75 max leobog reaper switch** by samuel quiceno, supplied by the user.

The supplied keyboard config maps A–Z keys to the Backspace recording and punctuation/modifier keys listed in that config to the Digit 5 recording. Those mappings are preserved.
