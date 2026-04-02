import { Injectable } from '@angular/core';
import { EsConnection } from '../entities/esConnection';
import { BaseService } from './base.service';
import { EsCircuitBreaker } from '../entities/esCircuitBreaker';

@Injectable({
  providedIn: 'root',
})
export class CircuitbreakerService extends BaseService {
  nodes : any[] = [];

  getGc(breaker: EsCircuitBreaker): any {
      var foundNodes = this.nodes.find(n => n.Node === breaker.Node && n.ConnectionId === breaker.ConnectionId);
      if (foundNodes) {
        return foundNodes;
      }
      else {      
        this.nodes.push({
          Node: breaker.Node,
          ConnectionId: breaker.ConnectionId,
          JvmGcCollectorsOldMillis: breaker.JvmGcCollectorsOldMillis,
          Timestamp: Date.now()
        });
        return undefined;
      }
    }

  getNodesStats(connection: EsConnection): any {
    return this.http.get<any>(connection.Host! + '/_nodes/stats', { headers: this.getHeader(connection) });
  }
}
