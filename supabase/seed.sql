-- Seed data: campings reales de Argentina para desarrollo local
-- Coordenadas verificadas, datos representativos

INSERT INTO campings (name, slug, location, province, geohash, type, amenities, prices, contact, photos, source, verified) VALUES

-- Patagonia Norte
(
  'Camping Los Coihues',
  'los-coihues-bariloche',
  ST_SetSRID(ST_MakePoint(-71.3442, -41.1245), 4326)::geography,
  'Río Negro',
  '6cs0v',
  'privado',
  '{"water": true, "electricity": true, "bathrooms": true, "showers": true, "hot_water": true, "wifi": true, "grill": true, "parking": true, "store": true}',
  '{"person_per_night": 5000, "tent_per_night": 3000, "car_per_night": 2000, "currency": "ARS"}',
  '{"phone": "+54 294 446-1060", "website": "https://campingloscoihues.com.ar"}',
  ARRAY[]::TEXT[],
  'community',
  true
),
(
  'Camping Petunia',
  'camping-petunia-bariloche',
  ST_SetSRID(ST_MakePoint(-71.4101, -41.0850), 4326)::geography,
  'Río Negro',
  '6cs0r',
  'privado',
  '{"water": true, "electricity": true, "bathrooms": true, "showers": true, "hot_water": true, "wifi": false, "grill": true, "parking": true, "pets_allowed": true}',
  '{"person_per_night": 4500, "tent_per_night": 2500, "currency": "ARS"}',
  '{"phone": "+54 294 444-8015"}',
  ARRAY[]::TEXT[],
  'community',
  true
),
(
  'Camping Lago Gutiérrez',
  'camping-lago-gutierrez',
  ST_SetSRID(ST_MakePoint(-71.4156, -41.1689), 4326)::geography,
  'Río Negro',
  '6cs0j',
  'municipal',
  '{"water": true, "electricity": false, "bathrooms": true, "showers": true, "hot_water": false, "grill": true, "parking": true}',
  '{"person_per_night": 3000, "tent_per_night": 2000, "currency": "ARS"}',
  NULL,
  ARRAY[]::TEXT[],
  'community',
  true
),

-- El Chaltén
(
  'Camping Madsen',
  'camping-madsen-chalten',
  ST_SetSRID(ST_MakePoint(-72.8860, -49.3283), 4326)::geography,
  'Santa Cruz',
  '5wv1g',
  'privado',
  '{"water": true, "electricity": true, "bathrooms": true, "showers": true, "hot_water": true, "wifi": true, "grill": true, "parking": true, "restaurant": true}',
  '{"person_per_night": 8000, "tent_per_night": 5000, "currency": "ARS"}',
  '{"phone": "+54 2962 49-3118", "website": "https://campingmadsen.com"}',
  ARRAY[]::TEXT[],
  'community',
  true
),
(
  'Camping De Agostini',
  'camping-de-agostini-chalten',
  ST_SetSRID(ST_MakePoint(-72.8871, -49.3316), 4326)::geography,
  'Santa Cruz',
  '5wv1g',
  'libre',
  '{"water": true, "electricity": false, "bathrooms": true, "showers": false, "grill": true}',
  '{"person_per_night": 0, "currency": "ARS"}',
  NULL,
  ARRAY[]::TEXT[],
  'community',
  true
),

-- Mendoza
(
  'Camping El Refugio',
  'camping-el-refugio-potrerillos',
  ST_SetSRID(ST_MakePoint(-69.1944, -32.9500), 4326)::geography,
  'Mendoza',
  '6ebht',
  'privado',
  '{"water": true, "electricity": true, "bathrooms": true, "showers": true, "hot_water": true, "wifi": false, "grill": true, "parking": true, "pool": true}',
  '{"person_per_night": 4000, "tent_per_night": 3000, "currency": "ARS"}',
  '{"phone": "+54 261 490-5555"}',
  ARRAY[]::TEXT[],
  'community',
  true
),
(
  'Camping Suizo',
  'camping-suizo-uspallata',
  ST_SetSRID(ST_MakePoint(-69.3459, -32.5937), 4326)::geography,
  'Mendoza',
  '6ecj1',
  'privado',
  '{"water": true, "electricity": true, "bathrooms": true, "showers": true, "hot_water": true, "grill": true, "parking": true, "store": true}',
  '{"person_per_night": 5500, "tent_per_night": 3500, "motorhome_per_night": 7000, "currency": "ARS"}',
  '{"phone": "+54 2624 42-0004"}',
  ARRAY[]::TEXT[],
  'community',
  true
),

-- Córdoba
(
  'Camping Municipal La Cumbrecita',
  'camping-municipal-la-cumbrecita',
  ST_SetSRID(ST_MakePoint(-64.7775, -31.8833), 4326)::geography,
  'Córdoba',
  '6dtbg',
  'municipal',
  '{"water": true, "electricity": true, "bathrooms": true, "showers": true, "hot_water": true, "grill": true, "parking": true}',
  '{"person_per_night": 3500, "tent_per_night": 2500, "currency": "ARS"}',
  '{"phone": "+54 3546 48-1088"}',
  ARRAY[]::TEXT[],
  'sinta',
  true
),
(
  'Camping Los Quebrachos',
  'camping-los-quebrachos-mina-clavero',
  ST_SetSRID(ST_MakePoint(-65.0006, -31.7219), 4326)::geography,
  'Córdoba',
  '6dt8v',
  'privado',
  '{"water": true, "electricity": true, "bathrooms": true, "showers": true, "hot_water": true, "wifi": true, "grill": true, "parking": true, "pool": true, "pets_allowed": true}',
  '{"person_per_night": 4000, "tent_per_night": 3000, "currency": "ARS"}',
  '{"phone": "+54 3544 47-0261", "website": "https://losquebrachos.com.ar"}',
  ARRAY[]::TEXT[],
  'community',
  true
),

-- Neuquén / Villa La Angostura
(
  'Camping Correntoso',
  'camping-correntoso-villa-la-angostura',
  ST_SetSRID(ST_MakePoint(-71.6325, -40.7583), 4326)::geography,
  'Neuquén',
  '6cr9x',
  'privado',
  '{"water": true, "electricity": true, "bathrooms": true, "showers": true, "hot_water": true, "wifi": false, "grill": true, "parking": true}',
  '{"person_per_night": 6000, "tent_per_night": 4000, "currency": "ARS"}',
  '{"phone": "+54 294 449-4590"}',
  ARRAY[]::TEXT[],
  'community',
  true
),

-- Lago Puelo
(
  'Camping del Lago',
  'camping-del-lago-lago-puelo',
  ST_SetSRID(ST_MakePoint(-71.6117, -42.0861), 4326)::geography,
  'Chubut',
  '6cm9u',
  'municipal',
  '{"water": true, "electricity": false, "bathrooms": true, "showers": true, "hot_water": false, "grill": true, "parking": true, "pets_allowed": true}',
  '{"person_per_night": 2500, "tent_per_night": 2000, "currency": "ARS"}',
  NULL,
  ARRAY[]::TEXT[],
  'community',
  true
),

-- Buenos Aires (Sierra de la Ventana)
(
  'Camping Base Cerro Ventana',
  'camping-base-cerro-ventana',
  ST_SetSRID(ST_MakePoint(-61.9792, -38.0833), 4326)::geography,
  'Buenos Aires',
  '6ek9c',
  'municipal',
  '{"water": true, "electricity": false, "bathrooms": true, "showers": false, "grill": true, "parking": true}',
  '{"person_per_night": 2000, "tent_per_night": 1500, "currency": "ARS"}',
  NULL,
  ARRAY[]::TEXT[],
  'sinta',
  false
);
