const Timeline = {

    events: [],

    storageKey: "vaero:timeline:events",

    boot(){

        this.load();

        const events = VAERO.get("events");

        if(!events){
            return;
        }

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

        events.on("life-event:created", (lifeEvent) => {

            if(!lifeEvent || !lifeEvent.id){
                return;
            }

            events.on("life-event:removed", () => {

    this.cleanOrphanLifeEvents();

});

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

    createId(){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ){
            return crypto.randomUUID();
        }

        return `timeline_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    },

    add(type, title, payload = {}){

        const event = {
            id: this.createId(),
            type,
            title,
            payload,
            createdAt: Date.now()
        };

        this.events.push(event);

        this.save();

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

    cleanOrphanLifeEvents(){

    const evolution = VAERO.get("evolution");

    if(
        !evolution ||
        typeof evolution.find !== "function"
    ){
        return 0;
    }

    const beforeCount = this.events.length;

    this.events = this.events.filter(event => {

        if(
            event.type !== "life-event" ||
            !event.payload ||
            !event.payload.sourceEventId
        ){
            return true;
        }

        return Boolean(
            evolution.find(
                event.payload.sourceEventId
            )
        );

    });

    const removedCount =
        beforeCount - this.events.length;

    if(removedCount > 0){
        this.save();
    }

    return removedCount;

},

    all(){

        return [...this.events];

    },

    save(){

        try{

            localStorage.setItem(
                this.storageKey,
                JSON.stringify(this.events)
            );

            return true;

        }catch(error){

            console.error(
                "Timeline kaydedilemedi:",
                error
            );

            return false;

        }

    },

    load(){

        try{

            const saved = localStorage.getItem(
                this.storageKey
            );

            if(!saved){
                this.events = [];
                return this.events;
            }

            const parsed = JSON.parse(saved);

            this.events = Array.isArray(parsed)
                ? parsed
                : [];

            return this.events;

        }catch(error){

            console.error(
                "Timeline yüklenemedi:",
                error
            );

            this.events = [];

            return this.events;

        }

    },

    clear(){

        this.events = [];

        this.save();

        return true;

    }

};

VAERO.register("timeline", Timeline);
