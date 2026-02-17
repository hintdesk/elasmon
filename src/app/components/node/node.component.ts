import { Component, computed, effect, input, OnDestroy, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { EsConnection } from '../../entities/esConnection';
import { NodeService } from '../../services/node.service';
import { EsNode } from '../../entities/esNode';
import { DecimalPipe } from '@angular/common';
import { MsToDaysHoursPipe } from '../../pipes/ms-to-days-hours.pipe';
import { catchError, of, Subscription, switchMap, timer } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormatBytesPipe } from '../../pipes/format-bytes.pipe';

@Component({
  selector: 'node',
  imports: [FormatBytesPipe, ProgressSpinnerModule, MsToDaysHoursPipe, DecimalPipe, TableModule, TooltipModule],
  templateUrl: './node.component.html',
  styleUrl: './node.component.css',
})
export class NodeComponent implements OnDestroy {
  connection = input<EsConnection>()
  nodes = signal<EsNode[]>([]);
  loading = signal<boolean>(true);
  hasSearchRejected = computed(() => this.nodes().some(n => n.ThreadPoolSearchRejected > 0));
  hasWriteRejected = computed(() => this.nodes().some(n => n.ThreadPoolWriteRejected > 0));

  private subscription: Subscription | null = null;

  constructor(private nodeService: NodeService) {
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
    this.nodes.set([]);

    // Start new subscription
    this.subscription = timer(0, 20000)
      .pipe(
        switchMap(() => {
          return this.nodeService.getNodesStats(this.connection()!)
            .pipe(
              catchError(error => {
                console.error('There was an error!', error);
                return of(null);
              })
            );
        })
      )
      .subscribe((data: any) => {
        this.loading.set(false);
        const items: EsNode[] = [];

        for (const nodeId in data.nodes) {
          const node = data.nodes[nodeId];
          items.push({
            Name: node.name,
            Cpu: node.os.cpu.percent,
            Memory: node.os.mem.used_percent,
            Heap: node.jvm.mem.heap_used_percent,
            Disk: (1 - node.fs.total.available_in_bytes / node.fs.total.total_in_bytes) * 100,
            ThreadPoolSearchRejected: node.thread_pool.search.rejected,
            ThreadPoolWriteRejected: node.thread_pool.write.rejected,
            TotalShards: node.indices.shard_stats.total_count,
            ShardsPerGBHeap: node.indices.shard_stats.total_count / (node.jvm.mem.heap_max_in_bytes / (1024 * 1024 * 1024)),
            Uptime: node.jvm.uptime_in_millis,
            HeapMaxInBytes: node.jvm.mem.heap_max_in_bytes,
            MemTotalInBytes: node.os.mem.total_in_bytes,
            IndexingRate: (node.indices?.indexing?.index_total && node.indices?.indexing?.index_time_in_millis)
              ? node.indices.indexing.index_total / (node.indices.indexing.index_time_in_millis / 1000)
              : undefined,
            SearchRate: (node.indices?.search?.query_total && node.indices?.search?.query_time_in_millis)
              ? node.indices.search.query_total / (node.indices.search.query_time_in_millis / 1000)
              : undefined,
            IndexingLatency: (node.indices?.indexing?.index_time_in_millis && node.indices?.indexing?.index_total)
              ? node.indices.indexing.index_time_in_millis / node.indices.indexing.index_total
              : undefined,
            SearchLatency: (node.indices?.search?.query_time_in_millis && node.indices?.search?.query_total)
              ? node.indices.search.query_time_in_millis / node.indices.search.query_total
              : undefined,
          })
        }
        this.nodes.set([...items.sort((a, b) => a.Name.localeCompare(b.Name))]);
      });
  }
}


