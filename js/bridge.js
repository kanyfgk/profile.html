const Bridge = {

    links: [],

    connect(from, to, type = "default"){

        const bridge = {
            from,
            to,
            type,
            createdAt: Date.now()
        };

        this.links.push(bridge);

        VAERO.emit("bridge:created", bridge);

        return bridge;

    },

    all(){

        return this.links;

    }

};

VAERO.register("bridge", Bridge);
