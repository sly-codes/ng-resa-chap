import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Routes du module Auth
const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.component').then((m) => m.SignupComponent),
  },
  // 🚀 NOUVEAU : Route pour le retour du flux Google
  {
    path: 'callback', // Le chemin de votre backend doit rediriger vers /auth/callback
    loadComponent: () =>
      import('./auth-callback/auth-callback.component').then((m) => m.AuthCallbackComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class AuthModule {}
