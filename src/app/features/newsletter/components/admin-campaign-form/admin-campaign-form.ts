import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Observable } from 'rxjs';
import { Campaign } from '../../services/campaign';
import { CampaignEditPayload, CampaignInterest, CampaignStatus, CampaignWritePayload } from '../../models/campaign';

/**
 * Create + edit, same pattern as admin-business-partner-form/admin-coupon-form:
 * loads the RAW edit shape (GET /admin/newsletter-campaigns/:id/edit) when an id
 * is present in the route, otherwise starts blank for a new campaign.
 *
 * Deliberate simplification for this pass (same precedent as
 * admin-business-partner-form's `content`): `content` has no dedicated block
 * editor UI here - it's kept in a private component field (not a form control)
 * and merged back into the payload unchanged on submit.
 *
 * `targetInterests` is a set of three checkboxes (general/products/
 * partnership). An empty selection means "svi pretplatnici" (no segment
 * filter) - spelled out in the UI hint rather than defaulting any box to
 * checked, so the admin has to make a deliberate choice either way.
 *
 * `scheduledFor` is a native <input type="datetime-local"> bound directly to
 * the raw "YYYY-MM-DDTHH:mm" string the control produces - same convention as
 * admin-appointment-detail's reschedule input. It is shown and required only
 * when `status` is 'scheduled', and only sent to the backend in that case
 * (cleared to '' otherwise so a stale value from a previous edit never leaks
 * into a draft/sent submit). A client-side future-datetime check is a
 * nice-to-have here, not mandatory, since the backend validates it too.
 *
 * A campaign that is already `sent` is done - no more editing. Rather than
 * disabling individual controls, the whole form is replaced with a message
 * once a loaded campaign's status is `sent` (mirrors the list/detail's hidden
 * edit-link guard for the same rule).
 */
@Component({
  selector: 'app-admin-campaign-form',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-campaign-form.html',
  styleUrl: './admin-campaign-form.scss',
})
export class AdminCampaignForm implements OnInit {
  private fb = inject(FormBuilder);
  private campaign = inject(Campaign);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  campaignId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  loadedStatus = signal<CampaignStatus | null>(null);

  // Preserved unchanged from the loaded edit payload and merged back into the
  // submit payload as-is (see header comment) - no UI in this pass.
  private content: unknown[] = [];

  statusOptions: { value: CampaignStatus; label: string }[] = [
    { value: 'draft', label: 'Nacrt' },
    { value: 'scheduled', label: 'Zakazano' },
  ];

  interestOptions: { value: CampaignInterest; label: string }[] = [
    { value: 'general', label: 'Opšte' },
    { value: 'products', label: 'Proizvodi' },
    { value: 'partnership', label: 'Partnerstvo' },
  ];

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    general: [false],
    products: [false],
    partnership: [false],
    status: ['draft' as CampaignStatus, Validators.required],
    scheduledFor: [''],
  });

  /** Whether editing is blocked entirely because the loaded campaign is already
   * `sent`. Always false on create (no loaded status yet). */
  get isSentLocked(): boolean {
    return this.loadedStatus() === 'sent';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.campaignId.set(id);
    this.loading.set(true);
    this.campaign
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (payload) => this.patchForm(payload),
        error: () => this.snackBar.open('Greška pri učitavanju kampanje.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(payload: CampaignEditPayload): void {
    this.loadedStatus.set(payload.status);
    this.form.patchValue({
      title: payload.title,
      subject: payload.subject,
      general: payload.targetInterests.includes('general'),
      products: payload.targetInterests.includes('products'),
      partnership: payload.targetInterests.includes('partnership'),
      status: payload.status === 'sent' ? 'draft' : payload.status,
      scheduledFor: payload.scheduledFor || '',
    });

    this.content = payload.content ?? [];
  }

  submit(): void {
    if (this.form.invalid || this.isSentLocked) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const status: CampaignStatus = raw.status;
    const targetInterests: CampaignInterest[] = (['general', 'products', 'partnership'] as CampaignInterest[]).filter(
      (interest) => raw[interest]
    );

    const payload: CampaignWritePayload = {
      title: raw.title,
      subject: raw.subject,
      targetInterests,
      status,
      scheduledFor: status === 'scheduled' ? raw.scheduledFor : '',
      content: this.content,
    };
    const id = this.campaignId();

    this.saving.set(true);
    const request$: Observable<unknown> = id ? this.campaign.update(id, payload) : this.campaign.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Kampanja je sačuvana.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/kampanje']);
      },
      error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
