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

            events.on("life-event:created", (lifeEvent) => {

    if(!lifeEvent || !lifeEvent.id){
        return;
    }

    const alreadyExists = this.events.some(event =>
        event.payload &&
        event.payload.sourceEventId === lifeEvent.id
    );

    if(alreadyExists){
        return;
    }

    this.add(
        "life-event",
        lifeEvent.title || "Yaşam Olayı",
        {
            sourceEventId: lifeEvent.id
        }
    );

});

        });

        events.on("life-event:created", (lifeEvent) => {

    if(!lifeEvent || !lifeEvent.id){
        return;
    }

    const alreadyExists = this.events.some(event =>
        event.payload &&
        event.payload.sourceEventId === lifeEvent.id
    );

    if(alreadyExists){
        return;
    }

    this.add(
        "life-event",
        lifeEvent.title || "Yaşam Olayı",
        {
            sourceEventId: lifeEvent.id
        }
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

    resolveLifeEvent(timelineEvent){

    if(
        !timelineEvent ||
        timelineEvent.type !== "life-event" ||
        !timelineEvent.payload ||
        !timelineEvent.payload.sourceEventId
    ){
        return null;
    }

    const evolution = VAERO.get("evolution");

    if(
        !evolution ||
        typeof evolution.find !== "function"
    ){
        return null;
    }

    return evolution.find(
        timelineEvent.payload.sourceEventId
    );

},

    all(){

        return this.events;

    },

    clear(){

        this.events = [];

    }

};

VAERO.register("timeline", Timeline);
