import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateReservationDto {
  resourceId: string;
  dateDebut: string;
  dateFin: string;
  notes?: string;
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELED';

export interface Reservation {
  id: string;
  resourceId: string;
  locataireId: string;
  dateDebut: string;
  dateFin: string;
  notes?: string;
  status: ReservationStatus;
  resource: {
    name: string;
    type: 'ROOM' | 'EQUIPMENT';
    owner?: { email: string };
  };
  locataire?: {
    id: string;
    email: string;
    username: string;
    contactPhone: string;
  };
  [key: string]: any;
}

export interface MyReservationView extends Reservation {
  resource: {
    name: string;
    type: 'ROOM' | 'EQUIPMENT';
    owner: { email: string };
  };
  isCancelling?: boolean;
}

export interface ReceivedReservationView extends Reservation {
  locataire: {
    id: string;
    email: string;
    username: string;
    contactPhone: string;
  };
  isApproving?: boolean;
  isRejecting?: boolean;
}

export interface ReservationQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReservationStatus;
}

export interface PaginatedReservations<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

export interface ReservationDetails {
  id: string;
  resourceId: string;
  locataireId: string;
  dateDebut: string;
  dateFin: string;
  notes?: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  resource: {
    id: string;
    name: string;
    type: 'ROOM' | 'EQUIPMENT';
    description?: string;
    price: number;
    priceUnit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
    country?: string;
    city?: string;
    address?: string;
    mainImage?: string;
    createdAt: string;
    updatedAt: string;
    owner: {
      id: string;
      email: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      contactPhone?: string;
      profilePictureUrl?: string;
    };
  };
  locataire: {
    id: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    contactPhone?: string;
    profilePictureUrl?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  createReservation(dto: CreateReservationDto): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, dto);
  }

  getReservationsMade(query: ReservationQuery = {}): Observable<PaginatedReservations<MyReservationView>> {
    let params = new HttpParams();

    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);

    return this.http.get<PaginatedReservations<MyReservationView>>(`${this.apiUrl}/made`, { params });
  }

  getReceivedReservations(query: ReservationQuery = {}): Observable<PaginatedReservations<ReceivedReservationView>> {
    let params = new HttpParams();

    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);

    return this.http.get<PaginatedReservations<ReceivedReservationView>>(`${this.apiUrl}/received`, { params });
  }

  cancelReservation(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateReservationStatus(id: string, status: 'CONFIRMED' | 'REJECTED'): Observable<Reservation> {
    const dto = { status };
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/status`, dto);
  }

  getReservationDetails(id: string): Observable<ReservationDetails> {
    return this.http.get<ReservationDetails>(`${this.apiUrl}/${id}`);
  }
}
