/**
 * Service de gestion des ressources cote frontend
 *
 * Ce service communique avec l'API backend pour gerer les ressources :
 * - Creation de ressources avec upload d'images
 * - Recuperation de la liste des ressources (publique et privee)
 * - Modification des ressources existantes
 * - Suppression de ressources
 * - Filtrage avance (type, localisation, recherche textuelle)
 * - Pagination pour optimiser les performances
 *
 * Les images sont gerees via Cloudinary cote backend
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Informations du proprietaire d'une ressource
 */
export interface Owner {
  email: string;
  firstName: string;
  lastName: string;
  contactPhone: string;
}

/**
 * Unite de tarification pour une ressource
 * Determine si le prix est a l'heure, au jour, a la semaine ou au mois
 */
export type PriceUnit = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

/**
 * Representation complete d'une ressource
 * Inclut toutes les informations necessaires pour l'affichage
 */
export interface Resource {
  id: string;
  name: string;
  type: 'ROOM' | 'EQUIPMENT';
  description: string;
  ownerId: string;
  createdAt: Date;
  owner: Owner;
  price: number;
  priceUnit: PriceUnit;
  country: string;
  city: string;
  address: string;
  mainImage: string;
}

/**
 * Options de filtrage pour la recherche de ressources
 * Permet de combiner plusieurs criteres de recherche
 */
export interface ResourceFilters {
  search?: string;
  type?: 'ROOM' | 'EQUIPMENT';
  city?: string;
  page?: number;
  limit?: number;
}

/**
 * Reponse paginee de l'API pour les ressources
 * Contient les donnees et les metadonnees de pagination
 */
export interface PaginatedResources {
  data: Resource[];
  total: number;
  page: number;
  lastPage: number;
}

/**
 * DTO pour la creation d'une nouvelle ressource
 * Utilise pour l'envoi de donnees depuis le formulaire
 */
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
   * Ajoute les filtres search, type, city, page et limit aux HttpParams
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
      if (filters.city) {
        params = params.set('city', filters.city);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit) {
        params = params.set('limit', filters.limit.toString());
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
   * Liste toutes les ressources disponibles (Catalogue public) avec filtres et pagination.
   */

  getAllResources(filters?: ResourceFilters): Observable<PaginatedResources> {
    const params = this.buildFilterParams(filters);
    return this.http.get<PaginatedResources>(this.apiUrl, { params });
  }
  /**
   * Récupère les ressources appartenant à l'utilisateur connecté (Gestion) avec pagination.
   * Appelle GET /resources/mine avec filtres.
   */

  getMyResources(filters?: ResourceFilters): Observable<PaginatedResources> {
    const params = this.buildFilterParams(filters);
    return this.http.get<PaginatedResources>(`${this.apiUrl}/mine`, { params });
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
