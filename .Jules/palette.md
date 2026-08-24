## 2024-03-24 - Preserving Tooltips on Disabled MUI Elements
**Learning:** In Material UI (MUI), tooltips attached to disabled elements (like `IconButton` with `disabled` prop) do not display.
**Action:** Wrap the disabled element in a `<span>` tag to ensure the tooltip remains functional for UX and accessibility. Always remember to add an `aria-label` to the wrapped element for screen readers, as the wrapper doesn't do that.
