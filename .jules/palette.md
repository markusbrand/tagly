## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2026-10-10 - Add loading states to User Management dialogs
**Learning:** For dialog forms, especially for user creation/editing where response time can vary, users expect a visual indicator when they submit to prevent duplicate clicks and provide reassurance.
**Action:** Always add `<CircularProgress>` to the `startIcon` of Submit buttons during async operations in Material-UI dialogs.
