# Gamification Integration Guide

These files were added to provide a lightweight gamification layer:

- `gamification.js` — core logic (XP, level, achievements) with localStorage fallback.
- `gamification-ui.js` — small floating widget and toasts to display XP/achievements.

Quick integration steps

1. Add script tags to `dashboard.html` (or whichever pages should show gamification):

```html
<script type="module" src="./gamification.js"></script>
<script type="module" src="./gamification-ui.js"></script>
```

2. Initialize on sign-in

In your auth flow (where you handle sign-in success), call:

```js
import { Gamification } from './gamification.js';
// after successful sign-in with `user` object:
Gamification.init(user.id);
// optionally update UI with current state
if (window.GamificationUI) window.GamificationUI.update(Gamification.getState());
```

3. Award XP after study sessions

When a study session finishes (your timer or session save logic), add XP:

```js
// give 1 XP per minute (example)
Gamification.addXp(Math.round(durationMinutes));
// optionally sync to server if you have a db client
// await Gamification.syncToServer(window.db);
```

4. Link sessions to subjects (optional)

If you prefer awarding subject-specific achievements, query the subject id and call:

```js
Gamification.awardAchievement('Completed: System Security');
```

5. Persisting to server (optional)

`Gamification.syncToServer(dbClient)` attempts to persist `total_xp` into a `user_stats` table
if you provide a `dbClient` with `upsertUserStats` or `request` helpers. If your project does not have `user_stats`, no server writes are made and the module falls back to `localStorage`.

Customization

- XP → level curve: edit `calcLevel` in `gamification.js`.
- Achievements: call `Gamification.awardAchievement(name)` when milestones are reached.
- Styling: edit the `STYLE` block inside `gamification-ui.js` or move to `style.css`.

Security and RLS notes

- This module stores a local copy of gamification info. To make data visible to other devices or to persist across installs, run `Gamification.syncToServer(dbClient)` after sign-in. Implement a server-side upsert in the DB (e.g. `user_stats` table) and expose a safe upsert helper in `db.js` if desired.

Need help wiring into `auth.js` or `timer.js`?

I can patch `auth.js` and `timer.js` to call `Gamification.init` and `Gamification.addXp` automatically — tell me if you want me to wire them in now.
