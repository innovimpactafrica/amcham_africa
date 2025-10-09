import { TestBed } from '@angular/core/testing';

import { BanniereService } from './banniere.service';

describe('BanniereService', () => {
  let service: BanniereService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BanniereService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
