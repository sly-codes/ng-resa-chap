/**
 * Service d'authentification frontend de l'application ResaChap
 *
 * Ce service gère toute la logique d'authentification côté client :
 * - Connexion et inscription locale (email/mot de passe)
 * - Authentification sociale (Google, GitHub) via OAuth 2.0
 * - Gestion des tokens JWT (Access Token et Refresh Token)
 * - Stockage sécurisé des tokens dans localStorage
 * - Rafraîchissement automatique des tokens expirés
 * - Déconnexion et nettoyage de session
 * - Décodage des tokens pour extraire les informations utilisateur
 *
 * Utilise RxJS BehaviorSubject pour notifier les composants
 * des changements d'état d'authentification en temps réel.
 */

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

  /**
   * BehaviorSubject pour suivre l'état d'authentification
   * Utilisé par les guards pour protéger les routes
   * et par les composants pour afficher/masquer des éléments UI
   */
  public isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  /**
   * BehaviorSubject pour indiquer si une vérification d'auth est en cours
   * Permet d'afficher des spinners pendant les opérations d'authentification
   */
  public isCheckingAuthSubject = new BehaviorSubject<boolean>(false);
  isCheckingAuth$ = this.isCheckingAuthSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Vérifie la présence d'un Access Token dans le localStorage
   * Note : Ne valide pas le token, vérifie uniquement son existence
   * @returns true si un token existe, false sinon
   */
  private hasValidToken(): boolean {
    const at = localStorage.getItem('access_token');
    return !!at;
  }

  /**
   * Stocke les tokens JWT dans le localStorage
   * et met à jour l'état d'authentification
   *
   * @param tokens Objet contenant access_token et refresh_token
   */
  private saveTokens(tokens: Tokens): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    this.isAuthenticatedSubject.next(true);
  }

  // -----------------------------------------------------------------
  // Méthodes d'Authentification Classique
  // -----------------------------------------------------------------

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
    this.router.navigate(['/']); // Rediriger vers la Landing Page
  }

  // -----------------------------------------------------------------
  // Méthodes d'Authentification Sociale
  // -----------------------------------------------------------------

  loginWithGoogle(): void {
    // 💡 Pas de toast ici, car c'est une redirection immédiate
    const googleAuthUrl = `${this.apiUrl}/google`;
    window.location.href = `${googleAuthUrl}?prompt=select_account`;
  }

  loginWithGithub(): void {
    // 💡 Pas de toast ici, car c'est une redirection immédiate
    const githubAuthUrl = `${this.apiUrl}/github`;
    window.location.href = githubAuthUrl;
  }

  // 🚨 CORRECTION : Affiche le toast de succès LORSQUE le token est géré
  handleSocialLogin(tokens: Tokens): void {
    this.saveTokens(tokens);
    this.toastService.success('Connexion Sociale Réussie', 'Bienvenue sur Resa Chap !'); // 💡 TOAST SUCCÈS
    this.router.navigate(['/catalogue']);
  }

  // -----------------------------------------------------------------
  // Token Management
  // -----------------------------------------------------------------

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Simple décodage pour obtenir l'ID (utile pour certaines requêtes)
  getUserIdFromToken(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      // Le payload est la 2e partie du JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (e) {
      return null;
    }
  }

  /**
   * Décode l'Access Token pour obtenir le RÔLE de l'utilisateur.
   * @returns Le rôle de l'utilisateur ou null.
   */
  getRoleFromToken(): UserRole | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      // Le payload est la 2e partie du JWT
      const payload = JSON.parse(atob(token.split('.')[1])); // 💡 Le champ 'role' est injecté dans le backend !
      return payload.role as UserRole;
    } catch (e) {
      console.error('Erreur lors du décodage du rôle du token:', e);
      return null;
    }
  }

  /**
   * Demande un nouveau couple AT/RT en utilisant le Refresh Token expiré.
   * Sera appelé par l'intercepteur.
   */
  refreshTokens(): Observable<Tokens> {
    const rt = this.getRefreshToken();
    if (!rt) return new Observable((observer) => observer.error('Refresh token missing'));

    // 🚀 NOUVEAU : Activer le flag de rafraîchissement pour l'UX
    this.isCheckingAuthSubject.next(true);

    return this.http.post<Tokens>(`${this.apiUrl}/refresh`, {}).pipe(
      tap((tokens) => this.saveTokens(tokens)),
      // 🚀 NOUVEAU : Désactiver le flag, qu'il y ait succès ou erreur
      tap({
        next: () => this.isCheckingAuthSubject.next(false),
        error: () => this.isCheckingAuthSubject.next(false),
      })
    );
  }
}
