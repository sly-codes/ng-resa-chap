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
import { RouterModule } from '@angular/router';
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
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf, ReactiveFormsModule],
})
export class CatalogueComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);

  resources$!: Observable<Resource[]>;
  loading = true;
  error: string | null = null;
  resourceTypes = RESOURCE_TYPES;

  private refreshTrigger = new Subject<boolean>();

  filterForm = new FormGroup({
    // ✅ CORRECTION : Suppression du 'new' en trop
    search: new FormControl<string>(''),
    type: new FormControl<'ROOM' | 'EQUIPMENT' | ''>(''),
  });

  ngOnInit(): void {
    const filterChanges$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value),
      debounceTime(400),
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

        const apiFilters: ResourceFilters = {
          search: searchParam || undefined,
          type: typeParam === '' ? undefined : (typeParam as 'ROOM' | 'EQUIPMENT'),
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
}
