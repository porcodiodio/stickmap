/**
 * Milano Stickerini Achievement Definitions
 * Each achievement has:
 * - id: unique key
 * - icon: emoji
 * - name: display name
 * - description: how to unlock
 * - check(stats): returns true if unlocked based on user stats
 *
 * stats = { stickerCount, countryCodes, commentCount, continents, hasPostedInLast24h }
 */

const CONTINENTS = {
  europe: ['FRA','DEU','GBR','ITA','ESP','PRT','NLD','BEL','CHE','AUT','POL','CZE','SVK','HUN','ROU','BGR','GRC','HRV','SRB','BIH','MNE','SVN','EST','LVA','LTU','FIN','SWE','NOR','DNK','ISL','IRL','LUX','MCO','AND','LIE','MLT','MKD','ALB','MDA','BLR','UKR','RUS'],
  north_america: ['USA','CAN','MEX','GTM','BLZ','HND','SLV','NIC','CRI','PAN','CUB','JAM','HTI','DOM','PRI'],
  south_america: ['BRA','ARG','CHL','PER','COL','VEN','ECU','BOL','PRY','URY','GUY','SUR'],
  africa: ['NGA','ZAF','EGY','KEN','ETH','GHA','TZA','UGA','SDN','DZA','MAR','TUN','LBY','CMR','SEN','MDG','MOZ','ZMB','ZWE','BWA','NAM','AGO'],
  asia: ['CHN','JPN','KOR','IND','IDN','THA','VNM','PHL','MYS','SGP','BGD','PAK','LKA','NPL','MMR','KHM','LAO','BTN','SAU','ARE','QAT','KWT','BHR','OMN','JOR','ISR','LBN','SYR','IRQ','IRN','TUR','AZE','GEO','ARM','KAZ','UZB','TKM'],
  oceania: ['AUS','NZL','FJI','PNG'],
};

const getContinentsFromCodes = (codes) => {
  const found = new Set();
  codes.forEach(code => {
    for (const [continent, countries] of Object.entries(CONTINENTS)) {
      if (countries.includes(code)) { found.add(continent); break; }
    }
  });
  return found;
};

export const ACHIEVEMENTS = [
  {
    id: 'first_sticker',
    icon: '📌',
    name: 'Premier Pas',
    description: 'Poser votre premier sticker',
    check: ({ stickerCount }) => stickerCount >= 1,
  },
  {
    id: 'home_sweet_home',
    icon: '🏠',
    name: 'Home Sweet Home',
    description: 'Coller un sticker en France',
    check: ({ countryCodes }) => countryCodes.includes('FRA'),
  },
  {
    id: 'propaganda',
    icon: '📢',
    name: 'Propaganda',
    description: 'Poster au moins 5 stickers',
    check: ({ stickerCount }) => stickerCount >= 5,
  },
  {
    id: 'globe_trotter',
    icon: '🌍',
    name: 'Globe Trotter',
    description: 'Poser des stickers dans 5 pays différents',
    check: ({ countryCodes }) => new Set(countryCodes).size >= 5,
  },
  {
    id: 'world_tour',
    icon: '🌎',
    name: 'World Tour',
    description: 'Poser des stickers dans 10 pays différents',
    check: ({ countryCodes }) => new Set(countryCodes).size >= 10,
  },
  {
    id: 'continental',
    icon: '🗺️',
    name: 'Continental',
    description: 'Stickers sur 3 continents différents',
    check: ({ countryCodes }) => getContinentsFromCodes(countryCodes).size >= 3,
  },
  {
    id: 'world_conqueror',
    icon: '👑',
    name: 'Conquérant',
    description: 'Stickers sur 5 continents différents',
    check: ({ countryCodes }) => getContinentsFromCodes(countryCodes).size >= 5,
  },
  {
    id: 'legend',
    icon: '⭐',
    name: 'Légende',
    description: 'Poster 50 stickers au total',
    check: ({ stickerCount }) => stickerCount >= 50,
  },
  {
    id: 'commentator',
    icon: '💬',
    name: 'Bavard',
    description: 'Laisser 10 commentaires',
    check: ({ commentCount }) => commentCount >= 10,
  },
];

export const computeAchievements = (stats) =>
  ACHIEVEMENTS.map(a => ({ ...a, unlocked: a.check(stats) }));
