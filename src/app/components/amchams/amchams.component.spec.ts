import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmchamsComponent } from './amchams.component';

describe('AmchamsComponent', () => {
  let component: AmchamsComponent;
  let fixture: ComponentFixture<AmchamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmchamsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmchamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
