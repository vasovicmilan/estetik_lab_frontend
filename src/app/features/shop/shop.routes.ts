import { Routes } from '@angular/router';
import { productDetailResolver } from './resolvers/product-detail-resolver';

/** Public catalog routes - mounted at /prodavnica (see app.routes.ts). SSR-critical:
 * the :slug route resolves and sets SEO tags server-side before render, same as
 * services-catalog/packages-catalog. */
export const SHOP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/product-list/product-list').then((m) => m.ProductList),
  },
  {
    path: ':slug',
    loadComponent: () => import('./components/product-detail/product-detail').then((m) => m.ProductDetail),
    resolve: { product: productDetailResolver },
  },
];

/** Cart + checkout - mounted separately at /korpa (not nested under /prodavnica),
 * since a cart isn't a catalog entity. Both routes are auth-gated INSIDE the
 * components themselves (see cart.ts/checkout.ts) rather than with a canActivate
 * guard, so a logged-out visitor still gets a page (with a login prompt) instead of
 * being redirected away - the same choice booking makes for guests. */
export const CART_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/cart/cart').then((m) => m.Cart),
  },
  {
    path: 'placanje',
    loadComponent: () => import('./components/checkout/checkout').then((m) => m.Checkout),
  },
];

/** Admin routes - mounted at /admin/prodavnica. The outer authGuard/permissionGuard
 * are already applied where this is mounted (see app.routes.ts's 'admin/prodavnica'
 * entry, matching how admin-catalog.routes.js gates /api/v1/admin/products/* with
 * requirePermission('manage_products')), so these child routes are left unguarded
 * here to avoid checking the same permission twice. */
export const SHOP_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-product-list/admin-product-list').then((m) => m.AdminProductList),
  },
  {
    path: 'novi',
    loadComponent: () => import('./components/admin-product-form/admin-product-form').then((m) => m.AdminProductForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/admin-product-form/admin-product-form').then((m) => m.AdminProductForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-product-detail/admin-product-detail').then((m) => m.AdminProductDetail),
  },
];
