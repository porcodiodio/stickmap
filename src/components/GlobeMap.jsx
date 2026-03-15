import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import countriesData from '../data/countries.geojson?url';
import { supabase } from '../lib/supabase';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const GlobeMap = forwardRef(({ refreshTrigger, onSelectSticker }, ref) => {
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

  // Mapping des codes ISO vers les noms exacts dans countries.geojson pour les pays ayant "-99"
  const ISO_TO_NAME_MAP = {
    'FRA': 'France',
    'NOR': 'Norway',
    'SYR': 'Syria',
    'PRY': 'Paraguay',
    'BHR': 'Bahrain',
    'LVA': 'Latvia',
    'UGA': 'Uganda',
    'AZE': 'Azerbaijan'
  };

  // Extract unique countries
  const countriesWithStickers = useMemo(() => {
    const uniqueCodes = new Set(stickers.map(s => s.country_code).filter(Boolean));
    const codesArray = Array.from(uniqueCodes);
    console.log("Stickers country codes (ISO A3):", codesArray);
    return codesArray;
  }, [stickers]);

  // Noms correspondants pour le fallback
  const namesWithStickers = useMemo(() => {
    return countriesWithStickers.map(code => ISO_TO_NAME_MAP[code]).filter(Boolean);
  }, [countriesWithStickers]);

  // Style de la couche GeoJSON - Updated for Premium Rainbow/Mesh aesthetic
  const countryLayerStyle = {
    id: 'countries',
    type: 'fill',
    paint: {
      'fill-color': [
        'case',
        ['any', 
          ['in', ['get', 'ISO3166-1-Alpha-3'], ['literal', countriesWithStickers]],
          ['in', ['get', 'name'], ['literal', namesWithStickers]]
        ],
        'rgba(255, 255, 255, 0.05)', // Subtle glass fill for active countries
        'rgba(0,0,0,0)'
      ],
      'fill-outline-color': [
        'case',
        ['any', 
          ['in', ['get', 'ISO3166-1-Alpha-3'], ['literal', countriesWithStickers]],
          ['in', ['get', 'name'], ['literal', namesWithStickers]]
        ],
        'rgba(255, 255, 255, 0.4)', // Sharp thin white border
        'rgba(0,0,0,0)'
      ]
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        projection="globe"
        fog={{
          'range': [0.5, 10],
          'color': '#000000',
          'horizon-blend': 0.1,
          'high-color': '#111111',
          'space-color': '#000000',
          'star-intensity': 0.2
        }}
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
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelectSticker(sticker);
            }}
          >
            <div className="group cursor-pointer transform transition-all hover:scale-110 relative z-10">
              <div className="w-12 h-12 glass-panel rounded-full p-1 shadow-2xl overflow-hidden shrink-0 border-white/30">
                <img src={sticker.photo_url} alt="Sticker" className="w-full h-full object-cover rounded-full" />
              </div>
              {/* Subtle indicator glow */}
              <div className="absolute -inset-1 rounded-full bg-white/20 blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </Marker>
        ))}
        
      </Map>
      
      {/* Overlay gradient for aesthetics */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] z-0 rounded-lg"></div>
    </div>
  );
});

export default GlobeMap;
