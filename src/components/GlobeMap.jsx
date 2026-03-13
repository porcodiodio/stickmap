import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import Map, { NavigationControl, Source, Layer, Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import countriesData from '../data/countries.geojson?url';
import { supabase } from '../lib/supabase';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const GlobeMap = forwardRef(({ refreshTrigger }, ref) => {
  const mapRef = useRef(null);
  const [stickers, setStickers] = useState([]);
  
  console.log("Mapbox Token currently loaded:", MAPBOX_TOKEN ? "Yes (length " + MAPBOX_TOKEN.length + ")" : "No token found!");

  const [viewState, setViewState] = useState({
    longitude: 2.3522, // Paris par défaut
    latitude: 48.8566,
    zoom: 1.5
  });

  useImperativeHandle(ref, () => ({
    flyToLastSticker() {
      if (stickers.length === 0) return;
      const last = stickers[stickers.length - 1]; // Supposant trié par défaut (insertion) ou juste le dernier
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [last.longitude, last.latitude],
          zoom: 5,
          duration: 2000
        });
      }
    }
  }));

  useEffect(() => {
    fetchStickers();
  }, [refreshTrigger]);

  const fetchStickers = async () => {
    try {
      // Order by created_at ascending so last is the newest
      const { data, error } = await supabase
        .from('stickers')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      console.log("Stickers fetched from DB:", data);
      setStickers(data || []);
    } catch (error) {
      console.error("Erreur chargement des stickers:", error);
    }
  };

  // Extract unique countries
  const countriesWithStickers = useMemo(() => {
    const uniqueCodes = new Set(stickers.map(s => s.country_code).filter(Boolean));
    const codesArray = Array.from(uniqueCodes);
    console.log("Countries to highlight (ISO A3):", codesArray);
    return codesArray;
  }, [stickers]);

  // Style de la couche GeoJSON
  const countryLayerStyle = {
    id: 'countries',
    type: 'fill',
    paint: {
      'fill-color': '#6366f1',
      'fill-opacity': 0.4,
      'fill-outline-color': '#4f46e5'
    },
    filter: ['in', ['get', 'ISO3166-1-Alpha-3'], ['literal', countriesWithStickers]]
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#1a1c29]">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        projection="globe"
      >
        {/* Layer pour colorer les pays */}
        {countriesWithStickers.length > 0 && (
          <Source id="countries" type="geojson" data={countriesData}>
            <Layer {...countryLayerStyle} />
          </Source>
        )}

        {/* Markers pour chaque sticker */}
        {stickers.map((sticker) => (
          <Marker 
            key={sticker.id} 
            longitude={sticker.longitude} 
            latitude={sticker.latitude}
            anchor="bottom"
          >
            <div className="group cursor-pointer transform transition-transform hover:scale-110 relative z-10">
              <div className="w-10 h-10 bg-white rounded-full p-1 shadow-lg border-2 border-indigo-500 overflow-hidden shrink-0">
                <img src={sticker.photo_url} alt="Sticker" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="absolute top-full left-1/2 -ml-1 w-2 h-2 bg-indigo-500 transform rotate-45 -mt-2"></div>
            </div>
          </Marker>
        ))}
        
        <NavigationControl position="top-right" />
      </Map>
      
      {/* Overlay gradient for aesthetics */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] z-0 rounded-lg"></div>
    </div>
  );
});

export default GlobeMap;
