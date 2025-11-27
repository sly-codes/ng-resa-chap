import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDropdownModule, NgbModal, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { DeleteConfirmationModalComponent } from '../../../../common/delete-confirmation-modal/delete-confirmation-modal.component';
import { PaginationComponent } from '../../../../common/pagination/pagination.component';
import { ToastService } from '../../../../common/toast/toast.service';
import { Resource, ResourceFilters, ResourceService } from '../../../core/resource.service';
import { ResourceFormModalComponent } from '../../components/resource-form-modal/resource-form-modal.component';

interface ManagedResourceView extends Resource {
  isDeleting?: boolean;
}

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    NgIf,
    ReactiveFormsModule,
    NgbDropdownModule,
    NgbPopoverModule,
    PaginationComponent,
  ],
})
export class ResourceListComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);
  private router = inject(Router);

  private refresh$ = new Subject<{ page: number; silent: boolean }>();

  private resourcesSubject = new BehaviorSubject<ManagedResourceView[]>([]);
  resources$: Observable<ManagedResourceView[]> = this.resourcesSubject.asObservable();

  totalItems = 0;
  currentPage = 1;
  totalPages = 1;
  limit = 10;

  error: string | null = null;
  loading = true;

  typeFilter = new FormControl<'ALL' | 'ROOM' | 'EQUIPMENT'>('ALL', { nonNullable: true });
  searchControl = new FormControl('', { nonNullable: true });
  cityFilter = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    const typeFilter$ = this.typeFilter.valueChanges.pipe(
      startWith(this.typeFilter.value),
      tap(() => (this.currentPage = 1))
    );

    const searchControl$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => (this.currentPage = 1))
    );

    const cityFilter$ = this.cityFilter.valueChanges.pipe(
      startWith(this.cityFilter.value),
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => (this.currentPage = 1))
    );

    combineLatest([
      typeFilter$,
      searchControl$,
      cityFilter$,
      this.refresh$.pipe(startWith({ page: 1, silent: false })),
    ])
      .pipe(
        switchMap(([type, search, city, refreshAction]) => {
          const pageToLoad = refreshAction.page;
          const silent = refreshAction.silent;

          if (!silent) {
            this.loading = true;
          }
          this.error = null;
          this.currentPage = pageToLoad;

          const filters: ResourceFilters = {
            search: search || undefined,
            type: type === 'ALL' ? undefined : (type as 'ROOM' | 'EQUIPMENT'),
            city: city || undefined,
            page: this.currentPage,
            limit: this.limit,
          };

          return this.resourceService.getMyResources(filters).pipe(
            tap((response) => {
              this.loading = false;
              this.totalItems = response.total;
              this.totalPages = response.lastPage;
              this.resourcesSubject.next(
                response.data.map((r) => ({ ...r, isDeleting: false } as ManagedResourceView))
              );
            }),
            catchError((err) => {
              this.loading = false;
              this.error = err.error?.message || 'Erreur lors du chargement de vos ressources.';
              this.resourcesSubject.next([]);
              return of({ data: [], total: 0, page: 1, lastPage: 1 });
            })
          );
        })
      )
      .subscribe();
  }

  onPageChange(page: number): void {
    this.refresh$.next({ page, silent: false });
  }

  onRefresh(): void {
    this.refresh$.next({ page: this.currentPage, silent: false });
    this.toastService.info('Actualisation', 'Rechargement de la liste des ressources...');
  }

  private openResourceModal(resourceId: string | null): void {
    const modalRef = this.modalService.open(ResourceFormModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });

    modalRef.componentInstance.resourceId = resourceId;

    modalRef.result.then(
      (result) => {
        if (result === true) {
          this.refresh$.next({ page: this.currentPage, silent: false });
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

  onView(resourceId: string): void {
    this.router.navigate(['/resources/mine', resourceId]);
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
      () => {}
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
        this.refresh$.next({ page: this.currentPage, silent: false });
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
        return unit;
    }
  }
}
