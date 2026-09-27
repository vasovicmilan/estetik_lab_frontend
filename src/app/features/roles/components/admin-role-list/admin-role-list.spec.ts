import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRoleList } from './admin-role-list';

describe('AdminRoleList', () => {
  let component: AdminRoleList;
  let fixture: ComponentFixture<AdminRoleList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRoleList],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRoleList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
