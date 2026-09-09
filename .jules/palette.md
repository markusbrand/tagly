## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.

## 2023-10-27 - Button Loading State Layout Shifts
**Learning:** Replacing a button's main text with a loading spinner (e.g., `<CircularProgress>`) causes the button to change width dynamically. This layout shift disrupts the user experience and removes context regarding the action currently being processed.
**Action:** For asynchronous Material UI `Button` components, always pass the loading spinner to the `startIcon` property (e.g., `startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : undefined}`) and preserve the button's text to maintain a stable layout and user context.
