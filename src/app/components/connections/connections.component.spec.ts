import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionsComponent } from './connections.component';

describe('ConnectionsComponent', () => {
  let component: ConnectionsComponent;
  let fixture: ComponentFixture<ConnectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectionsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
