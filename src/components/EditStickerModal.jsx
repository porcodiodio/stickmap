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

  const handleDelete = async () => {
    if (!window.confirm("Es-tu sûr de vouloir supprimer ce stickos ? Cette action est irréversible.")) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('stickers')
        .delete()
        .eq('id', sticker.id);

      if (deleteError) throw deleteError;
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl mesh-gradient">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-white font-light text-xl tracking-tight">Modifier le <span className="font-bold">Stickos</span></h2>
          <button onClick={onClose} className="text-white/40 hover:text-white p-2 bg-white/5 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border border-white/10 cursor-pointer group shadow-xl">
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
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Description</label>
            <div className="glass-panel rounded-2xl p-1 border-white/5 focus-within:border-white/20 transition-all">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Dis nous en plus..."
                className="w-full bg-transparent border-none px-4 py-3 text-white resize-none h-24 focus:outline-none placeholder-white/10 text-sm font-light"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs font-medium bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-white/90 disabled:opacity-20 text-black font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload size={18} strokeWidth={3} />
              {loading ? 'Enregistrement...' : 'Sauvegarder les modifications'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 border border-red-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Supprimer mon stickos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
