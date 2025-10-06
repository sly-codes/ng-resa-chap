import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import { ProfileService, UpdateProfileDto } from '../core/services/profile.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private fb = inject(FormBuilder);

  // ✅ CORRECTION TS2564 : Utilisation de '!' car il sera initialisé dans ngOnInit
  profileForm!: FormGroup;

  isLoading = true;
  isSaving = false;
  error: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      // L'email est affiché mais non modifiable (désactivé)
      email: [{ value: '', disabled: true }],

      username: ['', [Validators.maxLength(50)]],
      firstName: ['', [Validators.maxLength(50)]],
      lastName: ['', [Validators.maxLength(50)]],
      contactPhone: [''],
    });

    this.loadProfile();
  }

  /**
   * Charge le profil utilisateur et pré-remplit le formulaire.
   */
  loadProfile(): void {
    this.isLoading = true;
    this.error = null;
    this.profileService
      .loadProfile()
      .pipe(
        finalize(() => (this.isLoading = false)),
        catchError((err) => {
          // Afficher les erreurs du backend
          this.error = err.error?.message || 'Erreur lors du chargement du profil.';
          return of(null);
        })
      )
      .subscribe((profile) => {
        if (profile) {
          // PatchValue fonctionne car les clés correspondent à l'interface UserProfile
          this.profileForm.patchValue(profile);
        }
      });
  }

  /**
   * Envoie les modifications du formulaire au backend.
   */
  onSaveProfile(): void {
    if (this.profileForm.invalid || this.isSaving) {
      return;
    }

    // Récupérer les valeurs (getRawValue pour inclure les champs désactivés, bien que non envoyés)
    const formValues = this.profileForm.value;

    // Créer le DTO en excluant les champs non-patchables
    const dto: UpdateProfileDto = {
      username: formValues.username,
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      contactPhone: formValues.contactPhone,
    };

    this.isSaving = true;
    this.successMessage = null;
    this.error = null;

    this.profileService
      .updateProfile(dto)
      .pipe(
        finalize(() => (this.isSaving = false)),
        catchError((err) => {
          this.error = err.error?.message || 'Erreur lors de la mise à jour du profil.';
          return of(null);
        })
      )
      .subscribe((updatedProfile) => {
        if (updatedProfile) {
          this.successMessage = 'Profil mis à jour avec succès !';
          this.profileForm.patchValue(updatedProfile);
        }
      });
  }
}
