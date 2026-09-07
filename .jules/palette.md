## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-05-18 - Visual Feedback on Async Buttons
**Learning:** Adding `startIcon={<CircularProgress size={20} color="inherit" />}` to Material UI `<Button>` elements during loading states (while disabling the button) is a highly effective, low-effort micro-UX improvement that provides immediate context during async operations (like "Save", "Create").
**Action:** Always consider replacing static disabled states with active visual progress indicators on critical asynchronous action buttons.
