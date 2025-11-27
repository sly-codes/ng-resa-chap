import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ToastService } from '../../common/toast/toast.service';
import { environment } from '../../environments/environment';

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export type UserRole = 'SUPER_ADMIN' | 'LOCATEUR' | 'LOCATAIRE';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl + '/auth';
  private toastService = inject(ToastService);

  public isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  public isCheckingAuthSubject = new BehaviorSubject<boolean>(false);
  isCheckingAuth$ = this.isCheckingAuthSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private hasValidToken(): boolean {
    const at = localStorage.getItem('access_token');
    return !!at;
  }

  private saveTokens(tokens: Tokens): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    this.isAuthenticatedSubject.next(true);
  }

  signup(credentials: AuthCredentials): Observable<Tokens> {
    return this.http
      .post<Tokens>(`${this.apiUrl}/local/signup`, credentials)
      .pipe(tap((tokens) => this.saveTokens(tokens)));
  }

  signin(credentials: AuthCredentials): Observable<Tokens> {
    return this.http
      .post<Tokens>(`${this.apiUrl}/local/signin`, credentials)
      .pipe(tap((tokens) => this.saveTokens(tokens)));
  }

  logout(): void {
    const userId = this.getUserIdFromToken();
    if (userId) {
      // Optionnel: informer le backend pour invalider le RT
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        next: () => console.log('Backend logout successful'),
        error: (err) => console.error('Error during backend logout (RT already invalid?)', err),
      });
    }

    localStorage.clear();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);
  }

  loginWithGoogle(): void {
    const googleAuthUrl = `${this.apiUrl}/google`;
    window.location.href = `${googleAuthUrl}?prompt=select_account`;
  }

  loginWithGithub(): void {
    const githubAuthUrl = `${this.apiUrl}/github`;
    window.location.href = githubAuthUrl;
  }

  handleSocialLogin(tokens: Tokens): void {
    this.saveTokens(tokens);
    this.toastService.success('Connexion Sociale Reussie', 'Bienvenue sur Resa Chap !');
    this.router.navigate(['/catalogue']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getUserIdFromToken(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (e) {
      return null;
    }
  }

  getRoleFromToken(): UserRole | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role as UserRole;
    } catch (e) {
      console.error('Erreur decodage role token:', e);
      return null;
    }
  }

  refreshTokens(): Observable<Tokens> {
    const rt = this.getRefreshToken();
    if (!rt) return new Observable((observer) => observer.error('Refresh token missing'));

    this.isCheckingAuthSubject.next(true);

    return this.http.post<Tokens>(`${this.apiUrl}/refresh`, {}).pipe(
      tap((tokens) => this.saveTokens(tokens)),
      tap({
        next: () => this.isCheckingAuthSubject.next(false),
        error: () => this.isCheckingAuthSubject.next(false),
      })
    );
  }
}
