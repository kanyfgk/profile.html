const Engine = {

    currentEntity: null,

    start(){

        VAERO.engine = this;
        VAERO.register("engine", this);

        const vaeroEntity = new Entity({
            id: "vaero-root",
            type: "brand",
            name: "VAERO",
            description: "Living Digital Universe",
            status: "online",
            organs: [
                { name: "Identity", status: "active" },
                { name: "Engine", status: "active" },
                { name: "Renderer", status: "active" },
                { name: "Bridge", status: "pending" }
            ]
        });

        this.mount(vaeroEntity);

        console.log("VAERO Engine Started");

    },

    mount(entity){

        this.currentEntity = entity;

        Renderer.render(entity);

    }

};

Engine.start();
