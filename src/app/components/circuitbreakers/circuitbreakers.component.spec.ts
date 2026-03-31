import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircuitbreakersComponent } from './circuitbreakers.component';

describe('CircuitbreakersComponent', () => {
  let component: CircuitbreakersComponent;
  let fixture: ComponentFixture<CircuitbreakersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircuitbreakersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircuitbreakersComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
