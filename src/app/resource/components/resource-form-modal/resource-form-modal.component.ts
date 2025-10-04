import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Resource, ResourceService } from '../../../core/resource.service';
import { catchError, of, take, finalize } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'; // ⬅️ NgbActiveModal pour la fermeture
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-resource-form-modal',
  templateUrl: './resource-form-modal.component.html',
  styleUrls: ['./resource-form-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ResourceFormModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private resourceService = inject(ResourceService);
  private activeModal = inject(NgbActiveModal); // ⬅️ Le service actif pour interagir avec la modale

  @Input() resourceId: string | null = null; // Reçoit l'ID de la modale

  resourceForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.resourceForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['ROOM', [Validators.required]],
      description: ['', [Validators.maxLength(500)]],
    });

    this.isEditMode = !!this.resourceId;

    if (this.isEditMode && this.resourceId) {
      this.isLoading = true;
      this.resourceService
        .getResourceById(this.resourceId)
        .pipe(
          take(1),
          finalize(() => (this.isLoading = false)),
          catchError((err) => {
            this.error = 'Erreur: Ressource introuvable.';
            return of(null);
          })
        )
        .subscribe((resource: Resource | null) => {
          if (resource) {
            this.resourceForm.patchValue(resource);
          }
        });
    }
  }

  onSubmit(): void {
    if (this.resourceForm.invalid) {
      this.resourceForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;
    const formData = this.resourceForm.value;

    let operation =
      this.isEditMode && this.resourceId
        ? this.resourceService.updateResource(this.resourceId, formData)
        : this.resourceService.createResource(formData);

    operation.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        // Succès : Fermer la modale et passer 'true' pour le résultat
        this.activeModal.close(true);
      },
      error: (err) => {
        this.error = `Erreur lors de ${
          this.isEditMode ? 'la modification' : 'la création'
        } de la ressource.`;
        console.error(err);
      },
    });
  }

  // Fermer la modale (bouton Annuler ou X)
  onCancel(): void {
    // Utiliser dismiss() pour une fermeture sans succès/action
    this.activeModal.dismiss('User cancelled');
  }
}

