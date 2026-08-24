## 2024-03-24 - Preserving Tooltips on Disabled MUI Elements
**Learning:** In Material UI (MUI), tooltips attached to disabled elements (like `IconButton` with `disabled` prop) do not display.
**Action:** Wrap the disabled element in a `<span>` tag to ensure the tooltip remains functional for UX and accessibility. Always remember to add an `aria-label` to the wrapped element for screen readers, as the wrapper doesn't do that.
## 2024-05-15 - MUI Tooltips on Disabled Elements
**Learning:** By default, MUI `Tooltip` components attached directly to disabled elements (like an `IconButton`) do not display when hovered, because disabled elements block mouse events.
**Action:** Wrap the disabled element in a `<span>` before wrapping it with a `Tooltip`. Ensure the disabled element still receives an `aria-label` for screen reader accessibility, as the `Tooltip` will handle the wrapper.
