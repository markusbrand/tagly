## 2024-09-16 - Add loading state to async action buttons
**Learning:** For Material UI async action buttons (like Save or Create), the interface feels unresponsive if they disable without a visual cue while waiting for backend operations (e.g., creating a new user).
**Action:** Always indicate the loading state visually by passing `<CircularProgress size={20} color="inherit" />` to the `startIcon` property of the `Button` when disabling it during an async operation.
