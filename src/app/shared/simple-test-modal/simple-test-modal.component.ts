import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-simple-test-modal',
  template:
    '<div class="p-8 text-center text-green-600 bg-green-50 rounded-lg"><h2>✅ TEST RÉUSSI ! Le contenu s\'affiche.</h2><p class="mt-2 text-gray-700">Si vous voyez ce message, l\'injection dynamique fonctionne.</p></div>',
  standalone: true,
  imports: [CommonModule],
})
export class SimpleTestModalComponent {}
