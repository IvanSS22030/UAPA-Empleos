# Activity Log

## [Current Date]
- **Bug Fixed:** Buttons were invisible (white text on white background) because custom Universidad UAPA colors (`uapa-blue`, `uapa-orange`, `uapa-gold`, `uapa-sand`) were applied in class names but missing from the Tailwind 4 `@theme` configuration in `src/styles/global.css`.
- **Approach Taken:** Added the missing hex colors directly to `global.css` under `@theme`. This successfully populates the CSS variables to restore backgrounds and text colors on all previously styled elements.
