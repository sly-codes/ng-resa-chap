import { Component, inject, OnInit, Injector, effect } from '@angular/core'; // ⬅️ Nouveaux imports pour 'effect' et 'Injector'
import { CommonModule } from '@angular/common';
import { Resource, ResourceService } from '../../core/resource.service';
import { Observable, catchError, of, Subject, switchMap, startWith, tap } from 'rxjs'; // 'filter' et 'subscribe' retirés des imports car inutiles
import { RouterModule } from '@angular/router';
import { ModalService } from '../../shared/modal.service';
import { ResourceFormComponent } from '../resource-form/resource-form.component';
import { SimpleTestModalComponent } from '../../shared/simple-test-modal/simple-test-modal.component';

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class ResourceListComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private modalService = inject(ModalService);
  private injector = inject(Injector); // ⬅️ Injecteur nécessaire pour effect()

  private refresh$ = new Subject<void>();
  resources$!: Observable<Resource[]>;
  error: string | null = null;
  loading = true;

  ngOnInit(): void {
    // 💡 Chargement de la liste (logique inchangée, elle est correcte)
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

    // 💡 CORRECTION : Utilisation de effect() pour rafraîchir la liste à la fermeture de la modale
    effect(
      () => {
        // Si modalContent est null (fermeture de la modale)
        if (this.modalService.modalContent() === null) {
          this.refresh$.next(); // Déclenche le rechargement de la liste
        }
      },
      { injector: this.injector }
    );
  }

  // Ouverture de la modale de création
  onAddResource(): void {
    this.modalService.open({
      component: SimpleTestModalComponent,
      data: { resourceId: null },
    });
  }

  // Ouverture de la modale d'édition
  onEdit(resourceId: string): void {
    this.modalService.open({
      component: ResourceFormComponent,
      data: { resourceId: resourceId },
    });
  }

  // Suppression de la ressource
  onDelete(resourceId: string): void {
    const isConfirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer cette ressource ? Cette action est irréversible.'
    );

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
