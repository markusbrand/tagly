## 2026-09-04 - Visual Loading States for Admin Actions
**Learning:** Adding `startIcon={<CircularProgress size={20} color="inherit" />}` to MUI `Button`s during async actions (like Save or Delete) provides immediate, non-disruptive feedback. The `color="inherit"` property ensures it matches the disabled text color perfectly.
**Action:** Use this pattern for all async action buttons across the application to prevent multiple submissions and improve perceived performance.
