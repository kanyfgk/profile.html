const Timeline = {

    events: [],

    boot(){

        const events = VAERO.get("events");

        events.on("entity.mounted", (data)=>{

            this.add(
                "entity",
                "Entity Mounted",
                data
            );

        });

        events.on("engine.started", (data)=>{

            this.add(
                "engine",
                "Engine Started",
                data
            );

        });

    },

    add(type, title, payload = {}){

        const event = {
            id: crypto.randomUUID(),
            type,
            title,
            payload,
            createdAt: Date.now()
        };

        this.events.push(event);

        VAERO.emit("timeline:added", event);

        return event;

    },

    all(){

        return this.events;

    }

};

VAERO.register("timeline", Timeline);
