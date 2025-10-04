import { Routes } from '@angular/router';

export const MAIN_ROUTES: Routes = [
  // Route Catalogue
  {
    path: 'catalogue',
    loadComponent: () => import('./catalogue.component').then((m) => m.CatalogueComponent),
  },
  {
    path: 'resources/mine',
    loadComponent: () =>
      import('./resource/pages/resource-list/resource-list.component').then(
        (m) => m.ResourceListComponent
      ),
  },

  { path: '', redirectTo: 'catalogue', pathMatch: 'full' },
];
