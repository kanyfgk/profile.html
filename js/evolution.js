const Evolution = {

    history: [],
 
    record(type, description, payload = {}){

        const event = {
            id: crypto.randomUUID(),
            type,
            description,
            payload,
            createdAt: Date.now()
        };

        this.history.push(event);

        VAERO.emit("evolution:recorded", event);

        return event;

    },

    all(){

        return this.history;

    }

};

VAERO.register("evolution", Evolution);
