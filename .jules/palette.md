## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-09-09 - Admin Action Buttons Visual Feedback
**Learning:** We discovered that admin action buttons (like Create, Save, Delete) lacked visual loading states, meaning the UI didn't communicate clearly that an async background operation was happening, which can lead to confusion even if the buttons are disabled.
**Action:** Adding `<CircularProgress size={20} color="inherit" />` as the `startIcon` in MUI buttons effectively communicates loading states. Always make sure to provide this visual feedback alongside the `disabled` prop on async actions.
