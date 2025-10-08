import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Observable, tap, catchError, of, finalize } from 'rxjs';
// Assurez-vous d'avoir ce fichier dans le même répertoire ou ajustez le chemin
import { DashboardSummary } from './dashboard.types';
import { DashboardService } from './dashboard.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  summary$!: Observable<DashboardSummary>;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadSummary();
  }

  /**
   * Charge le résumé des données du tableau de bord depuis le service.
   */
  loadSummary(): void {
    this.loading = true;
    this.error = null;

    this.summary$ = this.dashboardService.getDashboardSummary().pipe(
      catchError((err) => {
        this.error = 'Erreur lors du chargement du tableau de bord. Veuillez réessayer.';
        console.error(err);

        // Le mock de retour d'erreur contient toutes les propriétés requises
        return of({
          myResourceCount: 0,
          pendingApprovalCount: 0,
          myReservationsCount: 0, // Inclus ici pour correspondre à l'interface
          nextReservationMade: null,
          nextPendingApproval: null,
        } as DashboardSummary);
      }),
      finalize(() => {
        this.loading = false;
      })
    );
  }

  /**
   * Retourne la classe d'icône pour le statut
   */
  getStatusIconClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bx-time-five';
      case 'CONFIRMED':
        return 'bx-check-circle';
      case 'REJECTED':
        return 'bx-x-circle';
      case 'CANCELED':
        return 'bx-calendar-x';
      default:
        return 'bx-info-circle';
    }
  }

  /**
   * Retourne la classe CSS pour le badge de statut
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'status-badge status-pending';
      case 'CONFIRMED':
        return 'status-badge status-confirmed';
      case 'REJECTED':
        return 'status-badge status-rejected';
      case 'CANCELED':
        return 'status-badge status-canceled';
      default:
        return 'status-badge';
    }
  }

  /**
   * Retourne le texte lisible du statut
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'En Attente';
      case 'CONFIRMED':
        return 'Confirmée';
      case 'REJECTED':
        return 'Refusée';
      case 'CANCELED':
        return 'Annulée';
      default:
        return status;
    }
  }
}
