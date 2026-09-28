import { ImageDisplay, ImageReference } from '../../../core/models/upload';
// ContentBlock now lives in core/models (shared with shop's ProductPublicDetail.dugiOpis -
// see core/models/content-block.ts's header comment for why it moved out of here).
import { ApiContentBlock, ContentBlock } from '../../../core/models/content-block';

export type { ContentBlock } from '../../../core/models/content-block';

// Mirrors post.mapper.js's two public shapes exactly.

export interface PostCard {
  id: string;
  naslov: string;
  slug: string;
  kratakOpis: string;
  slika: ImageDisplay | null;
  kategorije: string[];
  kategorijeRefs?: { naziv: string; slug: string | null }[];
  autor: string;
  datumObjave: string;
  vremeCitanja: string;
  istaknut: boolean;
}

// ---- Blog "chrome" - GET /blog/filters (see catalog.controller.js's
// getBlogFilters). Category post counts mirror the old EJS presenter's
// buildCategoryTabs (presenters/blog/blog.presenter.js) - tags intentionally
// have no count, same as that presenter's buildTagChips. ----

export interface BlogCategory {
  id: string;
  naziv: string;
  slug: string;
  count: number;
}

export interface BlogTag {
  id: string;
  naziv: string;
  slug: string;
}

export interface BlogFilters {
  categories: BlogCategory[];
  tags: BlogTag[];
  totalCount: number;
}

export interface PostDetail {
  id: string;
  naslov: string;
  slug: string;
  kratakOpis: string;
  // Structured content blocks, NOT an HTML string - see ContentBlock above.
  // Rendered by <app-content-blocks [blocks]="p.sadrzaj" />.
  sadrzaj: ContentBlock[];
  slika: ImageDisplay | null;
  galerija: ImageDisplay[];
  autor: { ime: string; avatar: ImageDisplay | string | null };
  kategorije: string[];
  kategorijeRefs?: { naziv: string; slug: string | null }[];
  tagovi: string[];
  tagoviRefs?: { naziv: string; slug: string | null }[];
  datumObjave: string;
  poslednjeAzuriranje: string;
  vremeCitanja: string;
}

// ---- Admin list row (mapPostsForAdminList) ----

export interface PostAdminListItem {
  id: string;
  naslov: string;
  slika: ImageDisplay | null;
  slug: string;
  /** Already the localized display string ("Nacrt"|"Zakazano"|"Objavljeno"|"Arhivirano"). */
  status: string;
  statusRaw: 'draft' | 'scheduled' | 'published' | 'archived';
  autor: string;
  kategorije: string[];
  pregledi: number;
  datumObjave: string | null;
  zakazanoZa: string | null;
  istaknut: 'Da' | 'Ne';
  kreiran: string;
}

// ---- Admin detail (display only) - GET /admin/posts/:id (mapPostForAdminDetail).
// Same route as getForEdit() below (see that method's own comment: Post is the one
// entity whose GET /admin/posts/:id never got a separate raw /edit route) - but a
// differently-shaped, Serbian-keyed, pre-formatted DISPLAY response, safe to render
// read-only, not to feed back into the form. ----

export interface PostAdminDetail {
  id: string;
  naslov: string;
  slug: string;
  status: string;
  statusRaw: string;
  autor: { ime: string; avatar: ImageDisplay | string | null };
  kategorije: string[];
  tagovi: string[];
  kratakOpis: string;
  /** Structured content blocks, NOT an HTML string - render with <app-content-blocks>. */
  sadrzaj: ContentBlock[];
  slika: ImageDisplay | null;
  galerija: ImageDisplay[];
  seo: { naslov: string; opis: string; kljucneReci: string[] };
  indeksiranje: string;
  /** "Da" | "Ne" - see post.mapper.js's mapPostForAdminDetail. */
  istaknut: string;
  redosledIstaknutog: number;
  vremeCitanja: string;
  pregledi: number;
  datumObjave: string | null;
  zakazanoZa: string | null;
  vreme: { kreiran: string; azuriran: string };
}

// ---- Edit / write shape (mapPostForEdit) ----
//
// GET /api/v1/admin/posts/:id already returns this shape directly (postService's
// getPostForEdit) - the one exception across every other admin-edit feature in
// this app (Service/Package/Product/Expert all needed a separate .../:id/edit
// route added; Post never did). See services/post.ts's getForEdit() comment.

export interface PostSeo {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface PostEditPayload {
  id?: string;
  title: string;
  slug?: string;
  /** Backend caps this at 300 chars (validatePostCreate/Update) - keep the
   * form's maxLength in sync or the request 400s. */
  excerpt: string;
  /** Structured content blocks, NOT a plain string/HTML - see ContentBlock's
   * header comment. This is the WIRE shape (English field names, matching the
   * backend's ContentBlogSchema) - NOT ContentBlock (Serbian field names,
   * display/editor-only). admin-blog-form's block editor works with
   * ContentBlock internally and converts at the load/submit boundary via
   * mapApiBlockToContentBlock / mapContentBlockToApiBlock (see
   * core/models/content-block.ts), sending `order` set to each block's array
   * index. */
  content?: ApiContentBlock[];
  coverImage?: ImageReference | null;
  gallery?: ImageReference[];
  /** ObjectId strings - same simplification note as Expert.services: no
   * category/tag picker exists in this app yet, so this is a plain
   * comma-separated-IDs text field. */
  categories?: string[];
  tags?: string[];
  /** User-selectable in admin-blog-form (GET admin/users, needs manage_users -
   * falls back to a read-only label if the logged-in admin lacks that
   * permission). Left undefined, the backend defaults it to the logged-in
   * admin (see admin-content.controller.js's createPost/updatePost). */
  author?: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  /** "YYYY-MM-DDTHH:mm" local format, directly usable in a native
   * datetime-local input. Only required when status is "scheduled". */
  scheduledFor?: string;
  seo?: PostSeo;
  isIndexable?: boolean;
  isFeatured?: boolean;
  featuredOrder?: number | null;
}
