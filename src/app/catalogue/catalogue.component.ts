import { CommonModule, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModal, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
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
import { PaginationComponent } from '../../common/pagination/pagination.component';
import { ToastService } from '../../common/toast/toast.service';
import { Resource, ResourceFilters, ResourceService } from '../core/resource.service';
import { ReservationFormModalComponent } from '../reservations/reservation-form-modal/reservation-form-modal.component';

const RESOURCE_TYPES: ('ROOM' | 'EQUIPMENT')[] = ['ROOM', 'EQUIPMENT'];

@Component({
  selector: 'app-catalogue',
  templateUrl: './catalogue.component.html',
  styleUrls: ['./catalogue.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgIf,
    ReactiveFormsModule,
    NgbPopoverModule,
    PaginationComponent,
  ],
})
export class CatalogueComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);
  private router = inject(Router);

  private resourcesSubject = new BehaviorSubject<Resource[]>([]);
  resources$: Observable<Resource[]> = this.resourcesSubject.asObservable();

  loading = true;
  error: string | null = null;
  resourceTypes = RESOURCE_TYPES;

  // Pagination
  totalItems = 0;
  currentPage = 1;
  totalPages = 1;
  limit = 12;

  private refresh$ = new Subject<{ page: number; silent: boolean }>();

  filterForm = new FormGroup({
    search: new FormControl<string>(''),
    type: new FormControl<'ROOM' | 'EQUIPMENT' | ''>(''),
    city: new FormControl<string>(''),
  });

  ngOnInit(): void {
    const filterChanges$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value),
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => (this.currentPage = 1))
    );

    // Flux principal combinant filtres et pagination
    combineLatest([filterChanges$, this.refresh$.pipe(startWith({ page: 1, silent: false }))])
      .pipe(
        switchMap(([filters, refreshAction]) => {
          const pageToLoad = refreshAction.page;
          const silent = refreshAction.silent;

          if (!silent) {
            this.loading = true;
          }
          this.error = null;
          this.currentPage = pageToLoad;

          const searchParam = filters.search ?? undefined;
          const typeParam = filters.type ?? '';
          const cityParam = filters.city ?? undefined;

          const apiFilters: ResourceFilters = {
            search: searchParam || undefined,
            type: typeParam === '' ? undefined : (typeParam as 'ROOM' | 'EQUIPMENT'),
            city: cityParam || undefined,
            page: this.currentPage,
            limit: this.limit,
          };

          return this.resourceService.getAllResources(apiFilters).pipe(
            tap((response) => {
              this.loading = false;
              this.totalItems = response.total;
              this.totalPages = response.lastPage;
              this.resourcesSubject.next(response.data);
            }),
            catchError((err) => {
              this.loading = false;
              this.error = 'Erreur lors du chargement ou du filtrage des ressources.';
              console.error(err);
              this.toastService.error(
                'Chargement échoué',
                'Impossible de récupérer les ressources depuis le serveur.'
              );
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
    this.toastService.info('Actualisation', 'Rechargement du catalogue...');
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

          this.refresh$.next({ page: this.currentPage, silent: false });
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
