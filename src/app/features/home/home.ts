import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUrlPipe } from '../../core/pipes/image-url-pipe';
import { Service } from '../services-catalog/services/service';
import { ServicePublicCard } from '../services-catalog/models/service';
import { Package } from '../packages-catalog/services/package';
import { PackagePublicCard } from '../packages-catalog/models/package';
import { Team } from '../team/services/team';
import { TeamMemberCard } from '../team/models/expert';
import { Product } from '../shop/services/product';
import { ProductPublicCard } from '../shop/models/product';
import { Post } from '../blog/services/post';
import { PostCard } from '../blog/models/post';
import { SiteContent } from '../../core/services/site-content';
import { SiteInfo } from '../../core/services/site-info';
import { HomeIntroContent, HomePageContent } from '../../core/models/site-content';
import { LocationInfo } from '../../shared/ui/location-info/location-info';
import { resolveImageUrl } from '../../core/utils/image-url';
import { biIconToMaterial } from '../../core/utils/bi-icon-map';

/**
 * Landing page - loosely mirrors beautymedica.rs's home page structure (hero,
 * services overview, packages/offers, shop/product preview, team preview, blog
 * preview, booking CTA). No public testimonials endpoint exists on the API yet
 * (only GET /admin/testimonials, gated behind manage_marketing - see
 * admin-marketing.routes.js), so a testimonials section is deliberately left
 * out here rather than faked with static placeholder content.
 */
@Component({
  selector: 'app-home',
  imports: [LocationInfo, CommonModule, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private serviceApi = inject(Service);
  private packageApi = inject(Package);
  private teamApi = inject(Team);
  private productApi = inject(Product);
  private postApi = inject(Post);
  private siteContent = inject(SiteContent);
  protected readonly site = inject(SiteInfo);

  featuredServices = signal<ServicePublicCard[]>([]);
  featuredPackages = signal<PackagePublicCard[]>([]);
  teamPreview = signal<TeamMemberCard[]>([]);
  featuredProducts = signal<ProductPublicCard[]>([]);
  recentPosts = signal<PostCard[]>([]);
  intro = signal<HomeIntroContent | null>(null);
  /** Hero texts + image, testimonials and location - all from GET /home (backend/DB is the source of truth). */
  page = signal<HomePageContent | null>(null);

  // Six independent fetches - true only until every one of them has settled
  // (success or error), so the loading state clears even if one endpoint fails.
  loadingServices = signal(true);
  loadingPackages = signal(true);
  loadingTeam = signal(true);
  loadingProducts = signal(true);
  loadingPosts = signal(true);
  loadingIntro = signal(true);

  /** srcset from the backend's responsive variants (thumb 300w / medium 800w / original 1600w), like the EJS <img>. */
  heroSrcset(): string | null {
    const variants = this.page()?.hero.imageVariants;
    if (!variants) return null;
    const parts: string[] = [];
    if (variants.thumb) parts.push(`${resolveImageUrl(variants.thumb)} 300w`);
    if (variants.medium) parts.push(`${resolveImageUrl(variants.medium)} 800w`);
    if (variants.original) parts.push(`${resolveImageUrl(variants.original)} 1600w`);
    return parts.length > 1 ? parts.join(', ') : null;
  }

  ngOnInit(): void {
    this.siteContent.getHomePage().subscribe({ next: (page) => this.page.set(page), error: () => this.page.set(null) });
    if (this.site.modules().booking) {
      this.serviceApi.listPublic({ page: 1 }).subscribe({
        next: ({ data }) => {
          this.featuredServices.set(data.slice(0, 4));
          this.loadingServices.set(false);
        },
        error: () => {
          this.featuredServices.set([]);
          this.loadingServices.set(false);
        },
      });
    } else {
      this.loadingServices.set(false);
    }

    if (this.site.modules().booking) {
      this.packageApi.listPublic({ page: 1 }).subscribe({
        next: ({ data }) => {
          this.featuredPackages.set(data.slice(0, 3));
          this.loadingPackages.set(false);
        },
        error: () => {
          this.featuredPackages.set([]);
          this.loadingPackages.set(false);
        },
      });
    } else {
      this.loadingPackages.set(false);
    }

    this.teamApi.list().subscribe({
      next: (members) => {
        this.teamPreview.set(members.slice(0, 4));
        this.loadingTeam.set(false);
      },
      error: () => {
        this.teamPreview.set([]);
        this.loadingTeam.set(false);
      },
    });

    if (this.site.modules().shop) {
      this.productApi.listPublic({ page: 1 }).subscribe({
        next: ({ data }) => {
          this.featuredProducts.set(data.slice(0, 4));
          this.loadingProducts.set(false);
        },
        error: () => {
          this.featuredProducts.set([]);
          this.loadingProducts.set(false);
        },
      });
    } else {
      this.loadingProducts.set(false);
    }

    if (this.site.modules().blog) {
      this.postApi.list({ page: 1 }).subscribe({
        next: ({ data }) => {
          this.recentPosts.set(data.slice(0, 3));
          this.loadingPosts.set(false);
        },
        error: () => {
          this.recentPosts.set([]);
          this.loadingPosts.set(false);
        },
      });
    } else {
      this.loadingPosts.set(false);
    }

    // DB-backed "Šta je Estetik Lab" intro + "Zašto mi" section (see
    // core/services/site-content.ts) - used to be a hardcoded constant here,
    // now admin-editable content fetched once on load.
    this.siteContent.getHomeIntro().subscribe({
      next: (intro) => {
        this.intro.set(intro);
        this.loadingIntro.set(false);
      },
      error: () => this.loadingIntro.set(false),
    });
  }

  protected biIcon(icon: string | undefined): string {
    return biIconToMaterial(icon);
  }
}
