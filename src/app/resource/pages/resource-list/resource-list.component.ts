import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { DeleteConfirmationModalComponent } from '../../../../common/delete-confirmation-modal/delete-confirmation-modal.component';
import { ToastService } from '../../../../common/toast/toast.service';
import { Resource, ResourceFilters, ResourceService } from '../../../core/resource.service';
import { ResourceFormModalComponent } from '../../components/resource-form-modal/resource-form-modal.component';

// Interface étendue pour la vue du tableau (pour le chargement du bouton)
interface ManagedResourceView extends Resource {
  isDeleting?: boolean;
}

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  standalone: true,
  imports: [CommonModule, NgClass, NgIf, ReactiveFormsModule, NgbDropdownModule],
})
export class ResourceListComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);

  private refresh$ = new Subject<void>();

  private resourcesSubject = new BehaviorSubject<ManagedResourceView[]>([]);
  resources$: Observable<ManagedResourceView[]> = this.resourcesSubject.asObservable();

  error: string | null = null;
  loading = true; // Contrôles de filtre et recherche

  typeFilter = new FormControl<'ALL' | 'ROOM' | 'EQUIPMENT'>('ALL', { nonNullable: true });
  searchControl = new FormControl('', { nonNullable: true }); // 🚨 NOUVEAU: Contrôle pour le filtre par ville
  cityFilter = new FormControl('', { nonNullable: true });

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
    ); // 🚨 NOUVEAU: Observables pour le filtre par ville

    const cityFilter$ = this.cityFilter.valueChanges.pipe(
      startWith(this.cityFilter.value),
      debounceTime(400),
      distinctUntilChanged(),
      map((value) => value.trim() as string)
    );

    const filterAndSearch$ = combineLatest([
      typeFilter$,
      searchControl$,
      cityFilter$, // 🚨 NOUVEAU: Ajout du filtre de ville
      this.refresh$.pipe(startWith(undefined)),
    ]); // Subscription principale pour charger les données et remplir le Subject

    filterAndSearch$
      .pipe(
        switchMap(([type, search, city, _]) => {
          this.loading = true;
          this.error = null;

          const filters: ResourceFilters = {
            search: search || undefined,
            type: type === 'ALL' ? undefined : type, // 🚨 NOUVEAU: Ajout du filtre city
            city: city || undefined,
          };

          return this.resourceService.getMyResources(filters).pipe(
            tap((res) => {
              this.loading = false;
              this.resourcesSubject.next(
                res.map((r) => ({ ...r, isDeleting: false } as ManagedResourceView))
              );
            }),
            catchError((err) => {
              this.loading = false;
              this.error = err.error?.message || 'Erreur lors du chargement de vos ressources.';
              this.resourcesSubject.next([]);
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
      size: 'lg', // 🚨 Mise à jour en 'xl' pour accueillir plus de champs
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

  private executeDelete(resource: ManagedResourceView): void {
    this.updateResourceLoading(resource.id, true);

    this.resourceService.deleteResource(resource.id).subscribe({
      next: () => {
        this.toastService.success(
          'Suppression réussie',
          `La ressource "${resource.name}" a été supprimée.`
        );
        this.refresh$.next();
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

  private updateResourceLoading(resourceId: string, isDeleting: boolean): void {
    const current = this.resourcesSubject.getValue();
    const updated = current.map((r) => (r.id === resourceId ? { ...r, isDeleting } : r));
    this.resourcesSubject.next(updated);
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

  /**
   * 💡 NOUVELLE MÉTHODE : Traduit l'unité de prix (HOUR, DAY, etc.) en français (Heure, Jour, etc.)
   * @param unit L'unité de prix en majuscule (ex: "HOUR")
   * @returns Le libellé en français.
   */
  getUnitDisplayLabel(unit: string): string {
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
        return unit; // Retourne l'unité originale si elle n'est pas trouvée
    }
  }
}
