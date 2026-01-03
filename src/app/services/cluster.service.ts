import { Injectable } from '@angular/core';
import { EsConnection } from '../entities/esConnection';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ClusterService extends BaseService {

  getClusterStats(connection: EsConnection): any {
    return this.http.get<any>(connection.Host! + '/_cluster/stats', { headers: this.getHeader(connection) });
  }
  
  getClusterHealth(connection: EsConnection): any {
    return this.http.get<any>(connection.Host! + '/_cluster/health', { headers: this.getHeader(connection) });
  }
}
