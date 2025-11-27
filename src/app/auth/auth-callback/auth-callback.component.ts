import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../common/toast/toast.service';
import { AuthService, Tokens } from '../../core/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="callback-container">
      <i class="bx bx-loader-alt bx-spin"></i>
      <p>Authentification en cours...</p>
      <p *ngIf="error" class="error-message">Erreur : {{ error }}</p>
    </div>
  `,
  styles: [
    `
      .callback-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        text-align: center;
        background-color: #f9fafb; /* $gray-50 */
      }

      .bx-spin {
        font-size: 3rem;
        color: #00add8; /* ✅ $primary-cyan */
        margin-bottom: 1rem;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      p {
        color: #374151; /* $gray-700 */
        font-size: 16px;
      }

      .error-message {
        color: #dc2626; /* $red */
        margin-top: 20px;
        font-weight: 500;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule],
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  error: string | null = null;
  private tokensHandled = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const accessToken = params['at'];
      const refreshToken = params['rt'];
      const backendError = params['error'];

      if (this.tokensHandled) {
        return;
      }

      if (backendError) {
        this.tokensHandled = true;
        this.error = backendError;
        this.toastService.error(
          'Échec de la Connexion',
          `Le service externe a renvoyé une erreur : ${backendError}`
        );

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
        return;
      }

      if (accessToken && refreshToken) {
        this.tokensHandled = true;

        const tokens: Tokens = {
          access_token: accessToken,
          refresh_token: refreshToken,
        };

        setTimeout(() => {
          this.authService.handleSocialLogin(tokens);
        }, 1500);
      } else if (!this.error) {
        this.error = "Echec authentification. Tokens manquants.";
        console.error(this.error);
        this.toastService.error('Échec de la Connexion', this.error);

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      }
    });
  }
}
