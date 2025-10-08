import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { AuthGuard } from './core/auth-guard'; // Assurez-vous que le chemin est correct

const routes: Routes = [
  // 1. Routes PUBLIQUES (Authentification)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },

  // 2. Routes PROTÉGÉES (Application principale)
  {
    path: '', // Ce chemin sert de point d'entrée pour la Layout et la Guard
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        // Le path vide ici signifie que les routes de MAIN_ROUTES seront chargées
        // directement sous le contexte de '/'.
        path: '',
        loadChildren: () => import('./main.routes').then((mod) => mod.MAIN_ROUTES),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
