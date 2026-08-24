## 2026-08-18 - Added ARIA labels to icon-only buttons
**Learning:** Found multiple icon-only buttons (like Menu, Edit, Delete, Move Up/Down) that lacked `aria-label` attributes, affecting screen reader users. MUI's Tooltip doesn't implicitly add ARIA labels to buttons if they aren't explicitly provided.
**Action:** Always ensure icon-only buttons have an explicit `aria-label`, either through raw text or localized strings (e.g., `t('common.edit')`).
