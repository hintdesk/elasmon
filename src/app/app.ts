import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { ConnectionComponent } from './components/connection/connection.component';
import { SplitterModule } from 'primeng/splitter';
import { NodeComponent } from './components/node.component/node.component';
import { IndexComponent } from './components/index/index.component';
import { ShardComponent } from './components/shard.component/shard.component';
import { MenuItem } from 'primeng/api';
import { EsConnection } from './entities/esConnection';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ConnectionsComponent } from './components/connections/connections.component';
import { ConnectionService } from './services/connection.service';
import packageJson from '../../package.json';

@Component({
  selector: 'app-root',
  imports: [ConnectionsComponent, PanelMenuModule ,ShardComponent, IndexComponent, NodeComponent, SplitterModule, ConnectionComponent, MenubarModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  version = packageJson.version;
  selectedConnectionNode = signal<any | undefined>(undefined);
  connectionNodes = computed<MenuItem[]>(() => this.buildConnectionNodes());

  constructor(private connectionService: ConnectionService) {

  }

  private buildConnectionNodes(): MenuItem[] {
    const nodes: MenuItem[] = this.connectionService.items().map((conn: EsConnection) =>
    ({
      label: conn.Name,
      command: () => this.onConnectionNodeSelected(conn, "Connection"),
      items: [
        {
          key: conn.Id + "_N",
          label: "Nodes",
          command: () => this.onConnectionNodeSelected(conn, "Node"),
        },
        {
          key: conn.Id + "_I",
          label: "Indices",
          command: () => this.onConnectionNodeSelected(conn, "Index"),
        },
        {
          key: conn.Id + "_S",
          label: "Shards",
          command: () => this.onConnectionNodeSelected(conn, "Shard"),
        }]
    }));

    const connectionsNode: MenuItem = {
      key: "connections",
      label: 'Connections',
      command: () => this.onConnectionNodeSelected(undefined, "Connections"),
    };

    return [connectionsNode, ...nodes];
  }

  private onConnectionNodeSelected(conn: any, type: string) {
    console.log("Selected node:", conn, type);
    this.selectedConnectionNode.set({...conn, "Type": type});
  }
}
