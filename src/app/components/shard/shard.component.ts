import { Component, effect, input, OnDestroy, signal } from '@angular/core';
import { EsConnection } from '../../entities/esConnection';
import { ClusterHealth } from '../../entities/clusterHealth';
import { catchError, of, Subscription, switchMap, timer } from 'rxjs';
import { ClusterService } from '../../services/cluster.service';
import { DecimalPipe } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'shard',
  imports: [ProgressSpinnerModule, DecimalPipe],
  templateUrl: './shard.component.html',
  styleUrl: './shard.component.css',
})
export class ShardComponent implements OnDestroy {
  connection = input<EsConnection>()
  clusterHealth = signal<ClusterHealth | null>(null);
  loading = signal<boolean>(true);

  private subscription: Subscription | null = null;

  constructor(private clusterService: ClusterService) {
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
    this.clusterHealth.set(null);

    // Start new subscription
    this.subscription = timer(0, 20000)
      .pipe(
        switchMap(() => {
          return this.clusterService.getClusterHealth(this.connection()!)
            .pipe(
              catchError(error => {
                console.error('There was an error!', error);
                return of(null);
              })
            );
        })
      ).subscribe((data: any) => {
        this.loading.set(false);
        this.clusterHealth.set(data);
      });
  }
}
