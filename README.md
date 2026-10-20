# Moonraker Klipper — LEDMatrix Multi-Printer

A native [ChuckBuilds LEDMatrix](https://github.com/ChuckBuilds/LEDMatrix) Python plugin inspired by [Tronbyt Moonraker](https://github.com/tronbyt/apps/tree/main/apps/moonraker).

## Features
- One printer at a time across the full matrix; cycles through enabled, eligible printers, then yields to other LEDMatrix plugins.
- G-code object preview thumbnail on the left via Moonraker metadata and file endpoints.
- Printer name, file, state, progress bar, nozzle/bed temperature and estimated time remaining.
- Per-printer Moonraker URL and optional API key. Configurable polling, rotation and state filters.
- Defaults favor active/paused prints; optional idle, completed and offline screens.
- Settings reload in process through `on_config_change`. Network I/O occurs only in `update()`.

## Setup
Install this repository as an LEDMatrix plugin through the Plugin Manager's repository/URL install workflow (if available), or place these files in an LEDMatrix plugin directory named `moonraker-klipper` and restart LEDMatrix.

In plugin settings, add entries to **Printers** with their own name, URL and optional API key (the Moonraker default port is 7125). Use `http://printer-ip:7125` for normal LAN setups. See `example_config.json` if using manual config.

Select a **seconds_per_printer** value such as 10. Enable dynamic duration so each printer is displayed once, then the regular LEDMatrix rotation resumes. Enable **show_thumbnail** for the print object on the left. Each printer's slicer must embed thumbnails in its G-code for previews to appear.

## Limitations
The LEDMatrix schema-driven editor's support for adding/removing array-of-object items varies by core release; where unsupported, edit the `printers` list in `config/config.json` directly. The preview is constrained by the physical panel resolution: for 5 x 64x32 P5 panels in a row the canvas is **320x32**. Progress ETA is estimated from elapsed time and progress (not Moonraker's slicer ETA).

The plugin is read-only, and makes HTTP GET requests to the configured Moonraker hosts. Avoid exposing Moonraker unsecured to the Internet. No physical LEDMatrix hardware or Moonraker printers were available for live integration tests.

## Development
Install Python dependencies with `pip install -r requirements.txt`. See the [LEDMatrix plugin API](https://github.com/ChuckBuilds/LEDMatrix/blob/main/docs/PLUGIN_API_REFERENCE.md).

## Display customization and startup activity

The plugin settings now expose `font_sizes` (pixel sizes for printer, filename, status, temperatures, percent, ETA) and `colors` (hex colors for each text element, nozzle/bed temperatures, progress fill/background and preparation message). Updates apply on the next configuration reload without replacing your printer profiles.

Before printing progress exceeds the configured `preprint_threshold` (default 1%), the progress bar is replaced with an activity message. Exact stages such as **HOMING**, **QGL**, and **HEAT SOAKING** come from Moonraker's `display_status.message`, typically set using `M117` in Klipper's `PRINT_START` macro. Moonraker's standard `print_stats.state` does **not** expose the currently running G-code or macro phase on its own. If the macro does not publish a message, the plugin shows **PREPARING** or **STARTING** instead. For example:

```gcode
M117 Homing
G28
M117 QGL
QUAD_GANTRY_LEVEL
M117 Heat Soaking
; Your heat soak routine
M117 Printing
```

Your macro needs to set meaningful messages at each step; not all printers use QGL. The stage updates on each Moonraker polling interval, not instantaneously.
