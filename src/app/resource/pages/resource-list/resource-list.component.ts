import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Resource, ResourceService, ResourceFilters } from '../../../core/resource.service';
import {
  Observable,
  catchError,
  of,
  Subject,
  switchMap,
  startWith,
  tap,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  BehaviorSubject,
} from 'rxjs';
import { NgbModal, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'; // 🚨 Ajout NgbDropdownModule
import { ResourceFormModalComponent } from '../../components/resource-form-modal/resource-form-modal.component';
import { ToastService } from '../../../../common/toast/toast.service';
import { DeleteConfirmationModalComponent } from '../../../../common/delete-confirmation-modal/delete-confirmation-modal.component'; // 🚨 NOUVEAU: Import Modale

// Interface étendue pour la vue du tableau (pour le chargement du bouton)
interface ManagedResourceView extends Resource {
  isDeleting?: boolean;
}

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  standalone: true,
  imports: [CommonModule, NgClass, NgIf, ReactiveFormsModule, NgbDropdownModule], // 🚨 Ajout NgbDropdownModule
})
export class ResourceListComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);

  private refresh$ = new Subject<void>();

  // 🚨 BehaviorSubject pour la gestion d'état local et de l'icône de chargement
  private resourcesSubject = new BehaviorSubject<ManagedResourceView[]>([]);
  resources$: Observable<ManagedResourceView[]> = this.resourcesSubject.asObservable();

  error: string | null = null;
  loading = true;

  // Contrôles de filtre et recherche
  typeFilter = new FormControl<'ALL' | 'ROOM' | 'EQUIPMENT'>('ALL', { nonNullable: true });
  searchControl = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    const typeFilter$ = this.typeFilter.valueChanges.pipe(
      startWith(this.typeFilter.value),
      map((value) => value as 'ALL' | 'ROOM' | 'EQUIPMENT')
    );

    const searchControl$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(400),
      distinctUntilChanged(),
      map((value) => value as string)
    );

    const filterAndSearch$ = combineLatest([
      typeFilter$,
      searchControl$,
      this.refresh$.pipe(startWith(undefined)),
    ]);

    // Subscription principale pour charger les données et remplir le Subject
    filterAndSearch$
      .pipe(
        switchMap(([type, search, _]) => {
          this.loading = true;
          this.error = null;

          const filters: ResourceFilters = {
            search: search || undefined,
            type: type === 'ALL' ? undefined : type,
          };

          // 🚨 CORRECTION : Utiliser getMyResources() pour n'afficher que les ressources du locateur
          return this.resourceService.getMyResources(filters).pipe(
            tap((res) => {
              this.loading = false;
              // Mettre à jour le Subject avec les nouvelles données et l'état isDeleting initialisé
              this.resourcesSubject.next(
                res.map((r) => ({ ...r, isDeleting: false } as ManagedResourceView))
              );
            }),
            catchError((err) => {
              this.loading = false;
              this.error = err.error?.message || 'Erreur lors du chargement de vos ressources.';
              this.resourcesSubject.next([]); // Vider la liste en cas d'erreur
              return of([]);
            })
          );
        })
      )
      .subscribe();
  }

  onRefresh(): void {
    this.refresh$.next();
    this.toastService.info('Actualisation', 'Rechargement de la liste des ressources...');
  }

  private openResourceModal(resourceId: string | null): void {
    const modalRef = this.modalService.open(ResourceFormModalComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
    });

    modalRef.componentInstance.resourceId = resourceId;

    modalRef.result.then(
      (result) => {
        if (result === true) {
          this.refresh$.next();
          this.toastService.success(
            resourceId ? 'Mise à jour réussie' : 'Création réussie',
            `La ressource a été ${resourceId ? 'modifiée' : 'créée'} avec succès.`
          );
        }
      },
      (reason) => {
        console.log(`Modale fermée: ${reason}`);
      }
    );
  }

  onAddResource(): void {
    this.openResourceModal(null);
  }

  onEdit(resourceId: string): void {
    this.openResourceModal(resourceId);
  }

  // Ouvre la modale de confirmation (appelé par le menu dropdown)
  onDeleteRequest(resource: ManagedResourceView): void {
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

  // Exécute la suppression après confirmation de la modale
  private executeDelete(resource: ManagedResourceView): void {
    this.updateResourceLoading(resource.id, true);

    this.resourceService.deleteResource(resource.id).subscribe({
      next: () => {
        this.toastService.success(
          'Suppression réussie',
          `La ressource "${resource.name}" a été supprimée.`
        );
        this.refresh$.next(); // Le refresh recharge la liste (et enlève l'élément)
      },
      error: (err) => {
        this.toastService.error(
          'Échec de la suppression',
          err.error?.message || `Impossible de supprimer la ressource "${resource.name}".`
        );
        this.updateResourceLoading(resource.id, false);
      },
    });
  }

  // Fonction utilitaire pour gérer l'état de chargement local via le Subject
  private updateResourceLoading(resourceId: string, isDeleting: boolean): void {
    const current = this.resourcesSubject.getValue();
    const updated = current.map((r) => (r.id === resourceId ? { ...r, isDeleting } : r));
    this.resourcesSubject.next(updated);
  }

  getResourceIcon(type: 'ROOM' | 'EQUIPMENT'): string {
    return type === 'ROOM' ? 'bx-buildings' : 'bx-devices';
  }
}
