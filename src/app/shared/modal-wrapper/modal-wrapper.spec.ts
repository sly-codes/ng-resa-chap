import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalWrapper } from './modal-wrapper.component';

describe('ModalWrapper', () => {
  let component: ModalWrapper;
  let fixture: ComponentFixture<ModalWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalWrapper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalWrapper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
