const Engine = {

    currentEntity: null,
    renderer: null,

    start(){

        VAERO.engine = this;
        VAERO.register("engine", this);

        const kernel = VAERO.get("kernel");

        const entityManager = kernel.service("entityManager");
        const identity = kernel.service("identity");
        const profile = kernel.service("profile");
        const organSystem = kernel.service("organSystem");
        const memory = kernel.service("memorySystem");
        const timeline = kernel.service("timeline");
        const bridge = kernel.service("bridge");
        const guardian = kernel.service("guardian");
        const evolution = kernel.service("evolution");
        const brain = kernel.service("brain");
        const events = kernel.service("events");

        this.renderer = kernel.service("renderer");

        const vaeroEntity = entityManager.create({
            id:"vaero-root",
            type:"brand",
            name:"VAERO",
            description:"Living Digital Universe",
            status:"online",
            organs:[]
        });

        vaeroEntity.identity = identity.create(vaeroEntity);
        identity.verify(vaeroEntity.identity);

        vaeroEntity.profile = profile.create(vaeroEntity);

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

        events.emit("entity.mounted", {
    entityId: vaeroEntity.id,
    entityName: vaeroEntity.name
});

        timeline.add(
            "entity",
            "VAERO root entity mounted",
            {
                entityId: vaeroEntity.id,
                entityName: vaeroEntity.name
            }
        );

        bridge.connect(
            vaeroEntity.id,
            "vaero-community",
            "root-community"
        );

        evolution.record(
            "engine:start",
            "VAERO Engine started with root entity",
            {
                entityId: vaeroEntity.id,
                entityName: vaeroEntity.name
            }
        );

        brain.boot();
        memory.boot();

        if(!guardian.validate(vaeroEntity)){
            console.error("Entity rejected by Guardian");
            return;
        }

        this.mount(vaeroEntity);

        events.emit("engine.started", {
            time: Date.now(),
            entityId: vaeroEntity.id,
            entityName: vaeroEntity.name
        });

        console.log("VAERO Engine Started");

    },

    mount(entity){

        this.currentEntity = entity;

        this.renderer.render(entity);

    }

};

const kernel = VAERO.get("kernel");

kernel.boot();

Engine.start();
