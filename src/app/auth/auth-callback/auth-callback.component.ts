import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, Tokens } from '../../core/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="callback-container">
      <i class="bx bx-loader-alt bx-spin"></i>
      <p>Authentification réussie. Redirection en cours...</p>
      <p *ngIf="error" class="error-message">{{ error }}</p>
    </div>
  `,
  styles: [
    `
      .callback-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: sans-serif;
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

  error: string | null = null;
  // Ajout d'une propriété pour s'assurer que l'on n'appelle pas plusieurs fois
  private tokensHandled = false;

  ngOnInit(): void {
    // S'abonne aux paramètres de l'URL
    // Utiliser take(1) si vous ne voulez l'exécuter qu'une fois,
    // mais ici la souscription se termine après la redirection.
    this.route.queryParams.subscribe((params) => {
      const accessToken = params['at'];
      const refreshToken = params['rt'];

      if (this.tokensHandled) {
        return;
      }

      if (accessToken && refreshToken) {
        this.tokensHandled = true; // Empêche le traitement multiple

        const tokens: Tokens = {
          access_token: accessToken,
          refresh_token: refreshToken,
        };

        // 🚨 AJOUT DU DELAI (par exemple 1000 millisecondes = 1 seconde)
        setTimeout(() => {
          this.authService.handleSocialLogin(tokens); // Stocke et redirige vers /
        }, 3000); // Vous voyez le loader pendant au moins 1 seconde.
      } else {
        // Logique d'erreur si tokens manquants (inchangée)
        this.error = "Échec de l'authentification. Tokens manquants dans l'URL.";
        console.error(this.error);

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      }
    });
  }
}
