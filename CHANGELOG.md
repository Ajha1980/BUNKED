# Changelog

## v3.0.5
- Integrated the user-supplied AULA F75 MAX / Leobog Reaper mechanical keyboard recordings.
- Added dedicated original samples for Space, digits 1–8, Backspace, Enter and both Shift keys.
- Preserved the supplied Mechvibes mappings for letters, punctuation and modifiers.
- Added mobile virtual-keyboard character-to-sample mapping.
- Added a six-key TEST KEYBOARD sequence and preloaded the keyboard sprite for smoother first use.
- Kept the mouse pack, Sound Deck mute and independent sound-channel volume controls.

## v3.0.4
- Replaced the synthesized mouse-click imitation with the user-supplied ASMR MOUSE recording.
- Mapped the uploaded pack's MouseLeft, MouseRight and side-button sample ranges to interface mouse actions.
- Kept Sound Deck master mute, click toggle and 0–100 output gain connected to the recorded click samples.
- Updated TEST CLICK to preview left and right click samples.
- Preloads the mouse pack so normal interactions use the recording after it is decoded.
- Retained the mechanical typing sound as a separate synthesized keycap sound.

## v3.0.3
- Added a touch-first responsive layout for phones and tablets without removing desktop features.
- Made subject tabs horizontally swipeable instead of hiding subjects on narrow screens.
- Kept the complete dashboard, bunk budget, forecast, formula, history and all attendance actions available in a vertical mobile layout.
- Added touch-friendly hit areas, safe-area padding, mobile dialog sizing, and a viewport-fitted Sound Deck panel.
- Added mobile virtual-keyboard input sound handling and removed duplicate global click/typing sound listeners to prevent doubled audio.
- Added landscape phone and narrow-width refinements.

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
