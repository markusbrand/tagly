## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-05-24 - [Action Button Loading State]
**Learning:** Adding a loading spinner to async buttons during submission (Save/Delete/Create) provides better visual feedback that a process is running, especially when combined with a disabled state to prevent duplicate actions.
**Action:** Always indicate loading states for Material UI asynchronous action buttons by passing `<CircularProgress size={20} color="inherit" />` to the `startIcon` property, and disable the button while submitting.
