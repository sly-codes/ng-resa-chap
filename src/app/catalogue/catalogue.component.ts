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
} from 'rxjs';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReservationFormModalComponent } from '../reservations/reservation-form-modal/reservation-form-modal.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Resource, ResourceFilters, ResourceService } from '../core/resource.service';

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
  loading = true;
  error: string | null = null;
  resourceTypes = RESOURCE_TYPES;

  filterForm = new FormGroup({
    search: new FormControl<string>(''),
    type: new FormControl<'ROOM' | 'EQUIPMENT' | ''>(''),
  });

  ngOnInit(): void {
    this.resources$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value),
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => {
        this.loading = true;
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
          catchError((err) => {
            this.error = 'Erreur lors du chargement ou du filtrage des ressources.';
            console.error(err);
            return of([]);
          }),
          finalize(() => {
            this.loading = false;
          })
        );
      })
    );

    this.filterForm.updateValueAndValidity({ emitEvent: true });
  }

  onRefresh(): void {
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
