## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## 2024-05-20 - [Add Loading Spinners to Async Buttons in Admin Pages]
**Learning:** Found that some asynchronous action buttons (Save, Delete, Create) in the admin pages were missing visual loading feedback (`startIcon={<CircularProgress />}`).
**Action:** Always add loading spinners to async buttons in dialogs to prevent user confusion during network requests. Use `startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : undefined}`.
