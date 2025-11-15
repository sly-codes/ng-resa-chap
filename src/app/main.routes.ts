import { Routes } from '@angular/router';
import { ResourceDetailComponent } from './catalogue/resource-detail/resource-detail.component';
import { AdminGuard } from './core/admin.guard';
import { ProfileComponent } from './profile/profile.component';
import { MyReservationsComponent } from './reservations/my-reservations/my-reservations.component';
import { ReceivedReservationsComponent } from './reservations/received-reservations/received-reservations.component';
import { ReservationDetailComponent } from './reservations/reservation-detail/reservation-detail.component';

export const MAIN_ROUTES: Routes = [
  // Route 1: Le Tableau de Bord (Dashboard)
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Tableau de Bord | Resa Chap',
  },

  // 🚀 NOUVELLE ROUTE : DASHBOARD ADMIN (Sécurisée)
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./admin/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    canActivate: [AdminGuard], // 💡 Protection par le nouveau Guard
    title: 'Dashboard Admin | Resa Chap',
  },

  // Route 2: Catalogue
  {
    path: 'catalogue',
    loadComponent: () =>
      import('./catalogue/catalogue.component').then((m) => m.CatalogueComponent),
    title: 'Catalogue | Resa Chap',
  },
  {
    path: 'catalogue/:id', // 💡 NOUVELLE ROUTE POUR LE DÉTAIL
    component: ResourceDetailComponent, // Assurez-vous d'avoir un canActivate si l'utilisateur doit être connecté
  },

  // Route 3: Mes Ressources
  {
    path: 'resources/mine',
    loadComponent: () =>
      import('./resource/pages/resource-list/resource-list.component').then(
        (m) => m.ResourceListComponent
      ),
    title: 'Mes Ressources | Resa Chap',
  },

  // Route 3b: Détail d'une ressource en tant que propriétaire
  {
    path: 'resources/mine/:id',
    loadComponent: () =>
      import('./resource/pages/resource-owner-detail/resource-owner-detail.component').then(
        (m) => m.ResourceOwnerDetailComponent
      ),
    title: 'Détail de ma ressource | Resa Chap',
  },

  // Route 4: Mes Réservations faites (Locataire)
  {
    path: 'reservations/made',
    component: MyReservationsComponent,
    title: 'Mes Réservations | Resa Chap',
  },

  // Route 5: Réservations Reçues (Locateur)
  {
    path: 'reservations/received',
    component: ReceivedReservationsComponent,
    title: 'Réservations Reçues | Resa Chap',
  },

  // Route 6: Détails d'une réservation
  {
    path: 'reservations/:id',
    component: ReservationDetailComponent,
    title: 'Détails de la Réservation | Resa Chap',
  },

  // Route 7: Profil Utilisateur
  {
    path: 'profile',
    component: ProfileComponent,
    title: 'Profil utilisateur',
  },

  // 🚀 NOUVEAU : Redirection interne de la zone protégée vers le dashboard
  // Si l'utilisateur est connecté et va sur /<empty>, il va au dashboard.
  { path: '', redirectTo: 'catalogue', pathMatch: 'full' },
];
