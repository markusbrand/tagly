## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-10-06 - Visual Feedback for Async Action Buttons
**Learning:** Adding a `CircularProgress` inside a disabled button during active saving/deleting states provides crucial immediate feedback for users, preventing double-clicks and confusion without requiring custom CSS or new components.
**Action:** Use `startIcon={<CircularProgress size={20} color="inherit" />}` on Material-UI `<Button>` elements during asynchronous operations.
