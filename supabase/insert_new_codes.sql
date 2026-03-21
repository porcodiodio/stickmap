-- This script sets up the physical QR codes system and inserts the 66 unique +20 points codes

-- 1. Create the physical_qrcodes table (if it doesn't already exist)
CREATE TABLE IF NOT EXISTS public.physical_qrcodes (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the physical_qr_claims table (if it doesn't already exist)
CREATE TABLE IF NOT EXISTS public.physical_qr_claims (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    qrcode_id UUID REFERENCES public.physical_qrcodes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, qrcode_id) -- Prevent same user from claiming the same code multiple times
);

-- RLS for physical tables (if not already set)
ALTER TABLE public.physical_qrcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_qr_claims ENABLE ROW LEVEL SECURITY;

-- Policies for physical_qrcodes (Read-only for all)
CREATE POLICY "Physical codes are publicly readable" 
ON public.physical_qrcodes FOR SELECT 
TO public 
USING (true);

-- Policies for physical_qr_claims (Read for all, Insert only for authenticated users)
CREATE POLICY "Physical claims visible by all" 
ON public.physical_qr_claims FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Users can claim physical codes" 
ON public.physical_qr_claims FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Insert the 66 specific codes with 20 points
INSERT INTO public.physical_qrcodes (code, points) VALUES
('OFIUUZ72', 20),
('1S5ZYD25', 20),
('3RZAAL4J', 20),
('7R3EJ3JB', 20),
('IYI9P9A8', 20),
('3PRMTCLG', 20),
('LNVY9H4G', 20),
('VS0UGK4I', 20),
('JFZ3TEHZ', 20),
('PMUH292Q', 20),
('TI9PQ07M', 20),
('1Z2N5PE4', 20),
('072CEHJP', 20),
('A3SX6GQ2', 20),
('R03NZUJZ', 20),
('BT7D1UGV', 20),
('1H1IA4VL', 20),
('1RVXTPH8', 20),
('3OBINH5C', 20),
('49VNIN8P', 20),
('5C511ZOR', 20),
('5V94TXTH', 20),
('64BY49D2', 20),
('65W45MP4', 20),
('7OYG2PNF', 20),
('8GT5D71T', 20),
('9KGKLHFO', 20),
('9SEX64ZG', 20),
('BFBWEWC5', 20),
('D690OIN7', 20),
('F1PTIX4N', 20),
('GSZILHIN', 20),
('GZPD4FSX', 20),
('H7XKMC23', 20),
('HB3J36H9', 20),
('HCDJTV8G', 20),
('HD6233DY', 20),
('HDP521Q6', 20),
('IJGA267P', 20),
('IR0ICVOK', 20),
('IXRDW1RO', 20),
('J540KQ90', 20),
('JKGMT624', 20),
('JTUJ9G7Y', 20),
('KCGQKSTX', 20),
('KW0XUPJV', 20),
('L2TG6BSS', 20),
('M99EGBFK', 20),
('MAEVPBN2', 20),
('P4DB92LD', 20),
('PCOBN5KV', 20),
('Q6OW1HGF', 20),
('QT7SZ90E', 20),
('R1A92PXR', 20),
('RD8NB6MM', 20),
('REFBO44W', 20),
('S7NVHP7W', 20),
('SA2R7U7P', 20),
('TSN79765', 20),
('UHAD34SL', 20),
('UTH3VZRQ', 20),
('WGY3MRVM', 20),
('WNACFEOB', 20),
('XRK90ZHJ', 20),
('YQDUQ0JM', 20),
('YQNV6JOW', 20)
ON CONFLICT (code) DO UPDATE SET points = 20;
