const Engine = {

    currentEntity: null,
    rootEntity: null,
    currentWorld: null,
    currentOpenedEntity: null,
    currentEntityPage: null,
    currentView: "home",

    entityCreateMode: false,
    entityType: null,

    renderer: null,
    started: false,

    views: [
        "home",
        "identity",
        "profile",
        "create",
        "worlds",
        "world",
        "entity"
    ],

    start(){

        if(this.started){
            console.warn(
                "VAERO Engine is already running."
            );

            return false;
        }

        VAERO.engine = this;

        VAERO.register(
            "engine",
            this
        );

        const kernel =
            VAERO.get("kernel");

        if(!kernel){
            console.error(
                "VAERO Kernel could not be found."
            );

            return false;
        }

        const entityManager =
            kernel.service("entityManager");

        const identity =
            kernel.service("identity");

        const profile =
            kernel.service("profile");

        const organSystem =
            kernel.service("organSystem");

        const timeline =
            kernel.service("timeline");

        const bridge =
            kernel.service("bridge");

        const graph =
            kernel.service("graph");

        const universe =
            kernel.service("universe");

        const world =
            kernel.service("world");

        const runtime =
            kernel.service("runtime");

        const guardian =
            kernel.service("guardian");

        const evolution =
            kernel.service("evolution");

        const brain =
            kernel.service("brain");

        const memory =
            kernel.service("memorySystem");

        const events =
            kernel.service("events");

        this.renderer =
            kernel.service("renderer");

        const requiredServices = {
            entityManager,
            identity,
            profile,
            organSystem,
            world,
            guardian,
            evolution,
            brain,
            memory,
            timeline,
            events,
            renderer: this.renderer
        };

        const missingServices =
            Object.entries(requiredServices)
                .filter(
                    ([, service]) =>
                        !service
                )
                .map(
                    ([name]) => name
                );

        if(missingServices.length > 0){

            console.error(
                "Engine could not start. Missing services:",
                missingServices
            );

            return false;
        }

        [
            brain,
            memory,
            timeline,
            bridge,
            graph,
            universe,
            world,
            runtime
        ].forEach(service => {

            if(
                service &&
                typeof service.boot === "function"
            ){
                service.boot();
            }

        });

        const vaeroEntity =
            entityManager.create({
                id: "vaero-root",
                type: "brand",
                name: "VAERO",
                description:
                    "Living Digital Universe",
                status: "online",
                organs: []
            });

        vaeroEntity.identity =
            identity.create(
                vaeroEntity
            );

        identity.verify(
            vaeroEntity.identity
        );

        vaeroEntity.profile =
            profile.create(
                vaeroEntity
            );

        [
            ["Identity", "active"],
            ["Engine", "active"],
            ["Renderer", "active"],
            ["Bridge", "active"]
        ].forEach(([name, status]) => {

            vaeroEntity.addOrgan(
                organSystem.create(
                    name,
                    status
                )
            );

        });

        if(!guardian.validate(vaeroEntity)){

            console.error(
                "Entity rejected by Guardian."
            );

            return false;
        }

        this.currentEntity =
            vaeroEntity;

        this.rootEntity =
            vaeroEntity;

        this.currentView =
            "home";

        const awareness =
            VAERO.get(
                "brainAwareness"
            );

        if(
            awareness &&
            typeof awareness.enter === "function"
        ){
            awareness.enter("home");
        }

        if(
            typeof world.ensureRootWorld ===
            "function"
        ){
            world.ensureRootWorld(
                vaeroEntity.id
            );
        }

        events.emit(
            "entity.mounted",
            {
                entityId:
                    vaeroEntity.id,

                entityName:
                    vaeroEntity.name
            }
        );

        const engineStartExists =
            evolution.all().some(event =>
                event.type === "engine:start" &&
                event.payload &&
                event.payload.entityId ===
                    vaeroEntity.id
            );

        if(!engineStartExists){

            evolution.record(
                "engine:start",
                "VAERO Engine started with root entity",
                {
                    entityId:
                        vaeroEntity.id,

                    entityName:
                        vaeroEntity.name
                }
            );

        }

        this.started = true;

        this.mount(
            vaeroEntity
        );

        events.emit(
            "engine.started",
            {
                time: Date.now(),
                entityId:
                    vaeroEntity.id,
                entityName:
                    vaeroEntity.name
            }
        );

        console.log(
            "VAERO Engine Started"
        );

        return true;

    },

    isValidView(view){

        return this.views.includes(
            String(view || "")
        );

    },

    setView(view, state = {}){

        const nextView =
            this.isValidView(view)
                ? view
                : "home";

        this.currentView =
            nextView;

        if(
            Object.prototype.hasOwnProperty.call(
                state,
                "world"
            )
        ){
            this.currentWorld =
                state.world;
        }

        if(
            Object.prototype.hasOwnProperty.call(
                state,
                "entity"
            )
        ){
            this.currentOpenedEntity =
                state.entity;
        }

        if(
            Object.prototype.hasOwnProperty.call(
                state,
                "page"
            )
        ){
            this.currentEntityPage =
                state.page;
        }

        if(
            Object.prototype.hasOwnProperty.call(
                state,
                "entityCreateMode"
            )
        ){
            this.entityCreateMode =
                Boolean(
                    state.entityCreateMode
                );
        }

        if(
            Object.prototype.hasOwnProperty.call(
                state,
                "entityType"
            )
        ){
            this.entityType =
                state.entityType;
        }

        const awareness =
            VAERO.get(
                "brainAwareness"
            );

        if(
            awareness &&
            typeof awareness.enter === "function"
        ){
            awareness.enter(
                nextView,
                {
                    page:
                        this.currentEntityPage,

                    worldId:
                        this.currentWorld?.id ||
                        null,

                    entityId:
                        this.currentOpenedEntity?.id ||
                        null
                }
            );
        }

        this.mount(
            this.currentEntity
        );

        return true;

    },

    openHome(){

        this.currentWorld = null;
        this.currentOpenedEntity = null;
        this.currentEntityPage = null;
        this.entityCreateMode = false;
        this.entityType = null;

        return this.setView(
            "home"
        );

    },

    mount(entity = this.currentEntity){

        if(!entity){
            console.error(
                "Engine.mount requires an entity."
            );

            return false;
        }

        if(
            !this.renderer ||
            typeof this.renderer.render !==
                "function"
        ){
            console.error(
                "Renderer is not available."
            );

            return false;
        }

        this.currentEntity =
            entity;

        this.renderer.render(
            entity
        );

        return true;

    }

};

const vaeroKernel =
    VAERO.get("kernel");

if(vaeroKernel){
    vaeroKernel.boot();
}else{
    console.error(
        "VAERO Kernel could not be booted."
    );
}

window.Engine = Engine;
