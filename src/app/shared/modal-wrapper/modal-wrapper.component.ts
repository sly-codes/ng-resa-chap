import {
  Component,
  inject,
  Type,
  WritableSignal,
  ViewChild,
  ViewContainerRef,
  AfterViewInit,
  Injector,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalContent, ModalService } from '../modal.service';

@Component({
  selector: 'app-modal-wrapper',
  templateUrl: './modal-wrapper.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class ModalWrapperComponent implements AfterViewInit {
  @ViewChild('modalContentContainer', { read: ViewContainerRef })
  contentContainer!: ViewContainerRef;

  modalService = inject(ModalService);
  modalContent: WritableSignal<ModalContent | null> = this.modalService.modalContent;
  private injector = inject(Injector);

  // 💡 Suppression du constructor pour utiliser seulement ngAfterViewInit et l'effect.
  // L'effect gère le changement de l'état, ngAfterViewInit gère l'endroit où injecter.

  ngAfterViewInit(): void {
    // 1. Déclencher un 'effect' ici, après que contentContainer soit garanti disponible.
    // L'effect observe le signal et appelle renderComponent.
    effect(
      () => {
        const content = this.modalContent();

        if (content) {
          this.renderComponent(content);
        } else {
          // Nettoyage lors de la fermeture de la modale
          this.contentContainer.clear();
        }
      },
      { injector: this.injector }
    );

    // 2. Rendre le composant si la modale était déjà ouverte (cas rare)
    // L'effect prend le relais immédiatement, mais on le garde pour être sûr.
    if (this.modalContent()) {
      this.renderComponent(this.modalContent()!);
    }
  }

  private renderComponent(content: ModalContent): void {
    if (!this.contentContainer) return;

    // 1. IMPORTANT : Nettoyer d'abord.
    this.contentContainer.clear();

    // 2. Créer le composant (le composant sera initialement injecté là où se trouve la balise <ng-template> - c'est-à-dire en haut du fichier)
    const componentRef = this.contentContainer.createComponent(content.component, {
      injector: this.injector,
    });

    // 3. OPTIONNEL MAIS UTILE : Déplacer le DOM du composant créé dans la carte blanche
    // (Ceci dépend de l'architecture exacte, mais avec le HTML de l'étape 1, cela fonctionne généralement)
    // Ici, nous faisons confiance au fait que l'injection se fait correctement à l'emplacement de la balise.
    // Si la simple correction HTML ne marche pas, il faudra utiliser ViewContainerRef.move() ou un autre ViewChild.

    // 🚨 Pour simplifier, la correction de l'étape 1 (déplacer la balise) est la plus critique.

    // Passage des Inputs (data) au composant
    if (content.data) {
      Object.keys(content.data).forEach((key) => {
        componentRef.setInput(key, content.data![key]);
      });
    }
  }
}
