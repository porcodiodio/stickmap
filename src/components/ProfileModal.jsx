import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, LogOut, X, Sparkles, MapPin, Trophy, Edit2, Check } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, user, profile, onUpdate }) {
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ stickers: 0, score: 0 });

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
    }
    if (user) fetchStats();
  }, [user, profile]);

  const fetchStats = async () => {
    try {
      const [
        { data: stickersData },
        { data: claimsData },
        { data: physicalClaimsData }
      ] = await Promise.all([
        supabase.from('stickers').select('points').eq('user_id', user.id),
        supabase.from('sticker_claims').select('stickers(points)').eq('user_id', user.id),
        supabase.from('physical_qr_claims').select('physical_qrcodes(points)').eq('user_id', user.id)
      ]);

      const sPoints = (stickersData || []).reduce((acc, s) => acc + (s.points || 10), 0);
      const cPoints = (claimsData || []).reduce((acc, c) => acc + (c.stickers?.points || 10), 0);
      const pPoints = (physicalClaimsData || []).reduce((acc, p) => acc + (p.physical_qrcodes?.points || 10), 0);
      
      setStats({
        stickers: stickersData?.length || 0,
        score: sPoints + cPoints + pPoints
      });
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  if (!isOpen || !user) return null;

  const handleUpdateUsername = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          username, 
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error("Pseudo update error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (e) => {
    try {
      setUploading(true);
      setError(null);
      
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      console.log("Attempting upload to storage:", filePath);

      let { data: uploadData, error: uploadError } = await supabase.storage
        .from('stickers-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }
      
      console.log("Upload successful:", uploadData);

      const { data: publicURLData } = supabase.storage
        .from('stickers-photos')
        .getPublicUrl(filePath);

      const avatarUrl = publicURLData.publicUrl;
      console.log("New avatar URL generated:", avatarUrl);

      // Utiliser upsert au lieu de update pour s'assurer que la ligne existe
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          avatar_url: avatarUrl, 
          updated_at: new Date().toISOString() 
        });

      if (updateError) {
        console.error("Profile upsert error:", updateError);
        throw updateError;
      }
      
      console.log("Profile upserted successfully in DB");
      onUpdate();
    } catch (err) {
      console.error("Error during avatar upload:", err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
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
          <div className="relative group mb-4">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-white text-3xl font-light border-4 border-white/5 overflow-hidden shadow-2xl relative">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="opacity-40">
                  {profile?.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </span>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-white text-black p-2 rounded-full cursor-pointer shadow-xl hover:scale-110 transition-all border-2 border-[#0a0a0a]">
              <Camera size={14} />
              <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
          {/* Username Display/Edit */}
          <div className="mb-6 w-full flex flex-col items-center">
            {isEditing ? (
              <div className="flex items-center gap-2 w-full max-w-[240px]">
                <div className="flex-1 glass-panel rounded-full px-4 py-2 border-white/20 bg-white/5">
                  <input
                    autoFocus
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-white text-center font-medium"
                    placeholder="Pseudo..."
                  />
                </div>
                <button 
                  onClick={handleUpdateUsername}
                  disabled={loading}
                  className="p-2 bg-[#ccff00] text-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Check size={18} />}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 group cursor-pointer" onClick={() => setIsEditing(true)}>
                <h2 className="text-3xl font-bold tracking-tight text-white group-hover:text-[#ccff00] transition-colors">
                  {profile?.username || 'Anonyme'}
                </h2>
                <button className="p-2 bg-white/5 rounded-full text-white/30 group-hover:text-white/60 group-hover:bg-white/10 transition-all shadow-xl border border-white/5">
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#ccff00]/10 rounded-full border border-[#ccff00]/20">
              <Sparkles size={12} className="text-[#ccff00]" />
              <span className="text-[10px] text-[#ccff00] font-bold uppercase tracking-widest">{stats.score} puntos</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <MapPin size={12} className="text-white/40" />
              <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{stats.stickers} stickos</span>
            </div>
          </div>
          
          <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">Milano Stickerini Explorer</p>
        </div>

        <div className="px-8 pb-10 overflow-y-auto space-y-8">
          {error && <p className="text-red-400 text-[10px] text-center font-bold tracking-tight bg-red-400/10 py-2 rounded-full border border-red-400/20">{error}</p>}
          
          <div className="pt-4 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
