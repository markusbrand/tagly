## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-10-24 - Loading states for Material UI buttons
**Learning:** Adding loading spinners inside Material UI's `Button` component using the `startIcon` prop (e.g. `startIcon={<CircularProgress size={20} color="inherit" />}`) is a clean, native way to provide visual feedback for asynchronous operations without requiring custom CSS or breaking layout.
**Action:** Always utilize `startIcon` (or `endIcon`) for loading indicators on Material UI Action buttons instead of conditionally rendering the spinner alongside the button text manually.
