import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { MyAppointment } from '../../services/my-appointment';
import { MyAppointmentListItem } from '../../models/appointment';

/** Groups the flat GET /me/appointments list into Danas/Predstojeći/Prošli
 * client-side, comparing each row's raw startTimeRaw ISO instant against
 * `new Date()` - the backend just returns a flat paginated list, there's no
 * server-side "upcoming" filter for this endpoint. Mounted at
 * /moj-nalog/zakazivanja. */
@Component({
  selector: 'app-account-appointments',
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './account-appointments.html',
  styleUrl: './account-appointments.scss',
})
export class AccountAppointments implements OnInit {
  private myAppointment = inject(MyAppointment);
  private snackBar = inject(MatSnackBar);

  appointments = signal<MyAppointmentListItem[]>([]);
  loading = signal(true);

  today = computed(() => this.appointments().filter((a) => this.groupOf(a) === 'today'));
  upcoming = computed(() => this.appointments().filter((a) => this.groupOf(a) === 'upcoming'));
  past = computed(() => this.appointments().filter((a) => this.groupOf(a) === 'past'));

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    // 100 is well beyond how many appointments a single customer realistically
    // has - simplest way to get "all of them" onto one grouped page without
    // building pagination for a list this small.
    this.myAppointment
      .list({ limit: 100 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ data }) => this.appointments.set(data),
        error: (error) => this.snackBar.open(error?.message || 'Učitavanje zakazivanja nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  private groupOf(a: MyAppointmentListItem): 'today' | 'upcoming' | 'past' {
    const start = new Date(a.startTimeRaw);
    if (Number.isNaN(start.getTime())) return 'past';
    const now = new Date();
    const isSameDay =
      start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth() && start.getDate() === now.getDate();
    if (isSameDay) return 'today';
    return start.getTime() > now.getTime() ? 'upcoming' : 'past';
  }
}
