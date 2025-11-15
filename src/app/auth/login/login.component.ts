import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../common/toast/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef); // Injecter ChangeDetectorRef

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      this.toastService.warning(
        'Formulaire Invalide',
        'Veuillez corriger les champs obligatoires.'
      );
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges(); // Force l'affichage du spinner

    const credentials = this.loginForm.value;

    this.authService.signin(credentials).subscribe({
      next: () => {
        // Succès : Annuler l'état et effacer les champs
        this.isLoading = false;
        this.loginForm.reset(); // 🚨 EFFACER LES CHAMPS UNIQUEMENT EN CAS DE SUCCÈS
        this.cdr.detectChanges(); // Force la détection
        this.toastService.success('Connexion Réussie', 'Bienvenue sur Resa Chap !');
        this.router.navigate(['/catalogue']);
      },
      error: (err: HttpErrorResponse) => {
        // Échec : Annuler l'état, mais CONSERVER les champs pour la correction
        this.isLoading = false;
        this.cdr.detectChanges(); // 🚨 CORRECTION CLÉ : Débloquer le bouton immédiatement

        let errorMessage = 'Erreur serveur inconnue. Veuillez réessayer plus tard.';

        if (err.error && err.error.message) {
          const backendMessage = Array.isArray(err.error.message)
            ? err.error.message.join(', ')
            : err.error.message;

          if (backendMessage && typeof backendMessage === 'string') {
            errorMessage = backendMessage;
          }
        } else if (err.status === 403) {
          errorMessage = 'Email ou mot de passe incorrect.';
        } else if (err.status >= 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer.';
        }

        this.toastService.error('Échec de la connexion', errorMessage);
      },
    });
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  loginWithGithub(): void {
    this.authService.loginWithGithub();
  }

  /**
   * Navigue vers la page d'accueil (landing page).
   */
  goToLandingPage(): void {
    this.router.navigate(['/']);
  }
}
