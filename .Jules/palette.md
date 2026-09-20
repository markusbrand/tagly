## 2024-03-20 - Adding Loading Indicators to Material UI Dialog Buttons
**Learning:** For asynchronous action buttons within admin dashboard dialogs (e.g., Save, Create, Delete), providing visual feedback during form submission enhances the user experience and aligns with other parts of the UI.
**Action:** Always wrap the disabled state with a `CircularProgress` inside the button's `startIcon` property (e.g., `startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}`) to clearly indicate to the user that a background process is happening.
