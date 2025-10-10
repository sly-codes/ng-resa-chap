import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSubject = new Subject<ToastMessage>(); // Observable pour que les composants (ToastComponent) puissent s'abonner

  toast$ = this.toastSubject.asObservable();

  constructor() {}

  private show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) {
    this.toastSubject.next({ type, title, message });
  }

  success(title: string, message: string = 'Opération réussie.') {
    this.show('success', title, message);
  }

  error(title: string, message: string = 'Une erreur est survenue.') {
    this.show('error', title, message);
  }

  warning(title: string, message: string) {
    this.show('warning', title, message);
  }

  /**
   * 💡 Ajout de la méthode info pour les notifications neutres ou de rafraîchissement.
   */
  info(title: string, message: string) {
    this.show('info', title, message);
  }
}
