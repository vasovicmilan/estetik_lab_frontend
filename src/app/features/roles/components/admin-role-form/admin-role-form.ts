import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Observable } from 'rxjs';
import { Role } from '../../services/role';
import { PERMISSIONS, RESERVED_ROLE_NAMES, RoleEditPayload } from '../../models/role';

/**
 * Create + edit, same pattern as admin-tag-form: loads the edit shape (here,
 * Role.getForEdit(), which reshapes GET /admin/roles/:id since there's no raw
 * edit endpoint for roles - see services/role.ts's header) when an id is
 * present in the route, otherwise starts blank for a new role.
 *
 * Permissions has no existing shared multiselect/checkbox-group UI component
 * in shared/ui/ to reuse (checked - repeater-field.ts is for schema-driven
 * array-of-object rows like service packages, not a flat string-enum picker),
 * so this renders one mat-checkbox per PERMISSIONS entry directly, tracked in
 * a plain Set<string> signal rather than a FormArray - simpler to keep in
 * sync with an enum that's just a flat list of independent booleans.
 */
@Component({
  selector: 'app-admin-role-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-role-form.html',
  styleUrl: './admin-role-form.scss',
})
export class AdminRoleForm implements OnInit {
  private fb = inject(FormBuilder);
  private role = inject(Role);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  roleId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  isReserved = signal(false);

  permissionOptions = PERMISSIONS;
  selectedPermissions = signal<Set<string>>(new Set());

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9 _-]{1,49}$/)]],
    description: ['', Validators.maxLength(300)],
    priority: [0, [Validators.min(0)]],
    isDefault: [false],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.roleId.set(id);
    this.loading.set(true);
    this.role
      .getForEdit(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (role) => this.patchForm(role),
        error: () => this.snackBar.open('Greška pri učitavanju role.', 'U redu', { duration: 4000 }),
      });
  }

  private patchForm(role: RoleEditPayload): void {
    this.form.patchValue({
      name: role.name,
      description: role.description ?? '',
      priority: role.priority,
      isDefault: role.isDefault,
    });
    this.selectedPermissions.set(new Set(role.permissions));
    this.isReserved.set(RESERVED_ROLE_NAMES.includes(role.name));
    if (this.isReserved()) {
      this.form.get('name')?.disable();
    }
  }

  isChecked(permission: string): boolean {
    return this.selectedPermissions().has(permission);
  }

  togglePermission(permission: string, event: MatCheckboxChange): void {
    const next = new Set(this.selectedPermissions());
    if (event.checked) {
      next.add(permission);
    } else {
      next.delete(permission);
    }
    this.selectedPermissions.set(next);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: RoleEditPayload = {
      name: raw.name,
      description: raw.description || undefined,
      permissions: Array.from(this.selectedPermissions()),
      isDefault: raw.isDefault,
      priority: raw.priority,
    };
    const id = this.roleId();

    this.saving.set(true);
    const request$: Observable<unknown> = id ? this.role.update(id, payload) : this.role.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open('Rola je sačuvana.', 'U redu', { duration: 3000 });
        this.router.navigate(['/admin/role']);
      },
      error: (error) => this.snackBar.open(error?.message || 'Čuvanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
