const Engine = {

    currentEntity: null,
    renderer: null,
    started: false,

    start(){

        if(this.started){
            console.warn("VAERO Engine is already running.");
            return;
        }

        VAERO.engine = this;
        VAERO.register("engine", this);

        const kernel = VAERO.get("kernel");

        if(!kernel){
            console.error("VAERO Kernel could not be found.");
            return;
        }

        const entityManager = kernel.service("entityManager");
        const identity = kernel.service("identity");
        const profile = kernel.service("profile");
        const organSystem = kernel.service("organSystem");
        const timeline = kernel.service("timeline");
        const bridge = kernel.service("bridge");
        const graph = kernel.service("graph");
        const universe = kernel.service("universe");
        const world = kernel.service("world");
        const runtime = kernel.service("runtime");
        const guardian = kernel.service("guardian");
        const evolution = kernel.service("evolution");
        const brain = kernel.service("brain");
        const memory = kernel.service("memorySystem");
        const events = kernel.service("events");

        this.renderer = kernel.service("renderer");

        brain.boot();
        memory.boot();
        timeline.boot();
        bridge.boot();
        graph.boot();
        universe.boot();
        world.boot();
        runtime.boot();

        const vaeroEntity = entityManager.create({
            id: "vaero-root",
            type: "brand",
            name: "VAERO",
            description: "Living Digital Universe",
            status: "online",
            organs: []
        });

        vaeroEntity.identity = identity.create(vaeroEntity);
        identity.verify(vaeroEntity.identity);

        vaeroEntity.profile = profile.create(vaeroEntity);

        vaeroEntity.addOrgan(
            organSystem.create("Identity", "active")
        );

        vaeroEntity.addOrgan(
            organSystem.create("Engine", "active")
        );

        vaeroEntity.addOrgan(
            organSystem.create("Renderer", "active")
        );

        vaeroEntity.addOrgan(
            organSystem.create("Bridge", "active")
        );

        events.emit("entity.mounted", {
            entityId: vaeroEntity.id,
            entityName: vaeroEntity.name
        });

        const engineStartExists = evolution.all().some(event =>
            event.type === "engine:start" &&
            event.payload &&
            event.payload.entityId === vaeroEntity.id
        );

        if(!engineStartExists){

            evolution.record(
                "engine:start",
                "VAERO Engine started with root entity",
                {
                    entityId: vaeroEntity.id,
                    entityName: vaeroEntity.name
                }
            );

        }

        if(!guardian.validate(vaeroEntity)){
            console.error("Entity rejected by Guardian");
            return;
        }

        this.mount(vaeroEntity);

        this.started = true;

        events.emit("engine.started", {
            time: Date.now(),
            entityId: vaeroEntity.id,
            entityName: vaeroEntity.name
        });

        console.log("VAERO Engine Started");

    },

    mount(entity){

        if(!entity){
            console.error("Engine.mount requires an entity.");
            return;
        }

        if(!this.renderer){
            console.error("Renderer is not available.");
            return;
        }

        this.currentEntity = entity;
        this.renderer.render(entity);

    }

};

const kernel = VAERO.get("kernel");

kernel.boot();

window.Engine = Engine;
