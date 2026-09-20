import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminServiceList } from './admin-service-list';

describe('AdminServiceList', () => {
  let component: AdminServiceList;
  let fixture: ComponentFixture<AdminServiceList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminServiceList],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminServiceList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
