import { Injectable, Type, signal, WritableSignal, Input, computed } from '@angular/core';

// Interface pour le contenu de la modale
export interface ModalContent {
  component: Type<any>; // Le composant Standalone à afficher
  data?: { [key: string]: any }; // Données à passer en tant qu'Inputs
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  // Signal pour l'état actuel de la modale (null si fermée)
  public modalContent: WritableSignal<ModalContent | null> = signal(null);

  /**
   * Ouvre la modale et affiche le composant donné
   */
  open(content: ModalContent): void {
    this.modalContent.set(content);
  }

  /**
   * Ferme la modale
   */
  close(): void {
    this.modalContent.set(null);
  }
}
