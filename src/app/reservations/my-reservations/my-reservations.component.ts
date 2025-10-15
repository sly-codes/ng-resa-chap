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
  combineLatest, // 🚨 NOUVEAU: Import combineLatest
  startWith, // 🚨 NOUVEAU: Import startWith
  Subject, // 🚨 NOUVEAU: Import Subject pour le refresh
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

  // 🚨 Nouveau Subject pour déclencher le rechargement manuel/pagination
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
      tap(() => (this.currentPage = 1)) // Réinitialise la page lors d'un changement de filtre
    );

    const searchControl$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => (this.currentPage = 1)) // Réinitialise la page lors d'un changement de recherche
    );

    // Le flux principal qui combine filtres, recherche, et rafraîchissement manuel
    combineLatest([
      statusFilter$,
      searchControl$,
      this.refresh$.pipe(startWith({ page: 1, silent: false })), // Déclenchement initial
    ])
      .pipe(
        switchMap(([status, search, refreshAction]) => {
          // La page à charger est déterminée par l'action de rafraîchissement ou la valeur courante
          const pageToLoad = refreshAction.page;
          const silent = refreshAction.silent;

          // 🚨 Afficher l'état de chargement UNIQUEMENT si l'action n'est pas silencieuse (ex: juste pour la pagination)
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
              // 💡 CONSERVE isCancelling: Mappez les données pour s'assurer que 'isCancelling' est initialisé.
              this.reservationsSubject.next(
                res.data.map((r) => ({ ...r, isCancelling: false } as MyReservationView))
              );
              this.isLoading = false;
            }),
            catchError((err) => {
              this.error = err.error?.message || 'Erreur lors du chargement de vos réservations.';
              this.reservationsSubject.next([]);
              this.isLoading = false;
              return of(null); // Retourne null pour terminer le flux
            })
          );
        })
      )
      .subscribe();
  }

  onPageChange(page: number): void {
    // 🚨 Déclenche le rechargement avec le nouveau numéro de page (non silencieux par défaut)
    this.refresh$.next({ page, silent: false });
  }

  onRefresh(): void {
    // 🚨 Déclenche le rechargement avec la page courante.
    this.refresh$.next({ page: this.currentPage, silent: false });
    this.toastService.info('Rafraîchissement', 'Liste de vos réservations mise à jour.');
  }

  onCancelReservation(id: string): void {
    const reservationToCancel = this.reservationsSubject.getValue().find((res) => res.id === id);
    const resourceName = reservationToCancel?.resource.name || 'la ressource';

    // 1. Mettre le bouton en chargement (isCancelling = true)
    let currentReservations = this.reservationsSubject
      .getValue()
      .map((res) => (res.id === id ? ({ ...res, isCancelling: true } as MyReservationView) : res));
    this.reservationsSubject.next(currentReservations);

    this.reservationService.cancelReservation(id).subscribe({
      next: () => {
        this.toastService.success(
          'Annulation réussie',
          `La réservation pour ${resourceName} a été annulée.`
        );

        // 💡 CHANGEMENT CLÉ : Rechargez la liste silencieusement pour une UX fluide.
        // On passe silent: true pour que la loading spinner de toute la page ne s'affiche pas.
        // Seul le bouton d'action 'Annuler' sera en chargement le temps de l'opération.
        this.refresh$.next({ page: this.currentPage, silent: true });
      },
      error: (err) => {
        this.toastService.error(
          "Échec de l'annulation",
          err.error?.message || "Impossible d'annuler cette réservation."
        );

        // Retirer manuellement l'état de chargement
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
