const OrganSystem = {

    organs: {},

    create(name, status = "active", meta = {}){

        const organ = {
            id: crypto.randomUUID(),
            name,
            status,
            meta,
            createdAt: Date.now()
        };

        this.organs[organ.id] = organ;

        VAERO.emit("organ:created", organ);

        return organ;

    },

    all(){

        return Object.values(this.organs);

    }

};

VAERO.register("organSystem", OrganSystem);
