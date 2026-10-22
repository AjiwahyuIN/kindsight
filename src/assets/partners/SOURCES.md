# Partner logo sources

The organization list comes from the earlier Figma analysis of node `675:1258`.
The Figma connection required reauthentication during implementation, so the
files below are brand-source equivalents rather than fresh exports from Figma.
Exact variant matching remains part of visual QC.

- The Nature Conservancy: https://logotyp.us/get/nature-conservancy/
  Original SVG: https://logotyp.us/file/nature-conservancy.svg
- Smithsonian Channel: https://www.smithsonianchannel.com/
  Original SVG: https://www.smithsonianchannel.com/svg/logo.svg
- UNICEF: https://commons.wikimedia.org/wiki/File:Logo_of_UNICEF.svg
  Original SVG: https://upload.wikimedia.org/wikipedia/commons/e/ed/Logo_of_UNICEF.svg
- Hoag: https://www.hoag.org/
  Complete inline SVG titled “Primary Logo”, saved as an external SVG with its
  namespace. Vector paths and colors were retained.
- Feeding America: https://www.feedingamerica.org/
  Original SVG: https://www.feedingamerica.org/themes/custom/ts_feeding_america/images/svgs/logo-2020.svg

Files are bundled locally. Monochrome appearance is applied by CSS. Nature
Conservancy's empty canvas is clipped by its display wrapper; SVG paths remain
unchanged. Its white negative-space fill is made transparent so the CSS
monochrome filter preserves the globe detail. No logo is redrawn or replaced
by text.
