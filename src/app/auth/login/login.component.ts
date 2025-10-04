import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // ⬅️ IMPORT !
import { Router, RouterLink } from '@angular/router'; // ⬅️ IMPORT !
import { CommonModule } from '@angular/common'; // ⬅️ IMPORT !
import { AuthService } from '../../core/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true, // ✅ Indispensable
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink, // Pour le lien vers signup
  ],
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
      password: ['', [Validators.required]], // Pas besoin de minLength ici
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
        // Redirection vers la page principale après succès
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        // Typiquement 401 Unauthorized pour les mauvaises identifiants
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
}
