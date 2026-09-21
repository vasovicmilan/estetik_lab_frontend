// Mirrors GET /api/v1/partner/catalog on the backend - services/packages/products
// are exactly the PUBLIC list shapes those catalog features already type
// (serviceService.listServices()/packageService.listPackages()/
// productService.listPublicProducts() - see services-catalog/models/service.ts's
// ServicePublicCard, packages-catalog/models/package.ts's PackagePublicCard and
// shop/models/product.ts's ProductPublicCard), each item just additionally
// carrying a partner-specific referralLink.

import { ServicePublicCard } from '../../services-catalog/models/service';
import { PackagePublicCard } from '../../packages-catalog/models/package';
import { ProductPublicCard } from '../../shop/models/product';

export interface PartnerReferralItem {
  /** Full URL, e.g. "https://beautymedica.rs/usluge/<slug>?code=<code>", or null
   * when the partner has no coupon code yet. */
  referralLink: string | null;
}

export type PartnerServiceCatalogItem = ServicePublicCard & PartnerReferralItem;
export type PartnerPackageCatalogItem = PackagePublicCard & PartnerReferralItem;
export type PartnerProductCatalogItem = ProductPublicCard & PartnerReferralItem;

export interface PartnerCatalogPageMeta {
  page: number;
  totalPages: number;
}

export interface PartnerCatalog {
  hasCode: boolean;
  hasProductDiscount: boolean;
  services: PartnerServiceCatalogItem[];
  servicesMeta: PartnerCatalogPageMeta;
  packages: PartnerPackageCatalogItem[];
  packagesMeta: PartnerCatalogPageMeta;
  /** Only populated (non-empty) when hasProductDiscount is true; otherwise
   * always [] with productsMeta = { page: 1, totalPages: 1 }. */
  products: PartnerProductCatalogItem[];
  productsMeta: PartnerCatalogPageMeta;
}
