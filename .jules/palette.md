## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2023-10-27 - Added loading spinner to async action buttons
**Learning:** Adding a `CircularProgress` component as a `startIcon` in a Material-UI `Button` when it's in a disabled loading state provides excellent immediate visual feedback for asynchronous actions (Save, Delete, Create) without breaking layout.
**Action:** Consistently apply this pattern for all critical async action buttons across admin forms to improve the user experience.
