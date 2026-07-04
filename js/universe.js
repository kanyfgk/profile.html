const Universe = {

    id: "vaero-universe",
    name: "VAERO Universe",
    type: "root-universe",
    worlds: [],

    boot(){

        const events = VAERO.get("events");
 
        events.on("engine.started", (data)=>{

            events.emit("universe.created", {
                id: this.id,
                name: this.name,
                type: this.type,
                owner: data.entityId
            });

        });

        events.on("world.created", (world)=>{

            this.worlds.push(world.id);

        });

    },

    all(){

        return {
            id: this.id,
            name: this.name,
            type: this.type,
            worlds: this.worlds
        };

    }

};

VAERO.register("universe", Universe);
