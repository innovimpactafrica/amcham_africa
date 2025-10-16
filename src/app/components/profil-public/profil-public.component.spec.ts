import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilPublicComponent } from './profil-public.component';

describe('ProfilPublicComponent', () => {
  let component: ProfilPublicComponent;
  let fixture: ComponentFixture<ProfilPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilPublicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
