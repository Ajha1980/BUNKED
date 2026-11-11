# Changelog

## v3.0.2
- Increased the mouse-click sound to a more pronounced tactile switch snap.
- Increased the mechanical keyboard sound with a fuller low thock, sharper key transient and short noise edge.
- Added a compact custom Sound Deck in the navigation bar.
- Added master mute, independent Mouse Click and Keyboard channels, adjustable 0–100 output gain and test buttons.
- Added animated audio level bars and persisted all sound preferences in browser local storage.
- Kept the controller styled for both dark and light themes.

## v3.0.1
- Added quiet synthesized tactile click sounds for buttons and interactive controls.
- Added a soft mechanical-keyboard sound for text entry, with key-repeat throttling.
- Added a sound on/off control and persisted the preference per browser.
- Added subtle control, tab, card, paper-cut, and formula-label hover/active states.
- Added visible keyboard focus styles and touch-device/reduced-motion fallbacks.

## v3.0.0
- Fixed class logging so Present and Missed each update counts exactly once and create one corresponding history entry.
- Moved subject data and class history to browser local storage, eliminating serverless SQLite instance mismatch and "Subject not found" errors.
- Made manual count edits update calculations without fabricating a class-log event.
- Rebuilt Add Subject dialog submission and explicit Cancel behavior.
- Made the entire interface react to dark/light mode, including paper-cut notes, NO GUESSWORK, KEEP IT REAL, outcome panel, forecast, formula, history, dialog, and footer.
- Kept the calculator, bunk budget, meter, status and future-absence forecast reactive to the selected subject.

## v2.1.1
- Fixed the desktop hero layout selector so the paper-cut artwork sits on the right of the hero copy.

## v2.1.0
- Restored the supplied dashboard design and repaired the subject creation handler.

## v2.0.0
- Full-stack attendance control room with Flask, SQLite and multi-subject tracking.

## v1.0.0
- Initial standalone calculator.
