# Demo data

`newcastle_recycling_points.json` holds real recycling point locations around Newcastle upon Tyne and the materials each one takes, downloaded from OpenStreetMap with `../fetch_osm_points.py`.

© OpenStreetMap contributors. The data is available under the Open Database Licence (ODbL) 1.0: https://www.openstreetmap.org/copyright

It's mapped by volunteers, not published by the council. Opening times are only kept where OpenStreetMap has them in a simple form; the rest are examples added by the demo seed.

To refresh it, run from `backend/`:

```
python src/app/scripts/fetch_osm_points.py
```
