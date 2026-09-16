## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2023-10-27 - Add Loading Spinners to Async Buttons
**Learning:** Adding visual feedback (like a loading spinner) to asynchronous action buttons (e.g., Save, Delete) significantly improves user experience by indicating that the system is processing their request, preventing duplicate submissions, and reducing user uncertainty.
**Action:** Consistently use the `<CircularProgress>` component within the `startIcon` prop of disabled `<Button>` elements during loading states (`saving`, `creating`, `deleting`) across all administrative and interactive forms.
