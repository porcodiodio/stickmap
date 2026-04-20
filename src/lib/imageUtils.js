/**
 * Génère une URL optimisée via la transformation d'image Supabase Storage.
 * Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
 *
 * @param {string} url         - URL originale Supabase Storage
 * @param {object} options     - Options de transformation
 * @param {number} options.width   - Largeur en px
 * @param {number} options.height  - Hauteur en px
 * @param {number} options.quality - Qualité 1-100
 * @param {'cover'|'contain'|'fill'} options.resize - Mode de redimensionnement
 */
export function getOptimizedUrl(url, { width, height, quality = 80, resize = 'cover' } = {}) {
  if (!url) return url;

  try {
    const urlObj = new URL(url);

    // La transformation Supabase ne fonctionne que pour les images hébergées
    // sur Supabase Storage. Si l'URL vient d'un autre hébergeur (goopics, etc.),
    // on retourne l'URL originale sans modification.
    const isSupabaseStorage =
      urlObj.hostname.endsWith('.supabase.co') &&
      urlObj.pathname.includes('/storage/v1/object/public/');

    if (!isSupabaseStorage) return url;

    // Remplace /object/public/ par /render/image/public/
    urlObj.pathname = urlObj.pathname.replace('/object/public/', '/render/image/public/');

    const params = new URLSearchParams();
    if (width)   params.set('width', width);
    if (height)  params.set('height', height);
    if (quality) params.set('quality', quality);
    params.set('resize', resize);
    params.set('format', 'webp'); // WebP = meilleure compression

    urlObj.search = params.toString();
    return urlObj.toString();
  } catch {
    // Si l'URL n'est pas parseable (ex: blob: pendant preview), retourner l'original
    return url;
  }
}

/**
 * URL optimisée pour les markers sur la map (miniature 96×96px, qualité basse)
 */
export function getThumbnailUrl(url) {
  return getOptimizedUrl(url, { width: 96, height: 96, quality: 40, resize: 'cover' });
}

/**
 * URL optimisée pour la vue détail (largeur 800px, bonne qualité)
 */
export function getDetailUrl(url) {
  return getOptimizedUrl(url, { width: 800, quality: 75, resize: 'contain' });
}
