import * as turf from '@turf/turf';

/**
 * Milano Stickerini Achievement Definitions
 */

const CONTINENTS = {
  europe: ['FRA','DEU','GBR','ITA','ESP','PRT','NLD','BEL','CHE','AUT','POL','CZE','SVK','HUN','ROU','BGR','GRC','HRV','SRB','BIH','MNE','SVN','EST','LVA','LTU','FIN','SWE','NOR','DNK','ISL','IRL','LUX','MCO','AND','LIE','MLT','MKD','ALB','MDA','BLR','UKR','RUS'],
  north_america: ['USA','CAN','MEX','GTM','BLZ','HND','SLV','NIC','CRI','PAN','CUB','JAM','HTI','DOM','PRI'],
  south_america: ['BRA','ARG','CHL','PER','COL','VEN','ECU','BOL','PRY','URY','GUY','SUR'],
  africa: ['NGA','ZAF','EGY','KEN','ETH','GHA','TZA','UGA','SDN','DZA','MAR','TUN','LBY','CMR','SEN','MDG','MOZ','ZMB','ZWE','BWA','NAM','AGO'],
  asia: ['CHN','JPN','KOR','IND','IDN','THA','VNM','PHL','MYS','SGP','BGD','PAK','LKA','NPL','MMR','KHM','LAO','BTN','SAU','ARE','QAT','KWT','BHR','OMN','JOR','ISR','LBN','SYR','IRQ','IRN','TUR','AZE','GEO','ARM','KAZ','UZB','TKM'],
  oceania: ['AUS','NZL','FJI','PNG'],
};

// Coordonnées approximatives des grandes capitales pour le succès "Collectionneur de capitales"
const CAPITALS = [
  [2.3522, 48.8566], // Paris
  [-0.1276, 51.5072], // Londres
  [-77.0369, 38.9072], // Washington
  [139.6917, 35.6895], // Tokyo
  [116.4074, 39.9042], // Beijing
  [13.4050, 52.5200], // Berlin
  [12.4922, 41.8929], // Rome
  [-3.7038, 40.4168], // Madrid
  [-9.1406, 38.7223], // Lisbonne
  [4.3517, 50.8503], // Bruxelles
  [4.9041, 52.3676], // Amsterdam
  [-75.6972, 45.4215], // Ottawa
  [-99.1332, 19.4326], // Mexico
  [-58.3816, -34.6037], // Buenos Aires
  [149.1287, -35.2813], // Canberra
  [37.6173, 55.7558], // Moscou
  [77.2090, 28.6139], // New Delhi
  [106.8275, -6.1751], // Jakarta
  [126.9780, 37.5665], // Séoul
  [18.0686, 59.3293], // Stockholm
  [10.7522, 59.9139], // Oslo
  [24.9384, 60.1699], // Helsinki
  [16.3738, 48.2082], // Vienne
  [14.4208, 50.0880], // Prague
  [23.7275, 37.9838], // Athènes
  [31.2357, 30.0444], // Le Caire
  [18.4233, -33.9249], // Le Cap (approximatif pour ZAF)
  [-74.0721, 4.7110], // Bogota
  [28.9784, 41.0082], // Istanbul (ok, Ankara est la capitale, mais on inclut les hubs)
  [32.8597, 39.9334] // Ankara
];

const getContinentsFromCodes = (codes) => {
  const found = new Set();
  codes.forEach(code => {
    for (const [continent, countries] of Object.entries(CONTINENTS)) {
      if (countries.includes(code)) { found.add(continent); break; }
    }
  });
  return found;
};

// Utils for geographical logic
const countDistinctCities = (stickers) => {
  // We approximate "cities" by grouping stickers that are within 50km of each other
  const cities = [];
  stickers.forEach(s => {
    const point = turf.point([s.longitude, s.latitude]);
    const isNewCity = cities.every(cityCenter => turf.distance(cityCenter, point) > 50);
    if (isNewCity) cities.push(point);
  });
  return cities.length;
};

const countCapitals = (stickers) => {
  const hitCapitals = new Set();
  stickers.forEach(s => {
    const p = turf.point([s.longitude, s.latitude]);
    CAPITALS.forEach((cap, idx) => {
      if (turf.distance(turf.point(cap), p) < 30) {
        hitCapitals.add(idx);
      }
    });
  });
  return hitCapitals.size;
};

const hasLocalRivalry = (userStickers, otherStickers) => {
  if (!otherStickers || otherStickers.length === 0 || userStickers.length === 0) return false;
  for (const u of userStickers) {
    const uPoint = turf.point([u.longitude, u.latitude]);
    for (const o of otherStickers) {
      if (turf.distance(uPoint, turf.point([o.longitude, o.latitude]), { units: 'meters' }) < 50) {
        return true;
      }
    }
  }
  return false;
};

export const ACHIEVEMENTS = [
  {
    id: 'first_sticker',
    icon: '📌',
    name: 'Premier Pas',
    description: 'Premier sticker posé',
    check: ({ stickers }) => stickers.length >= 1,
  },
  {
    id: 'globe_trotter',
    icon: '🌆',
    name: 'Globe-trotter',
    description: '5 villes différentes',
    check: ({ stickers }) => countDistinctCities(stickers) >= 5,
  },
  {
    id: 'grand_voyageur',
    icon: '🌍',
    name: 'Grand voyageur',
    description: '3 pays différents',
    check: ({ stickers }) => new Set(stickers.map(s => s.country_code).filter(Boolean)).size >= 3,
  },
  {
    id: 'world_tour',
    icon: '🌎',
    name: 'World Tour',
    description: '10 pays différents',
    check: ({ stickers }) => new Set(stickers.map(s => s.country_code).filter(Boolean)).size >= 10,
  },
  {
    id: 'continental',
    icon: '🗺️',
    name: 'Continental',
    description: '3 continents différents',
    check: ({ stickers }) => getContinentsFromCodes(stickers.map(s => s.country_code).filter(Boolean)).size >= 3,
  },
  {
    id: 'marathon_sticker',
    icon: '🏃',
    name: 'Marathon du sticker',
    description: '3 en une journée',
    check: ({ stickers }) => {
      const countsByDay = {};
      stickers.forEach(s => {
        const day = s.created_at ? s.created_at.split('T')[0] : null;
        if (day) {
          countsByDay[day] = (countsByDay[day] || 0) + 1;
        }
      });
      return Object.values(countsByDay).some(c => c >= 3);
    },
  },
  {
    id: 'capitals_collector',
    icon: '🏛️',
    name: 'Collectionneur de capitales',
    description: '5 capitales',
    check: ({ stickers }) => countCapitals(stickers) >= 5,
  },
  {
    id: 'scanner_fou',
    icon: '📱',
    name: 'Scanner fou',
    description: 'Scan 15 stickers',
    check: ({ claimsCount }) => claimsCount >= 15,
  },
  {
    id: 'voyageur_nocturne',
    icon: '🦉',
    name: 'Voyageur nocturne',
    description: 'Entre 00h et 5h du matin',
    check: ({ stickers }) => stickers.some(s => {
      if (!s.created_at) return false;
      const date = new Date(s.created_at);
      // Approximation de l'heure locale : UTC + (longitude / 15)
      const localHour = (date.getUTCHours() + Math.round(s.longitude / 15) + 24) % 24;
      return localHour >= 0 && localHour < 5;
    }),
  },
  {
    id: 'nomade_digital',
    icon: '💻',
    name: 'Nomade digital',
    description: 'Dans 3 fuseaux horaires',
    check: ({ stickers }) => {
      const timezones = new Set(stickers.map(s => Math.round(s.longitude / 15)));
      return timezones.size >= 3;
    },
  },
  {
    id: 'commentator',
    icon: '💬',
    name: 'Commentateur',
    description: 'A posté un commentaire',
    check: ({ commentCount }) => commentCount >= 1,
  },
  {
    id: 'rivalite_locale',
    icon: '⚔️',
    name: 'Rivalité locale',
    description: '< 50m d\'un autre sticker',
    check: ({ stickers, otherStickers }) => hasLocalRivalry(stickers, otherStickers),
  },
  {
    id: 'colleur_marin',
    icon: '🌊',
    name: 'Colleur marin',
    description: 'Proche de la mer',
    check: ({ stickers }) => stickers.some(s => {
      const cats = (s.poi_category || '').toLowerCase();
      const name = (s.poi_name || '').toLowerCase();
      return cats.includes('beach') || cats.includes('water') || cats.includes('coast') || name.includes('plage') || name.includes('mer') || name.includes('sea') || name.includes('ocean');
    }),
  },
  {
    id: 'robinson_crusoe',
    icon: '🌴',
    name: 'Robinson Crusoé',
    description: 'Sur une île',
    check: ({ stickers }) => stickers.some(s => {
      const cats = (s.poi_category || '').toLowerCase();
      const name = (s.poi_name || '').toLowerCase();
      return cats.includes('island') || name.includes('île') || name.includes('island');
    }),
  },
  {
    id: 'kaizen',
    icon: '⛰️',
    name: 'Kaizen',
    description: 'Au-dessus de 800m d\'altitude',
    check: ({ stickers }) => stickers.some(s => {
      const cats = (s.poi_category || '').toLowerCase();
      const name = (s.poi_name || '').toLowerCase();
      // On approxime l'altitude par la catégorie de POI de montagne
      return cats.includes('mountain') || cats.includes('peak') || cats.includes('ski') || name.includes('mont ') || name.includes('sommet') || name.includes('pic');
    }),
  },
];

export const computeAchievements = (stats) =>
  ACHIEVEMENTS.map(a => ({ ...a, unlocked: !!a.check(stats) }));

