# Housemaster (WIP)

Housemaster will be a household companion app in the form of a small game. You move a character around a house, and each room holds objects you can interact with. Walk up to the fridge in the kitchen and you open the grocery manager; walk up to a desk in the study and you open the task board. The house is meant to be rendered in 3D (Three.js) and viewed roughly isometrically, with keyboard or controller movement.

The same tools are also reachable from the menu, so in theory you never have to walk anywhere if you don't want to. Basically, the menu is the practical shortcut, and the house is the main scenic route.

> **Status:** early. Sign-in, the menu, role-gated tool navigation and the animated tool windows all work. The 3D house is not built yet, and most room tools are placeholders or embeds rather than finished features. Treat this as a working skeleton, not a shipped app just yet.

## The idea

A household is the unit of the app. Each member (a parent, a child, etc) has a named character; anyone visiting can use the guest character. Parents hold a "super" role that lets them change shared data (adding recipes or shopping items, for example, or accessing certain restricted parts of the app like the accounting board; your kids don't need to see the entire financial breakdown of your household ;) ) while everyone else can do the day-to-day things like ticking items off a list. Roles (`GUEST`, `MEMBER`, `ADMIN`) are enforced.

## Rooms and tools

The menu mirrors the planned layout of the house. Each room exposes one or more tools:

| Room        | Tools                          |
| ----------- | ------------------------------ |
| Living room | Task hub, Calendar             |
| Kitchen     | Grocery manager                |
| Bathroom    | Quote of the day               |
| Bedroom     | Snooze buddy (relaxing video and podcase index) |
| Study       | Accounting links, Task board   |
| Hobby room  | Craft log, Travel log          |

Some tools currently embed an external page in an iframe (the grocery manager is one) as a stand-in until an eventual native version exists. Ultimately, I want the current grocery app, which currently exists as its own separately hosted app, to be accessible within Housemaster. I'll work out how that'll look like later down the line.

## Tech stack

- **React 19** (w/ TypeScript on strict mode)
- **Vite** for dev server and build
- **React Router** for the auth/home split and the `?tool=` param
- **Zustand** for state (session, menu, fullscreen)
- **Tabler Icons** for the icon set

Three.js is planned but not yet added.

## Getting started

You'll want a recent Node installed (26 at the time of writing). A Docker setup will probably pin this down properly later.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (default http://localhost:5173)
npm run build    # type-check and build for production into dist/
npm run preview  # serve the production build locally
npm run lint     # run ESLint
```

## Project layout

```
src/
  main.tsx            App entry (mounts the router)
  App.tsx             Route table and the signed-in / signed-out split
  components/         Shared UI (Menu, AuthPanel, ToolWindow, the house backdrop)
  pages/              The auth and home screens, plus one folder per room
  tools/              Tool registry and the hook that opens and closes tools
  store/              Zustand stores (session, menu, fullscreen)
  lib/                Auth, password hashing and role checks
  data/               Household members (seed data for now)
  styles/             Global CSS, design tokens and helpers
```

Tools live under `pages/<Room>/<Tool>.tsx`. Which one is open is held in the URL as a `?tool=` parameter. The registry in `tools/` maps that parameter to a component, and `ToolWindow` wraps it with the window chrome (fullscreen toggle and close button).

## Conventions

- **Design tokens:** colours, spacing, radii, shadows and type are defined as CSS custom properties in `src/styles/utils/variables.css`. When writing CSS, each for a token when available rather than a raw value.
- **Spelling:** custom identifiers and user-facing text use British spelling (for example `--colour-grey-cold-1`). After all, I live and work in the British Isles and as such, I like to leave a little bit of my local cultural flavour of language in my projects.