import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminServiceForm } from './admin-service-form';

describe('AdminServiceForm', () => {
  let component: AdminServiceForm;
  let fixture: ComponentFixture<AdminServiceForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminServiceForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminServiceForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
