import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MyReservationView,
  PaginatedReservations,
  ReservationService,
  ReservationStatus,
  ReservationQuery,
} from '../reservation.service';
import { HttpClientModule } from '@angular/common/http';
import { PaginationComponent } from '../../../common/pagination/pagination.component';
import { ToastService } from '../../../common/toast/toast.service';

@Component({
  selector: 'app-my-reservations',
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.scss',
  standalone: true,
  imports: [CommonModule, HttpClientModule, DatePipe, PaginationComponent, ReactiveFormsModule],
})
export class MyReservationsComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private toastService = inject(ToastService);

  private reservationsSubject = new BehaviorSubject<MyReservationView[]>([]);
  reservations$: Observable<MyReservationView[]> = this.reservationsSubject.asObservable();

  totalItems = 0;
  currentPage = 1;
  totalPages = 1;
  limit = 10;

  statusFilter = new FormControl<ReservationStatus | 'ALL'>('ALL');
  searchControl = new FormControl('');
  reservationStatuses: ReservationStatus[] = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELED'];

  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.statusFilter.valueChanges
      .pipe(
        tap(() => (this.currentPage = 1)),
        switchMap(() => this.loadMyReservations())
      )
      .subscribe();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => (this.currentPage = 1)),
        switchMap(() => this.loadMyReservations())
      )
      .subscribe();

    this.loadMyReservations().subscribe();
  }

  loadMyReservations(
    page: number = this.currentPage
  ): Observable<PaginatedReservations<MyReservationView>> {
    this.isLoading = true;
    this.error = null;
    this.currentPage = page;

    const query: ReservationQuery = {
      page: this.currentPage,
      limit: this.limit,
      search: this.searchControl.value || undefined,
      status:
        this.statusFilter.value !== 'ALL'
          ? (this.statusFilter.value as ReservationStatus)
          : undefined,
    };

    const obs = this.reservationService.getReservationsMade(query).pipe(
      tap((res) => {
        this.totalItems = res.total;
        this.totalPages = res.lastPage;
        this.currentPage = res.page;
        this.reservationsSubject.next(
          res.data.map((r) => ({ ...r, isCancelling: false } as MyReservationView))
        );
        this.isLoading = false;
      }),
      catchError((err) => {
        this.error = err.error?.message || 'Erreur lors du chargement de vos réservations.';
        this.reservationsSubject.next([]);
        this.isLoading = false;
        return of({
          data: [],
          total: 0,
          page: 1,
          lastPage: 1,
          limit: this.limit,
        } as PaginatedReservations<MyReservationView>);
      })
    );

    return obs;
  }

  onPageChange(page: number): void {
    this.loadMyReservations(page).subscribe();
  }

  onRefresh(): void {
    this.loadMyReservations(this.currentPage).subscribe({
      next: () =>
        this.toastService.info('Rafraîchissement', 'Liste de vos réservations mise à jour.'),
      error: () =>
        this.toastService.error('Rafraîchissement échoué', 'Impossible de rafraîchir la liste.'),
    });
  }

  onCancelReservation(id: string): void {
    let currentReservations = this.reservationsSubject.getValue();
    const reservationToCancel = currentReservations.find((res) => res.id === id);

    currentReservations = currentReservations.map((res) =>
      res.id === id ? ({ ...res, isCancelling: true } as MyReservationView) : res
    );
    this.reservationsSubject.next(currentReservations);

    this.reservationService.cancelReservation(id).subscribe({
      next: (updatedRes) => {
        let updatedReservations = this.reservationsSubject.getValue().map((res) => {
          if (res.id === id) {
            return {
              ...res,
              status: updatedRes.status,
              isCancelling: false,
            } as MyReservationView;
          }
          return res;
        });
        this.reservationsSubject.next(updatedReservations);

        this.toastService.success(
          'Annulation réussie',
          `La réservation pour ${reservationToCancel?.resource.name} a été annulée.`
        );

        this.loadMyReservations(this.currentPage).subscribe();
      },
      error: (err) => {
        this.toastService.error(
          "Échec de l'annulation",
          err.error?.message || "Impossible d'annuler cette réservation."
        );

        let errorReservations = this.reservationsSubject
          .getValue()
          .map((res) =>
            res.id === id ? ({ ...res, isCancelling: false } as MyReservationView) : res
          );
        this.reservationsSubject.next(errorReservations);
      },
    });
  }

  getResourceIcon(type: 'ROOM' | 'EQUIPMENT'): string {
    return type === 'ROOM' ? 'bx-door-open' : 'bx-wrench';
  }

  getReservationStatusText(status: ReservationStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmée';
      case 'REJECTED':
        return 'Refusée';
      case 'CANCELED':
        return 'Annulée';
      case 'PENDING':
        return 'En Attente';
      default:
        return 'Inconnu';
    }
  }
}
