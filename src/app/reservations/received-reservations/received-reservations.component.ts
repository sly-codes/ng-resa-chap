import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
// ✅ Importation de l'interface spécifique ReceivedReservationView
import {
  ReservationService,
  ReservationStatus,
  ReceivedReservationView,
} from '../reservation.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-received-reservations',
  templateUrl: './received-reservations.component.html',
  styleUrl: './received-reservations.component.scss',
  standalone: true,
  imports: [CommonModule, HttpClientModule, DatePipe],
})
export class ReceivedReservationsComponent implements OnInit {
  private reservationService = inject(ReservationService);

  // ✅ Utilisation de l'interface spécifique
  private reservationsSubject = new BehaviorSubject<ReceivedReservationView[]>([]);
  reservations$: Observable<ReceivedReservationView[]> = this.reservationsSubject.asObservable();

  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadReceivedReservations();
  }

  loadReceivedReservations(): void {
    this.isLoading = true;
    this.reservationService
      .getReceivedReservations()
      .pipe(
        // ✅ Le cast est maintenant plus propre grâce à l'interface
        map((reservations) =>
          reservations.map((res) => ({ ...res, isProcessing: false } as ReceivedReservationView))
        ),
        tap(() => (this.isLoading = false)),
        catchError((err) => {
          this.error = err.error?.message || 'Erreur lors du chargement des demandes reçues.';
          this.isLoading = false;
          return of([]);
        })
      )
      .subscribe((data) => this.reservationsSubject.next(data));
  }

  private updateStatus(id: string, status: 'CONFIRMED' | 'REJECTED'): void {
    let currentReservations = this.reservationsSubject.getValue();
    currentReservations = currentReservations.map((res) =>
      // ✅ Utilisation de l'interface spécifique
      res.id === id ? ({ ...res, isProcessing: true } as ReceivedReservationView) : res
    );
    this.reservationsSubject.next(currentReservations);

    this.reservationService.updateReservationStatus(id, status).subscribe({
      next: (updatedRes) => {
        currentReservations = this.reservationsSubject.getValue().map((res) => {
          if (res.id === id) {
            // ✅ Utilisation de l'interface spécifique
            return {
              ...res,
              status: updatedRes.status,
              isProcessing: false,
            } as ReceivedReservationView;
          }
          return res;
        });
        this.reservationsSubject.next(currentReservations);
      },
      error: (err) => {
        alert(err.error?.message || 'Impossible de mettre à jour le statut de la réservation.');
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
