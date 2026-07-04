const Kernel = {

    services: {},

    boot(){

    console.log("VAERO Kernel Booting...");

    this.load("events");          // <-- yeni

    this.load("entityManager");
    this.load("identity");
    this.load("profile");
    this.load("bridge");
    this.load("organSystem");
    this.load("memorySystem");
    this.load("timeline");
    this.load("guardian");
    this.load("evolution");
    this.load("brain");
    this.load("components");
    this.load("renderer");

    console.log("VAERO Kernel Ready");

},

    load(name){

        const service = VAERO.get(name);

        if(!service){

            console.warn("Kernel: service not found ->", name);
            return;

        }

        this.services[name] = service;

    },

    service(name){

        return this.services[name] || null;

    }

};

VAERO.register("kernel", Kernel);
