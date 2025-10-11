import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

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
  error: string | null = null;

  // Injection des dépendances
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;

    const credentials = this.loginForm.value;

    this.authService.signin(credentials).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.error = 'Email ou mot de passe incorrect.';
        } else {
          this.error = err.error?.message || 'Erreur de connexion. Veuillez réessayer.';
        }
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  /**
   * Déclenche la redirection vers le backend pour la connexion Google.
   */
  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  /**
   * 🚨 NOUVEAU : Déclenche la redirection vers le backend pour la connexion GitHub.
   */
  loginWithGithub(): void {
    this.authService.loginWithGithub();
  }
}
