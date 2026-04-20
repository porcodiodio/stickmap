import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, User } from 'lucide-react';

export default function SetupProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !user) return;
    
    setLoading(true);
    setError(null);
    try {
      // Met à jour la table profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Force le rafraîchissement du profil dans App.jsx
      onProfileUpdated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in slide-in-from-bottom duration-300 pb-safe">
      <div className="bg-[#0a0a0a] w-full max-w-sm rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col mesh-gradient relative">
        
        {/* Close Button - Floating */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/40 z-20 border border-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-8 pt-10 pb-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center mb-4 shadow-xl text-[#ccff00]">
            <User size={24} />
          </div>
          <h2 className="text-2xl font-light tracking-tight text-white mb-1">
            C'est <span className="font-bold">qui là?!</span>
          </h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold leading-relaxed px-4 mt-2">
            Choisis un pseudo pour signer tes points sur la carte
          </p>
        </div>

        {/* Form Body */}
        <div className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="glass-panel rounded-[24px] p-1 border-white/5 focus-within:border-[#ccff00]/30 transition-all">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-4 bg-transparent outline-none text-white placeholder-white/20 font-medium text-center text-lg"
                  placeholder="Ton pseudo..."
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-[10px] text-center font-bold tracking-tight bg-red-400/10 py-2 rounded-full border border-red-400/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full bg-white text-black font-bold py-4 rounded-full transition-all shadow-[0_15px_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                "C'EST PARTI !"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
