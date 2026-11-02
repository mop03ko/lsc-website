# 3D catalog

The homepage `#models` section contains the existing Barnhouse and six supplied Rhino models. The Mongolian and English pages share the same catalog. Models load on demand; only the current model stays in GPU memory. Search filters the cards, GLB downloads are self-contained, and selecting a quote updates only a previously generated message, preserving user-written text.

## Rebuild source models

Install `trimesh==5.2.0`, `pycollada==0.9.3`, Pillow and NumPy, then run:

```
python scripts/convert-models.py "E:\Light Steel\model\New folder"
npm run verify
```

Original DAE files and texture folders are not modified or published. `models/catalog.json` records source hashes, geometry counts, conversion repairs and bounding extents in meters (X, Y-up, Z). These extents include terrain, decks and other objects; they are NOT floor areas. New models intentionally do not populate the price calculator until floor areas are confirmed from drawings.

Rhino exports contain auxiliary material profiles without rendering techniques, missing UV sources, and incomplete light definitions. The converter reconstructs missing diffuse techniques using the declared texture, discards only broken UV inputs (retaining vertices/normals and every triangle), and uses viewer lighting. Surface appearance is approximate wherever the source lacks usable material/UV information. Conversion fails on missing geometry and asserts exact source/export triangle counts.

Textures are capped at 1024 pixels. Six GLBs total approximately 37.6 MB; individual files range from 0.9 to 17 MB and load only when selected. Slow-network loading and real low-memory physical devices remain deployment checks. Posters are browser renders of the actual converted files.

## Validation

`npm run verify` covers the static build, backend regression tests and all six binary exports (GLB v2 headers, embedded resources, exact mesh/triangle counts, and unverified areas kept out of estimates). Browser checks cover both languages, model selection, search/empty results, quote message replacement, view controls, loading failure/retry and rapid selection. Desktop and 390px mobile layouts are preview checks, not physical-device certification.
