import { Injectable, signal } from '@angular/core';
import { EsConnection } from '../entities/esConnection';

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  items = signal<EsConnection[]>([]);

  constructor() {
    const data = localStorage.getItem('elasmon');
    if (data) {
      const connections: EsConnection[] = JSON.parse(data);
      this.items.set(connections);
    }
  }

  save() {
    localStorage.setItem('elasmon', JSON.stringify(this.items()));
  }
}
