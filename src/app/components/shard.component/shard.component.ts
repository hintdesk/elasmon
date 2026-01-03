import { Component, input, OnInit, signal } from '@angular/core';
import { EsConnection } from '../../entities/esConnection';
import { ClusterHealth } from '../../entities/clusterHealth';
import { catchError, of, switchMap, timer } from 'rxjs';
import { ClusterService } from '../../services/cluster.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'shard',
  imports: [DecimalPipe],
  templateUrl: './shard.component.html',
  styleUrl: './shard.component.css',
})
export class ShardComponent implements OnInit {
  connection = input<EsConnection>()
  clusterHealth = signal<ClusterHealth | null>(null);

  constructor(private clusterService: ClusterService) { }

  ngOnInit(): void {
    timer(0, 10000)
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
      ).subscribe((data:any) => {
        this.clusterHealth.set(data);
      });
  }
}
