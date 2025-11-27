import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, catchError, of, switchMap, take, tap } from 'rxjs';
import { ToastService } from '../../../common/toast/toast.service';
import { AuthService } from '../../core/auth.service';
import { ReservationDetails, ReservationService } from '../reservation.service';

@Component({
  selector: 'app-reservation-detail',
  templateUrl: './reservation-detail.component.html',
  styleUrls: ['./reservation-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class ReservationDetailComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private authService = inject(AuthService);

  reservation$!: Observable<ReservationDetails | null>;
  loading = true;
  error: string | null = null;
  currentUserId: string | null = null;

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserIdFromToken();

    this.reservation$ = this.route.params.pipe(
      tap(() => {
        this.loading = true;
        this.error = null;
      }),
      switchMap((params) => {
        const reservationId = params['id'];
        if (!reservationId) {
          this.loading = false;
          this.error = "L'identifiant de réservation est manquant.";
          return of(null);
        }

        return this.reservationService.getReservationDetails(reservationId).pipe(
          tap(() => (this.loading = false)),
          catchError((err) => {
            this.loading = false;
            if (err.status === 403) {
              this.error = "Vous n'êtes pas autorisé à voir les détails de cette réservation.";
            } else if (err.status === 404) {
              this.error = 'Réservation introuvable.';
            } else {
              this.error = 'Erreur de connexion au serveur.';
            }
            console.error('Erreur de chargement des détails:', err);
            this.toastService.error(
              'Détail Échoué',
              "Impossible d'afficher la réservation demandée."
            );
            return of(null);
          })
        );
      })
    );
  }

  goBack(): void {
    this.reservation$.pipe(take(1)).subscribe((reservation) => {
      if (reservation) {
        if (this.isCurrentUserTenant(reservation)) {
          this.router.navigate(['/reservations/made']);
        } else if (this.isCurrentUserOwner(reservation)) {
          this.router.navigate(['/reservations/received']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  getResourceTypeIcon(type: 'ROOM' | 'EQUIPMENT'): string {
    return type === 'ROOM' ? 'bx-door-open' : 'bx-wrench';
  }

  getResourceTypeText(type: 'ROOM' | 'EQUIPMENT'): string {
    return type === 'ROOM' ? 'Salle' : 'Équipement';
  }

  getStatusBadgeClass(status: string): string {
    const baseClass = 'status-badge';
    switch (status) {
      case 'CONFIRMED':
        return `${baseClass} status-approved`;
      case 'PENDING':
        return `${baseClass} status-pending`;
      case 'REJECTED':
        return `${baseClass} status-rejected`;
      case 'CANCELED':
        return `${baseClass} status-cancelled`;
      default:
        return baseClass;
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmée';
      case 'PENDING':
        return 'En Attente';
      case 'REJECTED':
        return 'Refusée';
      case 'CANCELED':
        return 'Annulée';
      default:
        return status;
    }
  }

  getPriceUnitText(unit: string): string {
    switch (unit) {
      case 'HOUR':
        return 'par heure';
      case 'DAY':
        return 'par jour';
      case 'WEEK':
        return 'par semaine';
      case 'MONTH':
        return 'par mois';
      default:
        return unit;
    }
  }

  isCurrentUserTenant(reservation: ReservationDetails): boolean {
    return this.currentUserId === reservation.locataireId;
  }

  isCurrentUserOwner(reservation: ReservationDetails): boolean {
    return this.currentUserId === reservation.resource.owner.id;
  }

  calculateDurationInHours(dateDebut: string, dateFin: string): number {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    return Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  calculateTotalCost(reservation: ReservationDetails): number {
    const duration = this.calculateDurationInHours(reservation.dateDebut, reservation.dateFin);
    const price = reservation.resource.price;
    const unit = reservation.resource.priceUnit;

    switch (unit) {
      case 'HOUR':
        return duration * price;
      case 'DAY':
        return Math.ceil(duration / 24) * price;
      case 'WEEK':
        return Math.ceil(duration / (24 * 7)) * price;
      case 'MONTH':
        return Math.ceil(duration / (24 * 30)) * price;
      default:
        return 0;
    }
  }
}
