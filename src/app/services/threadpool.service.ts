import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EsConnection } from '../entities/esConnection';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ThreadpoolService extends BaseService {
  getThreadPools(connection: EsConnection): Observable<any[]> {
    return this.http.get<any[]>(connection.Host + '/_cat/thread_pool?format=json&s=rejected:desc,queue:desc,active:desc,node_name:asc,name:asc', {
      headers: this.getHeader(connection),
    });
  }
}
