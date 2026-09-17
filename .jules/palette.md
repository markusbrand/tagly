## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## $(date +%Y-%m-%d) - [Missing Visual Feedback for Asynchronous Button Actions]
**Learning:** Found a UX opportunity where asynchronous action buttons (e.g., Save, Submit) lacked immediate visual feedback beyond being disabled. Users might think the application is unresponsive during server requests.
**Action:** When a button triggers an async operation, provide visual feedback by passing `<CircularProgress size={20} color="inherit" />` to the `startIcon` property in Material UI `Button` components while the loading state is active.
