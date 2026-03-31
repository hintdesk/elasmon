import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ThreadpoolComponent } from './threadpool.component';

describe('ThreadpoolComponent', () => {
  let component: ThreadpoolComponent;
  let fixture: ComponentFixture<ThreadpoolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadpoolComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreadpoolComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
