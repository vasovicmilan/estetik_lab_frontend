import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { Team } from '../../services/team';
import { ExpertAdminListItem } from '../../models/expert';
import { ApiMeta } from '../../../../core/models/api-response';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { DataTableAction, DataTableColumn } from '../../../../shared/ui/data-table/data-table.models';
import { DataTableCellDef } from '../../../../shared/ui/data-table/data-table-cell-def';

@Component({
  selector: 'app-admin-team-list',
  imports: [CommonModule, RouterLink, MatButtonModule, ImageUrlPipe, DataTable, DataTableCellDef],
  templateUrl: './admin-team-list.html',
  styleUrl: './admin-team-list.scss',
})
export class AdminTeamList implements OnInit {
  private team = inject(Team);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  rows = signal<ExpertAdminListItem[]>([]);
  meta = signal<ApiMeta | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private limit = 10;
  private search = '';
  /** `titula`/`aktivan` are plain scalar columns (title, isActive) on the
   * Expert schema - see EXPERT_SORT_FIELDS in admin-people.controller.js.
   * `imePrezime` (firstName + lastName, concatenated) and `brojUsluga`
   * (services.length, computed in JS from the populated services array) are
   * NOT sortable - neither is a sortable DB column. */
  private sort: string | null = null;
  private order: 'asc' | 'desc' | null = null;

  /** expertRepo.findExperts's default ({ order: 1, createdAt: -1, _id: -1 })
   * has no matching column shown in this list (redosled/order isn't a
   * displayed column here), so no defaultSort indicator is shown, same
   * reasoning as admin-user-list. */

  columns: DataTableColumn<ExpertAdminListItem>[] = [
    { key: 'slika', label: '', type: 'custom' },
    { key: 'imePrezime', label: 'Ime i prezime' },
    { key: 'titula', label: 'Titula', sortable: true },
    { key: 'brojUsluga', label: 'Usluge' },
    { key: 'aktivan', label: 'Aktivan', sortable: true },
  ];

  actions: DataTableAction<ExpertAdminListItem>[] = [
    { icon: 'visibility', label: 'Pregled', onClick: (row) => this.router.navigate(['/admin/tim', row.id, 'pregled']) },
    { icon: 'edit', label: 'Izmeni', onClick: (row) => this.router.navigate(['/admin/tim', row.id]) },
    { icon: 'delete', label: 'Obriši', color: 'warn', confirm: 'Obrisati člana tima?', onClick: (row) => this.remove(row) },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.team
      .listAdmin({
        page,
        limit: this.limit,
        search: this.search || undefined,
        sort: this.sort ?? undefined,
        order: this.order ?? undefined,
      })
      .subscribe({
        next: ({ data, meta }) => {
          this.rows.set(data);
          this.meta.set(meta ?? null);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error?.message || 'Greška pri učitavanju tima.');
          this.loading.set(false);
        },
      });
  }

  onPage(event: PageEvent): void {
    this.limit = event.pageSize;
    this.load(event.pageIndex + 1);
  }

  onSearch(term: string): void {
    this.search = term;
    this.load(1);
  }

  onSort(sort: Sort): void {
    this.sort = sort.direction ? sort.active : null;
    this.order = sort.direction ? (sort.direction as 'asc' | 'desc') : null;
    this.load(1);
  }

  remove(row: ExpertAdminListItem): void {
    this.team.delete(row.id).subscribe({
      next: () => {
        this.snackBar.open('Član tima je obrisan.', 'U redu', { duration: 3000 });
        this.load(this.meta()?.page ?? 1);
      },
      error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
    });
  }
}
