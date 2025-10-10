import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  ReservationService,
  ReservationStatus,
  ReceivedReservationView,
  ReservationQuery,
  PaginatedReservations,
} from '../reservation.service';
import { HttpClientModule } from '@angular/common/http';
import { PaginationComponent } from '../../../common/pagination/pagination.component';
import { ToastService } from '../../../common/toast/toast.service';

@Component({
  selector: 'app-received-reservations',
  templateUrl: './received-reservations.component.html',
  styleUrl: './received-reservations.component.scss',
  standalone: true,
  imports: [CommonModule, HttpClientModule, DatePipe, PaginationComponent, ReactiveFormsModule],
})
export class ReceivedReservationsComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private toastService = inject(ToastService);

  private reservationsSubject = new BehaviorSubject<ReceivedReservationView[]>([]);
  reservations$: Observable<ReceivedReservationView[]> = this.reservationsSubject.asObservable();

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
        switchMap(() => this.loadReceivedReservations())
      )
      .subscribe();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => (this.currentPage = 1)),
        switchMap(() => this.loadReceivedReservations())
      )
      .subscribe();

    this.loadReceivedReservations().subscribe();
  }

  loadReceivedReservations(
    page: number = this.currentPage
  ): Observable<PaginatedReservations<ReceivedReservationView>> {
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

    const obs = this.reservationService.getReceivedReservations(query).pipe(
      tap((res) => {
        this.totalItems = res.total;
        this.totalPages = res.lastPage;
        this.currentPage = res.page;
        this.reservationsSubject.next(
          res.data.map((r) => ({ ...r, isProcessing: false } as ReceivedReservationView))
        );
        this.isLoading = false;
      }),
      catchError((err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des demandes reçues.';
        this.reservationsSubject.next([]);
        this.isLoading = false;
        return of({
          data: [],
          total: 0,
          page: 1,
          lastPage: 1,
          limit: this.limit,
        } as PaginatedReservations<ReceivedReservationView>);
      })
    );

    return obs;
  }

  onPageChange(page: number): void {
    this.loadReceivedReservations(page).subscribe();
  }

  onRefresh(): void {
    this.loadReceivedReservations(this.currentPage).subscribe({
      next: () => this.toastService.info('Rafraîchissement', 'Liste des réservations mise à jour.'),
      error: () =>
        this.toastService.error('Rafraîchissement échoué', 'Impossible de rafraîchir la liste.'),
    });
  }

  private updateStatus(id: string, status: 'CONFIRMED' | 'REJECTED'): void {
    let currentReservations = this.reservationsSubject.getValue();
    const reservationToUpdate = currentReservations.find((res) => res.id === id);

    currentReservations = currentReservations.map((res) =>
      res.id === id ? ({ ...res, isProcessing: true } as ReceivedReservationView) : res
    );
    this.reservationsSubject.next(currentReservations);

    this.reservationService.updateReservationStatus(id, status).subscribe({
      next: (updatedRes) => {
        currentReservations = this.reservationsSubject.getValue().map((res) => {
          if (res.id === id) {
            return {
              ...res,
              status: updatedRes.status,
              isProcessing: false,
            } as ReceivedReservationView;
          }
          return res;
        });
        this.reservationsSubject.next(currentReservations);

        this.toastService.success(
          'Statut mis à jour',
          `La réservation pour "${reservationToUpdate?.resource.name}" a été ${
            status === 'CONFIRMED' ? 'acceptée' : 'refusée'
          }.`
        );

        this.loadReceivedReservations(this.currentPage).subscribe();
      },
      error: (err) => {
        this.toastService.error(
          'Échec de la mise à jour',
          err.error?.message || 'Impossible de mettre à jour le statut de la réservation.'
        );

        currentReservations = this.reservationsSubject
          .getValue()
          .map((res) =>
            res.id === id ? ({ ...res, isProcessing: false } as ReceivedReservationView) : res
          );
        this.reservationsSubject.next(currentReservations);
      },
    });
  }

  onApprove(id: string): void {
    this.updateStatus(id, 'CONFIRMED');
  }

  onReject(id: string): void {
    this.updateStatus(id, 'REJECTED');
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
