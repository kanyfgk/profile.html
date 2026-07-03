const Engine = {

    currentEntity: null,

    start(){

        VAERO.engine = this;
        VAERO.register("engine", this);

        const entityManager = VAERO.get("entityManager");

const vaeroEntity = entityManager.create({

    id:"vaero-root",

    type:"brand",

    name:"VAERO",

    description:"Living Digital Universe",

    status:"online",

    organs:[]

});

        const organSystem = VAERO.get("organSystem");

vaeroEntity.addOrgan(
    organSystem.create("Identity","active")
);

vaeroEntity.addOrgan(
    organSystem.create("Engine","active")
);

vaeroEntity.addOrgan(
    organSystem.create("Renderer","active")
);

vaeroEntity.addOrgan(
    organSystem.create("Bridge","active")
);
        const bridge = VAERO.get("bridge");

bridge.connect(
    vaeroEntity.id,
    "vaero-community",
    "root-community"
);
        this.mount(vaeroEntity);

        console.log("VAERO Engine Started");

    },

    mount(entity){

        this.currentEntity = entity;

        Renderer.render(entity);

    }

};

Engine.start();
