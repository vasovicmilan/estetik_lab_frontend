import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRoleForm } from './admin-role-form';

describe('AdminRoleForm', () => {
  let component: AdminRoleForm;
  let fixture: ComponentFixture<AdminRoleForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRoleForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRoleForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
