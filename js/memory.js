const MemorySystem = {

    records: [],

    boot(){

        const events = VAERO.get("events");
 
        if(!events) return;

        events.on("entity.mounted", (data) => {

            this.remember("entity:mounted", data);

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

    all(){

        return this.records;

    },

    clear(){

        this.records = [];

    }

};

VAERO.register("memorySystem", MemorySystem);
