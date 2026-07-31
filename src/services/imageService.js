// High-resolution, permanent Unsplash CDN URLs.
// Meta Graph API requires a static URL so that the image displayed in the app
// preview matches the EXACT image fetched by Meta servers during posting.

const UNSPLASH_COLLECTION = {
  car: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1024&q=80',
  auto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1024&q=80',
  vehicle: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1024&q=80',
  robot: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1024&q=80',
  tech: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1024&q=80',
  nature: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1024&q=80',
  forest: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1024&q=80',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1024&q=80',
  city: 'https://images.unsplash.com/photo-1477959858617-67f30ac72604?auto=format&fit=crop&w=1024&q=80',
  dog: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1024&q=80',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1024&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1024&q=80',
  coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1024&q=80',
  space: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1024&q=80',
};

const DEFAULT_PHOTOS = Object.values(UNSPLASH_COLLECTION);

function getStableHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function generateImage(prompt) {
  const query = (prompt || '').trim().toLowerCase();

  // Find keyword match in prompt
  let matchedUrl = null;
  for (const [key, url] of Object.entries(UNSPLASH_COLLECTION)) {
    if (query.includes(key)) {
      matchedUrl = url;
      break;
    }
  }

  // Fallback to deterministic selection from curated collection
  if (!matchedUrl) {
    const index = getStableHash(query || 'default') % DEFAULT_PHOTOS.length;
    matchedUrl = DEFAULT_PHOTOS[index];
  }

  return {
    uri: matchedUrl,
    source: 'Unsplash (High-resolution static photo URL)',
  };
}
