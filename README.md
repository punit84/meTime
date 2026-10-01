# MeTime

A private self-care app for mood, strengths, journaling (text + mic), mirror release, playlists, affirmation balloons, makeup tips, and outfit selfies.

All data stays on-device (AsyncStorage). No account. No backend.

## Docs

Full overview, **UI map**, architecture, and **project scope**:  
→ **[docs/PROJECT.md](docs/PROJECT.md)**

## Quick start

```bash
cd MeTime
npm install
npm start
```

Then open in Expo Go (`a` / `i`) or web (`w`). Camera and mic work best on a real phone.

## Features (high level)

| Space | What it does |
|-------|----------------|
| Home | Mood tiles + navigation hub |
| Strengths & Glow | Strengths + “Do this” growth tips |
| Soft Talk | Text & **mic** voice journal |
| Mirror | Private front camera release |
| Playlist | Mood-tagged favorite tracks |
| Pretty Balloons | Pop → glitter, sound, good words |
| Makeup Tips | Everyday beauty tip cards |
| Selfie Mode | Outfit selfie + soft look note |

## Project structure

```
app/           Expo Router screens
components/    UI primitives
lib/           theme, types, local storage
assets/        icons, fonts, sounds
docs/          Project overview & scope
```
