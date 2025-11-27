import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardMetrics {
  users: {
    total: number;
    verified: number;
    local: number;
    recent: { id: string; email: string; createdAt: Date; provider: string }[];
  };
  resources: {
    total: number;
    recentLastWeek: number;
    typesCount: { type: string; count: number }[];
  };
  reservations: {
    total: number;
    pending: number;
    confirmed: number;
    recent: {
      id: string;
      status: string;
      createdAt: Date;
      locataireEmail: string;
      resourceName: string;
      resourcePrice: number;
      resourcePriceUnit: string;
    }[];
  };
  finance: {
    potentialRevenueFromConfirmedReservations: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = environment.apiUrl + '/admin/dashboard';
  private http = inject(HttpClient);

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/metrics`);
  }
}
