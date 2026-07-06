# Elite Dangerous Mining Mapper
A Stream Deck plugin for Elite Dangerous that allows you to screenshot your best asteroids 
while you mine, automatically organized by system/body/ring so you can find them again
next time you're at the same hotspot. Includes a built-in Elite Dangerous
themed web viewer with drawing/text annotation tools, per-shot notes, mineral
filtering, and sharing via .zip export/import.

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

Drag these six actions onto keys on your Stream Deck:

| Button | What it does |
|---|---|
| **Start/Stop Session** | Press once to lock onto your current System/Body/Ring (and mineral tag, if selected) and start recording (icon switches to show it's active). Press again to end the session. |
| **Select Mineral** | Opens a picker in your browser listing every ring you've DSS-scanned at the current body, split into Laser Mining / Core Mining columns, with known hotspot minerals highlighted. Tag the next session with one before pressing Start/Stop Session. |
| **Save Snapshot** | Screenshots the game and adds it to the current session's folder. |
| **Undo** | Deletes the most recently captured screenshot in the current session. |
| **Open Library** | Opens a local web page listing every system/body/ring/mineral you've recorded, with a viewer to page through shots and annotate them, plus a mineral filter. |
| **Open Screenshots Folder** | Opens the base screenshots folder directly in File Explorer. |

## 3. Set your screenshots folder

Click the **Start/Stop Session** key once in the Stream Deck app to open its settings
panel. There's a text field for the base folder where screenshots get saved. Navigate
to where you want the folder to be, copy the path and paste it into the box.

There are also three manual override fields (System / Body / Ring) — you only need
these if the plugin hasn't detected your current ring yet (e.g. right after starting
the game, before you've dropped into a ring). Normally you won't need to touch them.

## 4. Using it while mining

1. Fly to a ring and DSS-scan it if you want mineral hotspots detected — the plugin picks this
   up passively from the journal, no need to fully map the whole planet.
2. If the ring has one or more known hotspots, press **Select Mineral** to open the
   picker in your browser. It'll show a Laser Mining / Core Mining column pair for
   every ring you've scanned at that body, with known minerals highlighted in green.
   Click the one you're mining. If a ring has no scan data yet, a generic list is
   shown so you can still tag manually. You can also clear the selection, and it's
   always safe to skip this step entirely if you don't want a mineral-specific tag.
3. Press **Start Session** - the key's icon changes to confirm it's now
   recording. If you tagged a mineral, screenshots go into a subfolder named after
   it within the ring, so two different hotspots in the same ring stay separate.
4. Mine as normal. Whenever you see a high % rock, press **Save Snapshot**.
5. Made a mistake? Press **Undo** to remove the last screenshot.
6. When you're done at that hotspot, press **Stop Session** again to end the
   session. (Your mineral selection is cleared automatically at this point, so
   you'll need to pick again or leave it blank before your next
   session)
7. Press **Open Library** anytime to browse everything you've recorded, grouped by
   System → Body → Ring, with a mineral filter dropdown at the top of the sidebar.
   You can draw on screenshots (pen tool with colour picker, add text boxes), add
   detailed notes underneath each one, and undo/redo your edits. Saving an
   annotation keeps the original screenshot untouched and creates a separate 
   copy.
8. Press **Open Screenshots Folder** anytime to browse the raw files directly in
   File Explorer if you want to manually delete duplicates or grab files to
   upload/share.

## 5. Sharing a hotspot book

From the library viewer, select a ring's book and use **Download Book (.zip)** to
get a self-contained .zip (images, notes, and a standalone offline viewer) you can
send to someone else. To bring a shared book into your own library, go to the
library viewer's landing page (before selecting anything in the sidebar) and use the
**Import a Shared Book** box to upload the .zip. It merges in without overwriting
or colliding with anything you already have for that ring/mineral.

## Troubleshooting

- **Screenshots come out black or fail**: make sure Elite Dangerous is running in
  Borderless or Windowed mode, not exclusive fullscreen.
- **Start/Stop Session shows an error/alert when pressed**: it couldn't detect a ring
  you're currently in. Make sure you've actually dropped out of supercruise into a
  ring, or fill in the manual override fields mentioned in step 3.
- **Nothing happens when pressing Save Snapshot/Undo**: these only work while a
  session is active (after pressing Start/Stop Session).
- **Select Mineral picker shows "No DSS data for this body yet"**: you haven't
  scanned any of that body's rings yet in the current game session (or the game was
  restarted since you last scanned it). DSS the ring, then reopen the picker or refresh
  the page
- **Stream Deck feels laggy while the plugin's buttons are visible**: this was a bug
  in earlier versions where the journal watcher reacted to every file Elite
  Dangerous touches (Status.json, Cargo.json, etc.), not just the journal log. It's
  fixed as of this build - if you still see it, let me know.
