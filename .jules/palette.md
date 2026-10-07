## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.

## 2024-10-07 - Add loading states to admin action buttons
**Learning:** Adding visual loading feedback (like MUI's `CircularProgress`) to asynchronous buttons significantly improves perceived performance and prevents duplicate submissions while keeping UX smooth and discoverable.
**Action:** When implementing forms or actions that require a network request in Material UI, conditionally apply the `startIcon` property with a `CircularProgress` component based on the boolean loading state, alongside the `disabled` state.
