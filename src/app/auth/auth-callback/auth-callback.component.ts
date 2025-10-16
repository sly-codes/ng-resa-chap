import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../common/toast/toast.service'; // 💡 IMPORT
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
  private toastService = inject(ToastService); // 💡 INJECTION

  error: string | null = null; // Ajout d'une propriété pour s'assurer que l'on n'appelle pas plusieurs fois
  private tokensHandled = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const accessToken = params['at'];
      const refreshToken = params['rt'];
      const backendError = params['error']; // 💡 NOUVEAU : Récupère l'erreur du backend

      if (this.tokensHandled) {
        return;
      }

      // 1. GESTION DES ERREURS
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

      // 2. GESTION DU SUCCÈS
      if (accessToken && refreshToken) {
        this.tokensHandled = true; // Empêche le traitement multiple

        const tokens: Tokens = {
          access_token: accessToken,
          refresh_token: refreshToken,
        }; // Donne un peu de temps pour voir le loader et permet au toast de s'afficher

        setTimeout(() => {
          this.authService.handleSocialLogin(tokens); // Stocke, affiche le toast de SUCCÈS et redirige
        }, 1500); // Réduit le délai à 1.5s
      } else if (!this.error) {
        // Logique d'erreur si tokens manquants et qu'il n'y a pas déjà d'erreur
        this.error = "Échec de l'authentification. Tokens manquants dans l'URL.";
        console.error(this.error);
        this.toastService.error('Échec de la Connexion', this.error);

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      }
    });
  }
}
