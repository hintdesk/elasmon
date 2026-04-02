import { Component, effect, input, OnDestroy, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { catchError, of, Subscription, switchMap, timer } from 'rxjs';
import { EsConnection } from '../../entities/esConnection';
import { EsCircuitBreaker } from '../../entities/esCircuitBreaker';
import { NodeService } from '../../services/node.service';
import { CircuitbreakerService } from '../../services/circuitbreaker.service';

@Component({
  selector: 'circuitbreakers',
  imports: [ProgressSpinnerModule, DecimalPipe, TableModule, TooltipModule],
  templateUrl: './circuitbreakers.component.html',
  styleUrl: './circuitbreakers.component.css',
})
export class CircuitbreakersComponent implements OnDestroy {
  connection = input<EsConnection>();
  breakers = signal<EsCircuitBreaker[]>([]);
  loading = signal<boolean>(true);

  private subscription: Subscription | null = null;

  constructor(
    private circuitbreakerService: CircuitbreakerService) {
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

  private calculatePercent(breaker?: any): number {
    const limit = breaker?.limit_size_in_bytes;
    if (!limit || limit <= 0) {
      return 0;
    }

    const estimated = breaker?.estimated_size_in_bytes ?? 0;
    return (estimated / limit) * 100;
  }

  private resetAndLoad(): void {
    this.stopTimer();
    this.loading.set(true);
    this.breakers.set([]);

    this.subscription = timer(0, 20000)
      .pipe(
        switchMap(() => {
          return this.circuitbreakerService.getNodesStats(this.connection()!).pipe(
            catchError((error) => {
              console.error('There was an error!', error);
              return of(null);
            })
          );
        })
      )
      .subscribe((data: any) => {
        this.loading.set(false);

        if (!data?.nodes) {
          this.breakers.set([]);
          return;
        }

        const items: EsCircuitBreaker[] = [];
        for (const nodeId in data.nodes) {
          const node = data.nodes[nodeId];
          const breakers = node.breakers ?? {};

          

          const breaker: EsCircuitBreaker = {
            Node: node.name,
            ConnectionId: this.connection()!.Id,
            ParentTripped: breakers.parent?.tripped ?? 0,
            ParentPercent: this.calculatePercent(breakers.parent),
            FielddataTripped: breakers.fielddata?.tripped ?? 0,
            FielddataPercent: this.calculatePercent(breakers.fielddata),
            InflightRequestsTripped: breakers.inflight_requests?.tripped ?? 0,
            InflightRequestsPercent: this.calculatePercent(breakers.inflight_requests),
            JvmGcCollectorsOldMillis: node.jvm?.gc?.collectors?.old?.collection_time_in_millis ?? 0,
            GcPercent: 0
          }

          const cacheItem = this.circuitbreakerService.getGc(breaker);
          if (cacheItem) {
            const deltaGC = breaker.JvmGcCollectorsOldMillis - cacheItem.JvmGcCollectorsOldMillis;
            const deltaTime = Date.now() - cacheItem.Timestamp;
            if (deltaTime > 0) {
              breaker.GcPercent = (deltaGC / deltaTime) * 100;
            }
          }
          items.push(breaker);
        }

        this.breakers.set([...items.sort((a, b) => a.Node.localeCompare(b.Node))]);
      });
  }

}
