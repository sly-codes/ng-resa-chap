import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Component, inject, OnInit } from '@angular/core';
// ✅ Importez spécifiquement NgbDropdown, NgbDropdownMenu, et NgbDropdownToggle
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true, // ✅ Assurez-vous que toutes les directives sont dans les imports (c'est l'endroit le plus probable du bug)
  imports: [CommonModule, RouterModule, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle],
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService); // ✅ Injection du ProfileService

  // Observable pour le profil, utilisé dans le template
  profile$!: Observable<UserProfile | null>;

  ngOnInit(): void {
    this.profile$ = this.profileService.profile$;

    // Charger le profil lors du chargement du layout, si ce n'est pas déjà fait
    // Cela initialise l'état du profil après une connexion réussie
    if (!this.profileService.getProfileSnapshot()) {
      this.profileService.loadProfile().subscribe({
        error: (err) => console.error('Erreur de chargement du profil dans le layout:', err),
      });
    }
  }

  onLogout(): void {
    // 1. Vider l'état du profil
    this.profileService.clearProfile();
    // 2. Déconnecter l'utilisateur (cela devrait naviguer vers /auth/login)
    this.authService.logout();
  }
}
