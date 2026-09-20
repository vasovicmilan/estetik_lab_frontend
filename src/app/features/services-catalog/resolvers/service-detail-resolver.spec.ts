import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { serviceDetailResolver } from './service-detail-resolver';

describe('serviceDetailResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
    TestBed.runInInjectionContext(() => serviceDetailResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
