import { Injectable } from '@angular/core';
import { EsConnection } from '../entities/esConnection';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class NodeService extends BaseService {
  getNodesStats(connection: EsConnection): any {
    return this.http.get<any>(connection.Host! + '/_nodes/stats', { headers: this.getHeader(connection) });
  }
}
