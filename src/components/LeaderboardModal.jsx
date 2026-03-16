import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, X, Sparkles } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardModal({ isOpen, onClose }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingUserId, setViewingUserId] = useState(null);

  useEffect(() => {
    if (isOpen) fetchLeaderboard();
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch all stickers with points
      const { data: stickersData } = await supabase
        .from('stickers')
        .select('user_id, points')
        .not('user_id', 'is', null);

      // 2. Fetch all claims with stickers(points) joined
      const { data: claimsData } = await supabase
        .from('sticker_claims')
        .select('user_id, stickers(points)');

      // 3. Fetch all physical claims
      const { data: physicalClaimsData } = await supabase
        .from('physical_qr_claims')
        .select('user_id, physical_qrcodes(points)');

      // 4. Aggregate scores
      const scores = {};
      const stickerCounts = {};
      
      (stickersData || []).forEach(s => {
        scores[s.user_id] = (scores[s.user_id] || 0) + (s.points || 10);
        stickerCounts[s.user_id] = (stickerCounts[s.user_id] || 0) + 1;
      });
      
      (claimsData || []).forEach(c => {
        if (!c.user_id) return;
        const pts = c.stickers?.points || 10;
        scores[c.user_id] = (scores[c.user_id] || 0) + pts;
      });

      (physicalClaimsData || []).forEach(p => {
        if (!p.user_id) return;
        const pts = p.physical_qrcodes?.points || 10;
        scores[p.user_id] = (scores[p.user_id] || 0) + pts;
      });

      // 4. Fetch profiles
      const userIds = Object.keys(scores);
      if (userIds.length === 0) { setLeaderboard([]); return; }
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const ranked = (profilesData || [])
        .map(p => ({ 
          ...p, 
          score: scores[p.id] || 0,
          count: stickerCounts[p.id] || 0
        }))
        .sort((a, b) => b.score - a.score);

      setLeaderboard(ranked);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in slide-in-from-bottom duration-300 pb-safe">
      <div className="bg-[#0a0a0a] w-full max-w-md rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh] mesh-gradient relative">
        
        {/* Close Button - Floating */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/40 z-20 border border-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-8 pt-10 pb-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4 shadow-xl">
            <Trophy size={24} className="text-yellow-400 opacity-90" />
          </div>
          <h2 className="text-2xl font-light tracking-tight text-white mb-1">
            Top <span className="font-bold">Stickerinos</span>
          </h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Nos colleuses et colleurs acharnés</p>
        </div>

        {/* Leaderboard Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="text-white/20 text-xs font-medium tracking-widest uppercase">Classement en cours...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-4xl mb-4 opacity-20">🏆</span>
              <p className="text-white/40 font-light">Le classement est encore vide.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((member, index) => (
                <button
                  key={member.id}
                  onClick={() => setViewingUserId(member.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-[24px] border transition-all text-left relative overflow-hidden group ${
                    index === 0 ? 'bg-yellow-400/5 border-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.05)]' :
                    index === 1 ? 'bg-white/5 border-white/20' :
                    index === 2 ? 'bg-amber-600/5 border-amber-600/20' :
                    'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Rank Indicator */}
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center relative">
                    {index < 3 ? (
                      <span className="text-2xl drop-shadow-lg">{MEDALS[index]}</span>
                    ) : (
                      <span className="text-white/20 font-bold text-sm tracking-tighter">#{index + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 shadow-lg flex-shrink-0 relative">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white/40'
                      }`}>
                        {member.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    {index === 0 && (
                      <div className="absolute inset-0 bg-yellow-400/10 animate-pulse pointer-events-none"></div>
                    )}
                  </div>

                  {/* Name & Count */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate tracking-tight transition-transform group-hover:translate-x-1 ${
                      index === 0 ? 'text-yellow-400' : 'text-white'
                    }`}>
                      {member.username || 'Anonyme'}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[#ccff00] font-bold text-[10px] uppercase tracking-wider">
                        <Sparkles size={10} />
                        <span>{member.score} <span className="font-light">puntos</span></span>
                      </div>
                      <span className="text-white/20 text-[10px] font-bold uppercase tracking-wider">
                        {member.count} <span className="font-light">stickos</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress Glow (Right side) */}
                  <div className="w-1 h-8 rounded-full bg-white/5 overflow-hidden">
                    <div 
                      className={`w-full h-full rounded-full transition-all duration-1000 ${
                        index === 0 ? 'bg-yellow-400' : 
                        index === 1 ? 'bg-white/40' : 
                        index === 2 ? 'bg-amber-600' : 
                        'bg-white/10'
                      }`}
                      style={{ height: `${(member.score / (leaderboard[0]?.score || 1)) * 100}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewingUserId && (
        <UserProfileModal 
          userId={viewingUserId} 
          onClose={() => setViewingUserId(null)} 
        />
      )}
    </div>
  );
}
