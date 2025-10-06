import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource, ResourceService } from './core/resource.service';
import { Observable, catchError, of } from 'rxjs';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReservationFormModalComponent } from './reservations/reservation-form-modal/reservation-form-modal.component';


@Component({
  selector: 'app-catalogue',
  templateUrl: './catalogue.component.html',
  styleUrls: ['./catalogue.component.scss'],
  standalone: true, // ✅ Mode Standalone
  imports: [
    CommonModule,
    RouterModule, // Pour les liens/boutons
    NgIf,
  ],
})
export class CatalogueComponent implements OnInit {
  private resourceService = inject(ResourceService);
  private modalService = inject(NgbModal); // <--- INJECTION DU SERVICE MODALE

  resources$!: Observable<Resource[]>;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.resources$ = this.resourceService.getAllResources().pipe(
      catchError((err) => {
        this.error = 'Erreur lors du chargement des ressources. Veuillez réessayer.';
        this.loading = false;
        console.error(err);
        return of([]); // Retourne un Observable vide en cas d'erreur
      })
    );

    // Pour gérer l'état de chargement
    this.resources$.subscribe({
      complete: () => {
        this.loading = false;
      },
    });
  }

  // NOUVELLE MÉTHODE
  onReserve(resourceId: string, resourceName: string): void {
    const modalRef = this.modalService.open(ReservationFormModalComponent, {
      size: 'md', // Utilise maintenant la définition Bootstrap de 'modal-lg'
      centered: true, // Utilise maintenant 'modal-dialog-centered'
      backdrop: 'static',
    });

    // Passer les données de la ressource à la modale
    modalRef.componentInstance.resourceId = resourceId;
    modalRef.componentInstance.resourceName = resourceName;

    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          // Optionnel : Afficher une notification de succès
          console.log('Réservation créée avec succès.');
        }
      },
      (reason) => {
        console.log('Modale fermée:', reason);
      }
    );
  }

  // Petite fonction pour l'icône basée sur le type
  getResourceIcon(type: 'ROOM' | 'EQUIPMENT'): string {
    return type === 'ROOM' ? 'bx-buildings' : 'bx-devices';
  }
}
