import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDropdownModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { PaginationComponent } from '../../../common/pagination/pagination.component';
import { ToastService } from '../../../common/toast/toast.service';
import {
  MyReservationView,
  ReservationQuery,
  ReservationService,
  ReservationStatus,
} from '../reservation.service';

@Component({
  selector: 'app-my-reservations',
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    HttpClientModule,
    DatePipe,
    PaginationComponent,
    ReactiveFormsModule,
    NgbPopoverModule,
    NgbDropdownModule,
  ],
})
export class MyReservationsComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  private reservationsSubject = new BehaviorSubject<MyReservationView[]>([]);
  reservations$: Observable<MyReservationView[]> = this.reservationsSubject.asObservable();

  private refresh$ = new Subject<{ page: number; silent: boolean }>();

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
    const statusFilter$ = this.statusFilter.valueChanges.pipe(
      startWith(this.statusFilter.value),
      tap(() => (this.currentPage = 1))
    );

    const searchControl$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => (this.currentPage = 1))
    );

    combineLatest([
      statusFilter$,
      searchControl$,
      this.refresh$.pipe(startWith({ page: 1, silent: false })),
    ])
      .pipe(
        switchMap(([status, search, refreshAction]) => {
          const pageToLoad = refreshAction.page;
          const silent = refreshAction.silent;

          if (!silent) {
            this.isLoading = true;
          }
          this.error = null;
          this.currentPage = pageToLoad;

          const query: ReservationQuery = {
            page: this.currentPage,
            limit: this.limit,
            search: search || undefined,
            status: status !== 'ALL' ? (status as ReservationStatus) : undefined,
          };

          return this.reservationService.getReservationsMade(query).pipe(
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
              this.error = err.error?.message || 'Erreur chargement reservations.';
              this.reservationsSubject.next([]);
              this.isLoading = false;
              return of(null);
            })
          );
        })
      )
      .subscribe();
  }

  onPageChange(page: number): void {
    this.refresh$.next({ page, silent: false });
  }

  onRefresh(): void {
    this.refresh$.next({ page: this.currentPage, silent: false });
    this.toastService.info('Rafraichissement', 'Liste mise a jour.');
  }

  onCancelReservation(id: string): void {
    const reservationToCancel = this.reservationsSubject.getValue().find((res) => res.id === id);
    const resourceName = reservationToCancel?.resource.name || 'la ressource';

    let currentReservations = this.reservationsSubject
      .getValue()
      .map((res) => (res.id === id ? ({ ...res, isCancelling: true } as MyReservationView) : res));
    this.reservationsSubject.next(currentReservations);

    this.reservationService.cancelReservation(id).subscribe({
      next: () => {
        this.toastService.success('Annulation reussie', `Reservation annulee.`);
        this.refresh$.next({ page: this.currentPage, silent: true });
      },
      error: (err) => {
        this.toastService.error('Echec annulation', err.error?.message || 'Impossible d\'annuler.');

        let errorReservations = this.reservationsSubject
          .getValue()
          .map((res) =>
            res.id === id ? ({ ...res, isCancelling: false } as MyReservationView) : res
          );
        this.reservationsSubject.next(errorReservations);
      },
    });
  }

  onViewReservation(reservation: MyReservationView): void {
    this.router.navigate(['/reservations', reservation.id]);
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
