import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function StickerDetailModal({ isOpen, onClose, sticker }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sticker && sticker.user_id) {
      fetchProfile();
    }
  }, [sticker]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sticker.user_id)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Erreur fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !sticker) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
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
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-inner bg-black flex items-center justify-center mb-6">
            <img 
              src={sticker.photo_url} 
              alt="Globe Sticker" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 bg-indigo-400/10 self-start px-3 py-1 rounded-full text-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Destimation : {sticker.country_code || 'Inconnue'}
            </div>
            
            <button 
              onClick={onClose}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 mt-4"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
