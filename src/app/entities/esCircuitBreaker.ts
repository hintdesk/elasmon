export class EsCircuitBreaker {
    Node!: string;
    ParentTripped!: number;
    ParentPercent!: number;
    FielddataTripped!: number;
    FielddataPercent!: number;
    InflightRequestsTripped!: number;
    InflightRequestsPercent!: number;
    ConnectionId!: string;
    JvmGcCollectorsOldMillis!: number;
    GcPercent!: number;
}
