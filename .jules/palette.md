## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.

## 2024-06-10 - [Visual Loading State for Async Buttons]
**Learning:** Found an interaction issue pattern where async action buttons (e.g. Save, Delete) in dialogs were disabled during processing but provided no explicit visual feedback (like a loading spinner), leaving users uncertain if the action was actually happening.
**Action:** Always add a loading spinner (`<CircularProgress size={20} color="inherit" />`) as a `startIcon` to Material UI `Button` components during async operations instead of just disabling them.
