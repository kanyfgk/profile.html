const Timeline = {

    events: [],

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
