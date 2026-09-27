import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

export type CardVariant = 'content' | 'stat';
export type CardActionsAlign = 'start' | 'end';

/**
 * Generic `mat-card` wrapper for BOTH public catalog grid items (product,
 * service, package, team, blog, business-partner...) and admin dashboard stat
 * tiles. Content is composed via `ng-content` slots rather than fixed fields,
 * so any consumer can bind whatever markup it needs into each slot.
 *
 * Usage - public catalog card (`variant="content"`, the default):
 * ```html
 * <app-card>
 *   <img cardMedia [src]="product.slika?.url | imageUrl" [alt]="product.naziv" />
 *   <span cardTitle>{{ product.naziv }}</span>
 *   <span cardSubtitle>{{ product.kategorija }}</span>
 *   <p>{{ product.kratakOpis }}</p>
 *   <div cardActions>
 *     <a mat-button [routerLink]="['/prodavnica', product.slug]">Detaljnije</a>
 *   </div>
 * </app-card>
 * ```
 *
 * Usage - admin dashboard stat tile (`variant="stat"`):
 * ```html
 * <app-card variant="stat" [routerLink]="tile.link">
 *   <span cardTitle>{{ tile.value }}</span>
 *   <span cardSubtitle>{{ tile.label }}</span>
 *   <span cardTrend>+12%</span>
 * </app-card>
 * ```
 *
 * All slots except `cardTitle` are optional and collapse away (via `:empty`)
 * when nothing is projected into them. Place cards inside a CSS grid (see
 * `FormLayout`'s `auto-fit`/`minmax` pattern, or the existing
 * `product-list__grid`-style grids) - the host stretches to `height: 100%` and
 * lays out as a flex column internally so `cardActions` always pins to the
 * bottom, keeping every card in a row the same height.
 */
@Component({
  selector: 'app-card',
  imports: [MatCardModule],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  variant = input<CardVariant>('content');
  actionsAlign = input<CardActionsAlign>('start');
}
