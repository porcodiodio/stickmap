-- Script de création des tables pour StickMap (à lancer dans le SQL Editor de Supabase)

-- 1. Table Utilisateurs (Extension de auth.users si besoin, mais on peut rester simple pour le moment)
-- On utilise directement auth.users pour l'authentification (Google/Apple) gérée par Supabase.

-- 2. Table Stickers
CREATE TABLE IF NOT EXISTS public.stickers (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    country_code VARCHAR(2), -- Code pays ISO 3166-1 alpha-2 (ex: 'FR', 'US')
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la recherche géographique (R-Tree recommandé si plus complexe, mais B-Tree suffit pour la base)
CREATE INDEX IF NOT EXISTS idx_stickers_location ON public.stickers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_stickers_country ON public.stickers(country_code);

-- 3. Configuration Storage (Bucket 'stickers-photos')
-- À faire depuis l'interface Supabase :
-- Créer un bucket 'stickers-photos' en "Public".

-- 4. RLS (Row Level Security) - Sécurité
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les stickers
CREATE POLICY "Stickers sont visibles publiquement" 
ON public.stickers FOR SELECT 
TO public 
USING (true);

-- Politique : Uniquement les utilisateurs authentifiés peuvent ajouter un sticker
CREATE POLICY "Utilisateurs authentifiés peuvent ajouter des stickers" 
ON public.stickers FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent modifier/supprimer que LEURS propres stickers
CREATE POLICY "Utilisateurs peuvent modifier leurs propres stickers" 
ON public.stickers FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs propres stickers" 
ON public.stickers FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
