import { Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { MyReservationsComponent } from './reservations/my-reservations/my-reservations.component';
import { ReceivedReservationsComponent } from './reservations/received-reservations/received-reservations.component';
import { DashboardComponent } from './dashboard/dashboard.component'; 
// Importez le composant

export const MAIN_ROUTES: Routes = [
  // Route 1: Le Tableau de Bord (Dashboard)
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Tableau de Bord | Booking App',
  },

  // Route 2: Catalogue
  {
    path: 'catalogue',
    loadComponent: () =>
      import('./catalogue/catalogue.component').then((m) => m.CatalogueComponent),
    title: 'Catalogue | Booking App',
  },

  

  // Route 3: Mes Ressources
  {
    path: 'resources/mine',
    loadComponent: () =>
      import('./resource/pages/resource-list/resource-list.component').then(
        (m) => m.ResourceListComponent
      ),
    title: 'Mes Ressources | Booking App',
  },

  // Route 4: Mes Réservations faites (Locataire)
  {
    path: 'reservations/made',
    component: MyReservationsComponent,
    title: 'Mes Réservations | Booking App',
  },

  // Route 5: Réservations Reçues (Locateur)
  {
    path: 'reservations/received',
    component: ReceivedReservationsComponent,
    title: 'Réservations Reçues | Booking App',
  },

  // Route 6: Profil Utilisateur
  {
    path: 'profile',
    component: ProfileComponent,
    title: 'Profil utilisateur',
  },

  // Redirection par défaut : rediriger l'URL vide vers le dashboard plutôt que le catalogue
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
