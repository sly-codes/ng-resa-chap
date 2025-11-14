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
  combineLatest, // 🚨 NOUVEAU: Import combineLatest
  startWith, // 🚨 NOUVEAU: Import startWith
  Subject, // 🚨 NOUVEAU: Import Subject pour le refresh
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
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-received-reservations',
  templateUrl: './received-reservations.component.html',
  styleUrl: './received-reservations.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    DatePipe,
    PaginationComponent,
    ReactiveFormsModule,
    NgbPopoverModule,
  ],
})
export class ReceivedReservationsComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private toastService = inject(ToastService);

  private reservationsSubject = new BehaviorSubject<ReceivedReservationView[]>([]);
  reservations$: Observable<ReceivedReservationView[]> = this.reservationsSubject.asObservable();

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
      tap(() => (this.currentPage = 1))
    );

    const searchControl$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => (this.currentPage = 1))
    );

    // Le flux principal qui combine filtres, recherche, et rafraîchissement manuel
    combineLatest([
      statusFilter$,
      searchControl$,
      this.refresh$.pipe(startWith({ page: 1, silent: false })), // Déclenchement initial
    ])
      .pipe(
        switchMap(([status, search, refreshAction]) => {
          const pageToLoad = refreshAction.page;
          const silent = refreshAction.silent;

          // 🚨 Afficher l'état de chargement UNIQUEMENT si l'action n'est pas silencieuse (ex: après un filtre)
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

          return this.reservationService.getReceivedReservations(query).pipe(
            tap((res) => {
              this.totalItems = res.total;
              this.totalPages = res.lastPage;
              this.currentPage = res.page;
              // Assurer que les états de chargement des actions sont réinitialisés après le chargement
              this.reservationsSubject.next(
                res.data.map(
                  (r) =>
                    ({
                      ...r,
                      isApproving: false,
                      isRejecting: false,
                    } as ReceivedReservationView)
                )
              );
              this.isLoading = false;
            }),
            catchError((err) => {
              this.error = err.error?.message || 'Erreur lors du chargement des demandes reçues.';
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
    // 🚨 Déclenche le rechargement avec la page courante
    this.refresh$.next({ page: this.currentPage, silent: false });
    this.toastService.info('Rafraîchissement', 'Liste des réservations mise à jour.');
  }

  private updateStatus(id: string, status: 'CONFIRMED' | 'REJECTED'): void {
    const reservationToUpdate = this.reservationsSubject.getValue().find((res) => res.id === id);
    const resourceName = reservationToUpdate?.resource.name || 'la ressource';
    const actionText = status === 'CONFIRMED' ? 'acceptée' : 'refusée';

    // 1. Définir le champ de chargement à mettre à jour
    const loadingField: 'isApproving' | 'isRejecting' =
      status === 'CONFIRMED' ? 'isApproving' : 'isRejecting';

    // 2. Mettre SEUL le bouton cliqué en chargement
    let currentReservations = this.reservationsSubject.getValue().map((res) =>
      res.id === id
        ? ({
            ...res,
            [loadingField]: true, // Utiliser la clé dynamique
          } as ReceivedReservationView)
        : res
    );
    this.reservationsSubject.next(currentReservations);

    this.reservationService.updateReservationStatus(id, status).subscribe({
      next: () => {
        // 3. Succès : Toast + Rechargement SILENCIEUX
        this.toastService.success(
          'Statut mis à jour',
          `La réservation pour "${resourceName}" a été ${actionText}.`
        );
        // 💡 CHANGEMENT CLÉ : Rechargez la liste silencieusement pour une UX fluide.
        this.refresh$.next({ page: this.currentPage, silent: true });
      },
      error: (err) => {
        // 4. Erreur : Toast + Retirer l'état de chargement SEULEMENT pour l'action qui a échoué
        this.toastService.error(
          'Échec de la mise à jour',
          err.error?.message || 'Impossible de mettre à jour le statut de la réservation.'
        );

        let errorReservations = this.reservationsSubject.getValue().map((res) =>
          res.id === id
            ? ({
                ...res,
                [loadingField]: false, // Retirer SEUL l'état de chargement
              } as ReceivedReservationView)
            : res
        );
        this.reservationsSubject.next(errorReservations);
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
