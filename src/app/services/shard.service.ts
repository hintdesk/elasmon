import { Injectable } from '@angular/core';
import { EsConnection } from '../entities/esConnection';
import { BaseService } from './base.service';
import { of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShardService extends BaseService {

  getShards(connection: EsConnection) {
    return this.http.get<Array<{ index: string }>>(
      connection.Host! + '/_cat/indices?format=json',
      { headers: this.getHeader(connection) },
    ).pipe(
      switchMap(indices => {
        if (indices.length === 0) {
          return of([] as []);
        }

        const indexList = indices.map(({ index }) => encodeURIComponent(index)).join(',');
        return this.http.get<any>(
          connection.Host! + `/_cat/shards/${indexList}?v=true&h=index,shard,prirep,docs,store&bytes=b&format=json`,
          { headers: this.getHeader(connection) },
        );
      }),
    );
  }
}