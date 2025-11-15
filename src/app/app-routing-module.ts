import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth-guard'; // Garde pour routes protégées
import { PublicGuard } from './guards/public-guard'; // 🚀 NOUVEAU : Garde pour routes publiques
import { LayoutComponent } from './shared/layout/layout.component';

const routes: Routes = [
  // 1. Route PUBLIQUE par défaut (LANDING PAGE)
  {
    path: '', // URL racine (resachap.sly.codes/)
    loadComponent: () =>
      import('./landing-page/landing-page.component').then((m) => m.LandingPageComponent),
    canActivate: [PublicGuard], // Bloque l'accès si déjà connecté
    title: 'Accueil | Resa Chap',
  },

  // 2. Routes D'AUTHENTIFICATION (Login, Signup, Callback)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },

  // 3. Routes PROTÉGÉES (Application principale - Dashboard, Catalogue, etc.)
  // Ces routes sont activées si l'utilisateur est connecté.
  {
    path: '', // Utilise le path vide pour encapsuler les MAIN_ROUTES
    component: LayoutComponent,
    canActivate: [AuthGuard], // Protection principale
    children: [
      {
        path: '',
        loadChildren: () => import('./main.routes').then((mod) => mod.MAIN_ROUTES),
      },
    ],
  },

  {
    path: 'preview',
    loadChildren: () => import('./preview/preview.module').then((m) => m.PreviewModule),
  },

  // 4. WILD CARD (Redirection si route inconnue)
  // Redirige les erreurs 404 vers la Landing Page
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
