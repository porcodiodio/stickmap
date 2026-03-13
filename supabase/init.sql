-- Script de création des tables pour StickMap (à lancer dans le SQL Editor de Supabase)

-- 1. Table Profils (Infos publiques des utilisateurs)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour les profils
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profils publics sont visibles par tous" 
ON public.profiles FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Fonction pour créer un profil automatiquement à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appeler la fonction à chaque insert dans auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Table Stickers
CREATE TABLE IF NOT EXISTS public.stickers (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    country_code VARCHAR(3), -- Code pays ISO 3166-1 alpha-3 (ex: 'FRA', 'USA')
    photo_url TEXT,
    caption TEXT,
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

-- Politique : Tout le monde peut ajouter un sticker (Simplification pour MVP sans Auth complet)
-- NOTE : Dans une version finale, on changerait TO public en TO authenticated
CREATE POLICY "Tout le monde peut ajouter des stickers" 
ON public.stickers FOR INSERT 
TO public 
WITH CHECK (true);

-- Politique : Les utilisateurs ne peuvent modifier/supprimer que LEURS propres stickers
CREATE POLICY "Utilisateurs peuvent modifier leurs propres stickers" 
ON public.stickers FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs propres stickers" 
ON public.stickers FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 5. Politiques pour le Storage (Bucket 'stickers-photos')
-- Note: Le bucket doit être créé manuellement en mode "Public" d'abord.
-- Ces politiques permettent l'upload et la lecture sans authentification pour le MVP.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('stickers-photos', 'stickers-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Lecture publique des photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'stickers-photos');

CREATE POLICY "Upload public des photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'stickers-photos');
