const axios = require('axios');

async function testYouTubeAPI() {
  try {
    console.log('🔍 Probando YouTube API directamente...');

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        key: 'AIzaSyCESA7Zps_4Ks0LiqlYMh8nvSm2sbqyfAQ',
        q: 'Bad Bunny',
        part: 'snippet',
        type: 'video',
        maxResults: 2,
        videoCategoryId: '10',
        order: 'relevance'
      }
    });

    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data type:', typeof response.data);
    console.log('Items found:', response.data.items?.length || 0);

    if (response.data.items && response.data.items.length > 0) {
      const firstItem = response.data.items[0];
      console.log('Primer resultado:', {
        id: firstItem.id,
        title: firstItem.snippet?.title,
        channelTitle: firstItem.snippet?.channelTitle
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testYouTubeAPI();