/**
 * Point d'entrée principal de l'application Angular ResaChap
 *
 * Ce fichier initialise l'application en mode standalone (Angular 14+)
 * sans utiliser NgModule traditionnel, pour une architecture plus moderne.
 *
 * Configuration incluse :
 * - Routing : Configuration des routes de l'application
 * - HTTP Client : Client HTTP avec intercepteur JWT pour l'authentification
 * - NgxMask : Bibliothèque pour le formatage des champs de saisie
 *
 * L'intercepteur JWT ajoute automatiquement le token d'authentification
 * à toutes les requêtes sortantes vers l'API backend.
 */

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideNgxMask } from 'ngx-mask';
import { routes } from './app/app-routing-module';
import { AppComponent } from './app/app.component';
import { jwtInterceptor } from './app/core/jwt-interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideNgxMask(),
  ],
}).catch((err) => console.error(err));
