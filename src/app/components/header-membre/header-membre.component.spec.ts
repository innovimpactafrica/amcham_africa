import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderMembreComponent } from './header-membre.component';

describe('HeaderMembreComponent', () => {
  let component: HeaderMembreComponent;
  let fixture: ComponentFixture<HeaderMembreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderMembreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderMembreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
