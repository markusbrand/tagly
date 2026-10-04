## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.

## 2026-10-04 - [Loading States for Async Buttons]
**Learning:** Discovered a pattern where some async action buttons in admin pages lacked visual loading indicators, leading to confusing UX during server delays.
**Action:** Always include a visual loading state for async action buttons (e.g., using `startIcon={<CircularProgress size={20} color="inherit" />}`) while disabling the button to clearly communicate ongoing background tasks to users.
