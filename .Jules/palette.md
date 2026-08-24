## 2024-05-15 - MUI Tooltips on Disabled Elements
**Learning:** By default, MUI `Tooltip` components attached directly to disabled elements (like an `IconButton`) do not display when hovered, because disabled elements block mouse events.
**Action:** Wrap the disabled element in a `<span>` before wrapping it with a `Tooltip`. Ensure the disabled element still receives an `aria-label` for screen reader accessibility, as the `Tooltip` will handle the wrapper.

