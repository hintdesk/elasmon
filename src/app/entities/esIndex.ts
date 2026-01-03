export class EsIndex {
    Name!: string;
    ConnectionId!: string;  
    Documents!: number;
    Ingested!: number;
    Size!: string;
    Shards!: number;
    Replicas!: number;
    Rate?: number;
}