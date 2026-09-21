import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Subscriber } from '../../services/subscriber';
import { SubscriberAdminDetail as SubscriberAdminDetailModel } from '../../models/subscriber';

/** Read-only view of GET /admin/newsletter-subscribers/:id (Subscriber.getById()
 * -> SubscriberAdminDetail). Mounted at /admin/pretplatnici/:id/pregled (see
 * subscribers.routes.ts). Same load/delete-with-confirm pattern as
 * admin-coupon-detail/admin-business-partner-detail - no edit route at all, only
 * view + delete (see this feature's model header comment). */
@Component({
  selector: 'app-admin-subscriber-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './admin-subscriber-detail.html',
  styleUrl: './admin-subscriber-detail.scss',
})
export class AdminSubscriberDetail implements OnInit {
  private subscriber = inject(Subscriber);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  subscriberId = signal<string | null>(null);
  detail = signal<SubscriberAdminDetailModel | null>(null);
  loading = signal(false);
  deleting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.subscriberId.set(id);
    this.loading.set(true);
    this.subscriber
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju pretplatnika.', 'U redu', { duration: 4000 }),
      });
  }

  remove(): void {
    const id = this.subscriberId();
    const email = this.detail()?.osnovno.email;
    if (!id) return;
    if (!confirm(`Obrisati pretplatnika "${email}"?`)) return;

    this.deleting.set(true);
    this.subscriber
      .delete(id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Pretplatnik je obrisan.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/pretplatnici']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
