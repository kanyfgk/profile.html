/* =========================================================
   VAERO GRAPH CORE
   Runtime Relationship / Topology Graph
========================================================= */

const Graph = {

    nodes:
        [],

    edges:
        [],

    booted:
        false,


    /* =====================================================
       SAFE ACCESS
    ===================================================== */

    getService(name){

        const serviceName =
            String(
                name ??
                ""
            ).trim();


        if(!serviceName){

            return null;

        }


        try{

            if(
                typeof VAERO ===
                    "undefined" ||
                typeof VAERO.get !==
                    "function"
            ){

                return null;

            }


            return (
                VAERO.get(
                    serviceName
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    emit(
        eventName,
        payload = {}
    ){

        const name =
            String(
                eventName ??
                ""
            ).trim();


        if(!name){

            return false;

        }


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    name,
                    payload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `Graph event gönderilemedi: ${name}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(prefix = "graph"){

        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){

                return crypto.randomUUID();

            }

        } catch(error){

            /* fallback below */

        }


        return `${prefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeId(value){

        const id =
            String(
                value ??
                ""
            )
                .trim()
                .slice(
                    0,
                    200
                );


        return (
            id ||
            null
        );

    },


    normalizeText(
        value,
        maxLength = 500
    ){

        return String(
            value ??
                ""
        )
            .trim()
            .slice(
                0,
                maxLength
            );

    },


    normalizeType(
        value,
        fallback = "unknown"
    ){

        return (
            String(
                value ||
                fallback
            )
                .trim()
                .toLowerCase()
                .slice(
                    0,
                    120
                ) ||
            fallback
        );

    },


    normalizeMetadata(value){

        if(
            !value ||
            typeof value !==
                "object" ||
            Array.isArray(
                value
            )
        ){

            return {};

        }


        return {
            ...value
        };

    },


    normalizeNode(node = {}){

        const source =
            node &&
            typeof node ===
                "object" &&
            !Array.isArray(
                node
            )
                ? node
                : {};


        const id =
            this.normalizeId(
                source.id
            );


        if(!id){

            return null;

        }


        const now =
            Date.now();


        return {

            id,

            type:
                this.normalizeType(
                    source.type,
                    "unknown"
                ),

            label:
                this.normalizeText(
                    source.label ||
                    source.name ||
                    id,
                    240
                ) ||
                id,

            status:
                this.normalizeText(
                    source.status ||
                    "active",
                    120
                )
                    .toLowerCase(),

            metadata:
                this.normalizeMetadata(
                    source.metadata
                ),

            createdAt:
                Number(
                    source.createdAt
                ) ||
                now,

            updatedAt:
                Number(
                    source.updatedAt
                ) ||
                now

        };

    },


    normalizeEdge(edge = {}){

        const source =
            edge &&
            typeof edge ===
                "object" &&
            !Array.isArray(
                edge
            )
                ? edge
                : {};


        const from =
            this.normalizeId(
                source.from ||
                source.sourceId ||
                source.sourceEntityId
            );


        const to =
            this.normalizeId(
                source.to ||
                source.targetId ||
                source.targetEntityId
            );


        if(
            !from ||
            !to ||
            from ===
                to
        ){

            return null;

        }


        const now =
            Date.now();


        return {

            id:
                this.normalizeId(
                    source.id
                ) ||
                this.createId(
                    "edge"
                ),

            from,

            to,

            type:
                this.normalizeType(
                    source.type ||
                    source.relationship,
                    "connection"
                ),

            bidirectional:
                source.bidirectional ===
                    true,

            source:
                this.normalizeText(
                    source.source ||
                    "",
                    120
                ),

            sourceId:
                this.normalizeId(
                    source.sourceId ||
                    source.bridgeId ||
                    source.linkId
                ),

            metadata:
                this.normalizeMetadata(
                    source.metadata
                ),

            createdAt:
                Number(
                    source.createdAt
                ) ||
                now,

            updatedAt:
                Number(
                    source.updatedAt
                ) ||
                now

        };

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(
            this.booted
        ){

            return true;

        }


        const events =
            this.getService(
                "events"
            );


        if(
            !events ||
            typeof events.on !==
                "function"
        ){

            console.warn(
                "Graph boot: Events service hazır değil."
            );


            return false;

        }


        const on =
            (
                names,
                handler
            ) => {

                names.forEach(
                    name => {

                        try{

                            events.on(
                                name,
                                handler
                            );

                        } catch(error){

                            console.warn(
                                `Graph listener kurulamadı: ${name}`,
                                error
                            );

                        }

                    }
                );

            };


        /* =================================================
           ENTITY
        ================================================= */

        const handleEntityMounted =
            data => {

                const entity =
                    data?.entity ||
                    null;


                const entityId =
                    this.normalizeId(
                        data?.entityId ||
                        entity?.id
                    );


                if(!entityId){

                    return;

                }


                this.addNode({

                    id:
                        entityId,

                    type:
                        entity?.type ||
                        data?.entityType ||
                        "entity",

                    label:
                        data?.entityName ||
                        entity?.name ||
                        entityId,

                    status:
                        entity?.status ||
                        "active",

                    metadata:{
                        source:
                            "entity"
                    }

                });

            };


        on(
            [
                "entity.mounted",
                "entity:mounted"
            ],
            handleEntityMounted
        );


        const handleEntityRemoved =
            data => {

                const entityId =
                    this.normalizeId(
                        data?.entityId ||
                        data?.id ||
                        data?.entity?.id
                    );


                if(!entityId){

                    return;

                }


                this.removeNode(
                    entityId,
                    {
                        removeEdges:
                            true
                    }
                );

            };


        on(
            [
                "entity.removed",
                "entity:removed"
            ],
            handleEntityRemoved
        );


        /* =================================================
           UNIVERSE
        ================================================= */

        const handleUniverseCreated =
            data => {

                const universeId =
                    this.normalizeId(
                        data?.id ||
                        data?.universeId
                    );


                if(!universeId){

                    return;

                }


                this.addNode({

                    id:
                        universeId,

                    type:
                        "universe",

                    label:
                        data?.name ||
                        "VAERO Universe",

                    metadata:{
                        source:
                            "universe"
                    }

                });


                const ownerId =
                    this.normalizeId(
                        data?.owner ||
                        data?.ownerId ||
                        data?.entityId
                    );


                if(ownerId){

                    this.addEdge({

                        from:
                            ownerId,

                        to:
                            universeId,

                        type:
                            "creates",

                        source:
                            "universe",

                        sourceId:
                            universeId

                    });

                }

            };


        on(
            [
                "universe.created",
                "universe:created"
            ],
            handleUniverseCreated
        );


        /* =================================================
           WORLD
        ================================================= */

        const handleWorldCreated =
            data => {

                const worldId =
                    this.normalizeId(
                        data?.id ||
                        data?.worldId
                    );


                if(!worldId){

                    return;

                }


                this.addNode({

                    id:
                        worldId,

                    type:
                        "world",

                    label:
                        data?.name ||
                        "VAERO World",

                    metadata:{
                        source:
                            "world"
                    }

                });


                const universeId =
                    this.normalizeId(
                        data?.universeId ||
                        data?.parentUniverseId ||
                        "vaero-universe"
                    );


                if(universeId){

                    this.addEdge({

                        from:
                            universeId,

                        to:
                            worldId,

                        type:
                            "contains",

                        source:
                            "world",

                        sourceId:
                            worldId

                    });

                }

            };


        on(
            [
                "world.created",
                "world:created"
            ],
            handleWorldCreated
        );


        /* =================================================
           RUNTIME
        ================================================= */

        const handleRuntimeStarted =
            data => {

                const runtimeId =
                    this.normalizeId(
                        data?.id ||
                        data?.runtimeId ||
                        "vaero-runtime"
                    );


                this.addNode({

                    id:
                        runtimeId,

                    type:
                        "runtime",

                    label:
                        data?.name ||
                        "VAERO Runtime",

                    status:
                        "active",

                    metadata:{
                        source:
                            "runtime"
                    }

                });


                const rootId =
                    this.normalizeId(
                        data?.rootId ||
                        "vaero-root"
                    );


                if(rootId){

                    this.addEdge({

                        from:
                            rootId,

                        to:
                            runtimeId,

                        type:
                            "runs",

                        source:
                            "runtime",

                        sourceId:
                            runtimeId

                    });

                }

            };


        on(
            [
                "runtime.started",
                "runtime:started"
            ],
            handleRuntimeStarted
        );


        /* =================================================
           BRIDGE
        ================================================= */

        const handleBridgeCreated =
            data => {

                const bridge =
                    data?.bridge ||
                    data;


                const from =
                    this.normalizeId(
                        bridge?.from ||
                        bridge?.sourceEntityId
                    );


                const to =
                    this.normalizeId(
                        bridge?.to ||
                        bridge?.targetEntityId
                    );


                if(
                    !from ||
                    !to
                ){

                    return;

                }


                this.addEdge({

                    from,

                    to,

                    type:
                        bridge?.relationship ||
                        bridge?.type ||
                        "connection",

                    bidirectional:
                        bridge?.bidirectional ===
                            true,

                    source:
                        "bridge",

                    sourceId:
                        bridge?.id ||
                        data?.bridgeId,

                    metadata:{
                        bridgeId:
                            bridge?.id ||
                            data?.bridgeId ||
                            null
                    }

                });

            };


        on(
            [
                "bridge.created",
                "bridge:created"
            ],
            handleBridgeCreated
        );


        const handleBridgeUpdated =
            data => {

                const bridge =
                    data?.bridge ||
                    data;


                const bridgeId =
                    this.normalizeId(
                        bridge?.id ||
                        data?.bridgeId
                    );


                if(!bridgeId){

                    return;

                }


                this.removeEdgesBySource(
                    "bridge",
                    bridgeId
                );


                if(
                    bridge?.archived ===
                        true
                ){

                    return;

                }


                handleBridgeCreated(
                    bridge
                );

            };


        on(
            [
                "bridge.updated",
                "bridge:updated",
                "bridge.restored",
                "bridge:restored"
            ],
            handleBridgeUpdated
        );


        const handleBridgeRemoved =
            data => {

                const bridge =
                    data?.bridge ||
                    data;


                const bridgeId =
                    this.normalizeId(
                        bridge?.id ||
                        data?.bridgeId
                    );


                if(bridgeId){

                    this.removeEdgesBySource(
                        "bridge",
                        bridgeId
                    );


                    return;

                }


                const from =
                    this.normalizeId(
                        bridge?.from
                    );


                const to =
                    this.normalizeId(
                        bridge?.to
                    );


                if(
                    from &&
                    to
                ){

                    this.removeEdgesBetween(
                        from,
                        to
                    );

                }

            };


        on(
            [
                "bridge.removed",
                "bridge:removed",
                "bridge.archived",
                "bridge:archived"
            ],
            handleBridgeRemoved
        );


        this.booted =
            true;


        this.emit(
            "graph:ready",
            {
                nodes:
                    this.nodes.length,

                edges:
                    this.edges.length,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       NODE
    ===================================================== */

    addNode(node){

        const normalized =
            this.normalizeNode(
                node
            );


        if(!normalized){

            return null;

        }


        const existing =
            this.node(
                normalized.id
            );


        if(existing){

            existing.type =
                normalized.type ||
                existing.type;


            existing.label =
                normalized.label ||
                existing.label;


            existing.status =
                normalized.status ||
                existing.status;


            existing.metadata = {

                ...existing.metadata,

                ...normalized.metadata

            };


            existing.updatedAt =
                Date.now();


            return existing;

        }


        this.nodes.push(
            normalized
        );


        this.emit(
            "graph:node:added",
            {
                node:
                    normalized,

                time:
                    Date.now()
            }
        );


        return normalized;

    },


    updateNode(
        id,
        changes = {}
    ){

        const node =
            this.node(
                id
            );


        if(
            !node ||
            !changes ||
            typeof changes !==
                "object" ||
            Array.isArray(
                changes
            )
        ){

            return null;

        }


        if(
            changes.type !==
                undefined
        ){

            node.type =
                this.normalizeType(
                    changes.type,
                    node.type
                );

        }


        if(
            changes.label !==
                undefined ||
            changes.name !==
                undefined
        ){

            const label =
                this.normalizeText(
                    changes.label ??
                    changes.name,
                    240
                );


            if(label){

                node.label =
                    label;

            }

        }


        if(
            changes.status !==
                undefined
        ){

            node.status =
                this.normalizeText(
                    changes.status,
                    120
                )
                    .toLowerCase();

        }


        if(
            changes.metadata &&
            typeof changes.metadata ===
                "object" &&
            !Array.isArray(
                changes.metadata
            )
        ){

            node.metadata = {

                ...node.metadata,

                ...changes.metadata

            };

        }


        node.updatedAt =
            Date.now();


        this.emit(
            "graph:node:updated",
            {
                node,

                time:
                    Date.now()
            }
        );


        return node;

    },


    node(id){

        const nodeId =
            this.normalizeId(
                id
            );


        if(!nodeId){

            return null;

        }


        return (
            this.nodes.find(
                node =>
                    node?.id ===
                        nodeId
            ) ||
            null
        );

    },


    hasNode(id){

        return Boolean(
            this.node(
                id
            )
        );

    },


    removeNode(
        id,
        options = {}
    ){

        const nodeId =
            this.normalizeId(
                id
            );


        if(!nodeId){

            return false;

        }


        const index =
            this.nodes.findIndex(
                node =>
                    node?.id ===
                        nodeId
            );


        if(
            index <
                0
        ){

            return false;

        }


        const [
            removed
        ] =
            this.nodes.splice(
                index,
                1
            );


        if(
            options.removeEdges !==
                false
        ){

            this.edges =
                this.edges.filter(
                    edge =>
                        edge.from !==
                            nodeId &&
                        edge.to !==
                            nodeId
                );

        }


        this.emit(
            "graph:node:removed",
            {
                node:
                    removed,

                nodeId,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       EDGE
    ===================================================== */

    addEdge(edge){

        const normalized =
            this.normalizeEdge(
                edge
            );


        if(!normalized){

            return null;

        }


        const existing =
            this.findEdge(
                normalized
            );


        if(existing){

            existing.type =
                normalized.type;


            existing.bidirectional =
                normalized.bidirectional;


            existing.source =
                normalized.source ||
                existing.source;


            existing.sourceId =
                normalized.sourceId ||
                existing.sourceId;


            existing.metadata = {

                ...existing.metadata,

                ...normalized.metadata

            };


            existing.updatedAt =
                Date.now();


            return existing;

        }


        this.edges.push(
            normalized
        );


        this.emit(
            "graph:edge:added",
            {
                edge:
                    normalized,

                time:
                    Date.now()
            }
        );


        return normalized;

    },


    edge(id){

        const edgeId =
            this.normalizeId(
                id
            );


        if(!edgeId){

            return null;

        }


        return (
            this.edges.find(
                edge =>
                    edge?.id ===
                        edgeId
            ) ||
            null
        );

    },


    findEdge(edge = {}){

        const from =
            this.normalizeId(
                edge.from
            );


        const to =
            this.normalizeId(
                edge.to
            );


        if(
            !from ||
            !to
        ){

            return null;

        }


        const type =
            this.normalizeType(
                edge.type ||
                "connection"
            );


        const source =
            this.normalizeText(
                edge.source,
                120
            );


        const sourceId =
            this.normalizeId(
                edge.sourceId
            );


        return (
            this.edges.find(
                item => {

                    if(
                        sourceId &&
                        item.sourceId ===
                            sourceId &&
                        item.source ===
                            source
                    ){

                        return true;

                    }


                    return (
                        item.from ===
                            from &&
                        item.to ===
                            to &&
                        item.type ===
                            type &&
                        (
                            !source ||
                            item.source ===
                                source
                        )
                    );

                }
            ) ||
            null
        );

    },


    removeEdge(id){

        const edgeId =
            this.normalizeId(
                id
            );


        if(!edgeId){

            return false;

        }


        const index =
            this.edges.findIndex(
                edge =>
                    edge?.id ===
                        edgeId
            );


        if(
            index <
                0
        ){

            return false;

        }


        const [
            removed
        ] =
            this.edges.splice(
                index,
                1
            );


        this.emit(
            "graph:edge:removed",
            {
                edge:
                    removed,

                edgeId,

                time:
                    Date.now()
            }
        );


        return true;

    },


    removeEdgesBySource(
        source,
        sourceId
    ){

        const normalizedSource =
            this.normalizeText(
                source,
                120
            );


        const normalizedSourceId =
            this.normalizeId(
                sourceId
            );


        if(
            !normalizedSource ||
            !normalizedSourceId
        ){

            return 0;

        }


        const before =
            this.edges.length;


        this.edges =
            this.edges.filter(
                edge =>
                    !(
                        edge.source ===
                            normalizedSource &&
                        edge.sourceId ===
                            normalizedSourceId
                    )
            );


        return (
            before -
            this.edges.length
        );

    },


    removeEdgesBetween(
        first,
        second
    ){

        const a =
            this.normalizeId(
                first
            );


        const b =
            this.normalizeId(
                second
            );


        if(
            !a ||
            !b
        ){

            return 0;

        }


        const before =
            this.edges.length;


        this.edges =
            this.edges.filter(
                edge =>
                    !(
                        (
                            edge.from ===
                                a &&
                            edge.to ===
                                b
                        ) ||
                        (
                            edge.from ===
                                b &&
                            edge.to ===
                                a
                        )
                    )
            );


        return (
            before -
            this.edges.length
        );

    },


    /* =====================================================
       QUERY
    ===================================================== */

    neighbors(id){

        const nodeId =
            this.normalizeId(
                id
            );


        if(!nodeId){

            return [];

        }


        return this.edges.filter(
            edge =>
                edge.from ===
                    nodeId ||
                edge.to ===
                    nodeId
        );

    },


    connectedNodes(id){

        const nodeId =
            this.normalizeId(
                id
            );


        if(!nodeId){

            return [];

        }


        const ids =
            new Set();


        this.neighbors(
            nodeId
        )
            .forEach(
                edge => {

                    if(
                        edge.from ===
                            nodeId
                    ){

                        ids.add(
                            edge.to
                        );

                    }

                    else {

                        ids.add(
                            edge.from
                        );

                    }

                }
            );


        return [
            ...ids
        ]
            .map(
                connectedId =>
                    this.node(
                        connectedId
                    )
            )
            .filter(Boolean);

    },


    edgesBetween(
        first,
        second
    ){

        const a =
            this.normalizeId(
                first
            );


        const b =
            this.normalizeId(
                second
            );


        if(
            !a ||
            !b
        ){

            return [];

        }


        return this.edges.filter(
            edge =>
                (
                    edge.from ===
                        a &&
                    edge.to ===
                        b
                ) ||
                (
                    edge.from ===
                        b &&
                    edge.to ===
                        a
                )
        );

    },


    nodesByType(type){

        const normalizedType =
            this.normalizeType(
                type
            );


        return this.nodes.filter(
            node =>
                node.type ===
                    normalizedType
        );

    },


    edgesByType(type){

        const normalizedType =
            this.normalizeType(
                type
            );


        return this.edges.filter(
            edge =>
                edge.type ===
                    normalizedType
        );

    },


    /* =====================================================
       ALL
    ===================================================== */

    all(){

        return {

            nodes:
                [
                    ...this.nodes
                ],

            edges:
                [
                    ...this.edges
                ]

        };

    },


    /* =====================================================
       STATS
    ===================================================== */

    stats(){

        return {

            nodes:
                this.nodes.length,

            edges:
                this.edges.length,

            entities:
                this.nodes.filter(
                    node =>
                        node.type ===
                            "entity"
                ).length,

            worlds:
                this.nodes.filter(
                    node =>
                        node.type ===
                            "world"
                ).length,

            universes:
                this.nodes.filter(
                    node =>
                        node.type ===
                            "universe"
                ).length,

            runtimes:
                this.nodes.filter(
                    node =>
                        node.type ===
                            "runtime"
                ).length,

            bridgeEdges:
                this.edges.filter(
                    edge =>
                        edge.source ===
                            "bridge"
                ).length

        };

    },


    /* =====================================================
       CLEAR
    ===================================================== */

    clear(){

        const previous = {

            nodes:
                this.nodes.length,

            edges:
                this.edges.length

        };


        this.nodes =
            [];


        this.edges =
            [];


        this.emit(
            "graph:cleared",
            {
                ...previous,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const stats =
            this.stats();


        return {

            booted:
                this.booted,

            ...stats,

            isolatedNodes:
                this.nodes.filter(
                    node =>
                        this.neighbors(
                            node.id
                        ).length ===
                            0
                ).length

        };

    }

};


/* =========================================================
   REGISTER
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        VAERO.register(
            "graph",
            Graph
        );

    }

} catch(error){

    console.error(
        "Graph register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.Graph =
        Graph;

}
