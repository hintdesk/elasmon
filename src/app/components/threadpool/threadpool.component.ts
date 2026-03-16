import { Component, effect, input, OnDestroy, signal } from '@angular/core';
import { EsConnection } from '../../entities/esConnection';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { catchError, of, Subscription, switchMap, timer } from 'rxjs';
import { ThreadpoolService } from '../../services/threadpool.service';
import { EsThreadPool } from '../../entities/esThreadPool';

@Component({
  selector: 'threadpool',
  imports: [ProgressSpinnerModule, TableModule],
  templateUrl: './threadpool.component.html',
  styleUrl: './threadpool.component.css',
})
export class Threadpool implements OnDestroy {
  connection = input<EsConnection>();
  threadPools = signal<EsThreadPool[]>([]);
  loading = signal<boolean>(true);

  private subscription: Subscription | null = null;

  constructor(private threadpoolService: ThreadpoolService) {
    effect(() => {
      const conn = this.connection();
      if (conn) {
        this.resetAndLoad();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private stopTimer(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  private resetAndLoad(): void {
    // Cancel previous subscription
    this.stopTimer();

    // Reset all data and show loading
    this.loading.set(true);
    this.threadPools.set([]);

    // Start new subscription
    this.subscription = timer(0, 20000)
      .pipe(
        switchMap(() => {
          return this.threadpoolService.getThreadPools(this.connection()!).pipe(
            catchError(error => {
              console.error('There was an error!', error);
              return of<any[] | null>(null);
            })
          );
        })
      )
      .subscribe((data: any[] | null) => {
        this.loading.set(false);

        if (!data) {
          this.threadPools.set([]);
          return;
        }

        const items: EsThreadPool[] = data.map(item => ({
          Node: item.node_name,
          Name: item.name,
          Active: Number(item.active),
          Queue: Number(item.queue),
          Rejected: Number(item.rejected),
        }));

        this.threadPools.set(items);
      });
  }
}
