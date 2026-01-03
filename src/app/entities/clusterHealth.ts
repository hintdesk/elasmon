export class ClusterHealth {
    active_shards!: number;
    active_shards_percent_as_number!: number;
    active_primary_shards!: number;
    relocating_shards!: number;
    initializing_shards!: number;
    unassigned_shards!: number;
    number_of_pending_tasks!: number;
}