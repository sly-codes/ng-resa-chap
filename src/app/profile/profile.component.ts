import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { catchError, finalize, of } from 'rxjs';
import { ProfileService, UpdateProfileDto } from '../core/services/profile.service';

// Définition de l'interface pour la structure des données des pays
interface Country {
  code: string;
  name: string;
  flag: string;
  prefix: string;
  mask: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, NgxMaskDirective],
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private fb = inject(FormBuilder);

  profileForm!: FormGroup;

  isLoading = true;
  isSaving = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Liste des pays d'Afrique de l'Ouest avec leurs masques et préfixes
  public westAfricanCountries: Country[] = [
    { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', prefix: '+225 ', mask: '00 00 00 00 00' },
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳', prefix: '+221 ', mask: '00 000 00 00' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', prefix: '+226 ', mask: '00 00 00 00' },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', prefix: '+223 ', mask: '00 00 00 00' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬', prefix: '+228 ', mask: '00 00 00 00' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', prefix: '+233 ', mask: '00 000 0000' }, 
  ];

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }],

      username: ['', [Validators.maxLength(50)]],
      firstName: ['', [Validators.maxLength(50)]],
      lastName: ['', [Validators.maxLength(50)]],

      // Ajout du contrôle pour le code pays, initialisé avec la Côte d'Ivoire par défaut
      countryCode: ['CI'],
      contactPhone: [''],
    });

    // Écouter les changements de countryCode pour réinitialiser le téléphone
    this.profileForm.get('countryCode')?.valueChanges.subscribe(() => {
      // Réinitialise le champ téléphone pour effacer les saisies précédentes non conformes au nouveau masque
      this.profileForm.get('contactPhone')?.setValue('');
    });

    this.loadProfile();
  }

  // Méthode pour charger le profil (logique inchangée)
  loadProfile(): void {
    this.isLoading = true;
    this.error = null;
    this.profileService
      .loadProfile()
      .pipe(
        finalize(() => (this.isLoading = false)),
        catchError((err) => {
          this.error = err.error?.message || 'Erreur lors du chargement du profil.';
          return of(null);
        })
      )
      .subscribe((profile) => {
        if (profile) {
          // Si le profil a une propriété countryCode, elle sera patchée ici.
          // Sinon, 'CI' restera la valeur par défaut.
          this.profileForm.patchValue(profile);
        }
      });
  }

  // Méthode appelée dans le template pour obtenir le masque dynamique
  getPhoneMask(): string {
    const code = this.profileForm.get('countryCode')?.value;
    return this.westAfricanCountries.find((c) => c.code === code)?.mask || '';
  }

  // Méthode appelée dans le template pour obtenir le préfixe dynamique
  getPhonePrefix(): string {
    const code = this.profileForm.get('countryCode')?.value;
    return this.westAfricanCountries.find((c) => c.code === code)?.prefix || '';
  }

  // Méthode pour sauvegarder le profil
  onSaveProfile(): void {
    if (this.profileForm.invalid || this.isSaving) {
      // Marquer tous les contrôles comme "touchés" pour afficher les erreurs
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValues = this.profileForm.value;

    const dto: UpdateProfileDto = {
      username: formValues.username,
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      // Le contactPhone est le numéro local saisi
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
