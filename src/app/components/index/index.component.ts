import { Component, effect, input, OnDestroy, signal } from '@angular/core';
import { TableModule } from '@openng/optimus-ui/table';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { CheckboxModule } from '@openng/optimus-ui/checkbox';
import { EsIndex } from '../../entities/esIndex';
import { IndexService } from '../../services/index.service';
import { EsConnection } from '../../entities/esConnection';
import { FormatBytesPipe } from '../../pipes/format-bytes.pipe';
import { catchError, forkJoin, of, Subscription, switchMap, timer } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { ToggleSwitchModule } from '@openng/optimus-ui/toggleswitch';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from '@openng/optimus-ui/progressspinner';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { IconFieldModule } from '@openng/optimus-ui/iconfield';
import { InputIconModule } from '@openng/optimus-ui/inputicon';

@Component({
  selector: 'index',
  imports: [InputIconModule, IconFieldModule, InputTextModule, TooltipModule, ProgressSpinnerModule, FormsModule, ToggleSwitchModule, DecimalPipe, FormatBytesPipe, TableModule, ButtonModule, DialogModule, CheckboxModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent implements OnDestroy {
  readonly columnDefinitions: IndexColumn[] = [
    { field: 'Name', label: 'Name' },
    { field: 'Documents', label: 'Documents' },
    { field: 'Size', label: 'Size', tooltip: 'Total size of index (primary only)' },
    { field: 'Shards', label: 'Shards' },
    { field: 'GBPerShard', label: 'GB/Shard', tooltip: 'Number of GB per Shard. The rate should be less than 50.' },
    { field: 'Replicas', label: 'Replicas' },
    { field: 'FieldCount', label: 'Field Count', tooltip: 'Number of fields (system fields not included). The count should be less than 1000.' },
    { field: 'IndexingRate', label: 'Indexing Rate', tooltip: 'Number of documents indexed per second' },
    { field: 'SearchRate', label: 'Search Rate', tooltip: 'Number of search queries per second' },
    { field: 'IndexingLatency', label: 'Indexing Latency', tooltip: 'Average time to index a document (ms)' },
    { field: 'SearchLatency', label: 'Search Latency', tooltip: 'Average time to execute a search (ms)' },
    { field: 'Alias', label: 'Alias' },
  ];
  connection = input<EsConnection>()
  indices = signal<EsIndex[]>([]);
  allIndices: EsIndex[] = [];
  showHidden: boolean = false;
  searchText: string = '';
  loading = signal<boolean>(true);
  visibleColumns: IndexColumn[] = [];
  columnSelections: IndexColumn[] = [];
  isColumnsDialogVisible = false;

  private readonly columnsStorageKey = 'elasmon.index.visibleColumns';

  private subscription: Subscription | null = null;

  constructor(private indexService: IndexService) {
    this.visibleColumns = this.loadVisibleColumns();
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
          const mappingRequest = this.indexService.getMapping(this.connection()!);
          const aliasesRequest = this.indexService.getAliases(this.connection()!);

          return forkJoin({
            stats: statsRequest,
            catIndices: catIndicesRequest,
            mapping: mappingRequest,
            aliases: aliasesRequest
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
            Alias: data.aliases?.[indexName]?.aliases
              ? Object.keys(data.aliases[indexName].aliases)
              : [],
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
              : undefined,
            FieldCount: data.mapping?.[indexName]?.mappings?.properties
              ? this.countFields(data.mapping[indexName].mappings.properties)
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

  isColumnVisible(field: string): boolean {
    return this.visibleColumns.some(column => column.field === field);
  }

  openColumnsDialog(): void {
    this.columnSelections = this.columnDefinitions.map(column => ({
      ...column,
      selected: this.visibleColumns.some(visibleColumn => visibleColumn.field === column.field),
    }));
    this.isColumnsDialogVisible = true;
  }

  selectAllColumns(): void {
    this.columnSelections = this.columnSelections.map(column => ({ ...column, selected: true }));
  }

  applyColumnSelection(): void {
    this.visibleColumns = this.columnSelections
      .filter(column => column.selected)
      .map(column => ({ ...column }));
    localStorage.setItem(this.columnsStorageKey, JSON.stringify(this.visibleColumns.map(column => column.field)));
    this.isColumnsDialogVisible = false;
  }

  private loadVisibleColumns(): IndexColumn[] {
    try {
      const storedFields = JSON.parse(localStorage.getItem(this.columnsStorageKey) || 'null');
      if (Array.isArray(storedFields)) {
        return this.columnDefinitions.filter(column => storedFields.includes(column.field));
      }
    } catch {
      // Use the default column selection when localStorage contains invalid data.
    }
    return this.columnDefinitions.map(column => ({ ...column, selected: true }));
  }

  private countFields(properties: Record<string, any>): number {
    return Object.values(properties).reduce((sum: number, prop: any) => {
      // Skip properties with type "object"
      if (prop.type === "object") {
        return sum;
      }
      const fieldsCount = prop.fields ? Object.keys(prop.fields).length : 0;
      const subPropsCount = prop.properties ? this.countFields(prop.properties) : 0;
      return sum + (subPropsCount > 0 ? fieldsCount + subPropsCount : 1 + fieldsCount);
    }, 0);
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
      filtered = filtered.filter(index => 
        index.Name.toLowerCase().includes(searchLower) || 
        (index.Alias && index.Alias.some(alias => alias.toLowerCase().includes(searchLower)))
      );
    }
    
    this.indices.set(filtered);
  }

}

interface IndexColumn {
  field: string;
  label: string;
  tooltip?: string;
  selected?: boolean;
}
