import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function FeedModal({ isOpen, onClose, onSelectSticker }) {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-950 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <h2 className="text-white font-bold text-lg leading-none">Derniers Stickers</h2>
            <p className="text-gray-500 text-xs mt-0.5">Activité récente de la communauté</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : stickers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-600">
            <span className="text-4xl mb-3">🌍</span>
            <p>Aucun sticker posté pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {stickers.map((sticker) => (
              <button
                key={sticker.id}
                onClick={() => { onSelectSticker(sticker); onClose(); }}
                className="w-full flex gap-3 p-4 hover:bg-gray-800/50 transition-colors text-left"
              >
                {/* Author avatar */}
                <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30 overflow-hidden flex-shrink-0">
                  {sticker.profile?.avatar_url ? (
                    <img src={sticker.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-400 font-bold">
                      {sticker.profile?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-white font-semibold text-sm truncate">
                      {sticker.profile?.username || 'Explorateur'}
                    </p>
                    <p className="text-gray-500 text-xs flex-shrink-0">{timeAgo(sticker.created_at)}</p>
                  </div>
                  {sticker.caption && (
                    <p className="text-gray-400 text-sm italic truncate mb-1">"{sticker.caption}"</p>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                      <img src={sticker.photo_url} alt="sticker" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-gray-600 text-xs">📍 {sticker.country_code || 'Quelque part dans le monde'}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
