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

// 💡 NOUVEAU TYPE pour l'affichage des unités de prix
interface PriceUnitDisplay {
  value: PriceUnit; // La valeur réelle (HOUR, DAY, ...) envoyée au backend
  label: string; // Le texte affiché (Heure, Jour, ...)
}

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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  resourceForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  error: string | null = null;

  // 💡 CORRECTION : Liste des unités de prix avec libellés FR
  priceUnitsDisplay: PriceUnitDisplay[] = [
    { value: 'HOUR', label: 'Heure' },
    { value: 'DAY', label: 'Jour' },
    { value: 'WEEK', label: 'Semaine' },
    { value: 'MONTH', label: 'Mois' },
  ];

  imagePreview: string | ArrayBuffer | null = null;
  currentImageUrl: string | null = null;

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.resourceForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['ROOM', [Validators.required]],
      description: ['', [Validators.maxLength(500)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      priceUnit: ['HOUR', [Validators.required]],
      country: ["Côte d'ivoire", [Validators.required, Validators.maxLength(50)]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      address: ['', [Validators.maxLength(100)]],
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
          this.resourceForm.patchValue({
            name: resource.name,
            type: resource.type,
            description: resource.description,
            price: resource.price,
            priceUnit: resource.priceUnit,
            country: resource.country,
            city: resource.city,
            address: resource.address,
          });
          this.currentImageUrl = resource.mainImage;
        }
      });
    this.subscriptions.add(sub);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      this.resourceForm.patchValue({ mainImageFile: file });
      this.resourceForm.get('mainImageFile')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.currentImageUrl = null;
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
