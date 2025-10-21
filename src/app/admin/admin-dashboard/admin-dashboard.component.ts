import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, catchError, of, map, startWith } from 'rxjs';
import { AdminService, DashboardMetrics } from '../admin.service';
import { RouterLink } from '@angular/router';

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
  styleUrls: ['./admin-dashboard.component.scss'], // Assurez-vous que ce fichier existe
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  // Gère l'état de l'interface (chargement, données, erreur) avec RxJS
  dashboardState$: Observable<DashboardState> | undefined;

  ngOnInit(): void {
    this.dashboardState$ = this.adminService.getDashboardMetrics().pipe(
      map((metrics) => ({ metrics, loading: false, error: false })),
      catchError((err) => {
        console.error('Erreur de chargement des métriques admin:', err);
        // Retourne un état d'erreur
        return of({ metrics: null, loading: false, error: true });
      }),
      startWith({ metrics: null, loading: true, error: false }) // État initial de chargement
    );
  }

  // Utilitaire pour afficher les nombres comme de l'argent (Euro par défaut)
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  }
}
