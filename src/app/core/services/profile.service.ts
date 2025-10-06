import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UpdateProfileDto = Partial<
  Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'updatedAt'>
>;

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  // BehaviorSubject pour stocker l'état du profil de manière réactive
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  profile$ = this.profileSubject.asObservable(); // Observable pour la Navbar

  /**
   * Charge le profil depuis l'API (/users/me) et met à jour l'état.
   */
  loadProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      tap((profile) => {
        this.profileSubject.next(profile);
      })
    );
  }

  /**
   * Récupère la valeur actuelle du profil (pour les vérifications initiales).
   */
  getProfileSnapshot(): UserProfile | null {
    return this.profileSubject.getValue();
  }

  /**
   * Efface le profil (à utiliser lors de la déconnexion).
   */
  clearProfile(): void {
    this.profileSubject.next(null);
  }

  /**
   * Met à jour les informations du profil via PATCH et met à jour l'état partagé.
   */
  updateProfile(dto: UpdateProfileDto): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/me`, dto).pipe(
      tap((updatedProfile) => {
        // Mettre à jour l'état partagé après la sauvegarde réussie
        this.profileSubject.next(updatedProfile);
      })
    );
  }
}
