import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css'
import GlobeMap from './components/GlobeMap'
import AddStickerModal from './components/AddStickerModal'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import StickerDetailModal from './components/StickerDetailModal'
import { supabase } from './lib/supabase'

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const mapRef = useRef(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleAddSticker = async (data) => {
    try {
      setIsUploading(true);
      
      // 0. Reverse Geocoding to get Country Code (ISO-A3 expected by GeoJSON)
      let countryCode = null;
      try {
        const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
        const geoResponse = await axios.get(
          `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${data.location.lng}&latitude=${data.location.lat}&access_token=${MAPBOX_TOKEN}`
        );
        
        // Find the country feature
        const features = geoResponse.data.features;
        console.log("Geocoding features found:", features);
        
        // Try to find country in features or in context of the first feature
        const countryFeature = features.find(f => f.properties.feature_type === 'country');
        
        if (countryFeature) {
           countryCode = countryFeature.properties.context?.country?.country_code_alpha_3?.toUpperCase();
        } else if (features.length > 0) {
           // Fallback: check context of the first feature
           countryCode = features[0].properties.context?.country?.country_code_alpha_3?.toUpperCase();
        }
        
        console.log("Detected Country Code (ISO-A3):", countryCode);
      } catch (e) {
        console.error("Geocoding failed, continuing without country code", e);
      }

      // 1. Upload the image to Storage
      const response = await fetch(data.photo);
      const blob = await response.blob();
      
      const fileName = `${Date.now()}-sticker.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stickers-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicURLData } = supabase.storage
        .from('stickers-photos')
        .getPublicUrl(fileName);
        
      const photoUrl = publicURLData.publicUrl;

      // 3. Insert into Database
      const { error: dbError } = await supabase
        .from('stickers')
        .insert([
          { 
            latitude: data.location.lat, 
            longitude: data.location.lng,
            photo_url: photoUrl,
            country_code: countryCode,
            user_id: user?.id // Nullable if not logged in, but better if logged in
          }
        ]);

      if (dbError) throw dbError;
      console.log("Sticker successfully inserted with country code:", countryCode);
      alert("Sticker ajouté avec succès !");
      setRefreshTrigger(prev => prev + 1);
      
      // Optional: Wait a bit then fly to new sticker
      setTimeout(() => {
        if (mapRef.current) mapRef.current.flyToLastSticker();
      }, 1000);

    } catch (error) {
      console.error("Erreur ajout sticker:", error);
      alert("Erreur lors de l'ajout: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full max-w-md mx-auto bg-gray-900 shadow-2xl relative overflow-hidden">
      {/* Header Mobile */}
      <header className="px-4 py-3 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 absolute top-0 w-full z-20 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">
          StickMap
        </h1>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => user ? setIsProfileModalOpen(true) : setIsAuthModalOpen(true)}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 cursor-pointer overflow-hidden hover:border-indigo-500 transition-all"
          >
            {profile?.avatar_url || user ? (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </div>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Map Content - Full space */}
      <main className="flex-1 w-full h-full relative z-0">
        <GlobeMap 
          ref={mapRef} 
          refreshTrigger={refreshTrigger} 
          onSelectSticker={(sticker) => setSelectedSticker(sticker)}
        />
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="absolute bottom-0 w-full bg-gray-900/90 backdrop-blur-lg border-t border-gray-800 px-6 py-4 flex justify-between items-center z-20 pb-safe">
        <button 
          onClick={() => {
            if (mapRef.current) mapRef.current.flyToLastSticker();
          }}
          className="flex flex-col items-center text-indigo-400 transition-colors cursor-pointer"
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-[10px] uppercase tracking-wider font-bold">Explorer</span>
        </button>
        
        {/* Floating Add Button */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] transform -translate-y-6 hover:scale-105 active:scale-95 transition-all outline-none ring-4 ring-gray-900 cursor-pointer relative"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          {isUploading && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          )}
        </button>
        
        <button className="flex flex-col items-center text-gray-500 hover:text-indigo-400 transition-colors cursor-not-allowed opacity-50">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          <span className="text-[10px] uppercase tracking-wider font-bold">Menu</span>
        </button>
      </nav>

      {/* Modals */}
      {isAddModalOpen && (
        <AddStickerModal 
          onClose={() => setIsAddModalOpen(false)} 
          onAdd={handleAddSticker}
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        profile={profile}
        onUpdate={() => fetchProfile(user.id)}
      />

      <StickerDetailModal 
        isOpen={!!selectedSticker} 
        onClose={() => setSelectedSticker(null)}
        sticker={selectedSticker}
      />
    </div>
  )
}

export default App
