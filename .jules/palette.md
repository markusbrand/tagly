## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-05-19 - Loading Indicators for Async Actions
**Learning:** Adding `CircularProgress` to the `startIcon` prop of MUI `Button` components during asynchronous operations (like saving or deleting) provides immediate and necessary visual feedback to the user, preventing multiple submissions and confusion.
**Action:** When creating or modifying forms with async submission actions, always ensure a loading state indicator is implemented, ideally by utilizing the `startIcon` on disabled buttons for a clean, integrated look.
