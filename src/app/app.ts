import { Component, computed, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { ConnectionComponent } from './components/connection/connection.component';
import { SplitterModule } from 'primeng/splitter';
import { NodeComponent } from './components/node.component/node.component';
import { IndexComponent } from './components/index/index.component';
import { ShardComponent } from './components/shard.component/shard.component';
import { MenuItem } from 'primeng/api';
import { EsConnection } from './entities/esConnection';
import { ButtonModule } from 'primeng/button';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ConnectionsComponent } from './components/connections/connections.component';
import { ConnectionService } from './services/connection.service';
import packageJson from '../../package.json';

const DESKTOP_BREAKPOINT = 1024; // Tailwind lg breakpoint

@Component({
  selector: 'app-root',
  imports: [ConnectionsComponent, PanelMenuModule, ButtonModule, ShardComponent, IndexComponent, NodeComponent, SplitterModule, ConnectionComponent, MenubarModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  version = packageJson.version;
  selectedConnectionNode = signal<any | undefined>(undefined);
  connectionNodes = computed<MenuItem[]>(() => this.buildConnectionNodes());
  // Sidebar visibility - Desktop: default visible, Mobile/Tablet: default hidden
  sidebarVisible = signal<boolean>(true);

  ngOnInit() {
    // Set default based on screen size
    this.sidebarVisible.set(window.innerWidth >= DESKTOP_BREAKPOINT);
  }

  toggleSidebar() {
    this.sidebarVisible.set(!this.sidebarVisible());
  }

  constructor(private connectionService: ConnectionService) {

  }

  private buildConnectionNodes(): MenuItem[] {
    const nodes: MenuItem[] = this.connectionService.items().map((conn: EsConnection) =>
    ({
      label: conn.Name,
      icon: 'pi pi-database',
      command: () => this.onConnectionNodeSelected(conn, "Connection"),
      items: [
        {
          key: conn.Id + "_N",
          label: "Nodes",
          icon: 'pi pi-sitemap',
          command: () => this.onConnectionNodeSelected(conn, "Node"),
        },
        {
          key: conn.Id + "_I",
          label: "Indices",
          icon: 'pi pi-list',
          command: () => this.onConnectionNodeSelected(conn, "Index"),
        },
        {
          key: conn.Id + "_S",
          label: "Shards",
          icon: 'pi pi-th-large',
          command: () => this.onConnectionNodeSelected(conn, "Shard"),
        }]
    }));

    const connectionsNode: MenuItem = {
      key: "connections",
      label: 'Connections',
      icon: 'pi pi-server',
      command: () => this.onConnectionNodeSelected(undefined, "Connections"),
    };

    return [connectionsNode, ...nodes];
  }

  private onConnectionNodeSelected(conn: any, type: string) {
    this.selectedConnectionNode.set({...conn, "Type": type});
  }
}
