export class ClusterStats {
    cluster_name!: string;
    status!: string;
    _nodes!:ClusterStatsUNodes;    
    indices!:ClusterStatsIndices;
    nodes!: ClusterStatsNodes;
}

export class ClusterStatsNodes {
    process!: ClusterStatsNodesProcess;
    jvm!: ClusterStatsNodesJVM;    
    os!: ClusterStatsNodesOS;
    fs!: ClusterStatsNodesFS;    
}
export class ClusterStatsNodesFS {
    total_in_bytes!: number; 
    available_in_bytes!: number;    
}
export class ClusterStatsNodesOS {
    available_processors!: number;
    mem!: ClusterStatsNodesOSMem;

}

export class ClusterStatsNodesOSMem {
    total_in_bytes!: number;
    used_in_bytes!: number;
    used_percent!: number;
}

export class ClusterStatsNodesJVM {
    mem!: ClusterStatsNodesJVMMem;
}   

export class ClusterStatsNodesJVMMem {
    heap_used_in_bytes!: number;
    heap_max_in_bytes!: number;
}



export class ClusterStatsNodesProcess {
    cpu!: ClusterStatsNodesProcessCPU;
}

export class ClusterStatsNodesProcessCPU {
    percent!: number;
}

export class ClusterStatsUNodes {
    total!: number;
    successful!: number;
    failed!: number;
}

export class ClusterStatsIndices {
    docs!: ClusterStatsIndicesDocs;
    store!:ClusterStatsIndicesStore;
}

export class ClusterStatsIndicesDocs {
    count!: number;
}

export class ClusterStatsIndicesStore {
    size_in_bytes!: number;
}