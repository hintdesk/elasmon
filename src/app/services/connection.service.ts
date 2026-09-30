import { Injectable, signal } from '@angular/core';
import { EsConnection } from '../entities/esConnection';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ConnectionService extends BaseService {
  items = signal<EsConnection[]>([]);

  constructor() {
    super();
    const data = localStorage.getItem('elasmon');
    if (data) {
      const connections: EsConnection[] = JSON.parse(data);
      this.items.set(connections);
    }
  }

  save() {
    localStorage.setItem('elasmon', JSON.stringify(this.items()));
  }

  check(url: string, username: string, password: string, apiKey: string): any {
    const connection = { Host: url, Username: username, Password: password, ApiKey: apiKey } as EsConnection;
    const host = url.endsWith('/') ? url.slice(0, -1) : url;
    return this.http.get(host + '/', { headers: this.getHeader(connection), observe: 'response' });
  }
}
