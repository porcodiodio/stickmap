import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css'
import GlobeMap from './components/GlobeMap'
import AddStickerModal from './components/AddStickerModal'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import StickerDetailModal from './components/StickerDetailModal'
import FeedModal from './components/FeedModal'
import LeaderboardModal from './components/LeaderboardModal'
import { supabase } from './lib/supabase'

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
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
            user_id: user?.id,
            caption: data.caption
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
      {/* Compact Header - Logo only */}
      <header className="px-4 py-3 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 absolute top-0 w-full z-20 flex justify-center items-center">
        <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">
          StickMap
        </h1>
      </header>

      {/* Main Map Content - Full space */}
      <main className="flex-1 w-full h-full relative z-0">
        <GlobeMap 
          ref={mapRef} 
          refreshTrigger={refreshTrigger} 
          onSelectSticker={(sticker) => setSelectedSticker(sticker)}
        />
      </main>

      {/* Mobile Navigation Bar - 5 icons */}
      <nav className="absolute bottom-0 w-full bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 px-2 py-2 flex justify-around items-center z-20 pb-safe">
        {/* 1. Feed */}
        <button
          onClick={() => setIsFeedOpen(true)}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-400 transition-colors p-2"
        >
          <span className="text-2xl">🔥</span>
          <span className="text-[9px] uppercase tracking-wider font-bold">Actus</span>
        </button>

        {/* 2. Leaderboard */}
        <button
          onClick={() => setIsLeaderboardOpen(true)}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-400 transition-colors p-2"
        >
          <span className="text-2xl">🏆</span>
          <span className="text-[9px] uppercase tracking-wider font-bold">Top</span>
        </button>

        {/* 3. Add Sticker (center CTA) */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] transform -translate-y-4 hover:scale-105 active:scale-95 transition-all outline-none ring-4 ring-gray-900 cursor-pointer relative"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          {isUploading && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          )}
        </button>

        {/* 4. Placeholder - future feature */}
        <button className="flex flex-col items-center gap-1 text-gray-600 p-2 cursor-not-allowed opacity-50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className="text-[9px] uppercase tracking-wider font-bold">Bientôt</span>
        </button>

        {/* 5. Profile */}
        <button
          onClick={() => user ? setIsProfileModalOpen(true) : setIsAuthModalOpen(true)}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors p-2"
        >
          <div className="w-7 h-7 rounded-full bg-gray-700 border border-gray-600 overflow-hidden flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : user ? (
              <span className="text-white font-bold text-xs">{profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}</span>
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider font-bold">Profil</span>
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
        currentUser={user}
        onStickerUpdated={() => {
          setRefreshTrigger(prev => prev + 1);
          setSelectedSticker(null);
        }}
      />

      <FeedModal
        isOpen={isFeedOpen}
        onClose={() => setIsFeedOpen(false)}
        onSelectSticker={(sticker) => setSelectedSticker(sticker)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </div>
  )
}

export default App
