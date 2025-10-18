#!/bin/bash

echo "🧪 Testing Images API Endpoints"
echo "================================"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# 1. Obtener una canción para probar
echo -e "${BLUE}📀 Step 1: Get a test song${NC}"
echo "GET /music/songs?limit=1"
SONG_RESPONSE=$(curl -s "$BASE_URL/music/songs?limit=1")
SONG_ID=$(echo $SONG_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Song ID: $SONG_ID"
echo ""

# 2. Generar imagen
echo -e "${BLUE}🎨 Step 2: Generate image${NC}"
echo "POST /images/generate"
IMAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/images/generate" \
  -H "Content-Type: application/json" \
  -d "{\"songId\":\"$SONG_ID\"}")
echo $IMAGE_RESPONSE | jq '.'
IMAGE_ID=$(echo $IMAGE_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo ""
echo -e "${GREEN}✅ Image ID: $IMAGE_ID${NC}"
echo ""

# 3. Obtener imagen por ID
echo -e "${BLUE}🔍 Step 3: Get image by ID${NC}"
echo "GET /images/$IMAGE_ID"
curl -s "$BASE_URL/images/$IMAGE_ID" | jq '.'
echo ""

# 4. Obtener imágenes por canción
echo -e "${BLUE}📋 Step 4: Get images by song${NC}"
echo "GET /images/by-song/$SONG_ID"
curl -s "$BASE_URL/images/by-song/$SONG_ID" | jq '.'
echo ""

# 5. Obtener todas las imágenes
echo -e "${BLUE}📚 Step 5: Get all images${NC}"
echo "GET /images?limit=5"
curl -s "$BASE_URL/images?limit=5" | jq '.'
echo ""

# 6. Obtener estadísticas
echo -e "${BLUE}📊 Step 6: Get stats${NC}"
echo "GET /images/stats"
curl -s "$BASE_URL/images/stats" | jq '.'
echo ""

echo -e "${GREEN}🎉 All tests completed!${NC}"
