## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.

## 2024-09-22 - Adding explicit loading states to asynchronous MUI buttons
**Learning:** Buttons that get disabled during asynchronous operations (like Save or Delete) without providing immediate visual feedback can confuse users, leaving them wondering if their action registered. The `<CircularProgress>` component provides a standard and clean way to indicate this.
**Action:** When a button disables due to an ongoing background process, consistently use the `startIcon` prop in Material UI to display `<CircularProgress size={20} color="inherit" />` as clear visual feedback of the asynchronous action.
