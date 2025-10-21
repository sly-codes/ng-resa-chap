import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from '../../common/toast/toast.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const userRole = this.authService.getRoleFromToken(); // 1. Vérification du Rôle

    if (userRole === 'SUPER_ADMIN') {
      return true; // Accès autorisé
    } else {
      // 2. Accès refusé : notification et redirection
      this.toastService.error(
        'Accès Restreint',
        "Vous n'avez pas les permissions d'administrateur pour accéder à cette zone."
      ); // Redirection vers une page par défaut pour les utilisateurs non-admin (ex: dashboard utilisateur)
      return this.router.createUrlTree(['/dashboard']);
    }
  }
}
