import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // ⬅️ IMPORT CRITIQUE
import { AuthService } from '../../core/auth.service';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true, // ✅
  imports: [
    CommonModule,
    RouterModule, // ⬅️ AJOUTÉ : Fournit routerLink, routerLinkActive, et router-outlet
  ],
})
export class LayoutComponent {
  private authService = inject(AuthService);

  onLogout(): void {
    this.authService.logout();
    // La méthode logout navigue déjà vers /auth/login
  }
}
