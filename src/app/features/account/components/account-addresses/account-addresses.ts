import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Address } from '../../services/address';
import { MyAddress } from '../../models/address';

/**
 * Address manager - a card per saved address (default badge, "set default" on
 * the others, delete-with-confirm) plus an inline "add address" form that
 * appends to the list on success. No dedicated edit route exists on the
 * backend for this v1 pass: to change an address the customer deletes and
 * re-adds it, same simplification precedent as other "keep it simple" pieces
 * of this app. Mounted at /moj-nalog/adrese.
 */
@Component({
  selector: 'app-account-addresses',
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatProgressSpinnerModule],
  templateUrl: './account-addresses.html',
  styleUrl: './account-addresses.scss',
})
export class AccountAddresses implements OnInit {
  private fb = inject(FormBuilder);
  private addressService = inject(Address);
  private snackBar = inject(MatSnackBar);

  addresses = signal<MyAddress[]>([]);
  loading = signal(true);
  acting = signal(false);

  addingNew = signal(false);
  saving = signal(false);

  form = this.fb.group({
    label: [''],
    city: ['', [Validators.required]],
    postalCode: ['', [Validators.required]],
    street: ['', [Validators.required]],
    number: ['', [Validators.required]],
    isDefault: [false],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.addressService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (addresses) => this.addresses.set(addresses),
        error: (error) => this.snackBar.open(error?.message || 'Učitavanje adresa nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  toggleAdd(): void {
    this.addingNew.set(!this.addingNew());
    if (this.addingNew()) this.form.reset({ isDefault: false });
  }

  submitAdd(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { label, city, postalCode, street, number, isDefault } = this.form.getRawValue();
    this.saving.set(true);
    this.addressService
      .add({
        label: label?.trim() || undefined,
        city: city!.trim(),
        postalCode: postalCode!.trim(),
        street: street!.trim(),
        number: number!.trim(),
        isDefault: isDefault ?? undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (addresses) => {
          this.addresses.set(addresses);
          this.addingNew.set(false);
          this.snackBar.open('Adresa je dodata.', 'U redu', { duration: 3000 });
        },
        error: (error) => this.snackBar.open(error?.message || 'Dodavanje adrese nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  setDefault(address: MyAddress): void {
    if (address.podrazumevana) return;

    this.acting.set(true);
    this.addressService
      .setDefault(address.id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Podrazumevana adresa je promenjena.', 'U redu', { duration: 3000 });
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Izmena podrazumevane adrese nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  remove(address: MyAddress): void {
    if (!confirm('Obrisati ovu adresu?')) return;

    this.acting.set(true);
    this.addressService
      .remove(address.id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Adresa je obrisana.', 'U redu', { duration: 3000 });
          this.addresses.set(this.addresses().filter((a) => a.id !== address.id));
        },
        error: (error) => this.snackBar.open(error?.message || 'Brisanje adrese nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
