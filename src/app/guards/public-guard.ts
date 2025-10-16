import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PublicGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Vérifie si l'utilisateur a un token valide (via la logique du service)
    if (this.authService.isAuthenticatedSubject.value) {
      // Si OUI, rediriger vers le dashboard
      return this.router.createUrlTree(['/dashboard']);
    } else {
      // Si NON, autoriser l'accès à la route publique (Landing Page ou Login)
      return true;
    }
  }
}
