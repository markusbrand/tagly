## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.

## 2024-05-18 - Async Loading States in Material UI Buttons
**Learning:** We observed that Material UI buttons used for async operations (like Save, Create, Delete) just disable the button while loading without visual feedback. This leaves users uncertain if their action registered.
**Action:** Always indicate the loading state visually by passing `<CircularProgress size={20} color="inherit" />` to the button's `startIcon` property while disabling the button.
