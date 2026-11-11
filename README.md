# BUNKED. — Skip Smart. Stay Safe.

An attendance tracker and bunk-budget calculator, maintained as three separate versions.

<sub>**Live V3 website:** https://bunked-arp21.vercel.app</sub>

## Project versions

| Folder | Version | What it contains |
|---|---|---|
| [`v1/`](v1/) | V1.0.0 | Original standalone HTML calculator |
| [`v2/`](v2/) | V2.1.1 | Flask + SQLite multi-subject dashboard |
| [`v3/`](v3/) | V3.0.2 | Latest dashboard, browser-saved attendance, click sounds, mechanical typing sounds, adjustable Sound Deck and refined hover states |

Each version is kept in its own folder. V2 remains the V2 codebase; V3 is maintained separately.

## Open the live website

**[Launch BUNKED V3 on Vercel](https://bunked-arp21.vercel.app)**

The Vercel production deployment uses the `v3/` folder.

## Run V1 locally

Open `v1/index.html` directly in a browser.

## Run V2 locally

```powershell
cd v2
python -m pip install -r requirements.txt
python app.py
```

Then open the local development address printed by Flask (normally `http://127.0.0.1:5000`).

## Run V3 locally

```powershell
cd v3
python -m pip install -r requirements.txt
python app.py
```

Then open the local development address printed by Flask (normally `http://127.0.0.1:5000`).

## V3 data and sound

V3 saves subjects and the class log in the browser's local storage. Data stays in that browser profile; it does not automatically sync between devices. The sound control beside the theme switch turns interface sounds on or off. A click sound plays for interactive controls, and a quiet mechanical-key tap plays while typing.

See [`CHANGELOG.md`](CHANGELOG.md) for release notes.
