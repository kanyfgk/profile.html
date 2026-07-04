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

        events.on("bridge.created", (data) => {

            this.addEdge({
                from: data.from,
                to: data.to,
                type: data.type
            });

        });

    },

    addNode(node){

        if(this.nodes.find(item => item.id === node.id)) return;

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

    all(){

        return {
            nodes: this.nodes,
            edges: this.edges
        };

    }

};

VAERO.register("graph", Graph);
