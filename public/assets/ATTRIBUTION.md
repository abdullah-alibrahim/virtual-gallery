# Asset attribution

Virtual Gallery ships free / commercial-safe assets only. Prefer CC0.
Attribution is optional for CC0 but listed here for provenance.

## 3D props (GLTF / GLB)

| Asset | Path | Source | License |
| --- | --- | --- | --- |
| Painted wooden bench | `public/assets/props/bench/` | [Poly Haven — painted_wooden_bench](https://polyhaven.com/a/painted_wooden_bench) | CC0 |
| Potted plant | `public/assets/props/plant/` | [Poly Haven — potted_plant_02](https://polyhaven.com/a/potted_plant_02) | CC0 |
| Marble bust | `public/assets/props/bust/` | [Poly Haven — marble_bust_01](https://polyhaven.com/a/marble_bust_01) | CC0 |
| Ceramic vase | `public/assets/props/vase/` | [Poly Haven — ceramic_vase_01](https://polyhaven.com/a/ceramic_vase_01) | CC0 |
| Side table (plinth) | `public/assets/props/plinth_table/` | [Poly Haven — side_table_01](https://polyhaven.com/a/side_table_01) | CC0 |
| Kenney furniture kit (bench / plants) | `public/assets/props/kenney/` | [Kenney.nl — Furniture Kit](https://kenney.nl/assets/furniture-kit) | CC0 |

Used in Walk for flagship templates: `modern-white`, `daylight-museum`, `grand-nave`, `plaza-hall`, `mega-wing`
(`architecture.benches[].glb` + `architecture.glbProps`).

## PBR textures (1K)

Catalogue IDs (`floorTextureId` / `wallTextureId` / `ceilingTextureId`) are selected in the editor Inspector → Surfaces.

### Floors

| Asset | Path | Catalogue id | Source | License |
| --- | --- | --- | --- |
| Wood floor (diff / nor / rough) | `public/assets/textures/wood_floor/` | `wood_plank` | [Poly Haven — wood_floor](https://polyhaven.com/a/wood_floor) | CC0 |
| Wood floor Color (AmbientCG) | `…/wood_floor/ambientcg_color.jpg` | `wood_parquet` | [AmbientCG — WoodFloor051](https://ambientcg.com/view?id=WoodFloor051) | CC0 |
| Wide wood planks | `public/assets/textures/wood_planks/` | `wood_planks` | [Poly Haven — wood_planks](https://polyhaven.com/a/wood_planks) | CC0 |
| Wood deck | `public/assets/textures/wood_deck/` | `wood_deck` | [Poly Haven — wood_floor_deck](https://polyhaven.com/a/wood_floor_deck) | CC0 |
| Concrete floor (diff / nor / rough) | `public/assets/textures/concrete_floor/` | `concrete` | [Poly Haven — concrete_floor](https://polyhaven.com/a/concrete_floor) | CC0 |
| Stone / tile floor | `public/assets/textures/stone_floor/` | `stone_tile` | [Poly Haven — floor_tiles_06](https://polyhaven.com/a/floor_tiles_06) | CC0 |
| Tile Color (AmbientCG) | `…/stone_floor/ambientcg_*.jpg` | `tile_pattern` | [AmbientCG — Tiles074](https://ambientcg.com/view?id=Tiles074) | CC0 |
| Ceramic floor tiles | `public/assets/textures/tile_floor/` | `ceramic_tile` | [Poly Haven — floor_tiles_02](https://polyhaven.com/a/floor_tiles_02) | CC0 |
| Cobblestone floor | `public/assets/textures/cobblestone_floor/` | `cobblestone` | [Poly Haven — cobblestone_floor_13](https://polyhaven.com/a/cobblestone_floor_13) | CC0 |

### Walls

| Asset | Path | Catalogue id | Source | License |
| --- | --- | --- | --- |
| Wall plaster / concrete | `public/assets/textures/plaster_wall/` | `plaster` | [Poly Haven — concrete_wall_001](https://polyhaven.com/a/concrete_wall_001) | CC0 |
| Painted plaster | `public/assets/textures/plaster_paint/` | `plaster_paint` | [Poly Haven — painted_plaster_wall](https://polyhaven.com/a/painted_plaster_wall) | CC0 |
| Smooth plaster | `public/assets/textures/plaster_smooth/` | `plaster_smooth` | [Poly Haven — plastered_wall](https://polyhaven.com/a/plastered_wall) | CC0 |
| Concrete wall | `public/assets/textures/concrete_wall/` | `concrete` | [Poly Haven — concrete_wall_008](https://polyhaven.com/a/concrete_wall_008) | CC0 |

### Ceiling / trim maps

| Asset | Path | Catalogue id | Source | License |
| --- | --- | --- | --- |
| White plaster | `public/assets/textures/ceiling_plaster/` | `plaster` | [Poly Haven — white_plaster_02](https://polyhaven.com/a/white_plaster_02) | CC0 |

Floor / wall / ceiling albedos apply via `FloorAlbedoProvider`, `WallAlbedoProvider`, and `CeilingAlbedoProvider` when a catalogue id is set (edit preview + walk / marketing). Style-mapped floor albedos still apply on Walk when Floor map is Auto.

## HDRI

| Asset | Path | Source | License |
| --- | --- | --- | --- |
| Studio Small 09 (1K) | `public/assets/hdri/studio_small_09_1k.hdr` | [Poly Haven — studio_small_09](https://polyhaven.com/a/studio_small_09) | CC0 |

Wired into walk `GalleryEnvironment` via `Environment files={…}` (session fallback to procedural Lightformers if the HDR fails). Marketing previews keep Lightformers for a lighter first paint.

## Room mockup photos

| Room | Path | Source | License |
| --- | --- | --- | --- |
| Living | `public/mockups/rooms/living-room.jpg` | [Unsplash](https://unsplash.com/photos/1586023492125) | [Unsplash License](https://unsplash.com/license) |
| Office | `public/mockups/rooms/office.jpg` | [Unsplash](https://unsplash.com/photos/1497366216548) | Unsplash License |
| Hall / salon | `public/mockups/rooms/hall.jpg` | [Unsplash](https://unsplash.com/photos/1600210492486) | Unsplash License |
| Gallery | `public/mockups/rooms/gallery.jpg` | [Pexels](https://www.pexels.com/photo/2372978/) | [Pexels License](https://www.pexels.com/license/) |
| Restaurant | `public/mockups/rooms/restaurant.jpg` | [Unsplash](https://unsplash.com/photos/1517248135467) | Unsplash License |

Hang planes in `ROOM_MOCKUP_PRESETS` are calibrated to these photos.

## Sample paintings (starter pack)

Mirrored under `public/demo/artworks/` and `public/samples/paintings/`.
See also `public/samples/MET_SOURCES.json`.

| File | Work | Source | License |
| --- | --- | --- | --- |
| `01.jpg` | van Gogh — The Starry Night | Wikimedia Commons | Public Domain |
| `02.jpg` | Rembrandt — Self-Portrait | [The Met Open Access](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access) | CC0 / Public Domain |
| `03.jpg` | Hokusai — The Great Wave | Wikimedia Commons | Public Domain |
| `04.jpg` | Monet — Water Lilies | Wikimedia Commons | Public Domain |
| `05.jpg` | van Gogh — A Pair of Shoes | The Met Open Access | CC0 / Public Domain |
| `06.jpg` | Turner — The Fighting Temeraire | Wikimedia Commons | Public Domain |
| `07.jpg` | Whistler — Arrangement in Flesh Colour and Black | The Met Open Access | CC0 / Public Domain |
| `08.jpg` | Cézanne — Trees and Houses Near the Jas de Bouffan | The Met Open Access | CC0 / Public Domain |
| `09.jpg` | van Gogh — Sunflowers | The Met Open Access | CC0 / Public Domain |

No Higgsfield assets are used.
