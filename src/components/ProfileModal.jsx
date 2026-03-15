import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, LogOut, X } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, user, profile, onUpdate }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
    }
  }, [profile]);

  if (!isOpen || !user) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
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
      onUpdate();
      alert("Profil mis à jour !");
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
          <h2 className="text-2xl font-light tracking-tight text-white mb-1">
            Mon <span className="font-bold">Profil</span>
          </h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Personnalisez votre identité</p>
        </div>

        {/* Form Body */}
        <div className="px-8 pb-10 overflow-y-auto space-y-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-2">Pseudo</label>
              <div className="glass-panel rounded-[24px] p-1 border-white/5 focus-within:border-white/20 transition-all">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-transparent outline-none text-white placeholder-white/10 font-light"
                  placeholder="Choisissez un pseudo..."
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-[10px] text-center font-bold tracking-tight bg-red-400/10 py-2 rounded-full border border-red-400/20">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-full transition-all shadow-[0_15px_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>}
              SAUVEGARDER
            </button>
          </form>

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
