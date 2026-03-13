import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Mon Profil</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-800 overflow-hidden shadow-xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-indigo-500 p-2 rounded-full cursor-pointer shadow-lg hover:bg-indigo-400 transition-colors border-2 border-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
              </label>
            </div>
            {uploading && <p className="text-indigo-400 text-xs mt-2 animate-pulse">Envoi en cours...</p>}
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nom d'utilisateur</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-600"
                placeholder="Votre pseudo"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? 'Mise à jour...' : 'Sauvegarder'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
