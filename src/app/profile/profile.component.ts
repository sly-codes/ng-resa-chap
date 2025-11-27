import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { catchError, finalize, of } from 'rxjs';
import { ProfileService, UpdateProfileDto } from '../core/services/profile.service';

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
      countryCode: ['CI'],
      contactPhone: [''],
    });

    this.profileForm.get('countryCode')?.valueChanges.subscribe(() => {
      this.profileForm.get('contactPhone')?.setValue('');
    });

    this.loadProfile();
  }

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

  getPhoneMask(): string {
    const code = this.profileForm.get('countryCode')?.value;
    return this.westAfricanCountries.find((c) => c.code === code)?.mask || '';
  }

  getPhonePrefix(): string {
    const code = this.profileForm.get('countryCode')?.value;
    return this.westAfricanCountries.find((c) => c.code === code)?.prefix || '';
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid || this.isSaving) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValues = this.profileForm.value;

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
