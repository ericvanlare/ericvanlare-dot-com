import { fetchCityPOIs, searchImages } from './wikipedia';

async function testWikipediaAPIs() {
  console.log('=== Testing Wikipedia POIs ===');
  const pois = await fetchCityPOIs('Chicago', 'Illinois');
  console.log('Chicago POIs:', pois);
  console.log('');

  console.log('=== Testing Wikimedia Commons Images ===');
  const images = await searchImages('Chicago skyline', 3);
  console.log('Chicago skyline images:');
  images.forEach((img, i) => {
    console.log(`${i + 1}. ${img.title}`);
    console.log(`   URL: ${img.url}`);
    console.log(`   Thumbnail: ${img.thumbnail}`);
  });
}

testWikipediaAPIs().catch(console.error);
