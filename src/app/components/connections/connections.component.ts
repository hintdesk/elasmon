import { Component, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { EsConnection } from '../../entities/esConnection';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule, NgForm } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ConnectionService } from '../../services/connection.service';

@Component({
  selector: 'connections',
  imports: [InputTextModule, FormsModule, DialogModule, ButtonModule, TableModule],
  templateUrl: './connections.component.html',
  styleUrl: './connections.component.css',
})
export class ConnectionsComponent {
  connections = signal<EsConnection[]>([]);
  isVisible: boolean = false;
  name: string = "";
  host: string = "";
  username: string = "";
  password: string = "";

  constructor(private connectionService: ConnectionService) {
    this.connections = this.connectionService.items;
  }

  newConnection() {
    this.isVisible = true;
  }

  save(form: NgForm) {
    if (form.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }
    
    // Form is valid, proceed with save
    const host = this.host.endsWith('/') ? this.host.slice(0, -1) : this.host;
    const newConnection: EsConnection = {
      Id: crypto.randomUUID(),
      Name: this.name,
      Host: host,
      Username: this.username,
      Password: this.password
    };
    this.connections.update(connections => [...connections, newConnection]);
    this.connectionService.save();
    form.resetForm();
    this.isVisible = false;
  }

  cancel(form: NgForm) {
    form.resetForm();
    this.isVisible = false;
  }

  delete(connection: EsConnection) {
    this.connections.update(connections => connections.filter(c => c.Id !== connection.Id));
    this.connectionService.save();
  }

  moveUp(connection: EsConnection) {
    const currentConnections = this.connections();
    const index = currentConnections.findIndex(c => c.Id === connection.Id);
    
    if (index > 0) {
      const newConnections = [...currentConnections];
      [newConnections[index], newConnections[index - 1]] = [newConnections[index - 1], newConnections[index]];
      this.connections.set(newConnections);
      this.connectionService.save();
    }
  }

  moveDown(connection: EsConnection) {
    const currentConnections = this.connections();
    const index = currentConnections.findIndex(c => c.Id === connection.Id);
    
    if (index < currentConnections.length - 1) {
      const newConnections = [...currentConnections];
      [newConnections[index], newConnections[index + 1]] = [newConnections[index + 1], newConnections[index]];
      this.connections.set(newConnections);
      this.connectionService.save();
    }
  }

  isFirstItem(connection: EsConnection): boolean {
    return this.connections()[0]?.Id === connection.Id;
  }

  isLastItem(connection: EsConnection): boolean {
    const connections = this.connections();
    return connections[connections.length - 1]?.Id === connection.Id;
  }
}
