import { TestBed } from '@angular/core/testing';

import { CountryAmchamService } from './country-amcham.service';

describe('CountryAmchamService', () => {
  let service: CountryAmchamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CountryAmchamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
