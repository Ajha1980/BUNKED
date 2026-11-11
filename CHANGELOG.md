# Changelog

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
