import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // ⬅️ IMPORT !
import { Router, RouterLink } from '@angular/router'; // ⬅️ IMPORT !
import { CommonModule } from '@angular/common'; // ⬅️ IMPORT !
import { AuthService } from '../../core/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  standalone: true, // ✅ Indispensable
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    RouterLink // Pour le lien vers signup
  ], 
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  isLoading = false;
  error: string | null = null;

  // Injection des dépendances
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.signupForm.invalid || this.isLoading) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;

    const credentials = this.signupForm.value;

    this.authService.signup(credentials).subscribe({
      next: () => {
        // Redirection vers le tableau de bord ou la page principale après succès
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        // Afficher un message d'erreur plus convivial
        if (err.status === 409) {
          this.error = 'Cet email est déjà utilisé. Veuillez vous connecter.';
        } else {
          this.error = err.error?.message || "Erreur lors de l'inscription. Veuillez réessayer.";
        }
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
