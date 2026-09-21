import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Observable } from 'rxjs';
import { RepeaterField, RepeaterSubfield } from '../../../../shared/ui/repeater-field/repeater-field';
import { Package } from '../../services/package';
import { PackageCreatePayload, PackageEditPayload } from '../../models/package';

/**
 * Create + edit, same pattern as admin-service-form: loads the RAW edit shape
 * (GET /admin/packages/:id/edit - added alongside this frontend work, see
 * models/package.ts's header comment) when an id is present in the route,
 * otherwise starts blank for a new package.
 */
@Component({
  selector: 'app-admin-package-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    RepeaterField,
  ],
  templateUrl: './admin-package-form.html',
  styleUrl: './admin-package-form.scss',
})
export class AdminPackageForm implements OnInit {
  private fb = inject(FormBuilder);
  private pkg = inject(Package);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  packageId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);

  // service/servicePackageId are raw Mongo ids for now (no service-picker
  // autocomplete built yet) - see mapPackageForEdit's `items` shape on the backend.
  itemSchema: RepeaterSubfield[] = [
    { name: 'service', label: 'ID usluge', type: 'text' },
    { name: 'servicePackageId', label: 'ID varijante usluge', type: 'text' },
    { name: 'sessions', label: 'Broj seansi', type: 'number' },
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    slug: [''],
    description: ['', Validators.required],
    shortDescription: [''],
    totalPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    basePrice: [null as number | null],
    isBest: [false],
    isActive: [true],
    items: this.fb.array<FormGroup>([]),
  });

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.packageId.set(id);
    this.loading.set(true);
    this.pkg
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (pkg) => this.patchForm(pkg),
        error: () => this.snackBar.open('Greška pri učitavanju paketa.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(pkg: PackageEditPayload): void {
    this.form.patchValue({
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description,
      shortDescription: pkg.shortDescription ?? '',
      totalPrice: pkg.totalPrice,
      basePrice: pkg.basePrice ?? null,
      isBest: pkg.isBest ?? false,
      isActive: pkg.isActive ?? true,
    });

    this.items.clear();
    for (const item of pkg.items ?? []) {
      this.items.push(
        this.fb.group({
          service: [item.service, Validators.required],
          servicePackageId: [item.servicePackageId, Validators.required],
          sessions: [item.sessions, [Validators.required, Validators.min(1)]],
        })
      );
    }
  }

  submit(): void {
    if (this.form.invalid || this.items.length === 0) {
      this.form.markAllAsTouched();
      if (this.items.length === 0) {
        this.snackBar.open('Paket mora sadržati bar jednu uslugu.', 'U redu', { duration: 4000 });
      }
      return;
    }

    const payload: PackageCreatePayload = this.form.value;
    const id = this.packageId();

    this.saving.set(true);
    // Typed as Observable<unknown> for the same reason as admin-service-form's
    // submit(): create()/update() resolve to different response shapes, and
    // submit() only cares whether the request succeeded.
    const request$: Observable<unknown> = id ? this.pkg.update(id, payload) : this.pkg.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Paket je sačuvan.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/paketi']);
      },
      error: () => this.snackBar.open('Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
