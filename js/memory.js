const MemorySystem = {

    records: [],

    storageKey: "vaero:memory:records",

    boot(){

    this.load();

    const events = VAERO.get("events");

    if(!events){
        return;
    }

    events.on("entity.mounted", (data) => {

        this.remember(
            "entity:mounted",
            data
        );

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

    events.on("life-event:removed", () => {

        this.cleanOrphanLifeEvents();

    });

},

    createId(){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ){
            return crypto.randomUUID();
        }

        return `memory_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    },

    remember(type, payload = {}){

        const record = {
            id: this.createId(),
            type,
            payload,
            createdAt: Date.now()
        };

        this.records.push(record);

        this.save();

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

    cleanOrphanLifeEvents(){

    const evolution = VAERO.get("evolution");

    if(
        !evolution ||
        typeof evolution.find !== "function"
    ){
        return 0;
    }

    const beforeCount = this.records.length;

    this.records = this.records.filter(record => {

        if(
            record.type !== "life-event" ||
            !record.payload ||
            !record.payload.sourceEventId
        ){
            return true;
        }

        return Boolean(
            evolution.find(
                record.payload.sourceEventId
            )
        );

    });

    const removedCount =
        beforeCount - this.records.length;

    if(removedCount > 0){
        this.save();
    }

    return removedCount;

},

    all(){

        return [...this.records];

    },

    save(){

        try{

            localStorage.setItem(
                this.storageKey,
                JSON.stringify(this.records)
            );

            return true;

        }catch(error){

            console.error(
                "Memory kaydedilemedi:",
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
                this.records = [];
                return this.records;
            }

            const parsed = JSON.parse(saved);

            this.records = Array.isArray(parsed)
                ? parsed
                : [];

            return this.records;

        }catch(error){

            console.error(
                "Memory yüklenemedi:",
                error
            );

            this.records = [];

            return this.records;

        }

    },

    clear(){

        this.records = [];

        this.save();

        return true;

    }

};

VAERO.register("memorySystem", MemorySystem);
