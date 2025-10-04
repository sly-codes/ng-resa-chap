import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Resource } from './resource.component';

describe('Resource', () => {
  let component: Resource;
  let fixture: ComponentFixture<Resource>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Resource],
    }).compileComponents();

    fixture = TestBed.createComponent(Resource);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
