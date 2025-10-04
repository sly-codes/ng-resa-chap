import { Routes } from '@angular/router';

export const MAIN_ROUTES: Routes = [
  // Route Catalogue
  {
    path: 'catalogue',
    loadComponent: () =>
      import('./catalogue.component').then((m) => m.CatalogueComponent),
  },

  // 🚨 ROUTE CONSERVÉE : Liste des ressources de l'utilisateur
  {
    path: 'resources/mine',
    loadComponent: () =>
      import('./resource/resource-list/resource-list.component').then(
        (m) => m.ResourceListComponent
      ),
  },

  // ❌ Routes /resources/new et /resources/edit/:id SUPPRIMÉES (gérées par la Modale)

  { path: '', redirectTo: 'catalogue', pathMatch: 'full' },
];
