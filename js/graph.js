const Graph = {

    nodes: [],
    edges: [],

    boot(){

        const events = VAERO.get("events");

        events.on("entity.mounted", (data) => {

            this.addNode({
                id: data.entityId,
                type: "entity",
                label: data.entityName
            });

        });

        events.on("universe.created", (data) => {

            this.addNode({
                id: data.id,
                type: "universe",
                label: data.name
            });

            this.addEdge({
                from: data.owner,
                to: data.id,
                type: "creates"
            });

        });

        events.on("world.created", (data) => {

            this.addNode({
                id: data.id,
                type: "world",
                label: data.name
            });

            this.addEdge({
                from: "vaero-universe",
                to: data.id,
                type: "contains"
            });

        });

        events.on("runtime.started", (data) => {

            this.addNode({
                id: "vaero-runtime",
                type: "runtime",
                label: "VAERO Runtime"
            });

            this.addEdge({
                from: "vaero-root",
                to: "vaero-runtime",
                type: "runs"
            });

        });

        events.on("bridge.created", (data) => {

            this.addEdge({
                from: data.from,
                to: data.to,
                type: data.type
            });

        });

    },

    addNode(node){

        if(this.nodes.find(item => item.id === node.id)){
            return;
        }

        this.nodes.push({
            ...node,
            createdAt: Date.now()
        });

    },

    addEdge(edge){

        this.edges.push({
            id: crypto.randomUUID(),
            ...edge,
            createdAt: Date.now()
        });

    },

    node(id){

        return this.nodes.find(node => node.id === id) || null;

    },

    neighbors(id){

        return this.edges.filter(edge =>
            edge.from === id || edge.to === id
        );

    },

    all(){

        return {
            nodes: this.nodes,
            edges: this.edges
        };

    },

    clear(){

        this.nodes = [];
        this.edges = [];

    }

};

VAERO.register("graph", Graph);
