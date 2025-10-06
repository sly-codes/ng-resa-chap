import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
// ✅ Importation de l'interface spécifique MyReservationView
import { MyReservationView, ReservationService, ReservationStatus } from '../reservation.service';

import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-my-reservations',
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.scss',
  standalone: true,
  imports: [CommonModule, HttpClientModule, DatePipe],
})
export class MyReservationsComponent implements OnInit {
  private reservationService = inject(ReservationService);

  // ✅ Utilisation de l'interface spécifique
  private reservationsSubject = new BehaviorSubject<MyReservationView[]>([]);
  reservations$: Observable<MyReservationView[]> = this.reservationsSubject.asObservable();

  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadMyReservations();
  }

  loadMyReservations(): void {
    this.isLoading = true;
    this.reservationService
      .getReservationsMade()
      .pipe(
        // ✅ Le cast est maintenant plus propre grâce à l'interface
        map((reservations) =>
          reservations.map((res) => ({ ...res, isCancelling: false } as MyReservationView))
        ),
        tap(() => (this.isLoading = false)),
        catchError((err) => {
          this.error = err.error?.message || 'Erreur lors du chargement de vos réservations.';
          this.isLoading = false;
          return of([]);
        })
      )
      .subscribe((data) => this.reservationsSubject.next(data));
  }

  onCancelReservation(id: string): void {
    let currentReservations = this.reservationsSubject.getValue();
    currentReservations = currentReservations.map((res) =>
      // ✅ Utilisation de l'interface spécifique
      res.id === id ? ({ ...res, isCancelling: true } as MyReservationView) : res
    );
    this.reservationsSubject.next(currentReservations);

    this.reservationService.cancelReservation(id).subscribe({
      next: () => {
        currentReservations = this.reservationsSubject.getValue().map((res) => {
          if (res.id === id) {
            // ✅ Utilisation de l'interface spécifique
            return {
              ...res,
              status: 'CANCELED' as ReservationStatus,
              isCancelling: false,
            } as MyReservationView;
          }
          return res;
        });
        this.reservationsSubject.next(currentReservations);
      },
      error: (err) => {
        alert(err.error?.message || "Impossible d'annuler cette réservation.");
        currentReservations = this.reservationsSubject
          .getValue()
          .map((res) =>
            res.id === id ? ({ ...res, isCancelling: false } as MyReservationView) : res
          );
        this.reservationsSubject.next(currentReservations);
      },
    });
  }

  // ------------------------------------------------------------------
  // FONCTIONS D'AFFICHAGE
  // ------------------------------------------------------------------
  getResourceIcon(type: 'ROOM' | 'EQUIPMENT'): string {
    return type === 'ROOM' ? 'bx-door-open' : 'bx-wrench';
  }
  getReservationStatusClass(status: ReservationStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'text-bg-success';
      case 'REJECTED':
      case 'CANCELED':
        return 'text-bg-danger';
      case 'PENDING':
        return 'text-bg-warning';
      default:
        return 'text-bg-secondary';
    }
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
