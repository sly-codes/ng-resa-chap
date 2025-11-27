import { Routes } from '@angular/router';
import { ResourceDetailComponent } from './catalogue/resource-detail/resource-detail.component';
import { AdminGuard } from './core/admin.guard';
import { ProfileComponent } from './profile/profile.component';
import { MyReservationsComponent } from './reservations/my-reservations/my-reservations.component';
import { ReceivedReservationsComponent } from './reservations/received-reservations/received-reservations.component';
import { ReservationDetailComponent } from './reservations/reservation-detail/reservation-detail.component';

export const MAIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Tableau de Bord | Resa Chap',
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./admin/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    canActivate: [AdminGuard],
    title: 'Dashboard Admin | Resa Chap',
  },
  {
    path: 'catalogue',
    loadComponent: () =>
      import('./catalogue/catalogue.component').then((m) => m.CatalogueComponent),
    title: 'Catalogue | Resa Chap',
  },
  {
    path: 'catalogue/:id',
    component: ResourceDetailComponent,
  },
  {
    path: 'resources/mine',
    loadComponent: () =>
      import('./resource/pages/resource-list/resource-list.component').then(
        (m) => m.ResourceListComponent
      ),
    title: 'Mes Ressources | Resa Chap',
  },
  {
    path: 'resources/mine/:id',
    loadComponent: () =>
      import('./resource/pages/resource-owner-detail/resource-owner-detail.component').then(
        (m) => m.ResourceOwnerDetailComponent
      ),
    title: 'Detail de ma ressource | Resa Chap',
  },
  {
    path: 'reservations/made',
    component: MyReservationsComponent,
    title: 'Mes Reservations | Resa Chap',
  },
  {
    path: 'reservations/received',
    component: ReceivedReservationsComponent,
    title: 'Reservations Recues | Resa Chap',
  },
  {
    path: 'reservations/:id',
    component: ReservationDetailComponent,
    title: 'Details de la Reservation | Resa Chap',
  },
  {
    path: 'profile',
    component: ProfileComponent,
    title: 'Profil utilisateur',
  },
  { path: '', redirectTo: 'catalogue', pathMatch: 'full' },
];
