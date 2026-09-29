## 2024-05-24 - [Floating Action Button Missing Tooltips and Labels]
**Learning:** Found an accessibility issue pattern where `Fab` components were missing `aria-label` attributes and tooltip descriptions, making them unfriendly to screen readers and potentially confusing to visually abled users when it's just an icon without a label.
**Action:** Always wrap `Fab` (and other icon-only components) in a `Tooltip` and provide a descriptive `aria-label`.
## $(date +%Y-%m-%d) - Adding loading states to MUI Buttons

**Learning:** When adding `startIcon` props with `CircularProgress` to Material UI `<Button>` elements in JSX using regex/string replacement tools, the new prop must be carefully placed *inside* the opening tag (before the closing `>`). Placing it after the closing `>` treats it as a text child, which breaks the UI.
**Action:** Always verify the generated JSX syntax after automated string replacements, and consider running the React linter (`pnpm lint`) to catch obvious parsing issues before moving to visual verification.
