const MemorySystem = {

    records: [],

    remember(type, payload){

        const record = {
            id: crypto.randomUUID(),
            type,
            payload,
            createdAt: Date.now()
        };

        this.records.push(record);

        VAERO.emit("memory:recorded", record);

        return record;

    },

    all(){

        return this.records;

    }

};

VAERO.register("memorySystem", MemorySystem);
