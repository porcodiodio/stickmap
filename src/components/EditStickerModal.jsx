import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, X, Upload } from 'lucide-react';

export default function EditStickerModal({ sticker, onClose, onUpdated }) {
  const [caption, setCaption] = useState(sticker.caption || '');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(sticker.photo_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let photoUrl = sticker.photo_url;

      if (photo) {
        const fileName = `${Date.now()}-edited-sticker.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('stickers-photos')
          .upload(fileName, photo, { contentType: 'image/jpeg', upsert: false });
        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from('stickers-photos')
          .getPublicUrl(fileName);
        photoUrl = publicURLData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('stickers')
        .update({ caption, photo_url: photoUrl })
        .eq('id', sticker.id);

      if (updateError) throw updateError;
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">Modifier le sticker</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-full">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Photo */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border-2 border-dashed border-gray-700 cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="text-white" size={32} />
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-1">Description</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Décrivez votre souvenir..."
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600 text-sm"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            {loading ? 'Enregistrement...' : 'Sauvegarder les modifications'}
          </button>
        </form>
      </div>
    </div>
  );
}
