export class EsIndex {
    Name!: string;
    ConnectionId!: string;  
    Documents!: number;
    Size!: string;
    Shards!: number;
    Replicas!: number;
    GBPerShard!: number;
    IndexingRate?: number;
    SearchRate?: number;
    IndexingLatency?: number;
    SearchLatency?: number;
}