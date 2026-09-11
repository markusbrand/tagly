## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-05-24 - [Visual Feedback for Async Actions]
**Learning:** Adding a visual indicator (like a loading spinner) during asynchronous operations (e.g., API calls triggered by "Save" or "Delete" buttons) significantly improves the perceived responsiveness of the application and reassures users that their action is being processed.
**Action:** When working with async buttons (e.g., in Material-UI), conditionally render a `CircularProgress` component in the `startIcon` prop (or visually equivalent space) and disable the button while the operation is pending.
