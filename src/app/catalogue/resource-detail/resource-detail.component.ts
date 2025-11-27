import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { ResourceService, Resource } from '../../core/resource.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReservationFormModalComponent } from '../../reservations/reservation-form-modal/reservation-form-modal.component';
import { ToastService } from '../../../common/toast/toast.service';

@Component({
  selector: 'app-resource-detail',
  templateUrl: './resource-detail.component.html',
  styleUrls: ['./resource-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf],
})
export class ResourceDetailComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private route = inject(ActivatedRoute);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);
  private router = inject(Router);

  resource$!: Observable<Resource | null>;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.resource$ = this.route.params.pipe(
      tap(() => {
        this.loading = true;
        this.error = null;
      }),
      switchMap((params) => {
        const resourceId = params['id'];
        if (!resourceId) {
          this.loading = false;
          this.error = "L'identifiant de ressource est manquant.";
          return of(null);
        }

        return this.resourceService.getResourceById(resourceId).pipe(
          tap(() => (this.loading = false)),
          catchError((err) => {
            this.loading = false;
            this.error = 'Ressource introuvable ou erreur de connexion au serveur.';
            console.error('Erreur de chargement des détails:', err);
            this.toastService.error(
              'Détail Échoué',
              "Impossible d'afficher la ressource demandée."
            );
            return of(null);
          })
        );
      })
    );
  }

  onReserve(resourceId: string, resourceName: string): void {
    const modalRef = this.modalService.open(ReservationFormModalComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
    });

    modalRef.componentInstance.resourceId = resourceId;
    modalRef.componentInstance.resourceName = resourceName;

    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.toastService.success(
            'Réservation Confirmée',
            `La réservation pour "${resourceName}" a été enregistrée.`
          );
        }
      },
      (reason) => {
        if (reason !== 'cancel' && reason !== 0 && reason !== 1) {
          this.toastService.error(
            'Erreur de Réservation',
            'Une erreur est survenue lors de la soumission de la réservation.'
          );
        }
      }
    );
  }

  getResourceIcon(type: 'ROOM' | 'EQUIPMENT'): string {
    return type === 'ROOM' ? 'bx-buildings' : 'bx-devices';
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'ROOM':
        return 'Salle';
      case 'EQUIPMENT':
        return 'Équipement';
      default:
        return type;
    }
  }

  getPriceUnitLabel(unit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH'): string {
    switch (unit) {
      case 'HOUR':
        return 'Heure';
      case 'DAY':
        return 'Jour';
      case 'WEEK':
        return 'Semaine';
      case 'MONTH':
        return 'Mois';
      default:
        return '';
    }
  }
}
