import { Component, effect, input, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EsConnection } from '../../entities/esConnection';
import { ClusterHealth } from '../../entities/clusterHealth';
import { catchError, forkJoin, of, Subscription, switchMap, timer } from 'rxjs';
import { ClusterService } from '../../services/cluster.service';
import { DecimalPipe } from '@angular/common';
import { ProgressSpinnerModule } from '@openng/optimus-ui/progressspinner';
import { TableModule } from '@openng/optimus-ui/table';
import { IconFieldModule } from '@openng/optimus-ui/iconfield';
import { InputIconModule } from '@openng/optimus-ui/inputicon';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { ShardService } from '../../services/shard.service';
import { EsShard } from '../../entities/esShard';
import { FormatBytesPipe } from '../../pipes/format-bytes.pipe';

@Component({
  selector: 'shard',
  imports: [ProgressSpinnerModule, DecimalPipe, TableModule, FormatBytesPipe, FormsModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './shard.component.html',
  styleUrl: './shard.component.css',
})
export class ShardComponent implements OnDestroy {
  connection = input<EsConnection>()
  clusterHealth = signal<ClusterHealth | null>(null);
  allShards = signal<EsShard[]>([]);
  filteredShards = signal<EsShard[]>([]);
  searchText: string = '';
  loading = signal<boolean>(true);

  private subscription: Subscription | null = null;

  constructor(private clusterService: ClusterService, private shardService: ShardService) {
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
    this.allShards.set([]);
    this.filteredShards.set([]);

    // Start new subscription
    this.subscription = timer(0, 20000)
      .pipe(
        switchMap(() => {
          return forkJoin({
            health: this.clusterService.getClusterHealth(this.connection()!),
            shards: this.shardService.getShards(this.connection()!),
          }).pipe(
            catchError(error => {
              console.error('There was an error!', error);
              return of(null);
            }),
          );
        })
      ).subscribe((data: any) => {
        this.loading.set(false);
        if (!data) {
          return;
        }

        this.clusterHealth.set(data.health);
        const items: EsShard[] = [];

        for (const shard of data.shards) {
          const item: EsShard = {
            Index: shard.index,
            Shard: shard.shard,
            PriRep: shard.prirep,
            Docs: Number(shard.docs) || 0,
            Store: Number(shard.store) || 0,
          }
          items.push(item);
        }
        this.allShards.set(items.sort((a, b) => b.Docs - a.Docs || b.Store - a.Store));
        this.filterShards();
      });
  }

  onSearchChange(): void {
    this.filterShards();
  }

  clearSearch(): void {
    this.searchText = '';
    this.filterShards();
  }

  private filterShards(): void {
    const searchText = this.searchText.trim().toLowerCase();
    this.filteredShards.set(this.allShards().filter(shard =>
      shard.Index.toLowerCase().includes(searchText)
    ));
  }
}
