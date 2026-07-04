const World = {

    worlds: [],

    boot(){

        const events = VAERO.get("events");

        events.on("engine.started", (data) => {

            this.create({
                id: "vaero-world",
                name: "VAERO World",
                type: "root-world",
                owner: data.entityId
            });

        });

    },

    create(world){

        const item = {
            ...world,
            createdAt: Date.now(),
            status: "active"
        };

        this.worlds.push(item);

        return item;

    },

    all(){

        return this.worlds;

    }

};

VAERO.register("world", World);
