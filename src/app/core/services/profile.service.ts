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

  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  profile$ = this.profileSubject.asObservable();

  loadProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      tap((profile) => {
        this.profileSubject.next(profile);
      })
    );
  }

  getProfileSnapshot(): UserProfile | null {
    return this.profileSubject.getValue();
  }

  clearProfile(): void {
    this.profileSubject.next(null);
  }

  updateProfile(dto: UpdateProfileDto): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/me`, dto).pipe(
      tap((updatedProfile) => {
        this.profileSubject.next(updatedProfile);
      })
    );
  }
}
