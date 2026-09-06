// Image URL Helper
const API_BASE = process.env.REACT_APP_API_BASE || "http://kunzomat.de/dust1947/backend/army_api.php";
const IMAGE_BASE = API_BASE.replace('/army_api.php', '/image.php');

/**
 * Get the full URL for an image
 * @param {string} imageName - Image filename (e.g., "spacemarine.png")
 * @returns {string} Full image URL
 */
export function getImageUrl(imageName) {
  if (!imageName) return null;

  // If already a full URL, return as-is
  if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
    return imageName;
  }

  // Build URL with our image endpoint
  return `${IMAGE_BASE}?name=${encodeURIComponent(imageName)}`;
}

/**
 * Get a placeholder image for a specific type
 * @param {string} type - Type of placeholder (faction, unit, weapon)
 * @returns {string} Data URL for placeholder
 */
export function getPlaceholderImage(type = 'unit') {
  const placeholders = {
    faction: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="14"%3EFaction%3C/text%3E%3C/svg%3E',
    unit: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e0e0e0" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="14"%3EUnit%3C/text%3E%3C/svg%3E',
    weapon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="12"%3EWeapon%3C/text%3E%3C/svg%3E',
  };

  return placeholders[type] || placeholders.unit;
}

/**
 * Preload an image to check if it exists
 * @param {string} url - Image URL to check
 * @returns {Promise<boolean>} True if image loads successfully
 */
export function checkImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export default {
  getImageUrl,
  getPlaceholderImage,
  checkImageExists,
};

