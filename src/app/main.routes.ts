import { Routes } from '@angular/router';
import { MyReservationsComponent } from './reservations/my-reservations/my-reservations.component';
import { ReceivedReservationsComponent } from './reservations/received-reservations/received-reservations.component';
import { ProfileComponent } from './profile/profile.component';

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
  {
    path: 'reservations/made',
    component: MyReservationsComponent,
    title: 'Mes Réservations | Booking App',
    // Assurez-vous d'ajouter votre AuthGuard ici
    // canActivate: [AuthGuard]
  },
  {
    path: 'reservations/received',
    component: ReceivedReservationsComponent,
    title: 'Réservations Reçues | Booking App',
  },
  {
    path: 'profile',
    component: ProfileComponent,
    title: 'Profile utilisateur',
  },

  { path: '', redirectTo: 'catalogue', pathMatch: 'full' },
];
