import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// 🚨 Interface simple pour la ressource (vous pouvez l'étendre au besoin)
export interface Resource {
  id: string;
  name: string;
  type: 'ROOM' | 'EQUIPMENT';
  description: string;
  ownerId: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  private readonly apiUrl = environment.apiUrl + '/resources';
  private http = inject(HttpClient);

  /**
   * Récupère la liste de TOUTES les ressources (pour le catalogue)
   * Corresponds à GET /resources
   */
  getAllResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(this.apiUrl);
  }

  /**
   * Récupère les ressources appartenant à l'utilisateur connecté (pour la gestion)
   * Corresponds à GET /resources/mine
   */
  getMyResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.apiUrl}/mine`);
  }

  // Les méthodes CRUD (create, update, delete) seront ajoutées plus tard
  /**
   * Récupère une ressource par son ID
   * Corresponds à GET /resources/:id
   */
  getResourceById(id: string): Observable<Resource> {
    return this.http.get<Resource>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée une nouvelle ressource
   * Corresponds à POST /resources
   */
  createResource(
    resourceData: Omit<Resource, 'id' | 'ownerId' | 'createdAt'>
  ): Observable<Resource> {
    return this.http.post<Resource>(this.apiUrl, resourceData);
  }

  /**
   * Met à jour une ressource existante
   * Corresponds à PATCH /resources/:id
   */
  updateResource(
    id: string,
    resourceData: Partial<Omit<Resource, 'id' | 'ownerId' | 'createdAt'>>
  ): Observable<Resource> {
    return this.http.patch<Resource>(`${this.apiUrl}/${id}`, resourceData);
  }

  /**
   * Supprime une ressource
   * Corresponds à DELETE /resources/:id
   */
  deleteResource(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
