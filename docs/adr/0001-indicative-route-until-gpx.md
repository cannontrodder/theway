# Draw an indicative route until we have a real Camino track

`trip-data.json` has no route geometry — obtaining an authoritative GPX or GeoJSON for Logroño to Burgos is still an open item, and the data explicitly forbids passing a Google Maps pedestrian route off as Camino navigation. So v1 draws straight lines between the Overnights and Waypoints, dashed and labelled "indicative", rather than a wiggly line that would look surveyed but be invented.

The Route line is meant to dominate the site, so this is a visible compromise on the centrepiece. It is deliberate: an honest thin line beats a convincing wrong one, and swapping the geometry in later touches only the map layer.
