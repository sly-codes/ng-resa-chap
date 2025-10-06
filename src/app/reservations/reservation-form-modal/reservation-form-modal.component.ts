import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateReservationDto, ReservationService } from '../reservation.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-reservation-form-modal',
  templateUrl: './reservation-form-modal.component.html',
  styleUrl: './reservation-form-modal.component.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
})
export class ReservationFormModalComponent implements OnInit {
  @Input() resourceId!: string;
  @Input() resourceName!: string;

  private fb = inject(FormBuilder);
  public activeModal = inject(NgbActiveModal);
  private reservationService = inject(ReservationService);

  reservationForm!: FormGroup;
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    // Fonction pour obtenir la date et l'heure actuelles au format datetime-local (YYYY-MM-DDThh:mm)
    const now = new Date();
    // Créer une date de fin 1 heure plus tard
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const formatToLocalDatetime = (date: Date): string => {
      // Obtenir la partie YYYY-MM-DD
      const datePart = date.toISOString().split('T')[0];
      // Obtenir la partie hh:mm
      const timePart = date.toTimeString().slice(0, 5);
      return `${datePart}T${timePart}`;
    };

    const initialDateDebut = formatToLocalDatetime(now);
    const initialDateFin = formatToLocalDatetime(oneHourLater);

    this.reservationForm = this.fb.group(
      {
        dateDebut: [initialDateDebut, [Validators.required]],
        dateFin: [initialDateFin, [Validators.required]],
        notes: [''],
      },
      { validator: this.timeConflictValidator }
    );
  }

  // Validateur personnalisé pour vérifier que dateDebut < dateFin
  timeConflictValidator(form: FormGroup) {
    const debut = form.get('dateDebut')?.value;
    const fin = form.get('dateFin')?.value;

    if (debut && fin) {
      // Les valeurs sont des chaînes (datetime-local). Les comparer permet de s'assurer de l'ordre.
      if (debut >= fin) {
        return { timeConflict: true };
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;

    const formValue = this.reservationForm.value;
    const dto: CreateReservationDto = {
      resourceId: this.resourceId,
      // Le format datetime-local est une chaîne ISO (sans Z) que NestJS peut parser en Date
      dateDebut: formValue.dateDebut,
      dateFin: formValue.dateFin,
      notes: formValue.notes,
    };

    this.reservationService.createReservation(dto).subscribe({
      next: () => {
        this.activeModal.close('success');
      },
      error: (err) => {
        // Votre backend renvoie des messages d'erreur spécifiques (e.g., conflit horaire)
        this.error =
          err.error?.message || 'Une erreur est survenue lors de la création de la réservation.';
        this.isLoading = false;
      },
    });
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
