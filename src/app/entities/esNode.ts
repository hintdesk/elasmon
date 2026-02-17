export class EsNode {
    Name!: string;
    Cpu!: number;
    Memory!: number;
    Heap!: number;
    Disk!: number;
    Uptime!: number;
    ThreadPoolSearchRejected!: number;
    ThreadPoolWriteRejected!: number;
    TotalShards!: number;
    ShardsPerGBHeap!: number;
    HeapMaxInBytes!: number;
    MemTotalInBytes!: number;
    IndexingRate?: number;
    SearchRate?: number;
    IndexingLatency?: number;
    SearchLatency?: number;
}