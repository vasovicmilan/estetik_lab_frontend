import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Observable } from 'rxjs';
import { Resource } from '../../services/resource';
import { ResourceEditPayload } from '../../models/resource';

/**
 * Create + edit, same pattern as admin-service-form: loads the RAW edit shape
 * (GET /admin/resources/:id/edit) when an id is present in the route, otherwise
 * starts blank for a new resource. Very simple form, per the spec: name,
 * capacity, an optional notes textarea, and isActive.
 */
@Component({
  selector: 'app-admin-resource-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-resource-form.html',
  styleUrl: './admin-resource-form.scss',
})
export class AdminResourceForm implements OnInit {
  private fb = inject(FormBuilder);
  private resource = inject(Resource);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  resourceId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    capacity: [1, [Validators.required, Validators.min(1)]],
    notes: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.resourceId.set(id);
    this.loading.set(true);
    this.resource
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resource) => this.patchForm(resource),
        error: () => this.snackBar.open('Greška pri učitavanju resursa.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(resource: ResourceEditPayload): void {
    this.form.patchValue({
      name: resource.name,
      capacity: resource.capacity,
      notes: resource.notes ?? '',
      isActive: resource.isActive ?? true,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: ResourceEditPayload = this.form.value;
    const id = this.resourceId();

    this.saving.set(true);
    const request$: Observable<unknown> = id ? this.resource.update(id, payload) : this.resource.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Resurs je sačuvan.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/resursi']);
      },
      error: () => this.snackBar.open('Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
