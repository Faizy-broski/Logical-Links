-- ============================================================
-- Migration 000035: Location coordinates for Mapbox tracking map
-- Run this SQL in your Supabase SQL editor (or psql).
-- ============================================================

alter table locations
  add column if not exists latitude  numeric(9,6),
  add column if not exists longitude numeric(9,6);

-- Backfill known coordinates for the seeded Canadian cities.
-- Cities added later (or not matched below) are geocoded client-side as a fallback.
update locations set latitude = 51.0447, longitude = -114.0719 where city = 'Calgary' and province = 'Alberta';
update locations set latitude = 53.5461, longitude = -113.4938 where city = 'Edmonton' and province = 'Alberta';
update locations set latitude = 52.2681, longitude = -113.8112 where city = 'Red Deer' and province = 'Alberta';
update locations set latitude = 49.6956, longitude = -112.8451 where city = 'Lethbridge' and province = 'Alberta';
update locations set latitude = 53.6305, longitude = -113.6256 where city = 'St. Albert' and province = 'Alberta';
update locations set latitude = 50.0405, longitude = -110.6764 where city = 'Medicine Hat' and province = 'Alberta';
update locations set latitude = 55.1707, longitude = -118.7947 where city = 'Grande Prairie' and province = 'Alberta';
update locations set latitude = 51.2917, longitude = -114.0144 where city = 'Airdrie' and province = 'Alberta';
update locations set latitude = 53.5450, longitude = -113.9040 where city = 'Spruce Grove' and province = 'Alberta';
update locations set latitude = 50.7256, longitude = -113.9750 where city = 'Okotoks' and province = 'Alberta';

update locations set latitude = 49.2827, longitude = -123.1207 where city = 'Vancouver' and province = 'British Columbia';
update locations set latitude = 49.1913, longitude = -122.8490 where city = 'Surrey' and province = 'British Columbia';
update locations set latitude = 49.2488, longitude = -122.9805 where city = 'Burnaby' and province = 'British Columbia';
update locations set latitude = 49.1666, longitude = -123.1336 where city = 'Richmond' and province = 'British Columbia';
update locations set latitude = 49.8880, longitude = -119.4960 where city = 'Kelowna' and province = 'British Columbia';
update locations set latitude = 49.0504, longitude = -122.3045 where city = 'Abbotsford' and province = 'British Columbia';
update locations set latitude = 49.2838, longitude = -122.7932 where city = 'Coquitlam' and province = 'British Columbia';
update locations set latitude = 49.1044, longitude = -122.6604 where city = 'Langley' and province = 'British Columbia';
update locations set latitude = 48.4757, longitude = -123.3811 where city = 'Saanich' and province = 'British Columbia';
update locations set latitude = 49.0847, longitude = -123.0587 where city = 'Delta' and province = 'British Columbia';
update locations set latitude = 50.6745, longitude = -120.3273 where city = 'Kamloops' and province = 'British Columbia';
update locations set latitude = 49.1659, longitude = -123.9401 where city = 'Nanaimo' and province = 'British Columbia';
update locations set latitude = 48.4284, longitude = -123.3656 where city = 'Victoria' and province = 'British Columbia';
update locations set latitude = 53.9171, longitude = -122.7497 where city = 'Prince George' and province = 'British Columbia';

update locations set latitude = 49.8951, longitude = -97.1384 where city = 'Winnipeg' and province = 'Manitoba';
update locations set latitude = 49.8481, longitude = -99.9503 where city = 'Brandon' and province = 'Manitoba';
update locations set latitude = 49.5254, longitude = -96.6841 where city = 'Steinbach' and province = 'Manitoba';
update locations set latitude = 55.7435, longitude = -97.8558 where city = 'Thompson' and province = 'Manitoba';
update locations set latitude = 49.9728, longitude = -98.2926 where city = 'Portage la Prairie' and province = 'Manitoba';

update locations set latitude = 46.0878, longitude = -64.7782 where city = 'Moncton' and province = 'New Brunswick';
update locations set latitude = 45.2733, longitude = -66.0633 where city = 'Saint John' and province = 'New Brunswick';
update locations set latitude = 45.9636, longitude = -66.6431 where city = 'Fredericton' and province = 'New Brunswick';
update locations set latitude = 47.0288, longitude = -65.5019 where city = 'Miramichi' and province = 'New Brunswick';
update locations set latitude = 47.6186, longitude = -65.6501 where city = 'Bathurst' and province = 'New Brunswick';

update locations set latitude = 47.5615, longitude = -52.7126 where city = 'St. John''s' and province = 'Newfoundland and Labrador';
update locations set latitude = 47.5189, longitude = -52.8058 where city = 'Mount Pearl' and province = 'Newfoundland and Labrador';
update locations set latitude = 48.9500, longitude = -57.9522 where city = 'Corner Brook' and province = 'Newfoundland and Labrador';
update locations set latitude = 47.5364, longitude = -52.8563 where city = 'Paradise' and province = 'Newfoundland and Labrador';

update locations set latitude = 44.6488, longitude = -63.5752 where city = 'Halifax' and province = 'Nova Scotia';
update locations set latitude = 46.1368, longitude = -60.1942 where city = 'Cape Breton' and province = 'Nova Scotia';
update locations set latitude = 45.3654, longitude = -63.2653 where city = 'Truro' and province = 'Nova Scotia';
update locations set latitude = 45.5896, longitude = -62.6465 where city = 'New Glasgow' and province = 'Nova Scotia';

update locations set latitude = 43.6532, longitude = -79.3832 where city = 'Toronto' and province = 'Ontario';
update locations set latitude = 45.4215, longitude = -75.6972 where city = 'Ottawa' and province = 'Ontario';
update locations set latitude = 43.5890, longitude = -79.6441 where city = 'Mississauga' and province = 'Ontario';
update locations set latitude = 43.7315, longitude = -79.7624 where city = 'Brampton' and province = 'Ontario';
update locations set latitude = 43.2557, longitude = -79.8711 where city = 'Hamilton' and province = 'Ontario';
update locations set latitude = 42.9849, longitude = -81.2453 where city = 'London' and province = 'Ontario';
update locations set latitude = 43.8561, longitude = -79.3370 where city = 'Markham' and province = 'Ontario';
update locations set latitude = 43.8563, longitude = -79.5085 where city = 'Vaughan' and province = 'Ontario';
update locations set latitude = 43.4516, longitude = -80.4925 where city = 'Kitchener' and province = 'Ontario';
update locations set latitude = 42.3149, longitude = -83.0364 where city = 'Windsor' and province = 'Ontario';
update locations set latitude = 43.4675, longitude = -79.6877 where city = 'Oakville' and province = 'Ontario';
update locations set latitude = 43.3255, longitude = -79.7990 where city = 'Burlington' and province = 'Ontario';
update locations set latitude = 46.4917, longitude = -80.9930 where city = 'Greater Sudbury' and province = 'Ontario';
update locations set latitude = 43.8971, longitude = -78.8658 where city = 'Oshawa' and province = 'Ontario';
update locations set latitude = 44.3894, longitude = -79.6903 where city = 'Barrie' and province = 'Ontario';
update locations set latitude = 43.8828, longitude = -79.4403 where city = 'Richmond Hill' and province = 'Ontario';
update locations set latitude = 43.5448, longitude = -80.2482 where city = 'Guelph' and province = 'Ontario';
update locations set latitude = 43.8509, longitude = -79.0204 where city = 'Ajax' and province = 'Ontario';
update locations set latitude = 43.8975, longitude = -78.9429 where city = 'Whitby' and province = 'Ontario';
update locations set latitude = 43.8384, longitude = -79.0868 where city = 'Pickering' and province = 'Ontario';
update locations set latitude = 44.0592, longitude = -79.4613 where city = 'Newmarket' and province = 'Ontario';
update locations set latitude = 48.3809, longitude = -89.2477 where city = 'Thunder Bay' and province = 'Ontario';
update locations set latitude = 43.4643, longitude = -80.5204 where city = 'Waterloo' and province = 'Ontario';
update locations set latitude = 43.3616, longitude = -80.3144 where city = 'Cambridge' and province = 'Ontario';
update locations set latitude = 44.2312, longitude = -76.4860 where city = 'Kingston' and province = 'Ontario';
update locations set latitude = 42.4048, longitude = -82.1910 where city = 'Chatham-Kent' and province = 'Ontario';
update locations set latitude = 43.1394, longitude = -80.2644 where city = 'Brantford' and province = 'Ontario';
update locations set latitude = 43.9181, longitude = -78.6373 where city = 'Clarington' and province = 'Ontario';
update locations set latitude = 43.6501, longitude = -79.9552 where city = 'Halton Hills' and province = 'Ontario';
update locations set latitude = 43.5183, longitude = -79.8774 where city = 'Milton' and province = 'Ontario';
update locations set latitude = 44.3091, longitude = -78.3197 where city = 'Peterborough' and province = 'Ontario';
update locations set latitude = 42.9749, longitude = -82.4066 where city = 'Sarnia' and province = 'Ontario';
update locations set latitude = 43.1594, longitude = -79.2469 where city = 'St. Catharines' and province = 'Ontario';
update locations set latitude = 43.0896, longitude = -79.0849 where city = 'Niagara Falls' and province = 'Ontario';

update locations set latitude = 46.2382, longitude = -63.1311 where city = 'Charlottetown' and province = 'Prince Edward Island';
update locations set latitude = 46.3950, longitude = -63.7876 where city = 'Summerside' and province = 'Prince Edward Island';

update locations set latitude = 45.5017, longitude = -73.5673 where city = 'Montreal' and province = 'Quebec';
update locations set latitude = 46.8139, longitude = -71.2080 where city = 'Quebec City' and province = 'Quebec';
update locations set latitude = 45.6066, longitude = -73.7124 where city = 'Laval' and province = 'Quebec';
update locations set latitude = 45.4765, longitude = -75.7013 where city = 'Gatineau' and province = 'Quebec';
update locations set latitude = 45.5312, longitude = -73.5183 where city = 'Longueuil' and province = 'Quebec';
update locations set latitude = 45.4042, longitude = -71.8929 where city = 'Sherbrooke' and province = 'Quebec';
update locations set latitude = 48.4280, longitude = -71.0680 where city = 'Saguenay' and province = 'Quebec';
update locations set latitude = 46.8033, longitude = -71.1727 where city = 'Lévis' and province = 'Quebec';
update locations set latitude = 46.3432, longitude = -72.5432 where city = 'Trois-Rivières' and province = 'Quebec';
update locations set latitude = 45.7003, longitude = -73.6473 where city = 'Terrebonne' and province = 'Quebec';
update locations set latitude = 45.7423, longitude = -73.4514 where city = 'Repentigny' and province = 'Quebec';
update locations set latitude = 45.4545, longitude = -73.4646 where city = 'Brossard' and province = 'Quebec';
update locations set latitude = 45.8836, longitude = -72.4842 where city = 'Drummondville' and province = 'Quebec';
update locations set latitude = 45.3080, longitude = -73.2596 where city = 'Saint-Jean-sur-Richelieu' and province = 'Quebec';

update locations set latitude = 52.1332, longitude = -106.6700 where city = 'Saskatoon' and province = 'Saskatchewan';
update locations set latitude = 50.4452, longitude = -104.6189 where city = 'Regina' and province = 'Saskatchewan';
update locations set latitude = 53.2033, longitude = -105.7531 where city = 'Prince Albert' and province = 'Saskatchewan';
update locations set latitude = 50.3934, longitude = -105.5519 where city = 'Moose Jaw' and province = 'Saskatchewan';
update locations set latitude = 50.2851, longitude = -107.7972 where city = 'Swift Current' and province = 'Saskatchewan';

update locations set latitude = 62.4540, longitude = -114.3718 where city = 'Yellowknife' and province = 'Northwest Territories';
update locations set latitude = 60.8156, longitude = -115.7999 where city = 'Hay River' and province = 'Northwest Territories';
update locations set latitude = 68.3607, longitude = -133.7230 where city = 'Inuvik' and province = 'Northwest Territories';

update locations set latitude = 63.7467, longitude = -68.5170 where city = 'Iqaluit' and province = 'Nunavut';
update locations set latitude = 62.8090, longitude = -92.0850 where city = 'Rankin Inlet' and province = 'Nunavut';

update locations set latitude = 60.7212, longitude = -135.0568 where city = 'Whitehorse' and province = 'Yukon';
update locations set latitude = 64.0601, longitude = -139.4325 where city = 'Dawson City' and province = 'Yukon';
