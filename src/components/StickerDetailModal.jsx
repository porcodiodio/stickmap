import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import EditStickerModal from './EditStickerModal';

export default function StickerDetailModal({ isOpen, onClose, sticker, currentUser, onStickerUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isOwner = currentUser && sticker && currentUser.id === sticker.user_id;

  useEffect(() => {
    if (sticker) {
      if (sticker.user_id) fetchProfile();
      fetchComments();
    }
  }, [sticker]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sticker.user_id)
        .single();
      setProfile(data);
    } catch (err) {
      console.error("Erreur fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      // 1. Fetch comments
      const { data: commentsData, error } = await supabase
        .from('sticker_comments')
        .select('*')
        .eq('sticker_id', sticker.id)
        .order('created_at', { ascending: true });

      if (error) { console.error("Comments fetch error:", error); return; }
      if (!commentsData || commentsData.length === 0) { setComments([]); return; }

      // 2. Fetch profiles for all unique user_ids
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profilesMap = {};
      (profilesData || []).forEach(p => { profilesMap[p.id] = p; });

      // 3. Merge
      const merged = commentsData.map(c => ({
        ...c,
        profiles: profilesMap[c.user_id] || null
      }));
      setComments(merged);
    } catch (err) {
      console.error("fetchComments error:", err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    setPostingComment(true);
    try {
      const { error } = await supabase.from('sticker_comments').insert({
        sticker_id: sticker.id,
        user_id: currentUser.id,
        content: newComment.trim(),
      });
      if (error) throw error;
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error("Erreur post commentaire:", err);
    } finally {
      setPostingComment(false);
    }
  };

  if (!isOpen || !sticker) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse"></div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-400 font-bold text-lg">
                      {profile?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-white font-bold leading-none">{profile?.username || 'Explorateur'}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(sticker.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Éditer
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Photo */}
          <div className="p-4 pb-0">
            <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <img src={sticker.photo_url} alt="Globe Sticker" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Caption */}
          {sticker.caption && (
            <div className="px-4 pt-4">
              <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 italic text-gray-300">
                "{sticker.caption}"
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="p-4 space-y-3">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Commentaires ({comments.length})
            </h3>

            {comments.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-4">Soyez le premier à commenter ! 👋</p>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30 overflow-hidden flex-shrink-0">
                  {comment.profiles?.avatar_url ? (
                    <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-400 font-bold text-xs">
                      {comment.profiles?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-none px-3 py-2 flex-1">
                  <p className="text-indigo-400 text-xs font-bold mb-1">{comment.profiles?.username || 'Anonyme'}</p>
                  <p className="text-gray-200 text-sm">{comment.content}</p>
                </div>
              </div>
            ))}

            {/* Comment Input */}
            {currentUser ? (
              <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
                />
                <button
                  type="submit"
                  disabled={postingComment || !newComment.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-2xl transition-all flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            ) : (
              <p className="text-center text-gray-600 text-sm py-2">
                <span className="text-indigo-400 font-semibold">Connectez-vous</span> pour laisser un commentaire.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <EditStickerModal
          sticker={sticker}
          onClose={() => setIsEditOpen(false)}
          onUpdated={() => {
            setIsEditOpen(false);
            onStickerUpdated?.();
          }}
        />
      )}
    </div>
  );
}
