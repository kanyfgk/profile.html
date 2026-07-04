const Bridge = {

    links: [],

    boot(){

        const events = VAERO.get("events");

        events.on("entity.mounted", (data)=>{

            this.connect(
                data.entityId,
                "vaero-community", 
                "root-community"
            );

        });

    },

    connect(from, to, type = "default"){

        const bridge = {
            id: crypto.randomUUID(),
            from,
            to,
            type,
            createdAt: Date.now()
        };

        this.links.push(bridge);

        VAERO.emit("bridge.created", bridge);

        return bridge;

    },

    remove(id){

        this.links = this.links.filter(link => link.id !== id);

    },

    find(from){

        return this.links.filter(link => link.from === from);

    },

    all(){

        return this.links;

    }

};

VAERO.register("bridge", Bridge);
