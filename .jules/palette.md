## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2025-02-20 - Adding Loading Indicators to Buttons
**Learning:** For asynchronous action buttons in Material UI (e.g., Save, Delete, Create), indicating the loading state visually is a common pattern that improves the perceived responsiveness of the application. The previous "saving..." disabled button text pattern was lacking visual feedback. Using a `CircularProgress` component gives a standard, universally understood visual cue.
**Action:** When creating action buttons that trigger async network requests, visually indicate the loading state by passing `<CircularProgress size={20} color="inherit" />` to the `startIcon` prop while disabling the button.
