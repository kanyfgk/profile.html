const VAERO = {

    version: "1.0",

    engine: null,
    renderer: null,

    registry: {},

    events: {},

    register(name, object){

        this.registry[name] = object;

    },

    get(name){

        return this.registry[name] || null;

    },

    on(eventName, callback){

        if(!this.events[eventName]){
            this.events[eventName] = [];
        }

        this.events[eventName].push(callback);

    },

    emit(eventName, payload){

        const listeners = this.events[eventName] || [];

        listeners.forEach(callback => {
            callback(payload);
        });

    }

};
