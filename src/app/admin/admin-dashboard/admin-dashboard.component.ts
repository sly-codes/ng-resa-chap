import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, catchError, of, map, startWith } from 'rxjs';
import { AdminService, DashboardMetrics } from '../admin.service';

interface DashboardState {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  dashboardState$: Observable<DashboardState> | undefined;

  ngOnInit(): void {
    this.dashboardState$ = this.adminService.getDashboardMetrics().pipe(
      map((metrics) => ({ metrics, loading: false, error: false })),
      catchError((err) => {
        console.error('Erreur de chargement des métriques admin:', err);
        return of({ metrics: null, loading: false, error: true });
      }),
      startWith({ metrics: null, loading: true, error: false })
    );
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      CANCELLED: 'Annulée',
      COMPLETED: 'Terminée',
    };
    return labels[status] || status;
  }

  getResourceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      ROOM: 'Salles',
      EQUIPMENT: 'Équipements',
    };
    return labels[type] || type;
  }
}
