import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Threadpool } from './threadpool.component';

describe('Threadpool', () => {
  let component: Threadpool;
  let fixture: ComponentFixture<Threadpool>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Threadpool],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Threadpool);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
