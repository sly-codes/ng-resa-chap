import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Resource, ResourceService } from '../../core/resource.service';
import { switchMap, catchError, of, take, finalize } from 'rxjs';
import { ModalService } from '../../shared/modal.service'; // Import du service de modale
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-resource-form',
  templateUrl: './resource-form.component.html',
  styleUrls: ['./resource-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class ResourceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private resourceService = inject(ResourceService);
  private modalService = inject(ModalService); // Service de modale injecté

  // 💡 Reçoit l'ID de la modale (si en mode édition)
  @Input() resourceId: string | null = null;

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

    // 1. Vérification si l'on est en mode Édition via l'Input
    this.isEditMode = !!this.resourceId;

    if (this.isEditMode && this.resourceId) {
      this.isLoading = true;
      // Récupération des données pour l'édition
      this.resourceService
        .getResourceById(this.resourceId)
        .pipe(
          take(1),
          finalize(() => (this.isLoading = false)),
          catchError((err) => {
            this.error = "Erreur: Ressource introuvable ou vous n'êtes pas autorisé à la modifier.";
            return of(null);
          })
        )
        .subscribe((resource: Resource | null) => {
          if (resource) {
            // 2. Remplir le formulaire
            this.resourceForm.patchValue(resource);
          }
        });
    }
  }

  // Méthode de soumission
  onSubmit(): void {
    if (this.resourceForm.invalid) {
      this.resourceForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;
    const formData = this.resourceForm.value;

    let operation;

    if (this.isEditMode && this.resourceId) {
      // MODE ÉDITION (L'ID est maintenant connu grâce à l'Input)
      operation = this.resourceService.updateResource(this.resourceId, formData);
    } else {
      // MODE CRÉATION
      operation = this.resourceService.createResource(formData);
    }

    operation.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        // Succès : Fermer la modale. La liste se rafraîchira automatiquement.
        this.modalService.close();
      },
      error: (err) => {
        this.error =
          err.error?.message ||
          `Erreur lors de ${this.isEditMode ? 'la modification' : 'la création'} de la ressource.`;
        console.error(err);
      },
    });
  }

  // Fermer la modale
  onCancel(): void {
    this.modalService.close();
  }
}
