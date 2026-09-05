## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2026-09-05 - Added Loading States to Async Buttons
**Learning:** Adding visual loading feedback (like `CircularProgress` on MUI buttons) to async operations greatly improves perceived performance and user confidence, confirming action receipt. It's a standard pattern often missed during initial implementation.
**Action:** When implementing or updating forms/dialogs with network requests, consistently add a `startIcon` with `CircularProgress` to the submit button while it is disabled during the saving state.
