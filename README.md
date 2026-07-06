# Elite Dangerous Mining Mapper
A Stream Deck plugin that assists in the creation of mining maps for Elite Dangerous, with the ability to annotate and publish finished maps to share with others.

## Installation Guide

A Stream Deck plugin for Elite Dangerous miners: screenshot your best asteroids while
you mine, automatically organized by system/body/ring so you can find them again
next time you're at the same hotspot. Includes a built-in html viewer with drawing/text
annotation tools and per-shot notes.

## Requirements

- Windows 10 or later
- [Elgato Stream Deck software](https://www.elgato.com/downloads) installed
- Elite Dangerous installed and launched at least once (so the save folder exists)
- Elite Dangerous running in **Borderless or Windowed** mode (screenshot capture
  targets the game window directly, which generally doesn't work with exclusive
  fullscreen)

## 1. Install the plugin

Double-click **`Elite Dangerous Mining Mapper.streamDeckPlugin`**. The Stream Deck app
will prompt you to install it. Just click accept, and it'll show up under the category
**"Elite Dangerous Mining Mapper"** in the actions list on the right side of the app.

## 2. Add the buttons

Drag these five actions onto keys on your Stream Deck:

| Button | What it does |
|---|---|
| **Toggle Session** | Press once to lock onto your current System/Body/Ring and start recording (icon switches to show it's active). Press again to end the session. |
| **Save Snapshot** | Screenshots the game and adds it to the current session's folder. |
| **Undo** | Deletes the most recently captured screenshot in the current session. |
| **Open Library** | Opens a local web page listing every system/ring you've recorded, with a viewer to page through shots and annotate them. |
| **Open Screenshots Folder** | Opens the base screenshots folder directly in File Explorer. |

## 3. (Optional) Set your screenshots folder

Click the **Toggle Session** key once in the Stream Deck app to open its settings
panel. There's a text field for the base folder where screenshots get saved. Navigate
to where you want the folder to be, copy the path and paste it into the box.

There are also three manual override fields (System / Body / Ring) — you only need
these if the plugin hasn't detected your current ring yet (e.g. right after starting
the game, before you've dropped into a ring). Normally you won't need to touch them.

## 4. Using it while mining

1. Fly into a ring hotspot.
2. Press **Start/Stop Session** - the key's icon changes to confirm it's now recording.
3. Mine as normal. Whenever you see a high % rock, press **Save Snapshot**.
4. Made a mistake? Press **Undo** to remove the last screenshot.
5. When you're done at that hotspot, press **Start/Stop Session** again to end the session.
6. Press **Open Library** anytime to browse everything you've recorded, grouped by
   System → Body → Ring. You can draw on screenshots (pen tool with colour picker,
   add text boxes), add detailed notes underneath each one, and undo/redo your 
   edits. Saving an annotation keeps the original screenshot untouched and creates a 
   separate annotated copy.
7. Press **Open Screenshots Folder** anytime to browse the raw files directly in
   File Explorer if you want to manually delete duplicates or grabbing files to
   upload/share.

## Troubleshooting

- **Screenshots come out black or fail**: make sure Elite Dangerous is running in
  Borderless or Windowed mode, not exclusive fullscreen.
- **Start/Stop Session shows an error/alert when pressed**: it couldn't detect a ring
  you're currently in. Make sure you've actually dropped out of supercruise into a
  ring, or fill in the manual override fields mentioned in step 3.
- **Nothing happens when pressing Save Snapshot/Undo**: these only work while a
  session is active (after pressing Start/Stop Session).
