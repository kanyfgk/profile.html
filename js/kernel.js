const Kernel = {

    services: {},
    booted: false,

    serviceList: [
        "events",
        "entityManager",
        "identity",
        "profile",
        "bridge",
        "graph",
        "world",
        "runtime",
        "organSystem",
        "memorySystem",
        "timeline",
        "guardian",
        "evolution",
        "brain",
        "components",
        "renderer"
    ],

    boot(){

        console.log("VAERO Kernel Booting...");

        this.serviceList.forEach(name => {
            this.load(name);
        });

        this.booted = true;

        console.log("VAERO Kernel Ready");

    },

    load(name){

        const service = VAERO.get(name);

        if(!service){
            console.warn("Kernel: service not found ->", name);
            return null;
        }

        this.services[name] = service;

        return service;

    },

    service(name){

        return this.services[name] || null;

    },

    has(name){

        return !!this.services[name];

    },

    report(){

        return {
            booted: this.booted,
            services: Object.keys(this.services),
            total: Object.keys(this.services).length
        };

    }

};

VAERO.register("kernel", Kernel);
