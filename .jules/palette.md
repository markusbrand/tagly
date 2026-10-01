## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## $(date +%Y-%m-%d) - [Missing Loading States on Async Action Buttons]
**Learning:** Found a UX pattern where asynchronous action buttons (Save, Create, Delete) in administrative forms (`UserManagement`, `CustomFields`, `StickerTemplates`) disabled themselves during the operation but provided no visual feedback (like a spinner) to indicate processing. This leaves users uncertain if their action was registered or if the UI is frozen.
**Action:** Always add a loading spinner to async submit/action buttons. For MUI `Button` components, pass a `<CircularProgress size={20} color="inherit" />` to the `startIcon` prop when the respective loading state (e.g., `saving`, `deleting`) is true.
