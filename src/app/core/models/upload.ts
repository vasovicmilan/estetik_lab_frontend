// Matches formatImage()'s output (src/utils/image-format.util.js) - what every
// public/admin-display mapper (service, package, expert...) puts on a `slika`/
// `galerija` field. Distinct from ImageReference below: this is the READ/display
// shape (a resolved url + srcset-style variants), ImageReference is the WRITE shape
// a create/update payload's image/gallery field expects.
export interface ImageDisplay {
  url: string | null;
  alt: string | null;
  variants: { thumb: string | null; medium: string | null; original: string | null };
}

// Matches the reference objects POST /api/v1/admin/uploads/:type(/gallery|/video)
// returns - same shape handleImageUpload()/processVideo() in the backend's
// multer.config.js already produce for the web admin panel. A create/update call
// for any entity includes this object as-is on its image/gallery/video field.

export interface ImageReference {
  img: string;
  imgThumb: string | null;
  imgMedium: string | null;
  imgOriginal: string | null;
  imgDesc: string;
}

export interface VideoReference {
  url: string;
  thumbnail: string;
  title: string;
}

/** The :type path segment admin-uploads.controller.js's TYPE_PERMISSIONS recognizes. */
export type UploadEntityType =
  | 'services'
  | 'packages'
  | 'products'
  | 'categories'
  | 'posts'
  | 'testimonials'
  | 'experts'
  | 'partners'
  | 'site';
