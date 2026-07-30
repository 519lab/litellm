# Demo — innovation/memory-ui

## What this branch does

Removes the upstream "draft deprecation" warning from the Memory dashboard page.
The full Memory UI (`MemoryView`) was already implemented and included in the sidebar;
the only thing hiding it was a banner saying it might be removed. In this fork we
are keeping Memory as a first-class feature.

## What works

- `/ui/memory` shows a searchable, paginated table of all `/v1/memory` entries
- Create, edit, and delete work via the modal and delete-confirmation dialog
- Detail drawer shows full value + metadata + timestamps
- Admins see all entries with user/team columns; users see only their own scope
- The sidebar entry under Agents → Memory is already present and functional

## To try it

After installing the fork and running `npm run build`:
1. Navigate to `/ui/?page=memory` (or click Memory in the Agents group of the sidebar)
2. Click "New memory" to create an entry
3. Use the key prefix filter (e.g. `user:`) to narrow results

## What's next

The value/metadata display areas in the detail drawer use hardcoded `#fafafa` background
which doesn't respect dark mode. The next increment is converting those inline styles to
`bg-muted` Tailwind classes (requires extracting the Drawer content into a shadcn-compatible
component — currently the whole `MemoryView` uses antd, consistent with the rest of the
admin UI that hasn't been migrated yet).
