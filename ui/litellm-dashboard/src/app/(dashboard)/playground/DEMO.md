# Innovation #6: Playground Run History

Adds a persistent run history panel to the LiteLLM playground, stored in `localStorage`.

## What was built

- `hooks/usePlaygroundHistory.ts` — hook managing up to 50 runs; `loadRuns()` exported for testing
- `components/PlaygroundHistoryPanel.tsx` — Sheet panel (slides in from the right) listing runs with relative timestamps, model badge, token count, and a 2-line response preview; supports per-run delete and bulk clear with an AlertDialog confirm
- `components/SaveRunDialog.tsx` — Dialog for manually saving a run snapshot (model, label, response, token counts)
- `page.tsx` — header bar with "Save run" and "History (N)" buttons wired to the above components; loading a run from history closes the panel and sets `loadedRun` state

## How to test

1. Start the dashboard dev server: `npm run dev` in `ui/litellm-dashboard`
2. Navigate to http://localhost:3000/ui/playground
3. Click "Save run", fill in model + response, click Save
4. Click "History (1)" — the right panel opens showing the saved run
5. Click a run to load it (panel closes, aria-live region announces the loaded run)
6. Delete a run with the trash icon; it disappears without reloading the page
7. Click the trash icon in the panel header and confirm — all runs cleared

## Storage contract

Key: `playground_history`  
Max entries: 50 (oldest trimmed on overflow)  
Fields per run: `id`, `timestamp`, `model`, `messages`, `response`, `promptTokens`, `completionTokens`, `durationMs`, `label?`

No server calls — entirely client-side.
