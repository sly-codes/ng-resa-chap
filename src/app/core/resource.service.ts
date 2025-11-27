import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Owner {
  email: string;
  firstName: string;
  lastName: string;
  contactPhone: string;
}

export type PriceUnit = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

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

export interface ResourceFilters {
  search?: string;
  type?: 'ROOM' | 'EQUIPMENT';
  city?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResources {
  data: Resource[];
  total: number;
  page: number;
  lastPage: number;
}

export interface CreateResourceDTO {
  name: string;
  type: 'ROOM' | 'EQUIPMENT';
  description: string;
  price: number;
  priceUnit: PriceUnit;
  country: string;
  city: string;
  address: string;
  mainImage: File | null;
}

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  private readonly apiUrl = environment.apiUrl + '/resources';
  private http = inject(HttpClient);

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

  private buildFormData(data: Partial<CreateResourceDTO>): FormData {
    const formData = new FormData();

    if (data.name) formData.append('name', data.name);
    if (data.type) formData.append('type', data.type);
    if (data.description) formData.append('description', data.description);
    if (data.price !== undefined && data.price !== null)
      formData.append('price', data.price.toString());
    if (data.priceUnit) formData.append('priceUnit', data.priceUnit);
    if (data.country) formData.append('country', data.country);
    if (data.city) formData.append('city', data.city);
    if (data.address) formData.append('address', data.address);

    if (data.mainImage) {
      formData.append('mainImage', data.mainImage, data.mainImage.name);
    }

    return formData;
  }

  getAllResources(filters?: ResourceFilters): Observable<PaginatedResources> {
    const params = this.buildFilterParams(filters);
    return this.http.get<PaginatedResources>(this.apiUrl, { params });
  }

  getMyResources(filters?: ResourceFilters): Observable<PaginatedResources> {
    const params = this.buildFilterParams(filters);
    return this.http.get<PaginatedResources>(`${this.apiUrl}/mine`, { params });
  }

  getResourceById(id: string): Observable<Resource> {
    return this.http.get<Resource>(`${this.apiUrl}/${id}`);
  }

  createResource(resourceData: CreateResourceDTO): Observable<Resource> {
    const formData = this.buildFormData(resourceData);
    return this.http.post<Resource>(this.apiUrl, formData);
  }

  updateResource(id: string, resourceData: Partial<CreateResourceDTO>): Observable<Resource> {
    const formData = this.buildFormData(resourceData);
    return this.http.patch<Resource>(`${this.apiUrl}/${id}`, formData);
  }

  deleteResource(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
