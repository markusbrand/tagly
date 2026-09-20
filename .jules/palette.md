## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-05-25 - [Loading Spinners in MUI Buttons]
**Learning:** Found an interaction improvement opportunity where "Save" buttons during async operations lacked visual feedback (loading spinners). Material UI's `Button` component supports a `startIcon` property that can be used conditionally alongside the `disabled` state.
**Action:** For asynchronous action buttons in Material UI (e.g., Save, Delete, Create), indicate the loading state visually by passing `<CircularProgress size={20} color="inherit" />` to the button's `startIcon` property while disabling the button.
