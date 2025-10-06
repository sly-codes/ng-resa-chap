import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces de données de base (ajustées pour correspondre à votre backend)
export interface CreateReservationDto {
  resourceId: string;
  dateDebut: string; // Format ISO-8601 (ex: 2025-10-05T09:00)
  dateFin: string; // Format ISO-8601
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
    // Le propriétaire (owner) peut être absent sur certaines routes (non inclus par défaut)
    owner?: { email: string };
  };
  // Le locataire (locataire) peut être absent sur certaines routes
  locataire?: {
    id: string;
    email: string;
    username: string;
    contactPhone: string;
  };
  [key: string]: any; // Permet les champs non définis (comme isCancelling)
}

// ----------------------------------------------------
// NOUVELLES INTERFACES DE VUE (pour résoudre TS4111 et TS2532)
// ----------------------------------------------------

// Vue: Mes Réservations (faites par moi)
export interface MyReservationView extends Reservation {
  // La route 'made' inclut l'owner
  resource: {
    name: string;
    type: 'ROOM' | 'EQUIPMENT';
    owner: { email: string }; // Rendu non-optionnel pour cette vue
  };
  isCancelling: boolean; // Ajout du champ pour l'état du bouton
}

// Vue: Réservations Reçues (pour mes ressources)
export interface ReceivedReservationView extends Reservation {
  // La route 'received' inclut le locataire
  locataire: {
    id: string;
    email: string;
    username: string;
    contactPhone: string;
  };
  isProcessing: boolean; // Ajout du champ pour l'état des boutons Accepter/Refuser
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

  // Retourne l'interface de vue spécifique
  getReservationsMade(): Observable<MyReservationView[]> {
    // Le backend renvoie Reservation[], nous faisons le cast dans le composant
    return this.http.get<MyReservationView[]>(`${this.apiUrl}/made`);
  }

  // Retourne l'interface de vue spécifique
  getReceivedReservations(): Observable<ReceivedReservationView[]> {
    // Le backend renvoie Reservation[], nous faisons le cast dans le composant
    return this.http.get<ReceivedReservationView[]>(`${this.apiUrl}/received`);
  }

  cancelReservation(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateReservationStatus(id: string, status: 'CONFIRMED' | 'REJECTED'): Observable<Reservation> {
    const dto = { status };
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/status`, dto);
  }
}
