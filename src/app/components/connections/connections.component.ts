import { Component, signal } from '@angular/core';
import { TableModule } from '@openng/optimus-ui/table';
import { EsConnection } from '../../entities/esConnection';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { FormsModule, NgForm } from '@angular/forms';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { ConnectionService } from '../../services/connection.service';
import { PasswordModule } from '@openng/optimus-ui/password';

@Component({
  selector: 'connections',
  imports: [InputTextModule, PasswordModule, FormsModule, DialogModule, ButtonModule, TableModule],
  templateUrl: './connections.component.html',
  styleUrl: './connections.component.css',
})
export class ConnectionsComponent {
  connections = signal<EsConnection[]>([]);
  isVisible: boolean = false;
  editingConnectionId: string | null = null;
  name: string = "";
  host: string = "";
  username: string = "";
  password: string = "";
  apiKey: string = "";

  constructor(private connectionService: ConnectionService) {
    this.connections = this.connectionService.items;
  }

  newConnection() {
    this.editingConnectionId = null;
    this.name = '';
    this.host = '';
    this.username = '';
    this.password = '';
    this.apiKey = '';
    this.isVisible = true;
  }

  editConnection(connection: EsConnection) {
    this.editingConnectionId = connection.Id;
    this.name = connection.Name;
    this.host = connection.Host;
    this.username = connection.Username || '';
    this.password = '';
    this.apiKey = connection.ApiKey || '';
    this.isVisible = true;
  }

  get dialogHeader(): string {
    return this.editingConnectionId ? 'Edit Connection' : 'New Connection';
  }

  onApiKeyChange() {
    if (this.apiKey) {
      this.username = '';
      this.password = '';
    }
  }

  onUsernameChange() {
    if (this.username) {
      this.apiKey = '';
    }
  }

  onPasswordChange() {
    if (this.password) {
      this.apiKey = '';
    }
  }

  isPasswordRequired(): boolean {
    if (this.apiKey) {
      return false;
    }
    if (!this.editingConnectionId) {
      return true;
    }
    const existing = this.connections().find(c => c.Id === this.editingConnectionId);
    return !existing?.Password;
  }

  isBase64(value: string): boolean {
    if (!value || value.trim() === '') {
      return true;
    }
    const trimmed = value.trim();
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    const base64UrlRegex = /^(?:[A-Za-z0-9-_]{4})*(?:[A-Za-z0-9-_]{2}==|[A-Za-z0-9-_]{3}=)?$/;
    if (!base64Regex.test(trimmed) && !base64UrlRegex.test(trimmed)) {
      return false;
    }
    try {
      const normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');
      return btoa(atob(normalized)) === normalized;
    } catch {
      return false;
    }
  }

  save(form: NgForm) {
    if (this.apiKey && !this.isBase64(this.apiKey)) {
      return;
    }
    if (form.invalid || (!this.apiKey && !this.username)) {
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }
    
    // Form is valid, proceed with save
    const host = this.host.endsWith('/') ? this.host.slice(0, -1) : this.host;
    if (this.editingConnectionId) {
      this.connections.update(connections =>
        connections.map(connection =>
          connection.Id === this.editingConnectionId
            ? {
                ...connection,
                Name: this.name,
                Host: host,
                Username: this.apiKey ? '' : this.username,
                Password: this.apiKey ? '' : (this.password || connection.Password),
                ApiKey: this.apiKey ? this.apiKey.trim() : '',
              }
            : connection
        )
      );
    } else {
      const newConnection: EsConnection = {
        Id: crypto.randomUUID(),
        Name: this.name,
        Host: host,
        Username: this.apiKey ? '' : this.username,
        Password: this.apiKey ? '' : this.password,
        ApiKey: this.apiKey ? this.apiKey.trim() : '',
      };
      this.connections.update(connections => [...connections, newConnection]);
    }

    this.connectionService.save();
    form.resetForm();
    this.editingConnectionId = null;
    this.apiKey = '';
    this.isVisible = false;
  }

  cancel(form: NgForm) {
    form.resetForm();
    this.editingConnectionId = null;
    this.apiKey = '';
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

  formatApiKey(apiKey?: string): string {
    if (!apiKey) {
      return '';
    }
    return apiKey.slice(0, 4) + '*';
  }
}
