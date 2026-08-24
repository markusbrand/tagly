## 2024-03-24 - Preserving Tooltips on Disabled MUI Elements
**Learning:** In Material UI (MUI), tooltips attached to disabled elements (like `IconButton` with `disabled` prop) do not display.
**Action:** Wrap the disabled element in a `<span>` tag to ensure the tooltip remains functional for UX and accessibility. Always remember to add an `aria-label` to the wrapped element for screen readers, as the wrapper doesn't do that.
## 2024-05-15 - MUI Tooltips on Disabled Elements
**Learning:** By default, MUI `Tooltip` components attached directly to disabled elements (like an `IconButton`) do not display when hovered, because disabled elements block mouse events.
**Action:** Wrap the disabled element in a `<span>` before wrapping it with a `Tooltip`. Ensure the disabled element still receives an `aria-label` for screen reader accessibility, as the `Tooltip` will handle the wrapper.

## 2023-10-27 - Translating Icon-Only Button Tooltips and Adding ARIA Labels
**Learning:** Found multiple icon-only buttons in `AppShell.tsx` (top navigation bar) that either lacked ARIA labels or had untranslated/inaccurate tooltips. For instance, the user menu icon (`AccountCircle`) had a tooltip stating "Sign Out" even though it opens a menu containing both appearance settings and sign-out options.
**Action:** Always verify that icon-only buttons not only have descriptive tooltips but that those tooltips accurately reflect the button's action (e.g., opening a menu vs. performing a direct action). Additionally, ensure that these buttons always have corresponding `aria-label`s and that all user-facing strings are fully internationalized (added to both `en.json` and `de.json`).

## 2026-08-18 - Added ARIA labels to icon-only buttons
**Learning:** Found multiple icon-only buttons (like Menu, Edit, Delete, Move Up/Down) that lacked `aria-label` attributes, affecting screen reader users. MUI's Tooltip doesn't implicitly add ARIA labels to buttons if they aren't explicitly provided.
**Action:** Always ensure icon-only buttons have an explicit `aria-label`, either through raw text or localized strings (e.g., `t('common.edit')`).

## 2026-08-19 - Missing ARIA Labels on Icon Buttons
**Learning:** Many interactive icon-only buttons (like drawer toggle, mode switch, edit, delete) across `AppShell` and admin components lacked `aria-label` attributes, relying solely on tooltips for context which isn't sufficient for screen readers.
**Action:** Consistently apply `aria-label` to all `<IconButton>` components, utilizing the existing i18n translation functions (e.g., `t('common.edit')`) where possible to ensure accessible labels are localized.



