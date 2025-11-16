-- Agregar columna displayOrder a la tabla playlists
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0;

-- Crear índice para mejorar el rendimiento de ordenamiento
CREATE INDEX IF NOT EXISTS "IDX_playlist_display_order" ON playlists("displayOrder");

-- Actualizar playlists existentes con valores aleatorios
UPDATE playlists 
SET "displayOrder" = random_order.new_order 
FROM (
  SELECT 
    id, 
    ROW_NUMBER() OVER (ORDER BY RANDOM()) - 1 as new_order 
  FROM playlists 
  WHERE "userId" IS NULL AND "isPublic" = true
) AS random_order 
WHERE playlists.id = random_order.id;
