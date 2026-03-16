import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Flame, X } from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import { getFlagEmoji } from '../lib/countryUtils';

export default function FeedModal({ isOpen, onClose, onSelectSticker }) {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingUserId, setViewingUserId] = useState(null);

  useEffect(() => {
    if (isOpen) fetchFeed();
  }, [isOpen]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const { data: stickersData } = await supabase
        .from('stickers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!stickersData || stickersData.length === 0) { setStickers([]); return; }

      const userIds = [...new Set(stickersData.map(s => s.user_id).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profilesMap = {};
      (profilesData || []).forEach(p => { profilesMap[p.id] = p; });

      setStickers(stickersData.map(s => ({ ...s, profile: profilesMap[s.user_id] || null })));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return `il y a ${Math.floor(diff / 86400)} j`;
  };

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
            <Flame size={24} className="text-orange-500 opacity-90" />
          </div>
          <h2 className="text-2xl font-light tracking-tight text-white mb-1">
            Nouvelle <span className="font-bold">propaganda</span>
          </h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Les derniers collages tout frais</p>
        </div>

        {/* Feed Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="text-white/20 text-xs font-medium tracking-widest uppercase">Chargement du flux...</p>
            </div>
          ) : stickers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-4xl mb-4 opacity-20">🌍</span>
              <p className="text-white/40 font-light">Aucun sticker pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => { onSelectSticker(sticker); onClose(); }}
                  className="w-full flex items-start gap-4 p-4 rounded-[24px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left group"
                >
                  {/* Author avatar */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (sticker.user_id) setViewingUserId(sticker.user_id);
                    }}
                    className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer hover:scale-110 transition-all"
                  >
                    {sticker.profile?.avatar_url ? (
                      <img src={sticker.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-white text-xs font-bold">
                        {sticker.profile?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium text-sm tracking-tight truncate group-hover:text-[#ccff00] transition-colors">
                        {sticker.profile?.username || 'Anonyme'}
                      </p>
                      <p className="text-white/20 text-[10px] font-mono tracking-tighter">{timeAgo(sticker.created_at)}</p>
                    </div>
                    {sticker.caption && (
                      <p className="text-white/40 text-[13px] font-light leading-snug line-clamp-2 mb-3">"{sticker.caption}"</p>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={sticker.photo_url} alt="sticker" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-2xl" title={sticker.country_code}>
                        {getFlagEmoji(sticker.country_code) || '🏳️‍🌈'}
                      </span>
                    </div>
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
