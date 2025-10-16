// src/app/app.component.ts
import { Component, signal } from '@angular/core';
import { ToastComponent } from '../common/toast/toast.component';
import { RouterOutlet } from '@angular/router'; // 💡 Ajouter RouterOutlet ici

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true, // 🚨 CORRECTION CLÉ : Repasser en standalone: true
  styleUrl: './app.component.scss',
  imports: [
    ToastComponent,
    RouterOutlet, // Si vous utilisez <router-outlet> dans le template
  ],
})
export class AppComponent {
  protected readonly title = signal('ng-resa-chap');
}
