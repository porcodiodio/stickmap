import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, MapPin, Trophy, Sparkles } from 'lucide-react';
import { computeAchievements } from '../lib/achievements';
import { getFlagEmoji } from '../lib/countryUtils';

export default function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [countries, setCountries] = useState([]);
  const [stickerCount, setStickerCount] = useState(0);
  const [score, setScore] = useState(0);
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
        { count: commentCount },
        { data: claimsData },
        { data: physicalClaimsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('stickers').select('country_code, points').eq('user_id', userId),
        supabase.from('sticker_comments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('sticker_claims').select('sticker_id, stickers(points)').eq('user_id', userId),
        supabase.from('physical_qr_claims').select('physical_qrcodes(points)').eq('user_id', userId)
      ]);

      setProfile(profileData);

      const count = stickersData?.length || 0;
      setStickerCount(count);

      // Points calculation
      const stickersPoints = (stickersData || []).reduce((acc, s) => acc + (s.points || 10), 0);
      const claimsPoints = (claimsData || []).reduce((acc, c) => acc + (c.stickers?.points || 10), 0);
      const physicalPoints = (physicalClaimsData || []).reduce((acc, p) => acc + (p.physical_qrcodes?.points || 10), 0);
      
      setScore(stickersPoints + claimsPoints + physicalPoints);

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
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#ccff00]/10 rounded-full border border-[#ccff00]/20">
                  <Sparkles size={12} className="text-[#ccff00]" />
                  <span className="text-[10px] text-[#ccff00] font-bold uppercase tracking-widest">{score} puntos</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                  <MapPin size={12} className="text-white/40" />
                  <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{stickerCount} stickos</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                  <Trophy size={12} className="text-yellow-400" />
                  <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{unlockedCount}/{achievements.length}</span>
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
                        {getFlagEmoji(code)}
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
