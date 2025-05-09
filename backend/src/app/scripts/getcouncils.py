from datetime import datetime
import pickle
import argparse
from typing import List
import requests
from requests.exceptions import Timeout
from lxml import etree
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.database.models import Council  # Update if your model path differs

AREA_LIST_URL = "https://webservices.esd.org.uk/areas?areaType=LA&ApplicationKey=nXtlswtirCpXlkuLZZCRmdmfDrCkimVWabXqDuKq"
HTTP_TIMEOUT = 10  # seconds

def kml_url_generator(identifier):
    return f"https://webservices.esd.org.uk/areas/{identifier}/shape?ApplicationKey=nXtlswtirCpXlkuLZZCRmdmfDrCkimVWabXqDuKq"

def fetch_and_store_councils(db: Session, save_to: List[str], verbose: bool = False):
    response = requests.get(AREA_LIST_URL)
    if response.status_code != 200:
        raise Exception(f"Failed to retrieve council list: {response.status_code}")

    data = response.json()
    areas = [
        {"gss_code": area["identifier"], "name": area["label"]}
        for area in data.get("area-array", [])
        if "(former authority)" not in area["label"].lower()
    ]

    ns = {"kml": "http://www.opengis.net/kml/2.2"}
    
    # only for serialization at the end, if --store=pickle
    serialize: bool = "serialize" in save_to
    store_db: bool = "db" in save_to
    
    councils = []

    for area in areas:
        gss_code = area["gss_code"]
        name = area["name"]

        try:
            kml_response = requests.get(kml_url_generator(gss_code), timeout=HTTP_TIMEOUT)
        except Timeout:
            if verbose:
                print(f"[!] Timed out fetching KML for {gss_code}")
            continue

        if kml_response.status_code != 200:
            if verbose:
                print(f"[!] Failed to retrieve KML for {gss_code}: HTTP {kml_response.status_code}")
            continue

        tree = etree.fromstring(kml_response.content)
        coordinates = tree.xpath("//kml:coordinates", namespaces=ns)
        if not coordinates:
            if verbose:
                print(f"[!] No coordinates found for {gss_code}")
            continue

        raw_coords = coordinates[0].text.strip().split()
        coords = []
        for coord in raw_coords:
            parts = coord.strip().split(",")
            if len(parts) >= 2:
                try:
                    lon = float(parts[0])
                    lat = float(parts[1])
                    coords.append([lon, lat])
                except ValueError:
                    if verbose:
                        print(f"[!] Invalid coord: {parts}")
        if serialize:
            councils.append({"gss_code": gss_code, "name": name, "lon_lat_points": coords})
        if store_db:
            council = Council(
                gss_code=gss_code,
                name=name,
                lon_lat_points=coords
            )
            db.merge(council)
        if verbose:
            print(f"[+] Stored {gss_code}: {name} with {len(coords)} coordinates")
    if store_db:
        db.commit()
    if serialize:
        with open(f"{datetime.now()}_uk_council_areas.pkl", "wb") as f:
            pickle.dump(councils, f)
        
    print("[✓] All councils saved.")

def main():
    parser = argparse.ArgumentParser(description="Fetch and store UK council boundaries.")
    parser.add_argument("-v", "--verbose", action="store_true", help="Print details during execution")
    parser.add_argument("--store", choices=["db", "serialize"], nargs="+",
                        required=True, help="")
    args = parser.parse_args()

    db_gen = get_db()
    db: Session = next(db_gen)
    try:
        fetch_and_store_councils(db, verbose=args.verbose, save_to=args.store)
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass

if __name__ == "__main__":
    main()
