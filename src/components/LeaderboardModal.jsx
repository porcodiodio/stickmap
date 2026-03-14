import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
      // Fetch all stickers with user_id
      const { data: stickersData } = await supabase
        .from('stickers')
        .select('user_id')
        .not('user_id', 'is', null);

      if (!stickersData || stickersData.length === 0) { setLeaderboard([]); return; }

      // Count stickers per user
      const counts = {};
      stickersData.forEach(s => { counts[s.user_id] = (counts[s.user_id] || 0) + 1; });

      // Fetch profiles
      const userIds = Object.keys(counts);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const ranked = (profilesData || [])
        .map(p => ({ ...p, count: counts[p.id] || 0 }))
        .sort((a, b) => b.count - a.count);

      setLeaderboard(ranked);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-950 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <div>
            <h2 className="text-white font-bold text-lg leading-none">Top Stickers</h2>
            <p className="text-gray-500 text-xs mt-0.5">Les membres les plus actifs</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Leaderboard */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-600">
            <span className="text-4xl mb-3">🏆</span>
            <p>Aucun classement disponible</p>
          </div>
        ) : (
          leaderboard.map((member, index) => (
            <button
              key={member.id}
              onClick={() => setViewingUserId(member.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                index === 0 ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20' :
                index === 1 ? 'bg-gray-400/10 border-gray-400/20 hover:bg-gray-400/20' :
                index === 2 ? 'bg-amber-600/10 border-amber-600/20 hover:bg-amber-600/20' :
                'bg-gray-800/50 border-gray-800 hover:bg-gray-800'
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {index < 3 ? (
                  <span className="text-2xl">{MEDALS[index]}</span>
                ) : (
                  <span className="text-gray-500 font-bold text-lg group-hover:text-white transition-colors">#{index + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-indigo-400 transition-all">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className={`font-bold text-xl ${index === 0 ? 'text-yellow-400' : 'text-indigo-400'}`}>
                    {member.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>

              {/* Name & count */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate group-hover:translate-x-1 transition-transform ${index === 0 ? 'text-yellow-300' : 'text-white'}`}>
                  {member.username || 'Explorateur'}
                </p>
                <p className="text-gray-500 text-sm">{member.count} sticker{member.count > 1 ? 's' : ''}</p>
              </div>

              {/* Progress bar */}
              <div className="w-20 flex-shrink-0">
                <div className="bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : index === 2 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    style={{ width: `${(member.count / (leaderboard[0]?.count || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </button>
          ))
        )}
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
