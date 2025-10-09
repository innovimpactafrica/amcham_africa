import { TestBed } from '@angular/core/testing';

import { AmchamService } from './amcham.service';

describe('AmchamService', () => {
  let service: AmchamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmchamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
