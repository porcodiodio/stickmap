import { useState } from 'react';
import { Camera, MapPin, X, Upload } from 'lucide-react';

export default function AddStickerModal({ onClose, onAdd }) {
  const [photo, setPhoto] = useState(null);
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
    onAdd({ photo, location });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 pb-safe">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Nouveau Sticker
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-200/60 hover:bg-gray-300 rounded-full transition-colors text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          
          {/* Photo Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Photo de votre sticker</label>
            <div className="w-full h-48 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden">
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
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    <Camera size={24} />
                  </div>
                  <span className="text-indigo-600 font-medium">Prendre une photo</span>
                  <span className="text-xs text-indigo-400 mt-1">ou choisir depuis la galerie</span>
                </>
              )}
            </div>
          </div>

          {/* Location Area */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Votre Position Actuelle</label>
            <div 
              onClick={handleGetLocation}
              className={`w-full p-4 rounded-2xl border ${location ? 'border-green-200 bg-green-50/50 text-green-700' : 'border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 text-gray-600'} cursor-pointer flex items-center justify-between transition-colors`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${location ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="font-medium">
                    {location ? 'Position enregistrée' : 'Obtenir ma position'}
                  </p>
                  {location && (
                    <p className="text-xs opacity-70">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
              {isLocating && (
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <button 
              type="submit"
              disabled={!photo || !location}
              className="w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all focus:ring-4 focus:ring-indigo-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-500 hover:from-indigo-600 to-purple-600 hover:to-purple-700 flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              Coller mon Sticker !
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
