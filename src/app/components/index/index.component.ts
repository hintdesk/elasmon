import { Component, effect, input, OnDestroy, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { EsIndex } from '../../entities/esIndex';
import { IndexService } from '../../services/index.service';
import { EsConnection } from '../../entities/esConnection';
import { FormatBytesPipe } from '../../pipes/format-bytes.pipe';
import { catchError, forkJoin, of, Subscription, switchMap, timer } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'index',
  imports: [InputIconModule, IconFieldModule, InputTextModule, TooltipModule, ProgressSpinnerModule, FormsModule, ToggleSwitchModule, DecimalPipe, FormatBytesPipe, TableModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent implements OnDestroy {
  connection = input<EsConnection>()
  indices = signal<EsIndex[]>([]);
  allIndices: EsIndex[] = [];
  showHidden: boolean = false;
  searchText: string = '';
  loading = signal<boolean>(true);

  private subscription: Subscription | null = null;

  constructor(private indexService: IndexService) {
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
    this.allIndices = [];
    this.indices.set([]);

    // Start new subscription
    this.subscription = timer(0, 20000)
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
      ).subscribe((data: any) => {
        this.loading.set(false);
        const items: EsIndex[] = [];
        for (const indexName in data.stats.indices) {
          const item = data.stats.indices[indexName];
          const index: EsIndex = {
            Name: indexName,
            Documents: item.primaries.docs.count,
            Size: item.primaries.store.size_in_bytes,
            Shards: item.primaries.shard_stats.total_count,
            GBPerShard: (item.primaries.store.size_in_bytes / (1024 * 1024 * 1024)) / item.primaries.shard_stats.total_count,
            Replicas: data.catIndices.find((catIndex: any) => catIndex.index === indexName)?.rep ?? 0,
            ConnectionId: this.connection()!.Id,
            IndexingRate: (item.total?.indexing?.index_total && item.total?.indexing?.index_time_in_millis) 
              ? item.total.indexing.index_total / (item.total.indexing.index_time_in_millis / 1000) 
              : undefined,
            SearchRate: (item.total?.search?.query_total && item.total?.search?.query_time_in_millis) 
              ? item.total.search.query_total / (item.total.search.query_time_in_millis / 1000) 
              : undefined,
            IndexingLatency: (item.total?.indexing?.index_time_in_millis && item.total?.indexing?.index_total) 
              ? item.total.indexing.index_time_in_millis / item.total.indexing.index_total 
              : undefined,
            SearchLatency: (item.total?.search?.query_time_in_millis && item.total?.search?.query_total) 
              ? item.total.search.query_time_in_millis / item.total.search.query_total 
              : undefined
          };
          // const cacheItem = this.indexService.getIngested(index);
          // if (cacheItem && cacheItem.Documents != index.Documents) {
          //   index.Ingested = index.Documents - cacheItem.Documents;
          //   index.Rate = index.Ingested / (Date.now() - cacheItem.Timestamp) * 1000;
          // }
          items.push(index);
        }
        this.allIndices = items.sort((a, b) => a.Name.localeCompare(b.Name));
        this.filterIndices();
      });
  }

  showHiddenIndices(event: any) {
    this.showHidden = event.checked;
    this.filterIndices();
  }

  onSearchChange() {
    this.filterIndices();
  }

  clearSearch() {
    this.searchText = '';
    this.filterIndices();
  }

  private filterIndices() {
    let filtered = this.allIndices;
    
    // Filter by hidden indices
    if (!this.showHidden) {
      filtered = filtered.filter(index => !index.Name.startsWith('.'));
    }
    
    // Filter by search text
    if (this.searchText && this.searchText.trim() !== '') {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(index => index.Name.toLowerCase().includes(searchLower));
    }
    
    this.indices.set(filtered);
  }

}
