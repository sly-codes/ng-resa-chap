import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationFormModal } from './reservation-form-modal';

describe('ReservationFormModal', () => {
  let component: ReservationFormModal;
  let fixture: ComponentFixture<ReservationFormModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationFormModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationFormModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
