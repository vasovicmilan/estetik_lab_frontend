import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
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
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private serviceApi = inject(Service);
  private packageApi = inject(Package);
  private teamApi = inject(Team);
  private productApi = inject(Product);
  private postApi = inject(Post);

  featuredServices = signal<ServicePublicCard[]>([]);
  featuredPackages = signal<PackagePublicCard[]>([]);
  teamPreview = signal<TeamMemberCard[]>([]);
  featuredProducts = signal<ProductPublicCard[]>([]);
  recentPosts = signal<PostCard[]>([]);

  // Five independent fetches - true only until every one of them has settled
  // (success or error), so the loading state clears even if one endpoint fails.
  loadingServices = signal(true);
  loadingPackages = signal(true);
  loadingTeam = signal(true);
  loadingProducts = signal(true);
  loadingPosts = signal(true);

  ngOnInit(): void {
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
  }
}
