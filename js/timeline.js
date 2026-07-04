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

        events.on("runtime.started", (data)=>{

            this.add(
                "runtime",
                "Runtime Started",
                data
            );

        });

        events.on("runtime.tick", (data)=>{

            this.add(
                "runtime",
                "Runtime Tick",
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

        return event;

    },

    all(){

        return this.events;

    },

    clear(){

        this.events = [];

    }

};

VAERO.register("timeline", Timeline);
