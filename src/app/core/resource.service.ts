import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Owner {
  email: string;
  firstName: string;
  lastName: string;
  contactPhone: string;
}

export interface Resource {
  id: string;
  name: string;
  type: 'ROOM' | 'EQUIPMENT';
  description: string;
  ownerId: string;
  createdAt: Date;
  owner: Owner;
}

export interface ResourceFilters {
  search?: string;
  type?: 'ROOM' | 'EQUIPMENT';
}

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  private readonly apiUrl = environment.apiUrl + '/resources';
  private http = inject(HttpClient);

  /**
   * Ajoute les filtres search et type aux HttpParams
   */
  private buildFilterParams(filters?: ResourceFilters): HttpParams {
    let params = new HttpParams();

    if (filters) {
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.type) {
        params = params.set('type', filters.type);
      }
    }
    return params;
  }

  /**
   * Liste toutes les ressources disponibles (Catalogue public) avec filtres.
   */
  getAllResources(filters?: ResourceFilters): Observable<Resource[]> {
    const params = this.buildFilterParams(filters);
    return this.http.get<Resource[]>(this.apiUrl, { params });
  }

  /**
   * 🚨 CORRECTION : Récupère les ressources appartenant à l'utilisateur connecté (Gestion).
   * Appelle GET /resources/mine avec filtres.
   */
  getMyResources(filters?: ResourceFilters): Observable<Resource[]> {
    const params = this.buildFilterParams(filters);
    return this.http.get<Resource[]>(`${this.apiUrl}/mine`, { params });
  }

  /**
   * Récupère une ressource par son ID
   */
  getResourceById(id: string): Observable<Resource> {
    return this.http.get<Resource>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée une nouvelle ressource
   */
  createResource(
    resourceData: Omit<Resource, 'id' | 'ownerId' | 'createdAt' | 'owner'>
  ): Observable<Resource> {
    return this.http.post<Resource>(this.apiUrl, resourceData);
  }

  /**
   * Met à jour une ressource existante
   */
  updateResource(
    id: string,
    resourceData: Partial<Omit<Resource, 'id' | 'ownerId' | 'createdAt' | 'owner'>>
  ): Observable<Resource> {
    return this.http.patch<Resource>(`${this.apiUrl}/${id}`, resourceData);
  }

  /**
   * Supprime une ressource
   */
  deleteResource(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
