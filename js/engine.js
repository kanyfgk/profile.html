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
        const memory = VAERO.get("memorySystem");

memory.remember("entity:mounted", {
    entityId: vaeroEntity.id,
    entityName: vaeroEntity.name
});
        const bridge = VAERO.get("bridge");

bridge.connect(
    vaeroEntity.id,
    "vaero-community",
    "root-community"
);

        const evolution = VAERO.get("evolution");

evolution.record(
    "engine:start",
    "VAERO Engine started with root entity",
    {
        entityId: vaeroEntity.id,
        entityName: vaeroEntity.name
    }
);
        const guardian = VAERO.get("guardian");

if(!guardian.validate(vaeroEntity)){
    console.error("Entity rejected by Guardian");
    return;
}
        this.mount(vaeroEntity);

        console.log("VAERO Engine Started");

    },

    mount(entity){

        this.currentEntity = entity;

        Renderer.render(entity);

    }

};

Engine.start();
