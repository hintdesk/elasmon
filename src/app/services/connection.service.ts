import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
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

  async check(url: string, username: string, password: string, apiKey: string): Promise<boolean> {
    const connection = { Host: url, Username: username, Password: password, ApiKey: apiKey } as EsConnection;
    const host = url.endsWith('/') ? url.slice(0, -1) : url;
    try {
      await firstValueFrom(this.http.get(host + '/', { headers: this.getHeader(connection) }));
      return true;
    } catch {
      return false;
    }
  }
}
