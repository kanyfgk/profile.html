const MemorySystem = {

    records: [],

    boot(){

        const events = VAERO.get("events");
 
        if(!events) return;

        events.on("entity.mounted", (data) => {

            this.remember("entity:mounted", data);

        });

        events.on("life-event:created", (lifeEvent) => {

    if(!lifeEvent || !lifeEvent.id){
        return;
    }

    const alreadyExists = this.records.some(record =>
        record.payload &&
        record.payload.sourceEventId === lifeEvent.id
    );

    if(alreadyExists){
        return;
    }

    this.remember(
        "life-event",
        {
            sourceEventId: lifeEvent.id,
            title: lifeEvent.title,
            importance: lifeEvent.importance
        }
    );

});

    },

    remember(type, payload){

        const record = {
            id: crypto.randomUUID(),
            type,
            payload,
            createdAt: Date.now()
        };

        this.records.push(record);

        return record;

    },

    resolveLifeEvent(memoryRecord){

    if(
        !memoryRecord ||
        memoryRecord.type !== "life-event" ||
        !memoryRecord.payload ||
        !memoryRecord.payload.sourceEventId
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
        memoryRecord.payload.sourceEventId
    );

},

    all(){

        return this.records;

    },

    clear(){

        this.records = [];

    }

};

VAERO.register("memorySystem", MemorySystem);
