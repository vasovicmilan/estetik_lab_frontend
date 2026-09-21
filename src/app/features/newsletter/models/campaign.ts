import { ContentBlock } from '../../../core/models/content-block';

// Mirrors the backend's newsletter-campaign.mapper.js. A Campaign is an
// admin-authored email blast to newsletter subscribers - permission
// `manage_marketing`, NOT module-gated. Same three-shape split as
// Category/BusinessPartner/Coupon (see those models' header comments for the
// full rationale):
//
// 1. CampaignAdminListItem - GET /admin/newsletter-campaigns             (mapCampaignsForAdminList)
// 2. CampaignAdminDetail    - GET /admin/newsletter-campaigns/:id          (mapCampaignForAdminDetail)
// 3. CampaignEditPayload    - GET /admin/newsletter-campaigns/:id/edit, and the body of POST/PUT (mapCampaignForEdit)
//
// NOTE: GET /admin/newsletter-campaigns/:id used to be (incorrectly) wired to
// the raw edit shape - that's now fixed to return the display shape below, with
// a new GET /admin/newsletter-campaigns/:id/edit added for the raw shape
// (third occurrence of this same bug class, after BusinessPartner and Coupon -
// see those models' header comments). admin-campaign-form must use
// getForEdit(), never getById(), to populate itself.

export type CampaignStatus = 'draft' | 'scheduled' | 'sent';
export type CampaignInterest = 'general' | 'products' | 'partnership';

// ---- (1) Admin list row ----

export interface CampaignAdminListItem {
  id: string;
  naslov: string;
  predmet: string;
  status: string;
  statusRaw: CampaignStatus;
  /** e.g. "Svi pretplatnici" or "Opšte, Proizvodi". */
  segment: string;
  zakazanoZa: string | null;
  poslatoZa: string | null;
  poslato: number;
  neuspesno: number;
  kreirano: string;
}

// ---- (2) Admin detail (display only) - NOT the shape admin-campaign-form posts back ----

export interface CampaignAdminDetail {
  id: string;
  naslov: string;
  predmet: string;
  status: string;
  statusRaw: CampaignStatus;
  segmenti: string[];
  segmentiRaw: CampaignInterest[];
  segment: string;
  /** renderContentBlocks() Serbian-shape block array - rendered with the shared
   * <app-content-blocks> component (src/app/shared/ui/content-blocks/), same as
   * admin-business-partner-detail's `sadrzaj`. NOT the same shape as edit's raw
   * `content`. */
  sadrzaj: ContentBlock[];
  zakazanoZa: string | null;
  poslatoZa: string | null;
  poslato: number;
  neuspesno: number;
  vreme: { kreiran: string; azuriran: string };
}

// ---- (3) Edit / write shape (mapCampaignForEdit) ----

export interface CampaignEditPayload {
  id: string;
  title: string;
  subject: string;
  /** RAW content blocks (English-keyed, Mongoose-shaped) - same "round-trip
   * unchanged" pattern as admin-business-partner-form's `content`. Kept in a
   * private component field, never rendered, merged back unchanged on submit. */
  content: unknown[];
  targetInterests: CampaignInterest[];
  status: CampaignStatus;
  /** "" or a naive "YYYY-MM-DDTHH:mm" datetime-local string. */
  scheduledFor: string;
}

// ---- Create/update payload actually POSTed/PUT - same flat shape minus `id` ----

export type CampaignWritePayload = Omit<CampaignEditPayload, 'id'>;
