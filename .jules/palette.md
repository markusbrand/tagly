## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-05-24 - [Loading States for Async Actions in Admin Dialogs]
**Learning:** Found a missing UX detail where dialog actions (Create, Edit, Save, Delete) in the admin section disabled the button during an async API request but did not provide visual feedback (like a loading spinner), leaving users uncertain if the action was being processed.
**Action:** Always add a `<CircularProgress size={20} color="inherit" />` as the `startIcon` for buttons that trigger asynchronous operations when they are in a loading/disabled state.
