import { Injectable } from '@angular/core';
import { EsConnection } from '../entities/esConnection';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class FielddataService extends BaseService {
  getFielddatas(connection: EsConnection): any {
    return this.http.get<any>(connection.Host! + '/_cat/fielddata?v&s=size:desc&format=json&bytes=b', {
      headers: this.getHeader(connection)
    });
  }
}
