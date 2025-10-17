import { Component, inject, OnInit, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgIf, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  Resource,
  ResourceService,
  PriceUnit,
  CreateResourceDTO,
} from '../../../core/resource.service';
import { catchError, of, take, finalize, Subscription, Observable } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-resource-form-modal',
  templateUrl: './resource-form-modal.component.html',
  styleUrls: ['./resource-form-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgClass],
})
export class ResourceFormModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private resourceService = inject(ResourceService);
  private activeModal = inject(NgbActiveModal);

  @Input() resourceId: string | null = null;
  // 🚨 NOUVEAU: Référence à l'input de fichier
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  resourceForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  error: string | null = null;
  priceUnits: PriceUnit[] = ['HOUR', 'DAY', 'WEEK', 'MONTH'];
  imagePreview: string | ArrayBuffer | null = null; // Pour l'aperçu de l'image
  currentImageUrl: string | null = null; // Pour l'image existante en mode édition

  private subscriptions = new Subscription();

  ngOnInit(): void {
    // 🚨 AJOUT des nouveaux contrôles avec validations appropriées
    this.resourceForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['ROOM', [Validators.required]],
      description: ['', [Validators.maxLength(500)]],
      // Nouveaux champs
      price: [0, [Validators.required, Validators.min(0.01)]],
      priceUnit: ['HOUR', [Validators.required]],
      country: ["Côte d'ivoire", [Validators.required, Validators.maxLength(50)]], // Valeur par défaut
      city: ['', [Validators.required, Validators.maxLength(50)]],
      address: ['', [Validators.maxLength(100)]],
      // Champ virtuel pour le fichier (pas de validation requise ici, on la gère au submit)
      mainImageFile: [null],
    });

    this.isEditMode = !!this.resourceId;

    if (this.isEditMode && this.resourceId) {
      this.loadResourceData();
    }
  }

  loadResourceData(): void {
    this.isLoading = true;
    const sub = this.resourceService
      .getResourceById(this.resourceId!)
      .pipe(
        take(1),
        finalize(() => (this.isLoading = false)),
        catchError((err) => {
          this.error =
            err.error?.message || "Erreur: Ressource introuvable ou vous n'avez pas les droits.";
          return of(null);
        })
      )
      .subscribe((resource: Resource | null) => {
        if (resource) {
          // Utiliser patchValue avec les champs existants
          this.resourceForm.patchValue({
            name: resource.name,
            type: resource.type,
            description: resource.description,
            price: resource.price,
            priceUnit: resource.priceUnit,
            country: resource.country,
            city: resource.city,
            address: resource.address,
            // Ne pas patcher le champ mainImageFile, car c'est un File
          });
          this.currentImageUrl = resource.mainImage; // Stocker l'URL pour l'affichage
        }
      });
    this.subscriptions.add(sub);
  }

  // 🚨 NOUVEAU: Gère la sélection du fichier et l'aperçu
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Mise à jour du FormControl pour la soumission
      this.resourceForm.patchValue({ mainImageFile: file });
      this.resourceForm.get('mainImageFile')?.updateValueAndValidity();

      // Créer l'aperçu
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.currentImageUrl = null; // Masquer l'ancienne image si une nouvelle est sélectionnée
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.resourceForm.invalid) {
      this.resourceForm.markAllAsTouched();
      this.error = 'Veuillez corriger les erreurs dans le formulaire.';
      return;
    }

    if (!this.isEditMode && !this.resourceForm.get('mainImageFile')?.value) {
      this.resourceForm.get('mainImageFile')?.setErrors({ required: true });
      this.error = 'Une image principale est requise pour la création.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    const formValue = this.resourceForm.value;

    // 🚨 Conversion du FormValue en DTO de soumission
    const resourceData: Partial<CreateResourceDTO> = {
      name: formValue.name,
      type: formValue.type,
      description: formValue.description,
      price: formValue.price,
      priceUnit: formValue.priceUnit,
      country: formValue.country,
      city: formValue.city,
      address: formValue.address,
      mainImage: formValue.mainImageFile, // Le fichier (File ou null)
    };

    let operation: Observable<Resource>;

    if (this.isEditMode && this.resourceId) {
      // Pour l'édition, on n'envoie que les champs que nous voulons modifier.
      // Dans ce cas, on envoie tous les champs pour simplifier.
      operation = this.resourceService.updateResource(this.resourceId, resourceData);
    } else {
      operation = this.resourceService.createResource(resourceData as CreateResourceDTO);
    }

    const sub = operation.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.activeModal.close(true);
      },
      error: (err) => {
        this.error =
          err.error?.message ||
          `Erreur lors de ${
            this.isEditMode ? 'la modification' : 'la création'
          } de la ressource. Vérifiez tous les champs.`;
        console.error(err);
      },
    });
    this.subscriptions.add(sub);
  }

  onCancel(): void {
    this.activeModal.dismiss('User cancelled');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
