import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { AuthGuard } from './core/auth-guard';

const routes: Routes = [
  // 1. Routes PUBLIQUES (Authentification)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },

  // 2. Routes PROTÉGÉES (Application principale)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // 🚨 NOUVEL AJOUT : Chargement du fichier de routes principales
      {
        path: '',
        loadChildren: () => import('./main.routes').then((mod) => mod.MAIN_ROUTES),
      }
    ],
  },

  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
