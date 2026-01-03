import { Component, input, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { EsIndex } from '../../entities/esIndex';
import { IndexService } from '../../services/index.service';
import { EsConnection } from '../../entities/esConnection';
import { FormatBytesPipe } from '../../pipes/format-bytes.pipe';
import { catchError, forkJoin, of, switchMap, timer } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'index',
  imports: [DecimalPipe, FormatBytesPipe, TableModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent implements OnInit {
  connection = input<EsConnection>()
  indices = signal<EsIndex[]>([]);

  constructor(private indexService: IndexService) {

  }

  ngOnInit(): void {
    timer(0, 10000)
      .pipe(
        switchMap(() => {
          const statsRequest = this.indexService.getStats(this.connection()!);
          const catIndicesRequest = this.indexService.getCatIndices(this.connection()!);

          return forkJoin({
            stats: statsRequest,
            catIndices: catIndicesRequest
          }).pipe(
            catchError(error => {
              console.error('There was an error!', error);
              return of(null);
            })
          );
        })
      ).subscribe((data:any) => {
        const items: EsIndex[] = [];
        for (const indexName in data.stats.indices) {
          if (indexName.startsWith('.')) {
            continue;
          }
          const item = data.stats.indices[indexName];
          const index: EsIndex = {
            Name: indexName,
            Documents: item.primaries.docs.count,
            Size: item.primaries.store.size_in_bytes,
            Shards: item.primaries.shard_stats.total_count,
            Replicas: data.catIndices.find((catIndex: any) => catIndex.index === indexName)?.rep ?? 0,
            ConnectionId: this.connection()!.Id,
            Ingested: 0
          };
          const cacheItem = this.indexService.getIngested(index);
          if (cacheItem && cacheItem.Documents != index.Documents) {
            index.Ingested = index.Documents - cacheItem.Documents;
            index.Rate = index.Ingested / (Date.now() - cacheItem.Timestamp) * 1000;
          }
          items.push(index);
        }
        this.indices.set(items.sort((a, b) => a.Name.localeCompare(b.Name)));
      });
  }

}
