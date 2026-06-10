# thrift-tracker
## Claude Code Session Context
## Last Updated: 2026-06-10

## Purpose
Thrift-find tracking app for Patrick's wife. Live at thrift-tracker-mph.netlify.app. AI photo→price working.

## Stack
React (Vite) + Netlify Functions → Neon Postgres (`rough-firefly-26516723`) + Netlify Blobs (photos) + Anthropic Claude vision. No auth (single-user). See ADR-035.

## Current Status
Reactivated 2026-06-10 on Neon (was decommissioned 2026-05-29; old Supabase data lost — fresh start). Frontend talks through the supabase-js-shaped shim in `src/lib/supabase.js` → `netlify/functions/items.js` (CRUD) + `photo.js` (Blobs). Deploys: `netlify deploy --build --prod`.

## Active Worktrees (if applicable)
None.

## Known Issues or Blockers
[Update as they arise]

## Next Steps
[Update at start of session]

## Architecture Notes
[Add repo-specific decisions here]

## Do Not Touch
[List protected files/patterns here]
