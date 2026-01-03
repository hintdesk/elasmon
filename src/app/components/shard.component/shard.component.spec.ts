import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShardComponent } from './shard.component';

describe('ShardComponent', () => {
  let component: ShardComponent;
  let fixture: ComponentFixture<ShardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
