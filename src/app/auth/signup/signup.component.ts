import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../common/toast/toast.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['../login/login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  isLoading = false;
  showPassword = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.signupForm.invalid || this.isLoading) {
      this.signupForm.markAllAsTouched();
      this.toastService.warning(
        'Formulaire Invalide',
        'Veuillez corriger les champs obligatoires.'
      );
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    const credentials = this.signupForm.value;

    this.authService.signup(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.signupForm.reset();
        this.cdr.detectChanges();
        this.toastService.success('Inscription Reussie', 'Votre compte a ete cree !');
        this.router.navigate(['/catalogue']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.cdr.detectChanges();

        let errorMessage = 'Erreur serveur inconnue. Veuillez réessayer plus tard.';

        if (err.error && err.error.message) {
          const backendMessage = Array.isArray(err.error.message)
            ? err.error.message.join(', ')
            : err.error.message;

          if (backendMessage && typeof backendMessage === 'string') {
            errorMessage = backendMessage;
          }
        } else if (err.status === 403 || err.status === 409) {
          errorMessage = "L'email est déjà utilisé. Veuillez vous connecter.";
        } else if (err.status >= 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer.';
        }

        this.toastService.error("Échec de l'inscription", errorMessage);
      },
    });
  }

  goToLandingPage(): void {
    this.router.navigate(['/']);
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  loginWithGithub(): void {
    this.authService.loginWithGithub();
  }
}
