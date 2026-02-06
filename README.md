# Happy Herbivore

A web-based interactive display application.

## Features

### Fullscreen Control
- **Enter Fullscreen**: Click the "Fullscreen" button at the bottom of the screen. The button disappears when in fullscreen mode.
- **Exit Fullscreen**: Tap/Click **5 times within 2 seconds** in the **top-right 25% area** of the screen.

### Input Restrictions
- **Right-Click**: Context menu is disabled to prevent unintended interactions.
- **Zoom**: User pinch-to-zoom is disabled.

### Configuration & Updates
- **Auto-Reload**: The application checks for configuration updates every **5 minutes**.
- **Versioning**: If the version number in `config.json` changes, the application automatically reloads to apply the new version.

## Key Files
- `index.html`: Main structure.
- `style.css`: Styling and theme (using CSS variables).
- `main.js`: Core logic for fullscreen, input handling, and config updates.
- `config.json`: Configuration file storing the current version.