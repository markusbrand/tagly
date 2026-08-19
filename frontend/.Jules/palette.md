## 2026-08-19 - Missing ARIA Labels on Icon Buttons
**Learning:** Many interactive icon-only buttons (like drawer toggle, mode switch, edit, delete) across `AppShell` and admin components lacked `aria-label` attributes, relying solely on tooltips for context which isn't sufficient for screen readers.
**Action:** Consistently apply `aria-label` to all `<IconButton>` components, utilizing the existing i18n translation functions (e.g., `t('common.edit')`) where possible to ensure accessible labels are localized.
