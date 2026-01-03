import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { EsConnection } from '../entities/esConnection';
import { Stats } from '../entities/stats';
import { EsIndex } from '../entities/esIndex';

@Injectable({
  providedIn: 'root',
})
export class IndexService extends BaseService {
  indices: any[] = [];

  getIngested(index: EsIndex): any {
    var foundIndices = this.indices.find(idx => idx.Name === index.Name && idx.ConnectionId === index.ConnectionId);
    if (foundIndices) {
      return foundIndices;
    }
    else {      
      this.indices.push({
        Name: index.Name,
        ConnectionId: index.ConnectionId,
        Documents: index.Documents,
        Ingested: 0,
        Timestamp: Date.now()
      });
      return undefined;
    }
  }

  getStats(connection: EsConnection): any {
    return this.http.get<any>(connection.Host! + '/_stats', { headers: this.getHeader(connection) });
  }

  getCatIndices(connection: EsConnection): any {
    return this.http.get<any>(connection.Host! + '/_cat/indices?format=json', { headers: this.getHeader(connection) });
  }
}
