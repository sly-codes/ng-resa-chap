import { CommonModule, registerLocaleData } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, UserRole } from '../../core/auth.service';
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
import localeFr from '@angular/common/locales/fr';

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
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  profile$!: Observable<UserProfile | null>;
  isMobileSidebarOpen = false;

  ngOnInit(): void {
    this.profile$ = this.profileService.profile$;

    if (!this.profileService.getProfileSnapshot()) {
      this.profileService.loadProfile().subscribe({
        error: (err) => console.error('Erreur de chargement du profil dans le layout:', err),
      });
    }
  }

  isSuperAdmin(): boolean {
    return this.authService.getRoleFromToken() === 'SUPER_ADMIN';
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;

    if (this.isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
    document.body.style.overflow = '';
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const width = (event.target as Window).innerWidth;
    if (width > 768 && this.isMobileSidebarOpen) {
      this.closeMobileSidebar();
    }
  }

  onLogout(): void {
    this.closeMobileSidebar();
    this.profileService.clearProfile();
    this.authService.logout();
  }
}
