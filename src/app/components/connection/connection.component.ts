import { Component, input, OnInit, signal } from '@angular/core';
import { ClusterService } from '../../services/cluster.service';
import { EsConnection } from '../../entities/esConnection';
import { ClusterStats } from '../../entities/clusterStats';
import { FormatBytesPipe } from '../../pipes/format-bytes.pipe';
import { DecimalPipe } from '@angular/common';
import { NodeService } from '../../services/node.service';
import { catchError, forkJoin, of, switchMap, timer } from 'rxjs';
import { ClusterHealth } from '../../entities/clusterHealth';

@Component({
  selector: 'connection',
  imports: [DecimalPipe, FormatBytesPipe],
  templateUrl: './connection.component.html',
  styleUrl: './connection.component.css',
})
export class ConnectionComponent implements OnInit {

  connection = input<EsConnection>()
  clusterStats = signal<ClusterStats | null>(null);
  clusterHealth = signal<ClusterHealth | null>(null);

  http = signal<number>(0);

  queryTotal = signal<number>(0);
  queryTime = signal<number>(0);

  indexTotal = signal<number>(0);
  indexTime = signal<number>(0);

  constructor(
    private elasticService: ClusterService,
    private nodeService: NodeService) {

  }

  ngOnInit(): void {
    timer(0, 10000)
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
