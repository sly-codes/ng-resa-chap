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
  distinctUntilChanged,
  Subject,
  merge,
} from 'rxjs';
import { RouterModule, Router } from '@angular/router'; // 💡 Ajout de Router pour la navigation
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReservationFormModalComponent } from '../reservations/reservation-form-modal/reservation-form-modal.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Resource, ResourceFilters, ResourceService } from '../core/resource.service';
import { ToastService } from '../../common/toast/toast.service';

const RESOURCE_TYPES: ('ROOM' | 'EQUIPMENT')[] = ['ROOM', 'EQUIPMENT'];

@Component({
  selector: 'app-catalogue',
  templateUrl: './catalogue.component.html',
  styleUrls: ['./catalogue.component.scss'],
  standalone: true, // 💡 Ajout de ResourceDetailComponent à importer/déclarer si c'est un module partagé
  imports: [CommonModule, RouterModule, NgIf, ReactiveFormsModule],
})
export class CatalogueComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);
  private router = inject(Router); // 💡 Injection de Router

  resources$!: Observable<Resource[]>;
  loading = true;
  error: string | null = null;
  resourceTypes = RESOURCE_TYPES;

  private refreshTrigger = new Subject<boolean>();

  filterForm = new FormGroup({
    search: new FormControl<string>(''),
    type: new FormControl<'ROOM' | 'EQUIPMENT' | ''>(''),
    city: new FormControl<string>(''), // 💡 AJOUT DU CONTRÔLE CITY
  });

  ngOnInit(): void {
    const filterChanges$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value),
      debounceTime(400), // Ajout de city dans le distinctUntilChanged
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );

    const manualRefresh$ = this.refreshTrigger.pipe(
      switchMap((isManual) => of({ filters: this.filterForm.value, isManual }))
    );

    this.resources$ = merge(
      filterChanges$.pipe(switchMap((filters) => of({ filters, isManual: false }))),
      manualRefresh$
    ).pipe(
      tap(() => {
        this.loading = true;
        this.error = null;
      }),
      switchMap(({ filters, isManual }) => {
        const searchParam = filters.search ?? undefined;
        const typeParam = filters.type ?? '';
        const cityParam = filters.city ?? undefined; // 💡 Récupération de City

        const apiFilters: ResourceFilters = {
          search: searchParam || undefined,
          type: typeParam === '' ? undefined : (typeParam as 'ROOM' | 'EQUIPMENT'),
          city: cityParam || undefined, // 💡 Passage de City au service
        };

        return this.resourceService.getAllResources(apiFilters).pipe(
          tap(() => {
            if (isManual) {
              this.toastService.info('Catalogue', 'Catalogue des ressources mis à jour.');
            }
          }),
          catchError((err) => {
            this.error = 'Erreur lors du chargement ou du filtrage des ressources.';
            console.error(err);
            this.toastService.error(
              'Chargement échoué',
              'Impossible de récupérer les ressources depuis le serveur.'
            );
            return of([]);
          }),
          finalize(() => {
            this.loading = false;
          })
        );
      })
    );
  }

  onRefresh(): void {
    this.refreshTrigger.next(true);
  }
  /**
   * Ouvre la modale de réservation
   */

  onReserve(resourceId: string, resourceName: string): void {
    // ... (Logique de réservation inchangée) ...
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

          this.refreshTrigger.next(false);
        }
      },
      (reason) => {
        if (reason === 'cancel') {
          this.toastService.info('Annulation', "La réservation a été annulée par l'utilisateur.");
        } else if (reason !== 0 && reason !== 1) {
          this.toastService.error(
            'Erreur de Réservation',
            'Une erreur est survenue lors de la soumission de la réservation.'
          );
        }
      }
    );
  }
  /**
   * 💡 NOUVEAU: Navigue vers la page de détails de la ressource.
   */

  onViewDetails(resourceId: string): void {
    // Assurez-vous que la route '/catalogue/:id' est configurée dans votre routing module
    this.router.navigate(['/catalogue', resourceId]);
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
        return 'h';
      case 'DAY':
        return 'j';
      case 'WEEK':
        return 'sem.';
      case 'MONTH':
        return 'mois';
      default:
        return '';
    }
  }
}
