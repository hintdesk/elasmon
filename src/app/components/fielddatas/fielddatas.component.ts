import { Component, effect, input, OnDestroy, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { EsConnection } from '../../entities/esConnection';
import { EsFieldData } from '../../entities/esFieldData';
import { catchError, forkJoin, of, Subscription, switchMap, timer } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FielddataService } from '../../services/fielddata.service';
import { FormatBytesPipe } from '../../pipes/format-bytes.pipe';
import { NodeService } from '../../services/node.service';

@Component({
  selector: 'fielddata',
  imports: [FormatBytesPipe, ProgressSpinnerModule, TableModule],
  templateUrl: './fielddatas.component.html',
  styleUrl: './fielddatas.component.css',
})
export class FieldDataComponent implements OnDestroy {
  connection = input<EsConnection>();
  fielddatas = signal<EsFieldData[]>([]);
  loading = signal<boolean>(true);

  private subscription: Subscription | null = null;

  constructor(
    private fielddataService: FielddataService,
    private nodeService: NodeService
  ) {
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
    this.stopTimer();

    this.loading.set(true);
    this.fielddatas.set([]);

    this.subscription = timer(0, 20000)
      .pipe(
        switchMap(() => {
          return forkJoin({
            fielddatas: this.fielddataService.getFielddatas(this.connection()!),
            nodeStats: this.nodeService.getNodesStats(this.connection()!)
          })
            .pipe(
              catchError(error => {
                console.error('There was an error!', error);
                return of({ fielddatas: [], nodeStats: {} });
              })
            );
        })
      )
      .subscribe((data: any) => {
        this.loading.set(false);

        const nodeMap = data?.nodeStats?.nodes ?? {};
        const items: EsFieldData[] = [];

        for (const item of data?.fielddatas ?? []) {
          const size = Number(item.size);
          const fielddataBreaker = nodeMap[item.id]?.breakers?.fielddata;
          const limit = Number(fielddataBreaker?.limit_size_in_bytes);
          const estimate = Number(fielddataBreaker?.estimated_size_in_bytes);

          items.push({
            Node: item.node ?? '',
            Field: item.field ?? '',
            Size: Number.isFinite(size) ? size : 0,
            Limit: Number.isFinite(limit) ? limit : 0,
            Estimate: Number.isFinite(estimate) ? estimate : 0
          })
        }

        this.fielddatas.set(items);
      });
  }
}
