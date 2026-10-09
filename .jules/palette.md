## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.

## 2023-10-09 - Ensure Playwright Clicks the Right Admin Tab First
**Learning:** In the frontend admin dashboard (`/admin`), sections like User Management, Custom Fields, and Sticker Templates are separated by MUI tabs. Playwright tests must explicitly click the corresponding tab (e.g., `page.get_by_role('tab', name='User Management').click()`) before attempting to interact with tab-specific components, otherwise selectors will time out.
**Action:** When writing E2E or verification scripts for admin features, always include a step to click the specific section tab after navigating to the `/admin` URL.
