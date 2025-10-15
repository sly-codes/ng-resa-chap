import { HttpClient, HttpParams } from '@angular/common/http'; // ✨ Importer HttpParams
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ----------------------------------------------------
// Interfaces de données de base (inchangées)
// ----------------------------------------------------

export interface CreateReservationDto {
  resourceId: string;
  dateDebut: string;
  dateFin: string;
  notes?: string;
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELED';

// Interface de base pour une Réservation
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

// ----------------------------------------------------
// NOUVELLES INTERFACES DE VUE & PAGINATION
// ----------------------------------------------------

// Vue: Mes Réservations (faites par moi)
export interface MyReservationView extends Reservation {
  resource: {
    name: string;
    type: 'ROOM' | 'EQUIPMENT';
    owner: { email: string };
  };
  isCancelling?: boolean; // Ajout du ? car ce n'est pas dans le DTO initial
}

// Vue: Réservations Reçues (pour mes ressources)
export interface ReceivedReservationView extends Reservation {
  locataire: {
    id: string;
    email: string;
    username: string;
    contactPhone: string;
  };
  // Remplacer isProcessing par ces deux champs
  isApproving?: boolean; // NOUVEAU: Pour le bouton Accepter
  isRejecting?: boolean; // NOUVEAU: Pour le bouton Refuser
}

// ✨ Interface pour les paramètres de requête de pagination/filtre (doit correspondre au DTO NestJS)
export interface ReservationQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReservationStatus;
}

// ✨ Interface pour le format de réponse paginée du backend
export interface PaginatedReservations<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
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

  /**
   * Récupère la liste des réservations faites par l'utilisateur avec pagination et filtres.
   */
  getReservationsMade(
    query: ReservationQuery = {} // ✨ Accepter les paramètres de requête
  ): Observable<PaginatedReservations<MyReservationView>> {
    let params = new HttpParams();

    // Ajouter les paramètres de requête à HttpParams
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);

    // Retourner le format paginé
    return this.http.get<PaginatedReservations<MyReservationView>>(`${this.apiUrl}/made`, {
      params,
    });
  }

  /**
   * Récupère la liste des réservations reçues par l'utilisateur avec pagination et filtres.
   */
  getReceivedReservations(
    query: ReservationQuery = {} // ✨ Accepter les paramètres de requête
  ): Observable<PaginatedReservations<ReceivedReservationView>> {
    let params = new HttpParams();

    // Ajouter les paramètres de requête à HttpParams
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);

    // Retourner le format paginé
    return this.http.get<PaginatedReservations<ReceivedReservationView>>(
      `${this.apiUrl}/received`,
      { params }
    );
  }

  cancelReservation(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateReservationStatus(id: string, status: 'CONFIRMED' | 'REJECTED'): Observable<Reservation> {
    const dto = { status };
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/status`, dto);
  }

  
}
