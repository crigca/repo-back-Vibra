-- Ver cuántos hay
SELECT COUNT(*) as "Total con name NULL" FROM playlists WHERE name IS NULL;

-- Eliminar públicas con name NULL (probablemente basura)
DELETE FROM playlists WHERE name IS NULL AND "isPublic" = true;

-- Asignar nombre por defecto a privadas
UPDATE playlists
SET name = 'Mi Playlist ' || SUBSTRING(id::text, 1, 8)
WHERE name IS NULL AND "isPublic" = false;

-- Verificar resultado
SELECT COUNT(*) as "Después de limpieza" FROM playlists WHERE name IS NULL;
