## v2.1.1
- Fixed the desktop hero layout selector (`.hero`) so the paper-cut illustration sits on the right side of the hero copy rather than dropping below the action buttons.
- Kept the existing small-screen responsive stacking behavior.

# Changelog

## v2.1.0
- Restored the supplied final dashboard layout with charcoal, sand, electric-blue accents, paper cards, and the subject tabs/input/bunk-budget layout.
- Fixed a JavaScript syntax error caused by an apostrophe inside a single-quoted string; the parse error prevented every UI event listener, including Add Subject, from running.
- Reworked Add Subject to handle the dialog form's submit event, support Enter key submission, show a temporary disabled/loading state, and handle cancel cleanly.
- Added Vercel public copies of the CSS and JavaScript assets.
- Configured Vercel SQLite to use writable /tmp storage; this is temporary serverless storage, not durable shared persistence.

## v2.0.0
- Final full-stack attendance control room with Flask, SQLite, configurable attendance targets, class logging, history, forecast, and C++ calculation engine.

## v1.0.0
- Initial standalone HTML/CSS/JavaScript attendance calculator.
