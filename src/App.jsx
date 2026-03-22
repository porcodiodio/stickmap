import { useState, useRef, useEffect } from 'react';
import { Flame, Trophy, QrCode, Plus } from 'lucide-react';
import axios from 'axios';
import './App.css'
import GlobeMap from './components/GlobeMap'
import AddStickerModal from './components/AddStickerModal'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import StickerDetailModal from './components/StickerDetailModal'
import FeedModal from './components/FeedModal'
import LeaderboardModal from './components/LeaderboardModal'
import ClaimScannerModal from './components/ClaimScannerModal'
import SplashScreen from './components/SplashScreen'
import { supabase } from './lib/supabase'

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const mapRef = useRef(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsAuthModalOpen(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
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
      
      // 0. Reverse Geocoding to get Country Code and POI info
      let countryCode = null;
      let poiName = null;
      let poiCategory = null;

      try {
        const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
        const geoResponse = await axios.get(
          `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${data.location.lng}&latitude=${data.location.lat}&access_token=${MAPBOX_TOKEN}`
        );
        
        const features = geoResponse.data.features;
        console.log("Geocoding features found:", features);
        
        // 1. Find Country
        const countryFeature = features.find(f => f.properties.feature_type === 'country');
        if (countryFeature) {
           countryCode = countryFeature.properties.context?.country?.country_code_alpha_3?.toUpperCase();
        } else if (features.length > 0) {
           countryCode = features[0].properties.context?.country?.country_code_alpha_3?.toUpperCase();
        }

        // 2. Find POI (Point of Interest)
        const poiFeature = features.find(f => f.properties.feature_type === 'poi');
        if (poiFeature) {
          poiName = poiFeature.properties.name;
          poiCategory = poiFeature.properties.poi_category?.[0]; // Get the primary category
          console.log("Found POI:", poiName, "Category:", poiCategory);
        }
        
        console.log("Detected Country Code (ISO-A3):", countryCode);
      } catch (e) {
        console.error("Geocoding failed, continuing without extra info", e);
      }

      // ... existing photo upload code ...
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

      const { data: publicURLData } = supabase.storage
        .from('stickers-photos')
        .getPublicUrl(fileName);
        
      const photoUrl = publicURLData.publicUrl;

      // 3. Insert into Database with enriched POI data
      const { error: dbError } = await supabase
        .from('stickers')
        .insert([
          { 
            latitude: data.location.lat, 
            longitude: data.location.lng,
            photo_url: photoUrl,
            country_code: countryCode,
            poi_name: poiName,
            poi_category: poiCategory,
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
    <div className="min-h-screen flex flex-col w-full max-w-md mx-auto bg-black text-white shadow-2xl relative overflow-hidden mesh-gradient">
      {isSplashVisible && <SplashScreen onFinish={() => setIsSplashVisible(false)} />}
      
      {/* Ultra-Premium Header */}
      <header className="px-6 py-5 absolute top-0 w-full z-20 flex justify-center items-center bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-0.5">Stick the World</span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Milano Stickerini
          </h1>
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

      {/* Floating Glassmorphic Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] z-30">
        <nav className="glass-panel rounded-full px-6 py-3 flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] border-white/20">
          {/* 1. Feed */}
          <button
            onClick={() => setIsFeedOpen(true)}
            className="flex flex-col items-center gap-1 transition-all transform active:scale-90 group"
          >
            <Flame size={22} className="text-orange-500/80 group-hover:text-orange-500 transition-colors group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
          </button>

          {/* 2. Leaderboard */}
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="flex flex-col items-center gap-1 transition-all transform active:scale-90 group"
          >
            <Trophy size={22} className="text-yellow-400/80 group-hover:text-yellow-400 transition-colors group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
          </button>

          {/* 3. Add Sticker (center CTA) */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] transform hover:scale-110 active:scale-95 transition-all outline-none border-none group"
          >
            <Plus size={28} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* 4. Scanner */}
          <button 
            onClick={() => user ? setIsScannerOpen(true) : setIsAuthModalOpen(true)}
            className="flex flex-col items-center gap-1 transition-all transform active:scale-90 group"
          >
            <QrCode size={22} className="text-[#ccff00]/80 group-hover:text-[#ccff00] transition-colors group-hover:drop-shadow-[0_0_8px_rgba(204,255,0,0.4)]" />
          </button>

          {/* 5. Profile */}
          <button 
            onClick={() => user ? setIsProfileModalOpen(true) : setIsAuthModalOpen(true)}
            className="w-8 h-8 rounded-full glass-panel flex items-center justify-center overflow-hidden border-white/20 transform active:scale-90 transition-all"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center text-[10px] font-bold">
                {profile?.username?.charAt(0).toUpperCase() || (user ? "U" : "?")}
              </div>
            )}
          </button>
        </nav>
      </div>

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

      <ClaimScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onClaimSuccess={() => {
          setRefreshTrigger(prev => prev + 1);
          if (user) fetchProfile(user.id);
        }}
      />
    </div>
  )
}

export default App
