import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';

import {
  Observable,
  catchError,
  of,
  switchMap,
  tap,
  startWith,
  finalize,
  debounceTime,
} from 'rxjs';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReservationFormModalComponent } from '../reservations/reservation-form-modal/reservation-form-modal.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Resource, ResourceFilters, ResourceService } from '../core/resource.service';

// Définition des types de ressource pour le filtre
const RESOURCE_TYPES: ('ROOM' | 'EQUIPMENT')[] = ['ROOM', 'EQUIPMENT'];

@Component({
  selector: 'app-catalogue',
  templateUrl: './catalogue.component.html',
  styleUrls: ['./catalogue.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf, ReactiveFormsModule],
})
export class CatalogueComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private modalService = inject(NgbModal);

  resources$!: Observable<Resource[]>;
  loading = true; // Initialiser à true pour le premier chargement
  error: string | null = null;
  resourceTypes = RESOURCE_TYPES;

  filterForm = new FormGroup({
    search: new FormControl<string>(''),
    type: new FormControl<'ROOM' | 'EQUIPMENT' | ''>(''),
  });

  ngOnInit(): void {
    this.resources$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value),
      debounceTime(300),
      // 🛑 CORRECTION ICI : Assurer que `loading` passe à true AVANT l'appel API.
      tap(() => {
        this.loading = true; // Début du chargement/filtrage
        this.error = null;
      }),
      switchMap((filters) => {
        const searchParam = filters.search ?? undefined;
        const typeParam = filters.type ?? '';

        const apiFilters: ResourceFilters = {
          search: searchParam || undefined,
          type: typeParam === '' ? undefined : (typeParam as 'ROOM' | 'EQUIPMENT'),
        };

        return this.resourceService.getAllResources(apiFilters).pipe(
          // La gestion de `loading = false` est déplacée dans `finalize`
          // pour s'assurer qu'elle est toujours exécutée, même en cas d'erreur.
          catchError((err) => {
            this.error = 'Erreur lors du chargement ou du filtrage des ressources.';
            console.error(err);
            return of([]);
          }),
          finalize(() => {
            this.loading = false; // Fin du chargement
          })
        );
      })
    );
    // Déclenche le premier chargement
    this.filterForm.updateValueAndValidity({ emitEvent: true });
  }

  /**
   * Déclenche un rafraîchissement forcé sans changer les filtres.
   */
  onRefresh(): void {
    // Déclencher simplement le re-traitement de l'Observable `resources$`
    this.filterForm.updateValueAndValidity({ emitEvent: true });
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
          console.log('Réservation créée avec succès. Rafraîchissement...');
          this.onRefresh();
        }
      },
      (reason) => {
        console.log('Modale fermée:', reason);
      }
    );
  }

  getResourceIcon(type: 'ROOM' | 'EQUIPMENT'): string {
    return type === 'ROOM' ? 'bx-buildings' : 'bx-devices';
  }

  /**
   * Retourne le label traduit du type de ressource
   */
  getTypeLabel(type: string): string {
    switch (type) {
      case 'ROOM':
        return 'Salle';
      case 'EQUIPMENT':
        // J'ai corrigé l'erreur de frappe : c'était 'EQUIPEMENT' dans votre code source original, mais 'EQUIPMENT' dans le type.
        // Je suppose que 'EQUIPMENT' est la bonne valeur pour la clé.
        return 'Équipement';
      default:
        return type;
    }
  }
}
