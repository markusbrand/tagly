## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-05-17 - Button Loading States
**Learning:** Adding `CircularProgress` inside a Material UI `Button`'s `startIcon` property while `disabled` is true provides excellent and immediate visual feedback for asynchronous actions (like Save or Delete) without disrupting the layout or requiring custom CSS.
**Action:** Always use this pattern (`startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : undefined}`) for submit/action buttons in forms that trigger API calls to improve perceived performance and prevent duplicate submissions.
