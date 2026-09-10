import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EsConnection } from '../entities/esConnection';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
    protected http = inject(HttpClient);
  
    getHeader(connection: EsConnection): any {
      if (connection.Username && connection.Password) {
        return new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(connection.Username + ':' + connection.Password),
        });
      } else if (connection.ApiKey) {
        return new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': 'ApiKey ' + connection.ApiKey,
        });
      }
      return new HttpHeaders({
        'Content-Type': 'application/json',
      });
    }
}
