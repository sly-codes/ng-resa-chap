import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // ⬅️ Nécessaire pour le Layout
import { LayoutComponent } from './shared/layout/layout.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule, // ⬅️ Importé ici
  ],
})
export class SharedModule {}
