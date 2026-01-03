import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionComponent } from './connection.component';

describe('ConnectionComponent', () => {
  let component: ConnectionComponent;
  let fixture: ComponentFixture<ConnectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
