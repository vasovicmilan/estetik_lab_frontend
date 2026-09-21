import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Observable } from 'rxjs';
import { Tag } from '../../services/tag';
import { TagDomain, TagEditPayload } from '../../models/tag';

/**
 * Create + edit, same pattern as admin-service-form: loads the RAW edit shape
 * (GET /admin/tags/:id/edit) when an id is present in the route, otherwise
 * starts blank for a new tag.
 *
 * Kept deliberately minimal, per the spec: validators on the backend only check
 * name (2-50 chars), domain and isActive - so this form is just name, a domain
 * select, isActive, and a free-text optional description.
 */
@Component({
  selector: 'app-admin-tag-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-tag-form.html',
  styleUrl: './admin-tag-form.scss',
})
export class AdminTagForm implements OnInit {
  private fb = inject(FormBuilder);
  private tag = inject(Tag);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  tagId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);

  domainOptions: { value: TagDomain; label: string }[] = [
    { value: 'post', label: 'Blog' },
    { value: 'service', label: 'Usluga' },
    { value: 'product', label: 'Proizvod' },
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    slug: [''],
    domain: ['service' as TagDomain, Validators.required],
    description: [''],
    isIndexable: [true],
    isActive: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.tagId.set(id);
    this.loading.set(true);
    this.tag
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (tag) => this.patchForm(tag),
        error: () => this.snackBar.open('Greška pri učitavanju taga.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(tag: TagEditPayload): void {
    this.form.patchValue({
      name: tag.name,
      slug: tag.slug ?? '',
      domain: tag.domain,
      description: tag.description ?? '',
      isIndexable: tag.isIndexable ?? true,
      isActive: tag.isActive ?? true,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const payload: TagEditPayload = {
      name: raw.name,
      slug: raw.slug || undefined,
      domain: raw.domain,
      description: raw.description || undefined,
      isIndexable: raw.isIndexable,
      isActive: raw.isActive,
    };
    const id = this.tagId();

    this.saving.set(true);
    const request$: Observable<unknown> = id ? this.tag.update(id, payload) : this.tag.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Tag je sačuvan.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/tagovi']);
      },
      error: () => this.snackBar.open('Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
