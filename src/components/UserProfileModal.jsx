import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { computeAchievements } from '../lib/achievements';

// Convert ISO 3166-1 alpha-3 -> alpha-2 for flag emojis
const ISO3_TO_ISO2 = {
  AFG:'AF',ALB:'AL',DZA:'DZ',ASM:'AS',AND:'AD',AGO:'AO',ARG:'AR',ARM:'AM',AUS:'AU',AUT:'AT',
  AZE:'AZ',BHS:'BS',BHR:'BH',BGD:'BD',BLR:'BY',BEL:'BE',BLZ:'BZ',BEN:'BJ',BTN:'BT',BOL:'BO',
  BIH:'BA',BWA:'BW',BRA:'BR',BRN:'BN',BGR:'BG',BFA:'BF',BDI:'BI',CPV:'CV',KHM:'KH',CMR:'CM',
  CAN:'CA',CAF:'CF',TCD:'TD',CHL:'CL',CHN:'CN',COL:'CO',COM:'KM',COD:'CD',COG:'CG',CRI:'CR',
  HRV:'HR',CUB:'CU',CYP:'CY',CZE:'CZ',DNK:'DK',DJI:'DJ',DOM:'DO',ECU:'EC',EGY:'EG',SLV:'SV',
  GNQ:'GQ',ERI:'ER',EST:'EE',SWZ:'SZ',ETH:'ET',FJI:'FJ',FIN:'FI',FRA:'FR',GAB:'GA',GMB:'GM',
  GEO:'GE',DEU:'DE',GHA:'GH',GRC:'GR',GTM:'GT',GIN:'GN',GNB:'GW',GUY:'GY',HTI:'HT',HND:'HN',
  HUN:'HU',ISL:'IS',IND:'IN',IDN:'ID',IRN:'IR',IRQ:'IQ',IRL:'IE',ISR:'IL',ITA:'IT',JAM:'JM',
  JPN:'JP',JOR:'JO',KAZ:'KZ',KEN:'KE',PRK:'KP',KOR:'KR',KWT:'KW',KGZ:'KG',LAO:'LA',LVA:'LV',
  LBN:'LB',LSO:'LS',LBR:'LR',LBY:'LY',LIE:'LI',LTU:'LT',LUX:'LU',MDG:'MG',MWI:'MW',MYS:'MY',
  MDV:'MV',MLI:'ML',MLT:'MT',MRT:'MR',MUS:'MU',MEX:'MX',MDA:'MD',MCO:'MC',MNG:'MN',MNE:'ME',
  MAR:'MA',MOZ:'MZ',MMR:'MM',NAM:'NA',NPL:'NP',NLD:'NL',NZL:'NZ',NIC:'NI',NER:'NE',NGA:'NG',
  MKD:'MK',NOR:'NO',OMN:'OM',PAK:'PK',PAN:'PA',PNG:'PG',PRY:'PY',PER:'PE',PHL:'PH',POL:'PL',
  PRT:'PT',QAT:'QA',ROU:'RO',RUS:'RU',RWA:'RW',SAU:'SA',SEN:'SN',SRB:'RS',SLE:'SL',SGP:'SG',
  SVK:'SK',SVN:'SI',SOM:'SO',ZAF:'ZA',SSD:'SS',ESP:'ES',LKA:'LK',SDN:'SD',SUR:'SR',SWE:'SE',
  CHE:'CH',SYR:'SY',TWN:'TW',TJK:'TJ',TZA:'TZ',THA:'TH',TLS:'TL',TGO:'TG',TTO:'TT',TUN:'TN',
  TUR:'TR',TKM:'TM',UGA:'UG',UKR:'UA',ARE:'AE',GBR:'GB',USA:'US',URY:'UY',UZB:'UZ',VEN:'VE',
  VNM:'VN',YEM:'YE',ZMB:'ZM',ZWE:'ZW',
};

const getFlag = (iso3) => {
  const iso2 = ISO3_TO_ISO2[iso3?.toUpperCase()];
  if (!iso2) return null;
  return iso2.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
};

export default function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [countries, setCountries] = useState([]);
  const [stickerCount, setStickerCount] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [
        { data: profileData },
        { data: stickersData },
        { count: commentCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('stickers').select('country_code').eq('user_id', userId),
        supabase.from('sticker_comments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      setProfile(profileData);

      const count = stickersData?.length || 0;
      setStickerCount(count);

      const uniqueCodes = [...new Set((stickersData || []).map(s => s.country_code).filter(Boolean))];
      setCountries(uniqueCodes);

      // Compute achievements
      const computed = computeAchievements({
        stickerCount: count,
        countryCodes: uniqueCodes,
        commentCount: commentCount || 0,
      });
      setAchievements(computed);
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-700 rounded-full"></div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-y-auto p-6 space-y-5">
            {/* Profile header */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center border-4 border-indigo-500/40 overflow-hidden shadow-lg">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-indigo-300 font-bold">
                    {profile?.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-white font-bold text-2xl">{profile?.username || 'Explorateur'}</h2>
                <div className="flex items-center justify-center gap-3 mt-1">
                  <span className="text-indigo-400 text-sm font-medium">
                    📌 {stickerCount} sticker{stickerCount > 1 ? 's' : ''}
                  </span>
                  <span className="text-yellow-400 text-sm font-medium">
                    🏆 {unlockedCount}/{achievements.length} succès
                  </span>
                </div>
              </div>
            </div>

            {/* Countries visited */}
            <div className="bg-gray-800/60 rounded-2xl p-4">
              <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-3">
                🌍 Pays visités ({countries.length})
              </p>
              {countries.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-2">Aucun pays encore 😊</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {countries.map((code) => {
                    const flag = getFlag(code);
                    return flag ? (
                      <span key={code} className="text-3xl" title={code}>{flag}</span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-gray-800/60 rounded-2xl p-4">
              <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-3">
                🏆 Succès
              </p>
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all ${
                      a.unlocked
                        ? 'bg-indigo-500/15 border border-indigo-500/30'
                        : 'bg-gray-700/30 opacity-40'
                    }`}
                    title={a.description}
                  >
                    <span className={`text-2xl ${a.unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
                    <p className={`text-xs font-bold leading-tight ${a.unlocked ? 'text-white' : 'text-gray-500'}`}>
                      {a.name}
                    </p>
                    {a.unlocked && (
                      <span className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider">Débloqué</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-2xl transition-all text-sm"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
