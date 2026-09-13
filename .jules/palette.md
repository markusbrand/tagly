## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-05-25 - [Async Button Loading States]
**Learning:** In the admin forms (UserManagement, CustomFields, StickerTemplates), asynchronous actions like save, create and delete only disabled the button during flight. This lack of visual feedback (no loading spinner) left users uncertain if their click registered or the app had stalled.
**Action:** Consistently use the MUI `<CircularProgress size={20} color="inherit" />` passed into the button's `startIcon` prop in combination with the `disabled` state to provide clear visual feedback during API calls.
