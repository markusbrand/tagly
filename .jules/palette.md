## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2025-02-12 - Added Loading Spinner to Async Admin Forms
**Learning:** Adding a subtle visual cue (like a spinner inside a button) provides significant UX improvement for dialog forms that perform network requests. It reassures users their action is in progress and prevents accidental double submissions if the button is disabled at the same time.
**Action:** Use Material UI's `startIcon` on `Button` components alongside `CircularProgress` for a seamless integration in forms dealing with asynchronous actions, matching the application's existing design system for UI consistency.
