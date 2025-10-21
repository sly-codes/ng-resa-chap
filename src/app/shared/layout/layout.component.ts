import { CommonModule, registerLocaleData } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, UserRole } from '../../core/auth.service'; // 💡 Import de UserRole
import { Component, inject, OnInit, HostListener, LOCALE_ID } from '@angular/core';
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { Observable } from 'rxjs';
import { ToastComponent } from '../../../common/toast/toast.component';
import localeFr from '@angular/common/locales/fr'; // 💡 Import de la locale FR

// Enregistrement de la locale FR pour les Pipes si non fait dans app.config/app.module
registerLocaleData(localeFr);

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbDropdownItem,
    ToastComponent,
  ],
  // 💡 AJOUT : Définir la locale du composant au cas où (bonne pratique)
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  profile$!: Observable<UserProfile | null>; // État du menu mobile

  isMobileSidebarOpen = false;

  ngOnInit(): void {
    this.profile$ = this.profileService.profile$;

    if (!this.profileService.getProfileSnapshot()) {
      this.profileService.loadProfile().subscribe({
        error: (err) => console.error('Erreur de chargement du profil dans le layout:', err),
      });
    }
  }
  /**
   * 🚀 NOUVEAU : Vérifie si l'utilisateur est Super Admin
   */

  isSuperAdmin(): boolean {
    return this.authService.getRoleFromToken() === 'SUPER_ADMIN';
  }
  /**
   * Toggle la sidebar mobile
   */

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen; // Bloquer le scroll du body quand la sidebar est ouverte

    if (this.isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  /**
   * Fermer la sidebar mobile
   */

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
    document.body.style.overflow = '';
  }
  /**
   * Fermer la sidebar mobile si on redimensionne vers desktop
   */

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const width = (event.target as Window).innerWidth;
    if (width > 768 && this.isMobileSidebarOpen) {
      this.closeMobileSidebar();
    }
  }
  /**
   * Déconnexion
   */

  onLogout(): void {
    this.closeMobileSidebar();
    this.profileService.clearProfile();
    this.authService.logout();
  }
}
