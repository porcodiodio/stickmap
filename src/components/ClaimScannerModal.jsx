import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '../lib/supabase';
import { X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ClaimScannerModal({ isOpen, onClose, onClaimSuccess }) {
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleScan = async (result) => {
    if (!result || !scanning) return;
    
    // The library might return an array of results
    const code = Array.isArray(result) ? result[0]?.rawValue : result.rawValue;
    if (!code) return;

    setScanning(false);
    setStatus('processing');
    
    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setStatus('error');
        setMessage('Vous devez être connecté pour collecter des puntos.');
        return;
      }

      // 2. Check in physical_qrcodes first (Unique one-time use)
      const { data: physicalCode, error: physicalError } = await supabase
        .from('physical_qrcodes')
        .select('*')
        .eq('code', code)
        .single();

      if (physicalCode) {
        // Try to insert a claim
        const { error: claimError } = await supabase
          .from('physical_qr_claims')
          .insert({ 
            user_id: user.id,
            qrcode_id: physicalCode.id
          });

        if (claimError) {
          if (claimError.code === '23505') {
            setStatus('error');
            setMessage('Tu as déjà scanné ce code physique !');
          } else {
            throw claimError;
          }
          return;
        }

        setStatus('success');
        setMessage(`Bravo ! Tu as trouvé un code physique. +${physicalCode.points || 10} puntos !`);
        onClaimSuccess?.();
        setTimeout(() => onClose(), 3000);
        return;
      }

      // 3. Fallback: Find sticker by claim_code (Legacy stickers)
      const { data: sticker, error: stickerError } = await supabase
        .from('stickers')
        .select('id, points, user_id')
        .eq('claim_code', code)
        .single();

      if (stickerError || !sticker) {
        setStatus('error');
        setMessage('Code invalide ou sticker introuvable.');
        return;
      }

      // Check if user is the owner
      if (sticker.user_id === user.id) {
        setStatus('error');
        setMessage('C\'est ton propre sticker, tu ne peux pas collecter tes propres puntos !');
        return;
      }

      // 4. Insert sticker claim
      const { error: sClaimError } = await supabase
        .from('sticker_claims')
        .insert({
          user_id: user.id,
          sticker_id: sticker.id
        });

      if (sClaimError) {
        if (sClaimError.code === '23505') {
          setStatus('error');
          setMessage('Tu as déjà scanné ce Milano Stickerini !');
        } else {
          throw sClaimError;
        }
        return;
      }

      // Success!
      setStatus('success');
      setMessage(`Félicitations ! +${sticker.points || 10} puntos collectés.`);
      onClaimSuccess?.();
      setTimeout(() => onClose(), 3000);

    } catch (err) {
      console.error('Claim error:', err);
      setStatus('error');
      setMessage('Une erreur est survenue lors de la collecte.');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] w-full max-w-sm rounded-[32px] border border-white/10 overflow-hidden relative mesh-gradient p-8 flex flex-col items-center text-center">
        
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/40 z-20"
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Scanner un Code</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Collectez des points Stickerini</p>
        </div>

        {/* Scanner / Status Area */}
        <div className="w-full aspect-square bg-black/40 rounded-[24px] border border-white/5 overflow-hidden relative mb-8 flex items-center justify-center">
          {status === 'idle' || status === 'processing' ? (
            <>
              {scanning && (
                <div className="w-full h-full">
                  <Scanner
                    onScan={handleScan}
                    allowMultiple={false}
                    audio={false}
                    styles={{ container: { width: '100%', height: '100%' } }}
                    components={{
                        audio: false,
                        torch: false,
                    }}
                  />
                  {/* Scanning HUD */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-[#ccff00]/50 rounded-[20px] shadow-[0_0_50px_rgba(204,255,0,0.1)] relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#ccff00] rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#ccff00] rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#ccff00] rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#ccff00] rounded-br-xl"></div>
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#ccff00]/40 animate-scan"></div>
                    </div>
                  </div>
                </div>
              )}
              {status === 'processing' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin"></div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Vérification...</p>
                </div>
              )}
            </>
          ) : status === 'success' ? (
            <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-[#ccff00]/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={40} className="text-[#ccff00]" />
              </div>
              <p className="text-[#ccff00] font-bold uppercase tracking-widest text-sm">Gagné !</p>
              <div className="flex items-center gap-1 text-white/80 py-2 px-4 bg-white/5 rounded-full border border-white/10">
                <Sparkles size={14} className="text-[#ccff00]" />
                <span className="text-xs font-bold tracking-tight">{message}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 px-6 animate-in shake-in duration-300">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="text-red-400 text-xs font-medium leading-relaxed">{message}</p>
              <button 
                onClick={() => { setScanning(true); setStatus('idle'); }}
                className="mt-2 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-all"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        <p className="text-white/20 text-[10px] font-medium leading-relaxed max-w-[200px]">
          Placez le QR code au centre du cadre pour collecter vos points.
        </p>
      </div>
    </div>
  );
}
