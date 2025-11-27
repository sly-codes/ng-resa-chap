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

let isRefreshing = false;

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const accessToken = authService.getAccessToken();

  const isAuthRequest =
    req.url.includes('/auth/local/signin') || req.url.includes('/auth/local/signup');
  const isRefreshRequest = req.url.includes('/auth/refresh');

  let authReq = req;

  if (accessToken && !isAuthRequest && !isRefreshRequest) {
    authReq = addToken(req, accessToken, 'Bearer');
  } else if (authService.getRefreshToken() && isRefreshRequest) {
    authReq = addToken(req, authService.getRefreshToken()!, 'Bearer');
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (isRefreshRequest) {
          authService.logout();
          return throwError(() => error);
        }
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function addToken(request: HttpRequest<unknown>, token: string, type: string) {
  return request.clone({
    setHeaders: {
      Authorization: `${type} ${token}`,
    },
  });
}

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
) {
  if (!isRefreshing) {
    isRefreshing = true;

    return authService.refreshTokens().pipe(
      switchMap((tokens: Tokens) => {
        isRefreshing = false;
        const newReq = addToken(request, tokens.access_token, 'Bearer');
        return next(newReq);
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => refreshError);
      })
    );
  } else {
    return throwError(
      () => new HttpErrorResponse({ status: 401, error: 'Token refresh in progress' })
    );
  }
}
