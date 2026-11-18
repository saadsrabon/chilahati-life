"""Convert the OSM map API response to the geometry format used by fetch-map."""
import json
import sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.stdin.buffer).getroot()
if root.tag != "osm":
    raise ValueError("Expected an OSM map response")

nodes = {}
elements = []
for item in root.findall("node"):
    point = {"lat": float(item.attrib["lat"]), "lon": float(item.attrib["lon"])}
    nodes[item.attrib["id"]] = point
    tags = {tag.attrib["k"]: tag.attrib["v"] for tag in item.findall("tag")}
    if tags:
        elements.append({"type": "node", "id": item.attrib["id"], "tags": tags, **point})

for item in root.findall("way"):
    tags = {tag.attrib["k"]: tag.attrib["v"] for tag in item.findall("tag")}
    if not {"highway", "railway", "building", "amenity", "shop", "tourism"} & tags.keys():
        continue
    geometry = [nodes[ref.attrib["ref"]] for ref in item.findall("nd")]
    elements.append({"type": "way", "id": item.attrib["id"], "tags": tags, "geometry": geometry})

json.dump({"elements": elements}, sys.stdout)
