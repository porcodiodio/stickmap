import { useState, useRef } from 'react';
import { Camera, ImageIcon, MapPin, X, Upload, RefreshCw } from 'lucide-react';

export default function AddStickerModal({ onClose, onAdd }) {
  const [photo, setPhoto] = useState(null);
  const [caption, setCaption] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [location, setLocation] = useState(null);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(URL.createObjectURL(e.target.files[0]));
    }
  };

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
    onAdd({ photo, location, caption });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in slide-in-from-bottom duration-300 pb-safe">
      <div className="bg-[#0a0a0a] w-full max-w-md rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh] mesh-gradient relative">
        
        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Close Button */}
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
        <form onSubmit={handleSubmit} className="px-8 pb-10 overflow-y-auto space-y-5">

          {/* Photo Section */}
          <div className="space-y-3">

            {/* Preview */}
            {photo && (
              <div className="relative w-full h-52 rounded-[20px] overflow-hidden border border-white/10">
                <img src={photo} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white/70 hover:text-white border border-white/10 transition-all"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            )}

            {/* Pick source buttons */}
            {!photo && (
              <div className="grid grid-cols-2 gap-3">
                {/* Camera live */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="glass-panel rounded-[20px] p-5 flex flex-col items-center gap-3 border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <Camera size={22} className="text-white/60 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/80">Appareil photo</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Live</p>
                  </div>
                </button>

                {/* Gallery */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="glass-panel rounded-[20px] p-5 flex flex-col items-center gap-3 border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <ImageIcon size={22} className="text-white/60 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/80">Galerie</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Bibliothèque</p>
                  </div>
                </button>
              </div>
            )}

            {/* Re-pick button when photo is set */}
            {photo && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setTimeout(() => cameraInputRef.current?.click(), 50); }}
                  className="glass-panel rounded-[16px] py-3 flex items-center justify-center gap-2 border-white/5 hover:border-white/20 transition-all text-white/50 hover:text-white/80 text-sm"
                >
                  <Camera size={16} />
                  <span>Reprendre</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setTimeout(() => galleryInputRef.current?.click(), 50); }}
                  className="glass-panel rounded-[16px] py-3 flex items-center justify-center gap-2 border-white/5 hover:border-white/20 transition-all text-white/50 hover:text-white/80 text-sm"
                >
                  <ImageIcon size={16} />
                  <span>Galerie</span>
                </button>
              </div>
            )}
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
                {isLocating ? (
                  <div className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                ) : (
                  <MapPin size={22} />
                )}
              </div>
              <div>
                <p className={`font-medium transition-colors ${location ? 'text-[#ccff00]' : 'text-white/60'}`}>
                  {isLocating ? 'Localisation...' : location ? 'Position verrouillée' : 'Géolocalisation'}
                </p>
                {location && (
                  <p className="text-[10px] text-[#ccff00]/50 font-mono tracking-tighter">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
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
