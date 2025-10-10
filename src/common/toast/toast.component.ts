import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastMessage, ToastService } from './toast.service'; // Assurez-vous d'avoir le bon chemin d'import
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-container" [class.show]="currentToast">
      <div *ngIf="currentToast" [class]="'toast-item toast-' + currentToast.type">
        <div class="toast-icon">
          <i *ngIf="currentToast.type === 'success'" class="bx bx-check-circle"></i>
          <i *ngIf="currentToast.type === 'error'" class="bx bx-x-circle"></i>
          <i *ngIf="currentToast.type === 'warning'" class="bx bx-error-circle"></i>
          <i *ngIf="currentToast.type === 'info'" class="bx bx-info-circle"></i>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ currentToast.title }}</div>
          <div class="toast-message">{{ currentToast.message }}</div>
        </div>
        <button class="toast-close" (click)="closeToast()">
          <i class="bx bx-x"></i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./toast.component.scss'],
  standalone: true,
  imports: [CommonModule],
  // Utilisation de OnPush pour optimiser, nécessite ChangeDetectorRef pour mettre à jour
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent implements OnInit, OnDestroy {
  currentToast: ToastMessage | null = null;
  private toastSubscription!: Subscription;
  private timerSubscription?: Subscription;
  private readonly DISPLAY_TIME = 4000; // 4 secondes

  constructor(private toastService: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // S'abonne au flux de messages du service
    this.toastSubscription = this.toastService.toast$.subscribe((toast) => {
      this.currentToast = toast;
      this.cdr.detectChanges(); // Met à jour la vue (nécessaire avec OnPush)
      this.startTimer();
    });
  }

  ngOnDestroy(): void {
    this.toastSubscription.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  startTimer(): void {
    this.timerSubscription?.unsubscribe(); // Annule le précédent si un nouveau arrive
    this.timerSubscription = timer(this.DISPLAY_TIME).subscribe(() => {
      this.closeToast();
    });
  }

  closeToast(): void {
    this.currentToast = null;
    this.timerSubscription?.unsubscribe();
    this.cdr.detectChanges(); // Met à jour la vue
  }
}
