## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-10-03 - [Missing Visual Feedback on Async Buttons]
**Learning:** Found a UX issue pattern where asynchronous action buttons (e.g., Save, Delete, Create in admin dialogs) disable during network requests but lack visual loading indicators. This leaves users wondering if the action registered or the app froze.
**Action:** Always indicate loading states visually for async action buttons. In Material UI, this can be cleanly implemented by passing `<CircularProgress size={20} color="inherit" />` to the button's `startIcon` property while disabling it.
