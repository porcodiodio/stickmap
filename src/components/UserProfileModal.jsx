import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, MapPin, Trophy } from 'lucide-react';
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
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in slide-in-from-bottom duration-300 pb-safe">
      <div className="bg-[#0a0a0a] w-full max-w-md rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh] mesh-gradient relative">
        
        {/* Close Button - Floating */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/40 z-20 border border-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Header - Profile Info */}
            <div className="px-8 pt-12 pb-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/5 shadow-2xl mb-4 relative">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-3xl font-light">
                    {profile?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-light tracking-tight text-white mb-2">
                <span className="font-bold">{profile?.username || 'Explorateur'}</span>
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                  <MapPin size={12} className="text-[#ccff00]" />
                  <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{stickerCount} sticker{stickerCount > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                  <Trophy size={12} className="text-yellow-400" />
                  <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{unlockedCount}/{achievements.length} succès</span>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-8">
              
              {/* Countries Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Pays explorés ({countries.length})</h3>
                </div>
                <div className="glass-panel rounded-[24px] p-4 border-white/5 bg-white/[0.02] flex flex-wrap gap-2">
                  {countries.length === 0 ? (
                    <p className="text-white/20 text-xs italic font-light">Pas encore d'exploration...</p>
                  ) : (
                    countries.map(code => (
                      <div key={code} className="text-2xl hover:scale-125 transition-transform" title={code}>
                        {getFlag(code)}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Achievements Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Succès débloqués</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {achievements.map((ach) => (
                    <div 
                      key={ach.id}
                      className={`aspect-square rounded-[24px] p-3 flex flex-col items-center justify-center text-center gap-2 border transition-all ${
                        ach.unlocked 
                          ? 'bg-white/5 border-white/10 shadow-[0_10px_20px_rgba(255,255,255,0.03)]' 
                          : 'bg-black/20 border-white/5 opacity-30 grayscale'
                      }`}
                    >
                      <span className={`text-2xl ${ach.unlocked ? 'animate-bounce-subtle' : ''}`}>{ach.icon}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-tighter leading-tight ${ach.unlocked ? 'text-white' : 'text-white/40'}`}>
                        {ach.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
