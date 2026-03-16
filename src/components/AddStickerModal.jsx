import { useState } from 'react';
import { Camera, MapPin, X, Upload } from 'lucide-react';

export default function AddStickerModal({ onClose, onAdd }) {
  const [photo, setPhoto] = useState(null);
  const [caption, setCaption] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [location, setLocation] = useState(null);

  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Erreur de géolocalisation: ", error);
          alert("Impossible de vous géolocaliser. Veuillez autoriser l'accès.");
          setIsLocating(false);
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      setIsLocating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!photo || !location) {
      alert("Veuillez ajouter une photo et votre position.");
      return;
    }
    // TODO: Send to Supabase
    onAdd({ photo, location, caption });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in slide-in-from-bottom duration-300 pb-safe">
      <div className="bg-[#0a0a0a] w-full max-w-md rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh] mesh-gradient relative">
        
        {/* Close Button - Floating */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/40 z-20 border border-white/5"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="px-8 pt-10 pb-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4 shadow-xl">
            <Upload size={24} className="opacity-80" />
          </div>
          <h2 className="text-2xl font-light tracking-tight text-white mb-1">
            Ajouter un <span className="font-bold">Stickos</span>
          </h2>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-8 pb-10 overflow-y-auto space-y-8">
          
          {/* Photo Upload Area */}
          <div className="space-y-3">
            <div className="w-full h-52 glass-card border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden">
              <input 
                type="file" 
                accept="image/*"
                capture="environment"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  if(e.target.files && e.target.files[0]) {
                    setPhoto(URL.createObjectURL(e.target.files[0]));
                  }
                }}
              />
              {photo ? (
                <img src={photo} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform border border-white/10">
                    <Camera size={26} className="opacity-60" />
                  </div>
                  <span className="text-white/80 font-medium">Ajouter une photo</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1">ou parcourir la galerie</span>
                </>
              )}
            </div>
          </div>

          {/* Caption Area */}
          <div className="space-y-3">
            <div className="glass-panel rounded-[24px] p-1 border-white/5 focus-within:border-white/20 transition-all">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Dis nous en plus ! (optionnel)"
                className="w-full p-4 bg-transparent outline-none resize-none h-24 text-white placeholder-white/20 font-light"
              />
            </div>
          </div>

          {/* Location Area */}
          <div 
            onClick={handleGetLocation}
            className={`glass-panel rounded-[24px] p-5 transition-all group border-white/5 ${location ? 'bg-[#ccff00]/5 border-[#ccff00]/20' : 'hover:border-white/20 cursor-pointer'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${location ? 'bg-[#ccff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.4)]' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                <MapPin size={22} />
              </div>
              <div>
                <p className={`font-medium transition-colors ${location ? 'text-[#ccff00]' : 'text-white/60'}`}>
                  {location ? 'Position verrouillée' : 'Géolocalisation'}
                </p>
                {location && (
                  <p className="text-[10px] text-[#ccff00]/50 font-mono tracking-tighter">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
            {isLocating && (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button 
              type="submit"
              disabled={!photo || !location}
              className="w-full py-5 rounded-full font-bold text-black bg-white shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Upload size={20} strokeWidth={3} />
              COLLER MON MILANO STICKERINI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
