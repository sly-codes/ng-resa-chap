import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService, Tokens } from './auth.service';
import { Router } from '@angular/router';

let isRefreshing = false; // Flag pour éviter les boucles infinies de rafraîchissement

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router); // Injecter le Router pour la redirection

  const accessToken = authService.getAccessToken();

  // 1. Ajouter le Token à la Requête (sauf pour signin/signup/refresh, qui sont gérés autrement)
  const isAuthRequest =
    req.url.includes('/auth/local/signin') || req.url.includes('/auth/local/signup');
  const isRefreshRequest = req.url.includes('/auth/refresh');

  let authReq = req;

  if (accessToken && !isAuthRequest && !isRefreshRequest) {
    authReq = addToken(req, accessToken, 'Bearer');
  } else if (authService.getRefreshToken() && isRefreshRequest) {
    // Si c'est la requête de refresh, on utilise le Refresh Token
    authReq = addToken(req, authService.getRefreshToken()!, 'Bearer');
  }

  // 2. Gérer la réponse (surtout 401)
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 non lié au refresh token (token manquant ou invalide)
      if (error.status === 401) {
        // Si la 401 vient de la requête de refresh elle-même, ça veut dire que le RT est invalide -> DECONNEXION
        if (isRefreshRequest) {
          authService.logout();
          return throwError(() => error);
        }

        // Si 401 sur une autre requête, on tente le rafraîchissement
        return handle401Error(authReq, next, authService);
      }

      return throwError(() => error);
    })
  );
};

// Fonction utilitaire pour ajouter le token au header
function addToken(request: HttpRequest<unknown>, token: string, type: string) {
  return request.clone({
    setHeaders: {
      Authorization: `${type} ${token}`,
    },
  });
}

// Logique de rafraîchissement du token
function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
) {
  if (!isRefreshing) {
    isRefreshing = true;

    // Tente de rafraîchir les tokens
    return authService.refreshTokens().pipe(
      switchMap((tokens: Tokens) => {
        isRefreshing = false;
        // Une fois rafraîchi, rejouer la requête initiale avec le nouvel AT
        const newReq = addToken(request, tokens.access_token, 'Bearer');
        return next(newReq);
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        // Échec du rafraîchissement (ex: 403 Forbidden car le RT est aussi expiré)
        authService.logout();
        return throwError(() => refreshError);
      })
    );
  } else {
    // Si un rafraîchissement est déjà en cours, attendre le nouveau token et rejouer
    // Pour simplifier, nous allons juste faire échouer la requête en parallèle.
    // Pour une production robuste, on utiliserait un BehaviorSubject pour mettre en file d'attente les requêtes.
    // Ici, nous faisons le choix simple d'échouer pour ne pas complexifier excessivement le code.
    return throwError(
      () => new HttpErrorResponse({ status: 401, error: 'Token refresh in progress' })
    );
  }
}
