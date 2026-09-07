## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.

## 2024-05-24 - [Visual Feedback for Async Buttons]
**Learning:** For asynchronous action buttons in Material UI (e.g., Save, Delete, Create), it's important to indicate the loading state visually. Users might wonder if their click registered, especially if the operation takes a moment.
**Action:** Add `<CircularProgress size={20} color="inherit" />` to the button's `startIcon` property while disabling the button during loading.
