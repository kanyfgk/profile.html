class EventSystem {

    constructor() {
        this.events = {};
        console.log("VAERO EventSystem Ready");
    }

    on(name, callback) {

        if (!this.events[name]) {
            this.events[name] = []; 
        }

        this.events[name].push(callback);

        console.log("Event listener added:", name);

    }

    emit(name, data = {}) {

        console.log("Event emitted:", name, data);

        if (!this.events[name]) {
            console.warn("No listeners for event:", name);
            return;
        }

        this.events[name].forEach(callback => callback(data));

    }

}

VAERO.register("events", new EventSystem());
