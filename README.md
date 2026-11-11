# BUNKED. — Skip Smart. Stay Safe.

A multi-version attendance tracker and bunk-budget calculator.

**Live website:** [Open BUNKED V3](https://bunked-arp21.vercel.app)

## Project versions

| Folder | Version | What it contains |
|---|---|---|
| [`v1/`](v1/) | V1.0.0 | Original standalone HTML calculator |
| [`v2/`](v2/) | V2.1.1 | Flask + SQLite multi-subject dashboard |
| [`v3/`](v3/) | V3.0.5 | Responsive desktop/mobile dashboard, attendance history, forecasts, themes, Sound Deck, uploaded ASMR mouse clicks and recorded mechanical keyboard sounds |

Each version is kept in its own folder. V2 remains unchanged as the V2 codebase; V3 is maintained separately.

## Launch V3
[**Open the live BUNKED V3 website**](https://bunked-arp21.vercel.app)

Vercel production deploys from the `v3/` folder.

## Run V1
Open `v1/index.html` directly in a browser.

## Run V2
```powershell
cd v2
python -m pip install -r requirements.txt
python app.py
```

## Run V3
```powershell
cd v3
python -m pip install -r requirements.txt
python app.py
```
Open the local development address printed by Flask (normally `http://127.0.0.1:5000`).

## V3 storage
V3 saves subjects and the class log in the browser's local storage, in the current browser profile. It does not automatically sync across devices.

## Sound packs
V3 includes the user-supplied ASMR MOUSE pack by Angel Lozano and the AULA F75 / Leobog Reaper keyboard pack by samuel quiceno. Sound settings are available in the Sound Deck.

See [`CHANGELOG.md`](CHANGELOG.md) for release notes.
