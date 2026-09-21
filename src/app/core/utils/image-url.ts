import { environment } from '../../../environments/environment';

// image-format.util.js's formatImage() stores `img` (and its thumb/medium/original
// variants) as a path RELATIVE to the backend's own origin (e.g.
// "/images/services/xyz-medium.webp" - see static.config.js), never a full URL.
// That's fine when the frontend and API share an origin, but this Angular app runs
// on its own dev-server origin (localhost:4200, or later its own domain) while the
// API is fixed at beautymedica.rs (see environment.ts) - so every relative image
// path has to be resolved against the API's origin explicitly, or the browser
// resolves it against the CURRENT page's origin instead and 404s.
const API_ORIGIN = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
}
