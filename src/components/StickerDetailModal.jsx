import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { X, Edit3, Trash2, Send, MapPin, Sparkles, QrCode } from 'lucide-react';
import EditStickerModal from './EditStickerModal';
import UserProfileModal from './UserProfileModal';

export default function StickerDetailModal({ isOpen, onClose, sticker, currentUser, onStickerUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [viewingUserId, setViewingUserId] = useState(null);

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

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    const { error } = await supabase.from('sticker_comments').delete().eq('id', commentId);
    if (!error) fetchComments();
  };

  const handleEditComment = async (commentId) => {
    if (!editingContent.trim()) return;
    const { error } = await supabase.from('sticker_comments')
      .update({ content: editingContent.trim() })
      .eq('id', commentId);
    if (!error) { setEditingCommentId(null); setEditingContent(''); fetchComments(); }
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in slide-in-from-bottom duration-300 pb-safe">
      <div className="bg-[#0a0a0a] w-full max-w-lg rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh] mesh-gradient relative">
        
        {/* Header - Author Info & Actions */}
        <div className="px-6 pt-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => sticker.user_id && setViewingUserId(sticker.user_id)}
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 shadow-lg hover:scale-110 transition-all cursor-pointer flex-shrink-0"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/40 font-bold">
                  {profile?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </button>
            <div className="min-w-0">
              <p className="text-white font-medium tracking-tight truncate">
                {profile?.username || 'Anonyme'}
              </p>
              <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                {new Date(sticker.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            
            {/* Points Badge moved next to pseudo */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#ccff00]/10 rounded-full border border-[#ccff00]/20 flex-shrink-0 ml-1">
              <Sparkles size={12} className="text-[#ccff00]" />
              <span className="text-[10px] text-[#ccff00] font-bold uppercase tracking-widest">{sticker.points || 10} PUNTOS</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwner && (
              <button
                onClick={() => setIsEditOpen(true)}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/60 border border-white/5 shadow-xl"
                title="Éditer"
              >
                <Edit3 size={18} />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/40 border border-white/5 shadow-xl"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* Photo Container */}
          <div className="w-full aspect-square sm:aspect-video rounded-[24px] overflow-hidden border border-white/5 bg-black/40 group relative">
            <img src={sticker.photo_url} alt="Sticker" className="w-full h-full object-contain" />
            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2">
              <MapPin size={12} className="text-[#ccff00]" />
              <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">{sticker.country_code || '📍 Monde'}</span>
            </div>
          </div>

          {/* Caption */}
          {sticker.caption && (
            <div className="glass-panel rounded-[24px] p-5 border-white/5 bg-white/[0.02]">
              <p className="text-white/80 font-light leading-relaxed italic">"{sticker.caption}"</p>
            </div>
          )}

          {/* Comments Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Commentaires ({comments.length})</h3>
            </div>

            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-white/5 rounded-[24px]">
                  <p className="text-white/20 text-xs font-light">Aucun message encore...</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isCommentOwner = currentUser && currentUser.id === comment.user_id;
                  const isEditing = editingCommentId === comment.id;
                  return (
                    <div key={comment.id} className="flex gap-3 group/comment">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                        {comment.profiles?.avatar_url ? (
                          <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-[10px] font-bold">
                            {comment.profiles?.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-[20px] rounded-tl-none p-3 relative">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[#ccff00] text-[11px] font-bold tracking-tight">{comment.profiles?.username || 'Anonyme'}</p>
                          {isCommentOwner && !isEditing && (
                            <div className="flex items-center gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setEditingCommentId(comment.id); setEditingContent(comment.content); }}
                                className="text-white/20 hover:text-white transition-colors"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-white/20 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="flex gap-2 mt-1">
                            <input
                              autoFocus
                              type="text"
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleEditComment(comment.id); if (e.key === 'Escape') setEditingCommentId(null); }}
                              className="flex-1 bg-white/5 rounded-lg px-2 py-1 text-white text-xs outline-none border border-[#ccff00]/30"
                            />
                            <button onClick={() => handleEditComment(comment.id)} className="text-[#ccff00] font-bold text-[10px]">OK</button>
                          </div>
                        ) : (
                          <p className="text-white/70 text-[13px] font-light leading-snug">{comment.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Comment Input Box - Sticky at bottom */}
        <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
          {currentUser ? (
            <form onSubmit={handlePostComment} className="flex gap-2">
              <div className="flex-1 glass-panel rounded-full border-white/5 p-1 flex items-center pr-2 focus-within:border-[#ccff00]/30 transition-all">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Éclairez le globe..."
                  className="flex-1 bg-transparent px-4 py-2 text-white text-[13px] outline-none placeholder-white/20 font-light"
                />
                <button
                  type="submit"
                  disabled={postingComment || !newComment.trim()}
                  className="bg-white text-black p-2 rounded-full disabled:opacity-20 transition-all hover:scale-110"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          ) : (
            <p className="text-center text-white/20 text-[10px] font-bold uppercase tracking-widest py-2">
              Connectez-vous pour commenter
            </p>
          )}
        </div>
      </div>

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

      {viewingUserId && (
        <UserProfileModal
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
        />
      )}
    </div>
  );
}
