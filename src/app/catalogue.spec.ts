import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Catalogue } from './catalogue.component';

describe('Catalogue', () => {
  let component: Catalogue;
  let fixture: ComponentFixture<Catalogue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Catalogue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Catalogue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
