import { Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">
          <i class="bx bx-error-circle"></i>
          <span>Confirmation de suppression</span>
        </h4>
        <button
          type="button"
          class="modal-close"
          aria-label="Fermer"
          (click)="activeModal.dismiss('Fermeture manuelle')"
        >
          <i class="bx bx-x"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="warning-icon">
          <i class="bx bx-trash"></i>
        </div>
        <div class="warning-content">
          <p class="warning-text">
            Êtes-vous sûr de vouloir supprimer la ressource
            <strong class="resource-name">{{ resourceName }}</strong> ?
          </p>
          <p class="warning-subtitle">
            Cette action est <strong>irréversible</strong> et toutes les données associées seront
            définitivement perdues.
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel" (click)="activeModal.dismiss('Annulé')">
          <i class="bx bx-x"></i>
          <span>Annuler</span>
        </button>
        <button type="button" class="btn-delete" (click)="activeModal.close(true)">
          <i class="bx bx-trash"></i>
          <span>Supprimer définitivement</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-container {
        background: #ffffff;
        border-radius: 4px;
        max-width: 540px;
        animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes modalSlideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .modal-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 1rem;
        color: #111827;
        margin: 0;
      }

      .modal-title i {
        font-size: 1.188rem;
        color: #dc2626;
        flex-shrink: 0;
      }

      .modal-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 3px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .modal-close i {
        font-size: 1.5rem;
      }

      .modal-close:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .modal-close:active {
        background: #e5e7eb;
      }

      .modal-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1.25rem;
      }

      .warning-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: #fee2e2;
        display: flex;
        align-items: center;
        justify-content: center;
        // animation: pulseWarning 2s ease-in-out infinite;
      }

      // @keyframes pulseWarning {
      //   0%,
      //   100% {
      //     box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
      //   }
      //   50% {
      //     box-shadow: 0 0 0 12px rgba(220, 38, 38, 0);
      //   }
      // }

      .warning-icon i {
        font-size: 2rem;
        color: #dc2626;
      }

      .warning-content {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .warning-text {
        font-size: 0.938rem;
        color: #111827;
        margin: 0;
        line-height: 1.6;
      }

      .resource-name {
        color: #dc2626;
        font-weight: 600;
      }

      .warning-subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
      }

      .warning-subtitle strong {
        color: #dc2626;
      }

      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1.25rem 1.5rem;
        border-top: 1px solid #e5e7eb;
      }

      .btn-cancel,
      .btn-delete {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        padding: 0.563rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        white-space: nowrap;
      }

      .btn-cancel i,
      .btn-delete i {
        font-size: 1rem;
        flex-shrink: 0;
      }

      .btn-cancel {
        background: transparent;
        color: #6b7280;
        border: 1px solid #d1d5db;
      }

      .btn-cancel:hover {
        background: #f9fafb;
        border-color: #9ca3af;
        color: #4b5563;
      }

      .btn-cancel:active {
        background: #f3f4f6;
      }

      .btn-delete {
        background: #dc2626;
        color: #ffffff;
      }

      .btn-delete:hover {
        background: #b91c1c;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
      }

      .btn-delete:active {
        background: #991b1b;
        transform: scale(0.97);
      }

      @media (min-width: 768px) {
        .modal-container {
          max-width: 600px;
        }

        .modal-header {
          padding: 1.5rem 2rem;
        }

        .modal-title {
          font-size: 1.063rem;
        }

        .modal-body {
          padding: 2rem;
        }

        .modal-footer {
          padding: 1.5rem 2rem;
        }

        .btn-cancel,
        .btn-delete {
          padding: 0.625rem 1.25rem;
        }
      }
    `,
  ],
})
export class DeleteConfirmationModalComponent {
  activeModal = inject(NgbActiveModal);

  @Input() resourceName: string = 'cette ressource';
}
