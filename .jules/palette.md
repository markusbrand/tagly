## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-09-14 - Button Async Loading State

**Learning:** Replacing text inside a button with a loading spinner (e.g. `<CircularProgress />`) causes the button to lose its accessibility context for screen readers and shrinks the button, leading to an abrupt layout shift when the form is submitted.
**Action:** When a Material UI Button triggers an asynchronous action, preserve its text and use the `startIcon` property to pass the `<CircularProgress size={20} color="inherit" />` indicator instead of replacing the `children` prop.
