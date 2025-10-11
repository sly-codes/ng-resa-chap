import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Resource, ResourceService } from '../../../core/resource.service';
import { Observable, catchError, of, Subject, switchMap, startWith, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'; // ⬅️ NgbModal pour ouvrir
import { ResourceFormModalComponent } from '../../components/resource-form-modal/resource-form-modal.component';

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  standalone: true,
  imports: [CommonModule, NgClass, NgIf],
})
export class ResourceListComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private modalService = inject(NgbModal); // ⬅️ Service d'ouverture NgbModal

  private refresh$ = new Subject<void>();
  resources$!: Observable<Resource[]>;
  error: string | null = null;
  loading = true;

  ngOnInit(): void {
    // La logique de chargement de la liste reste la même (correcte)
    this.resources$ = this.refresh$.asObservable().pipe(
      startWith(undefined),
      switchMap(() => {
        this.loading = true;
        this.error = null;
        return this.resourceService.getMyResources().pipe(
          catchError((err) => {
            this.error = 'Erreur lors du chargement de vos ressources. Réessayez plus tard.';
            return of([]);
          }),
          tap(() => (this.loading = false))
        );
      })
    );
  }

  // Fonction utilitaire pour ouvrir la modale
  private openResourceModal(resourceId: string | null): void {
    const modalRef = this.modalService.open(ResourceFormModalComponent, {
      size: 'md', // Utilise maintenant la définition Bootstrap de 'modal-lg'
      centered: true, // Utilise maintenant 'modal-dialog-centered'
      backdrop: 'static',
    });

    // Passage de l'Input @Input() resourceId
    modalRef.componentInstance.resourceId = resourceId;

    // Gérer la fermeture de la modale pour rafraîchir la liste
    modalRef.result.then(
      (result) => {
        // Résolu (fermé avec succès par activeModal.close(true))
        if (result === true) {
          this.refresh$.next();
        }
      },
      (reason) => {
        // Dismiss (fermé par backdrop, escape, ou activeModal.dismiss())
        // Pas d'action de succès, donc pas de rafraîchissement
        console.log(`Modale fermée: ${reason}`);
      }
    );
  }

  // Ouverture de la modale de création
  onAddResource(): void {
    this.openResourceModal(null);
  }

  // Ouverture de la modale d'édition
  onEdit(resourceId: string): void {
    this.openResourceModal(resourceId);
  }

  // Suppression de la ressource (logique inchangée)
  onDelete(resourceId: string): void {
    const isConfirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?');

    if (isConfirmed) {
      this.resourceService.deleteResource(resourceId).subscribe({
        next: () => {
          this.refresh$.next();
        },
        error: (err) => {
          this.error = 'Erreur lors de la suppression.';
          console.error(err);
        },
      });
    }
  }

  getResourceIcon(type: 'ROOM' | 'EQUIPMENT'): string {
    return type === 'ROOM' ? 'bx-buildings' : 'bx-devices';
  }

}
