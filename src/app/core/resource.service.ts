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

// Type pour l'unité de prix
export type PriceUnit = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

export interface Resource {
  id: string;
  name: string;
  type: 'ROOM' | 'EQUIPMENT';
  description: string;
  ownerId: string;
  createdAt: Date;
  owner: Owner; // NOUVEAUX CHAMPS (confirmés par le backend)
  price: number;
  priceUnit: PriceUnit;
  country: string;
  city: string;
  address: string;
  mainImage: string; // URL de l'image Cloudinary
}

// Interface pour les filtres étendus
export interface ResourceFilters {
  search?: string;
  type?: 'ROOM' | 'EQUIPMENT';
  city?: string; // Filtre par ville (Nécessaire pour le Catalogue)
}

// DTO pour la soumission du formulaire (inclut le fichier)
export interface CreateResourceDTO {
  name: string;
  type: 'ROOM' | 'EQUIPMENT';
  description: string;
  price: number;
  priceUnit: PriceUnit;
  country: string;
  city: string;
  address: string;
  mainImage: File | null; // Le fichier image
}

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  private readonly apiUrl = environment.apiUrl + '/resources';
  private http = inject(HttpClient);
  /**
   * Ajoute les filtres search, type et city aux HttpParams
   */

  private buildFilterParams(filters?: ResourceFilters): HttpParams {
    let params = new HttpParams();

    if (filters) {
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.type) {
        params = params.set('type', filters.type);
      } // Ajout du filtre city
      if (filters.city) {
        params = params.set('city', filters.city);
      }
    }
    return params;
  }
  /**
   * Construit l'objet FormData requis par le backend.
   */

  private buildFormData(data: Partial<CreateResourceDTO>): FormData {
    const formData = new FormData(); // Ajouter les champs de texte

    if (data.name) formData.append('name', data.name);
    if (data.type) formData.append('type', data.type);
    if (data.description) formData.append('description', data.description); // Convertir les nombres en chaîne
    if (data.price !== undefined && data.price !== null)
      formData.append('price', data.price.toString());
    if (data.priceUnit) formData.append('priceUnit', data.priceUnit);
    if (data.country) formData.append('country', data.country);
    if (data.city) formData.append('city', data.city);
    if (data.address) formData.append('address', data.address); // Ajouter l'image si elle est présente (pour la création et l'édition)

    if (data.mainImage) {
      formData.append('mainImage', data.mainImage, data.mainImage.name);
    }

    return formData;
  }
  /**
   * Liste toutes les ressources disponibles (Catalogue public) avec filtres.
   */

  getAllResources(filters?: ResourceFilters): Observable<Resource[]> {
    const params = this.buildFilterParams(filters); // Le backend renvoie l'owner avec les champs requis
    return this.http.get<Resource[]>(this.apiUrl, { params });
  }
  /**
   * Récupère les ressources appartenant à l'utilisateur connecté (Gestion).
   * Appelle GET /resources/mine avec filtres.
   */

  getMyResources(filters?: ResourceFilters): Observable<Resource[]> {
    const params = this.buildFilterParams(filters);
    return this.http.get<Resource[]>(`${this.apiUrl}/mine`, { params });
  }
  /**
   * Récupère une ressource par son ID (Détail)
   */

  getResourceById(id: string): Observable<Resource> {
    return this.http.get<Resource>(`${this.apiUrl}/${id}`);
  }
  /**
   * Crée une nouvelle ressource en utilisant FormData (multipart/form-data)
   */

  createResource(resourceData: CreateResourceDTO): Observable<Resource> {
    const formData = this.buildFormData(resourceData);
    return this.http.post<Resource>(this.apiUrl, formData);
  }
  /**
   * Met à jour une ressource existante en utilisant FormData
   */

  updateResource(id: string, resourceData: Partial<CreateResourceDTO>): Observable<Resource> {
    const formData = this.buildFormData(resourceData);
    return this.http.patch<Resource>(`${this.apiUrl}/${id}`, formData);
  }
  /**
   * Supprime une ressource
   */

  deleteResource(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
