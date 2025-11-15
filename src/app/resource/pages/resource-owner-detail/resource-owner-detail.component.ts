import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { DeleteConfirmationModalComponent } from '../../../../common/delete-confirmation-modal/delete-confirmation-modal.component';
import { ToastService } from '../../../../common/toast/toast.service';
import { Resource, ResourceService } from '../../../core/resource.service';
import { ResourceFormModalComponent } from '../../components/resource-form-modal/resource-form-modal.component';

@Component({
  selector: 'app-resource-owner-detail',
  templateUrl: './resource-owner-detail.component.html',
  styleUrls: ['./resource-owner-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf],
})
export class ResourceOwnerDetailComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private route = inject(ActivatedRoute);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);
  private router = inject(Router);

  resource$!: Observable<Resource | null>;
  loading = true;
  error: string | null = null;
  isDeleting = false;

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

  /**
   * Navigate back to resource list
   */
  onBackToList(): void {
    this.router.navigate(['/resources/mine']);
  }

  /**
   * Open edit modal for the resource
   */
  onEdit(resourceId: string): void {
    const modalRef = this.modalService.open(ResourceFormModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });

    modalRef.componentInstance.resourceId = resourceId;

    modalRef.result.then(
      (result) => {
        if (result === true) {
          // Refresh the resource data
          this.ngOnInit();
          this.toastService.success(
            'Mise à jour réussie',
            'La ressource a été modifiée avec succès.'
          );
        }
      },
      (reason) => {
        console.log(`Modale fermée: ${reason}`);
      }
    );
  }

  /**
   * Request deletion confirmation
   */
  onDeleteRequest(resource: Resource): void {
    const modalRef = this.modalService.open(DeleteConfirmationModalComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
    });

    modalRef.componentInstance.resourceName = resource.name;

    modalRef.result.then(
      (result) => {
        if (result === true) {
          this.executeDelete(resource);
        }
      },
      () => {
        // La modale a été annulée ou fermée
      }
    );
  }

  /**
   * Execute the delete operation
   */
  private executeDelete(resource: Resource): void {
    this.isDeleting = true;

    this.resourceService.deleteResource(resource.id).subscribe({
      next: () => {
        this.toastService.success(
          'Suppression réussie',
          `La ressource "${resource.name}" a été supprimée.`
        );
        // Navigate back to list after successful deletion
        this.router.navigate(['/resources/mine']);
      },
      error: (err) => {
        this.isDeleting = false;
        this.toastService.error(
          'Échec de la suppression',
          err.error?.message || `Impossible de supprimer la ressource "${resource.name}".`
        );
      },
    });
  }

  /**
   * Navigate to public view of the resource
   */
  onViewPublic(resourceId: string): void {
    this.router.navigate(['/catalogue', resourceId]);
  }

  // Utility methods
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
