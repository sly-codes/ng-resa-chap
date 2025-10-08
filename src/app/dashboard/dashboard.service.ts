import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardSummary } from './dashboard.types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  // Assurez-vous que l'URL de votre API est correctement configurée
  private readonly apiUrl = environment.apiUrl

  /**
   * Récupère le résumé complet des données pour le tableau de bord de l'utilisateur connecté.
   * Le token d'authentification sera ajouté automatiquement par un intercepteur (si vous en avez un).
   */
  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/dashboard/summary`);
  }
}
