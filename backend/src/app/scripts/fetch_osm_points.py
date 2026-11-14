"""Download real recycling point locations around Newcastle from OpenStreetMap.

Saves them to data/newcastle_recycling_points.json, which seed_demo.py loads
into the demo area. Only the location, the materials each point takes and its
opening hours are kept.

The data is © OpenStreetMap contributors under the Open Database Licence
(https://www.openstreetmap.org/copyright). It's mapped by volunteers, not
published by the council, so the app labels it as demo data.

Run from backend/ (needs internet, nothing else to install):
    python src/app/scripts/fetch_osm_points.py

Or save the Overpass response yourself and convert it:
    python src/app/scripts/fetch_osm_points.py --input overpass.json
"""
import argparse
import json
import re
import urllib.parse
import urllib.request
from datetime import date, timezone, datetime
from pathlib import Path

OUTPUT = Path(__file__).parent / "data" / "newcastle_recycling_points.json"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# south, west, north, east: roughly the city of Newcastle upon Tyne
BBOX = (54.95, -1.78, 55.07, -1.53)

# OpenStreetMap recycling tags to the app's material names
TAG_TO_MATERIAL = {
    "glass": "Glass",
    "glass_bottles": "Glass",
    "cans": "Metal",
    "scrap_metal": "Metal",
    "aluminium": "Metal",
    "paper": "Paper",
    "newspaper": "Paper",
    "magazines": "Paper",
    "paper_packaging": "Paper",
    "cardboard": "Cardboard",
    "plastic_bottles": "PET",
    "plastic": "Plastic",
    "plastic_packaging": "Plastic",
    "plastic_bags": "LDPE",
    "beverage_cartons": "Tetra Pak",
    "cartons": "Tetra Pak",
    "clothes": "Textile",
    "shoes": "Textile",
    "textiles": "Textile",
    "wood": "Wood",
}

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
OSM_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
ALL_DAY = ["00:01", "23:59"]


def overpass_query() -> str:
    south, west, north, east = BBOX
    return (
        "[out:json][timeout:60];"
        f'(node["amenity"="recycling"]({south},{west},{north},{east});'
        f'way["amenity"="recycling"]({south},{west},{north},{east}););'
        "out center tags;"
    )


def download() -> dict:
    body = urllib.parse.urlencode({"data": overpass_query()}).encode()
    request = urllib.request.Request(
        OVERPASS_URL,
        data=body,
        headers={"User-Agent": "EcoNexus demo data script (https://github.com/k1k12/EcoNexus)"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.load(response)


def parse_opening_hours(value):
    """Turn simple OSM opening_hours into the app's weekly format, or None."""
    if not value:
        return None
    value = value.strip()
    if value == "24/7":
        return {day: ALL_DAY for day in DAYS}

    hours = {day: ["Closed", "Closed"] for day in DAYS}
    for rule in value.split(";"):
        rule = rule.strip()
        if not rule:
            continue
        match = re.fullmatch(r"([A-Za-z]{2})(?:-([A-Za-z]{2}))?\s+(\d{2}:\d{2})-(\d{2}:\d{2})", rule)
        if not match:
            # Anything fancier (holidays, several ranges) isn't worth guessing
            return None
        start_day, end_day, opens, closes = match.groups()
        if start_day not in OSM_DAYS or (end_day and end_day not in OSM_DAYS):
            return None
        first = OSM_DAYS.index(start_day)
        last = OSM_DAYS.index(end_day) if end_day else first
        if last < first:
            return None
        times = ALL_DAY if (opens, closes) in (("00:00", "24:00"), ("00:00", "23:59")) else [opens, closes]
        for i in range(first, last + 1):
            hours[DAYS[i]] = times
    return hours


def convert(overpass: dict) -> dict:
    points = []
    for element in overpass.get("elements", []):
        tags = element.get("tags", {})
        lat = element.get("lat", element.get("center", {}).get("lat"))
        lon = element.get("lon", element.get("center", {}).get("lon"))
        if lat is None or lon is None:
            continue

        materials = sorted({
            material
            for key, material in TAG_TO_MATERIAL.items()
            if tags.get(f"recycling:{key}") == "yes"
        })
        if not materials:
            continue

        hours = parse_opening_hours(tags.get("opening_hours"))
        points.append({
            "osm": f"{element['type']}/{element['id']}",
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "materials": materials,
            "centre": tags.get("recycling_type") == "centre",
            "hours": hours,
        })

    points.sort(key=lambda p: p["osm"])
    return {
        "source": "© OpenStreetMap contributors",
        "licence": "Open Database Licence (ODbL) 1.0, https://www.openstreetmap.org/copyright",
        "fetched": datetime.now(timezone.utc).date().isoformat(),
        "bbox": list(BBOX),
        "points": points,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--input", help="convert a saved Overpass JSON response instead of downloading")
    args = parser.parse_args()

    if args.input:
        with open(args.input, encoding="utf-8") as f:
            overpass = json.load(f)
    else:
        overpass = download()

    data = convert(overpass)
    OUTPUT.parent.mkdir(exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
        f.write("\n")

    with_hours = sum(1 for p in data["points"] if p["hours"])
    print(f"Saved {len(data['points'])} recycling points ({with_hours} with opening hours) to {OUTPUT}")


if __name__ == "__main__":
    main()
