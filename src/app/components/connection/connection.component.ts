import { Component, effect, input, OnDestroy, signal } from '@angular/core';
import { ClusterService } from '../../services/cluster.service';
import { EsConnection } from '../../entities/esConnection';
import { ClusterStats } from '../../entities/clusterStats';
import { FormatBytesPipe } from '../../pipes/format-bytes.pipe';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { NodeService } from '../../services/node.service';
import { catchError, forkJoin, of, Subscription, switchMap, timer } from 'rxjs';
import { ClusterHealth } from '../../entities/clusterHealth';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';


@Component({
  selector: 'connection',
  imports: [TooltipModule, ProgressSpinnerModule, TitleCasePipe, DecimalPipe, FormatBytesPipe],
  templateUrl: './connection.component.html',
  styleUrl: './connection.component.css',
})
export class ConnectionComponent implements OnDestroy {

  connection = input<EsConnection>()
  clusterStats = signal<ClusterStats | null>(null);
  clusterHealth = signal<ClusterHealth | null>(null);
  loading = signal<boolean>(true);

  http = signal<number>(0);

  queryTotal = signal<number>(0);
  queryTime = signal<number>(0);

  indexTotal = signal<number>(0);
  indexTime = signal<number>(0);

  private subscription: Subscription | null = null;

  constructor(
    private elasticService: ClusterService,
    private nodeService: NodeService) {
    
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
    this.clusterStats.set(null);
    this.clusterHealth.set(null);
    this.http.set(0);
    this.queryTotal.set(0);
    this.queryTime.set(0);
    this.indexTotal.set(0);
    this.indexTime.set(0);

    // Start new subscription
    this.subscription = timer(0, 20000)
      .pipe(
        switchMap(() => {
          const clusterStatsRequest = this.elasticService.getClusterStats(this.connection()!);
          const nodesStatsRequest = this.nodeService.getNodesStats(this.connection()!);
          const clusterHealthRequest = this.elasticService.getClusterHealth(this.connection()!);

          return forkJoin({
            clusterStats: clusterStatsRequest,
            nodesStats: nodesStatsRequest,
            clusterHealth: clusterHealthRequest
          }).pipe(
            catchError(error => {
              console.error('There was an error!', error);
              return of(null);
            })
          );
        })

      ).subscribe((data: any) => {
        this.loading.set(false);
        this.http.set(0);
        this.queryTotal.set(0);
        this.queryTime.set(0);
        this.indexTotal.set(0);
        this.indexTime.set(0);

        this.clusterStats.set(data.clusterStats);
        this.clusterHealth.set(data.clusterHealth);
        for (const nodeId in data.nodesStats.nodes) {
          const node = data.nodesStats.nodes[nodeId];

          this.http.set(this.http() + node.http.current_open);

          this.queryTotal.set(this.queryTotal() + node.indices.search.query_total);
          this.queryTime.set(this.queryTime() + node.indices.search.query_time_in_millis);

          this.indexTotal.set(this.indexTotal() + node.indices.indexing.index_total);
          this.indexTime.set(this.indexTime() + node.indices.indexing.index_time_in_millis);
        }
      });
  }

}
