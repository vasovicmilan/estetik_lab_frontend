import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepeaterField } from './repeater-field';

describe('RepeaterField', () => {
  let component: RepeaterField;
  let fixture: ComponentFixture<RepeaterField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepeaterField],
    }).compileComponents();

    fixture = TestBed.createComponent(RepeaterField);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
