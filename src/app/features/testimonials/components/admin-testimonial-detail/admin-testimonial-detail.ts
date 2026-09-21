import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Testimonial } from '../../services/testimonial';
import { TestimonialAdminDetail as TestimonialAdminDetailModel } from '../../models/testimonial';

/** Read+act view of GET /admin/testimonials/:id - full submitted content,
 * linked service/package/product if any, submitting registered user if any,
 * GDPR consent info, and the approve/reject review actions. Mounted at
 * /admin/utisci/:id/pregled (see testimonials.routes.ts). "Odobri" opens a
 * small inline featured-checkbox before confirming, matching the task's
 * "keep it simple" call rather than a separate dialog; "Odobri"/"Odbij" are
 * only shown while `pending` - approving or rejecting is a one-way review
 * decision here (no reopen action, unlike admin-appointment-detail), and
 * delete stays available in every status. No edit route exists at all -
 * admin never creates or edits the content itself. */
@Component({
  selector: 'app-admin-testimonial-detail',
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatCheckboxModule, MatProgressSpinnerModule, ImageUrlPipe],
  templateUrl: './admin-testimonial-detail.html',
  styleUrl: './admin-testimonial-detail.scss',
})
export class AdminTestimonialDetail implements OnInit {
  private testimonial = inject(Testimonial);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  testimonialId = signal<string | null>(null);
  detail = signal<TestimonialAdminDetailModel | null>(null);
  loading = signal(false);
  acting = signal(false);
  deleting = signal(false);

  approveFeatured = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.testimonialId.set(id);
    this.load();
  }

  private load(): void {
    const id = this.testimonialId();
    if (!id) return;

    this.loading.set(true);
    this.testimonial
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.approveFeatured.set(detail.status.istaknut);
        },
        error: () => this.snackBar.open('Greška pri učitavanju utiska.', 'U redu', { duration: 4000 }),
      });
  }

  approve(): void {
    const id = this.testimonialId();
    if (!id) return;

    this.acting.set(true);
    this.testimonial
      .approve(id, this.approveFeatured())
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.snackBar.open('Utisak je odobren.', 'U redu', { duration: 3000 });
        },
        error: (error) => this.snackBar.open(error?.message || 'Odobravanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  reject(): void {
    const id = this.testimonialId();
    if (!id) return;

    this.acting.set(true);
    this.testimonial
      .reject(id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.snackBar.open('Utisak je odbijen.', 'U redu', { duration: 3000 });
        },
        error: (error) => this.snackBar.open(error?.message || 'Odbijanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  remove(): void {
    const id = this.testimonialId();
    const ime = this.detail()?.osnovno.ime;
    if (!id) return;
    if (!confirm(`Obrisati utisak od "${ime}"?`)) return;

    this.deleting.set(true);
    this.testimonial
      .delete(id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Utisak je obrisan.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/utisci']);
        },
        error: (error) => this.snackBar.open(error?.message || 'Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
