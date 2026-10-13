## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2026-10-13 - Add Loading Spinners to Form Buttons
**Learning:** Adding visual feedback to asynchronous submit buttons via Material-UI's native `startIcon` and `CircularProgress` provides a strong UX improvement without changing layout structure.
**Action:** Use `<CircularProgress size={20} color="inherit" />` as the `startIcon` for `<Button>` components that handle saving/creating/deleting actions when they are in a disabled/loading state.
