import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Component, inject, OnInit, HostListener } from '@angular/core';
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { Observable } from 'rxjs';

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
  ],
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  profile$!: Observable<UserProfile | null>;

  // État du menu mobile
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
   * Toggle la sidebar mobile
   */
  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;

    // Bloquer le scroll du body quand la sidebar est ouverte
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
