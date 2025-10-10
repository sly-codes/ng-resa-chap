import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: `
    <div class="pagination-container" *ngIf="totalPages > 1">
      <div class="pagination-info">
        Page {{ currentPage }} sur {{ totalPages }} ({{ totalItems }} résultats)
      </div>
      <div class="pagination-controls">
        <button
          (click)="changePage(currentPage - 1)"
          [disabled]="currentPage === 1"
          class="btn-prev"
        >
          <i class="bx bx-chevron-left"></i> Précédent
        </button>

        <ng-container *ngFor="let page of getPages()">
          <button
            *ngIf="page !== '...'"
            (click)="changePage(page)"
            [class.active]="page === currentPage"
            class="btn-page"
          >
            {{ page }}
          </button>
          <span *ngIf="page === '...'" class="page-ellipsis">...</span>
        </ng-container>

        <button
          (click)="changePage(currentPage + 1)"
          [disabled]="currentPage === totalPages"
          class="btn-next"
        >
          Suivant <i class="bx bx-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./pagination.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class PaginationComponent {
  @Input() totalItems = 0;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();

  // ⚠️ CORRECTION: Accepter 'string | number' pour gérer le type du template et faire la conversion
  changePage(page: number | string): void {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;

    if (pageNum > 0 && pageNum <= this.totalPages) {
      this.pageChange.emit(pageNum);
    }
  }

  // Logique inchangée...
  getPages(): (number | string)[] {
    const maxPagesToShow = 5;
    const pages: (number | string)[] = [];
    const start = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    const end = Math.min(this.totalPages, start + maxPagesToShow - 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (start > 1) {
      pages.unshift('...');
      if (pages[1] !== 1) pages.unshift(1);
    }
    if (end < this.totalPages) {
      pages.push('...');
      if (pages[pages.length - 2] !== this.totalPages) pages.push(this.totalPages);
    }

    return Array.from(new Set(pages));
  }
}
