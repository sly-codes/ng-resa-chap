import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceivedReservations } from './received-reservations.component';

describe('ReceivedReservations', () => {
  let component: ReceivedReservations;
  let fixture: ComponentFixture<ReceivedReservations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivedReservations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceivedReservations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
