import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource, ResourceService } from './core/resource.service';
import { Observable, catchError, of } from 'rxjs';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';

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

  // Cette méthode sera utilisée sur le bouton "Réserver"
  onReserve(resourceId: string): void {
    // 💡 TO DO: Naviguer vers le formulaire de réservation avec l'ID de la ressource
    console.log(`Naviguer vers la réservation pour la ressource: ${resourceId}`);
    // this.router.navigate(['/reservations/new', resourceId]);
  }

  // Petite fonction pour l'icône basée sur le type
  getResourceIcon(type: 'ROOM' | 'EQUIPMENT'): string {
    return type === 'ROOM' ? 'bx-buildings' : 'bx-devices';
  }
}
