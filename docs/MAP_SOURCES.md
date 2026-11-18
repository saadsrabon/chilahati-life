# Geographic data status

## Cloud acquisition, 18 November 2026

The published managed cloud runtime enforced its domain allowlist throughout this check. The original `NODE_USE_ENV_PROXY=1 node scripts/fetch-map.mjs` run returned an Overpass result containing the mapped railway station and zero road or rail ways. A follow-up primary Overpass GET returned HTTP 502 with a server-capacity message. The corrected script requested full geometry, timed out on both Overpass hosts, and successfully fell back to the OpenStreetMap map API. A direct map API probe returned HTTP 200 and 10,029,520 bytes of XML.

The committed normalized extract at `public/data/chilahati-map.json` records the 2026-11-18 11:01:51 UTC retrieval and query bounds. It contains 194 highway ways, three railway ways, 8,656 building ways and one selected point of interest, OSM station node 2543961100. The map API fallback supplies a retrieval timestamp rather than an Overpass database timestamp. The snapshot identifies individual OSM objects and uses local east/south metre offsets from its recorded origin.

To refresh on the managed runtime, run `NODE_USE_ENV_PROXY=1 node scripts/fetch-map.mjs`. The XML fallback uses Python 3's standard library. The script rejects responses missing road or rail geometry before replacing the snapshot. Source and licence are [OpenStreetMap contributors, ODbL 1.0](https://www.openstreetmap.org/copyright).

## Coverage and game integration

The in-game **Guide** shows the regional source map, with the railway and mapped station identified, below the illustrative playable area guide. The extract bounds describe the requested development rectangle. Full OSM ways can extend beyond it. Road classifications and building outlines come from OSM and require local verification. The playable 3D scene still uses the prototype layout.

| Place | Evidence and remaining work |
| --- | --- |
| Chilahati Railway Station | OSM node [2543961100](https://www.openstreetmap.org/node/2543961100) in the extract. Verify frontage, platform placement and entrances. |
| Chilahati Dakghor | Bangladesh Post confirms Chilahati SO and postcode 5341. Its pin, entrance and facade are pending. |
| Botolganj Bazar | School website confirms বোতলগঞ্জ বাজার in its location description. Pin and market extent are pending. |
| Kazirhat | LGED labels Kazir Hat. Confirm the Bengali spelling, pin and market extent. |
| Boaed Bazar | User-provided name. Bengali spelling, pin and extent are unresolved. |
| Bouer/Bou Bazar | User-provided name. Bengali spelling, pin and extent are unresolved. |

The full perimeter, school and mosque positions, shop names and roads connecting the required markets still need evidence. Station architectural references are documented in [VISUAL_REFERENCES.md](VISUAL_REFERENCES.md).
