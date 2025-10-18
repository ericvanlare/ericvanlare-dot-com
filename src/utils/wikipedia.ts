interface WikipediaPageResponse {
  query?: {
    pages?: Record<string, {
      pageid: number;
      title: string;
      extract?: string;
      revisions?: Array<{
        slots: {
          main: {
            '*': string;
          };
        };
      }>;
    }>;
  };
}

interface WikimediaImageInfo {
  imageinfo?: Array<{
    url: string;
    thumburl?: string;
  }>;
}

interface WikimediaSearchResponse {
  query?: {
    pages?: Record<string, {
      title: string;
    } & WikimediaImageInfo>;
  };
}

export interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
}

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const WIKIMEDIA_COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

export async function fetchCityPOIs(city: string, state?: string): Promise<string[]> {
  const pageTitles = state ? [`${city}, ${state}`, city] : [city];
  
  for (const pageTitle of pageTitles) {
    try {
      console.log(`Fetching Wikipedia page for: ${pageTitle}`);
      
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        origin: '*',
        titles: pageTitle,
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        redirects: '1',
      });

      const response = await fetch(`${WIKIPEDIA_API}?${params}`);
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        continue;
      }

      const data: WikipediaPageResponse = await response.json();
      
      if (!data.query?.pages) {
        console.log(`No pages found for ${pageTitle}`);
        continue;
      }

      const pages = Object.values(data.query.pages);
      const page = pages[0];

      if (!page || page.pageid === undefined || page.pageid < 0) {
        console.log(`Page not found: ${pageTitle}`);
        continue;
      }

      const content = page.revisions?.[0]?.slots?.main?.['*'];
      if (!content) {
        console.log(`No content found for ${pageTitle}`);
        continue;
      }
      
      // Check if it's a redirect
      if (content.trim().startsWith('#REDIRECT')) {
        console.log(`Page is a redirect, should have been auto-followed`);
        continue;
      }

      const pois = parsePOIsFromWikitext(content);
      
      if (pois.length > 0) {
        console.log(`Found ${pois.length} POIs for ${pageTitle}: ${pois.slice(0, 5).join(', ')}...`);
        return pois;
      }
    } catch (error) {
      console.error(`Error fetching Wikipedia page for ${pageTitle}:`, error);
    }
  }

  console.log(`No POIs found for ${city}${state ? `, ${state}` : ''}`);
  return [];
}

function parsePOIsFromWikitext(wikitext: string): string[] {
  const pois: Set<string> = new Set();
  
  // Try specific tourism sections
  const tourismSections = /==\s*(See also|Culture|Tourism|Attractions|Landmarks|Points of interest|Sights and attractions)\s*==[\s\S]*?(?=\n==\s*[^=]|$)/gi;
  const sectionMatches = wikitext.match(tourismSections);
  
  if (sectionMatches) {
    sectionMatches.forEach(section => {
      // Extract wiki links [[Link]] or [[Link|Display]]
      const linkMatches = section.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g);
      for (const match of linkMatches) {
        const poiName = match[1].trim();
        if (isValidPOI(poiName)) {
          pois.add(poiName);
        }
      }
      
      // Extract bold list items
      const listItemMatches = section.matchAll(/^\*+\s*'''([^']+)'''/gm);
      for (const match of listItemMatches) {
        const poiName = match[1].trim();
        if (isValidPOI(poiName) && !pois.has(poiName)) {
          pois.add(poiName);
        }
      }
    });
  }
  
  // If we don't have enough POIs, extract from the entire first part of the article
  if (pois.size < 5) {
    const firstPart = wikitext.split('== History ==')[0] || wikitext.slice(0, 5000);
    const linkMatches = firstPart.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g);
    for (const match of linkMatches) {
      const poiName = match[1].trim();
      if (isValidPOI(poiName) && isLikelyLandmark(poiName)) {
        pois.add(poiName);
        if (pois.size >= 20) break;
      }
    }
  }

  return Array.from(pois).slice(0, 20);
}

function isValidPOI(name: string): boolean {
  if (!name || name.length < 3) return false;
  
  const invalidPrefixes = ['File:', 'Image:', 'Category:', 'Wikipedia:', 'Template:', 'Help:', 'WP:', 'Portal:'];
  if (invalidPrefixes.some(prefix => name.startsWith(prefix))) return false;
  
  const invalidTerms = ['citation needed', 'edit', 'list of', 'according to', 'main article', 'see also'];
  const lowerName = name.toLowerCase();
  if (invalidTerms.some(term => lowerName.includes(term))) return false;
  
  return true;
}

function isLikelyLandmark(name: string): boolean {
  const landmarkKeywords = [
    'center', 'centre', 'museum', 'park', 'tower', 'building', 'hall', 'stadium', 'arena',
    'theater', 'theatre', 'library', 'university', 'college', 'bridge', 'square', 'plaza',
    'cathedral', 'church', 'temple', 'airport', 'station', 'observatory', 'zoo', 'garden',
    'monument', 'memorial', 'fort', 'castle', 'palace', 'house', 'street', 'avenue', 'district'
  ];
  
  const lowerName = name.toLowerCase();
  return landmarkKeywords.some(keyword => lowerName.includes(keyword));
}

export async function searchImages(
  query: string,
  limit: number = 5
): Promise<ImageResult[]> {
  try {
    console.log(`Searching Wikimedia Commons for: ${query}`);
    
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: '6',
      gsrlimit: String(limit),
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '300',
    });

    const response = await fetch(`${WIKIMEDIA_COMMONS_API}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: WikimediaSearchResponse = await response.json();
    
    if (!data.query?.pages) {
      console.log(`No images found for: ${query}`);
      return [];
    }

    const images: ImageResult[] = Object.values(data.query.pages)
      .filter(page => page.imageinfo && page.imageinfo.length > 0)
      .map(page => ({
        title: page.title.replace('File:', ''),
        url: page.imageinfo![0].url,
        thumbnail: page.imageinfo![0].thumburl || page.imageinfo![0].url,
      }));

    console.log(`Found ${images.length} images for: ${query}`);
    return images;
  } catch (error) {
    console.error(`Error searching Wikimedia Commons for ${query}:`, error);
    return [];
  }
}
