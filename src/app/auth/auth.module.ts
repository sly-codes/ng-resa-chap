import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Les composants Login et Signup sont désormais gérés par le routing directement

// Routes du module Auth
const routes: Routes = [
  // ⚠️ Les composants autonomes ne sont plus importés ici, mais dans le routing
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.component').then((m) => m.SignupComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  // ❌ Supprimer la section declarations et imports inutiles
  // Nous laissons uniquement l'export du RouterModule
  imports: [
    CommonModule,
    RouterModule.forChild(routes), // Le routing gère le lazy loading des composants
  ],
})
export class AuthModule {}
