const https = require('https');

function latLngToTile(lat, lng, zoom) {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y, z: zoom };
}

const tile = latLngToTile(24.7136, 46.6753, 10);
console.log('Riyadh tile:', tile);

const esriUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${tile.z}/${tile.y}/${tile.x}`;
https.get(esriUrl, (res) => {
  console.log('Esri status:', res.statusCode, 'content-type:', res.headers['content-type']);
});

