export const environment = {
  production: false,
  // Pointed at the LIVE backend (beautymedica.rs) for now, per Milan's explicit
  // request, while there's no local backend running to develop against. Swap back
  // to 'http://localhost:3000/api/v1' once local backend dev is needed again -
  // CORS for that is already allowlisted server-side (src/config/cors.config.js).
  apiUrl: 'https://beautymedica.rs/api/v1',
};
