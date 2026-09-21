import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Contact } from '../../services/contact';
import { ContactAdminDetail as ContactAdminDetailModel, ContactStatus } from '../../models/contact';

/** Read+act view of GET /admin/contacts/:id - full contact info, the message,
 * and a status-change control. Mounted at /admin/poruke/:id/pregled (see
 * contacts.routes.ts). Opening a `new` message auto-marks it `read` server
 * side as a side effect of the GET (see Contact.getById()'s comment) - no
 * separate action for that transition, the detail just reflects whatever
 * status the response comes back with. The three OTHER transitions
 * (`replied`/`archived`/back to `new`) go through PUT .../:id/status, offered
 * as buttons that exclude the current status (and always exclude `read`,
 * since that one only happens automatically). No delete - the backend has no
 * delete endpoint for contacts. */
@Component({
  selector: 'app-admin-contact-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './admin-contact-detail.html',
  styleUrl: './admin-contact-detail.scss',
})
export class AdminContactDetail implements OnInit {
  private contact = inject(Contact);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  contactId = signal<string | null>(null);
  detail = signal<ContactAdminDetailModel | null>(null);
  loading = signal(false);
  acting = signal(false);

  private readonly statusLabels: Record<ContactStatus, string> = {
    new: 'Nova',
    read: 'Pročitana',
    replied: 'Odgovorena',
    archived: 'Arhivirana',
  };

  /** The status buttons offered: every status except `read` (only reached
   * automatically) and the currently active one. */
  availableTargets(): { value: ContactStatus; label: string }[] {
    const current = this.detail()?.osnovno.statusRaw;
    return (['new', 'replied', 'archived'] as ContactStatus[])
      .filter((status) => status !== current)
      .map((value) => ({ value, label: this.statusLabels[value] }));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.contactId.set(id);
    this.loading.set(true);
    this.contact
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.snackBar.open('Greška pri učitavanju poruke.', 'U redu', { duration: 4000 }),
      });
  }

  changeStatus(status: ContactStatus): void {
    const id = this.contactId();
    if (!id) return;

    this.acting.set(true);
    this.contact
      .updateStatus(id, status)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.snackBar.open('Status poruke je ažuriran.', 'U redu', { duration: 3000 });
        },
        error: (error) => this.snackBar.open(error?.message || 'Promena statusa nije uspela.', 'U redu', { duration: 4000 }),
      });
  }
}
