/* =========================================================
   VAERO ENGINE
   Core Engine Lifecycle / Navigation / Mount Controller
========================================================= */

const Engine = {

    /* =====================================================
       STATE
    ===================================================== */

    currentEntity:
        null,

    rootEntity:
        null,

    currentWorld:
        null,

    currentOpenedEntity:
        null,

    currentEntityPage:
        null,

    currentView:
        "home",

    entityCreateMode:
        false,

    entityType:
        null,

    renderer:
        null,

    started:
        false,

    starting:
        false,

    startedAt:
        null,


    /* =====================================================
       ENGINE VIEWS
    ===================================================== */

    views: [

        "home",
        "identity",
        "profile",
        "create",
        "worlds",
        "world",
        "entity"

    ],


    /* =====================================================
       SYSTEM APPLICATION PAGES
    ===================================================== */

    systemPages: [

        "vaero",
        "applications"

    ],


    /* =====================================================
       SAFE SERVICE ACCESS
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
            ){
                return null;
            }


            return (
                VAERO.get(name) ||
                null
            );

        } catch(error){

            console.warn(
                `Engine service lookup failed: ${name}`,
                error
            );

            return null;

        }

    },


    /* =====================================================
       AWARENESS
    ===================================================== */

    syncAwareness(
        location,
        metadata = {}
    ){

        const awareness =
            this.getService(
                "brainAwareness"
            );


        if(
            !awareness ||
            typeof awareness.enter !==
                "function"
        ){
            return false;
        }


        try{

            awareness.enter(
                location,
                {
                    page:
                        this.currentEntityPage,

                    view:
                        this.currentView,

                    worldId:
                        this.currentWorld?.id ||
                        null,

                    entityId:
                        this.currentOpenedEntity?.id ||
                        null,

                    ...metadata
                }
            );


            return true;

        } catch(error){

            console.warn(
                "Engine awareness sync failed:",
                error
            );

            return false;

        }

    },


    /* =====================================================
       VIEW VALIDATION
    ===================================================== */

    isValidView(view){

        return this.views.includes(
            String(
                view ||
                ""
            )
        );

    },


    isValidSystemPage(page){

        return this.systemPages.includes(
            String(
                page ||
                ""
            )
        );

    },


    /* =====================================================
       BOOT SERVICE
    ===================================================== */

    bootService(
        service,
        name
    ){

        if(
            !service ||
            typeof service.boot !==
                "function"
        ){
            return true;
        }


        try{

            const result =
                service.boot();


            if(result === false){

                console.warn(
                    `${name} boot returned false.`
                );

                return false;

            }


            return true;

        } catch(error){

            console.error(
                `${name} boot failed:`,
                error
            );

            return false;

        }

    },


    /* =====================================================
       ENGINE START
    ===================================================== */

    start(){

        if(this.started){

            console.warn(
                "VAERO Engine is already running."
            );

            return false;

        }


        if(this.starting){

            console.warn(
                "VAERO Engine is already starting."
            );

            return false;

        }


        this.starting =
            true;


        try{

            VAERO.engine =
                this;


            VAERO.register(
                "engine",
                this
            );


            /* =================================================
               KERNEL
            ================================================= */

            const kernel =
                this.getService(
                    "kernel"
                );


            if(!kernel){

                console.error(
                    "VAERO Kernel could not be found."
                );

                return false;

            }


            /*
             * Engine dosyasının altındaki bootstrap normalde
             * Kernel'i önceden boot eder.
             *
             * Bu kontrol Engine.start doğrudan çağrılırsa
             * güvenli fallback sağlar.
             */

            if(
                kernel.booted !==
                    true &&
                typeof kernel.boot ===
                    "function"
            ){

                const kernelResult =
                    kernel.boot();


                if(
                    kernelResult ===
                    false
                ){

                    console.error(
                        "VAERO Kernel could not be booted."
                    );

                    return false;

                }

            }


            /* =================================================
               SERVICES
            ================================================= */

            const entityManager =
                kernel.service(
                    "entityManager"
                );


            const identity =
                kernel.service(
                    "identity"
                );


            const profile =
                kernel.service(
                    "profile"
                );


            const organSystem =
                kernel.service(
                    "organSystem"
                );


            const timeline =
                kernel.service(
                    "timeline"
                );


            const bridge =
                kernel.service(
                    "bridge"
                );


            const graph =
                kernel.service(
                    "graph"
                );


            const universe =
                kernel.service(
                    "universe"
                );


            const world =
                kernel.service(
                    "world"
                );


            const runtime =
                kernel.service(
                    "runtime"
                );


            const guardian =
                kernel.service(
                    "guardian"
                );


            const evolution =
                kernel.service(
                    "evolution"
                );


            const brain =
                kernel.service(
                    "brain"
                );


            const memory =
                kernel.service(
                    "memorySystem"
                );


            const events =
                kernel.service(
                    "events"
                );


            this.renderer =
                kernel.service(
                    "renderer"
                );


            /* =================================================
               REQUIRED SERVICES
            ================================================= */

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

                renderer:
                    this.renderer

            };


            const missingServices =
                Object.entries(
                    requiredServices
                )
                    .filter(
                        ([, service]) =>
                            !service
                    )
                    .map(
                        ([name]) =>
                            name
                    );


            if(
                missingServices.length >
                0
            ){

                console.error(
                    "Engine could not start. Missing services:",
                    missingServices
                );

                return false;

            }


            /* =================================================
               SECURITY READINESS
            ================================================= */

            if(
                typeof kernel.assertSecurity ===
                    "function"
            ){

                const securityReady =
                    kernel.assertSecurity();


                if(
                    securityReady ===
                    false
                ){

                    console.error(
                        "Engine start blocked: security layer is not ready."
                    );

                    return false;

                }

            }


            /* =================================================
               SERVICE LIFECYCLE
            ================================================= */

            const bootServices = [

                [
                    "brain",
                    brain
                ],

                [
                    "memory",
                    memory
                ],

                [
                    "timeline",
                    timeline
                ],

                [
                    "bridge",
                    bridge
                ],

                [
                    "graph",
                    graph
                ],

                [
                    "universe",
                    universe
                ],

                [
                    "world",
                    world
                ],

                [
                    "runtime",
                    runtime
                ]

            ];


            for(
                const [
                    name,
                    service
                ] of bootServices
            ){

                this.bootService(
                    service,
                    name
                );

            }


            /* =================================================
               ROOT ENTITY
            ================================================= */

            const vaeroEntity =
                entityManager.create({
                    id:
                        "vaero-root",

                    type:
                        "brand",

                    name:
                        "VAERO",

                    description:
                        "Living Digital Universe",

                    status:
                        "online",

                    organs:
                        []
                });


            if(!vaeroEntity){

                console.error(
                    "VAERO root entity could not be created."
                );

                return false;

            }


            /* =================================================
               ROOT IDENTITY
            ================================================= */

            vaeroEntity.identity =
                identity.create(
                    vaeroEntity
                );


            if(!vaeroEntity.identity){

                console.error(
                    "VAERO root identity could not be created."
                );

                return false;

            }


            if(
                typeof identity.verify ===
                    "function"
            ){

                identity.verify(
                    vaeroEntity.identity
                );

            }


            /* =================================================
               ROOT PROFILE
            ================================================= */

            vaeroEntity.profile =
                profile.create(
                    vaeroEntity
                );


            /* =================================================
               ROOT ORGANS
            ================================================= */

            const rootOrgans = [

                [
                    "Identity",
                    "active",
                    {
                        slug:
                            "identity",

                        type:
                            "system",

                        source:
                            "system",

                        trusted:
                            true,

                        removable:
                            false
                    }
                ],

                [
                    "Engine",
                    "active",
                    {
                        slug:
                            "engine",

                        type:
                            "system",

                        source:
                            "system",

                        trusted:
                            true,

                        removable:
                            false
                    }
                ],

                [
                    "Renderer",
                    "active",
                    {
                        slug:
                            "renderer",

                        type:
                            "system",

                        source:
                            "system",

                        trusted:
                            true,

                        removable:
                            false
                    }
                ],

                [
                    "Bridge",
                    "active",
                    {
                        slug:
                            "bridge",

                        type:
                            "system",

                        source:
                            "system",

                        trusted:
                            true,

                        removable:
                            false
                    }
                ]

            ];


            rootOrgans.forEach(
                ([
                    name,
                    status,
                    meta
                ]) => {

                    const organ =
                        organSystem.create(
                            name,
                            status,
                            meta
                        );


                    if(
                        organ &&
                        typeof vaeroEntity.addOrgan ===
                            "function"
                    ){

                        vaeroEntity.addOrgan(
                            organ
                        );

                    }

                }
            );


            /* =================================================
               GUARDIAN VALIDATION
            ================================================= */

            if(
                typeof guardian.validate !==
                    "function"
            ){

                console.error(
                    "Guardian validation API is unavailable."
                );

                return false;

            }


            if(
                !guardian.validate(
                    vaeroEntity,
                    {
                        operation:
                            "engine-root-mount",

                        scope:
                            "entity"
                    }
                )
            ){

                console.error(
                    "Entity rejected by Guardian."
                );

                return false;

            }


            /* =================================================
               ENGINE STATE
            ================================================= */

            this.currentEntity =
                vaeroEntity;


            this.rootEntity =
                vaeroEntity;


            this.currentWorld =
                null;


            this.currentOpenedEntity =
                null;


            this.currentEntityPage =
                null;


            this.currentView =
                "home";


            this.entityCreateMode =
                false;


            this.entityType =
                null;


            /* =================================================
               ROOT WORLD
            ================================================= */

            if(
                typeof world.ensureRootWorld ===
                    "function"
            ){

                world.ensureRootWorld(
                    vaeroEntity.id
                );

            }


            /* =================================================
               ENTITY MOUNT EVENT
            ================================================= */

            events.emit(
                "entity.mounted",
                {
                    entityId:
                        vaeroEntity.id,

                    entityName:
                        vaeroEntity.name
                }
            );


            /* =================================================
               EVOLUTION START EVENT
            ================================================= */

            const evolutionHistory =
                typeof evolution.all ===
                    "function"
                    ? evolution.all()
                    : [];


            const engineStartExists =
                Array.isArray(
                    evolutionHistory
                ) &&
                evolutionHistory.some(
                    event =>
                        event?.type ===
                            "engine:start" &&
                        event?.payload
                            ?.entityId ===
                            vaeroEntity.id
                );


            if(
                !engineStartExists &&
                typeof evolution.record ===
                    "function"
            ){

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


            /* =================================================
               FINALIZE
            ================================================= */

            this.started =
                true;


            this.startedAt =
                Date.now();


            this.syncAwareness(
                "home"
            );


            const mounted =
                this.mount(
                    vaeroEntity
                );


            if(!mounted){

                this.started =
                    false;

                console.error(
                    "VAERO Engine initial render failed."
                );

                return false;

            }


            events.emit(
                "engine.started",
                {
                    time:
                        this.startedAt,

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

        } catch(error){

            this.started =
                false;


            console.error(
                "VAERO Engine start failed:",
                error
            );


            return false;

        } finally {

            this.starting =
                false;

        }

    },


    /* =====================================================
       SET VIEW
    ===================================================== */

    setView(
        view,
        state = {}
    ){

        const nextView =
            this.isValidView(
                view
            )
                ? view
                : "home";


        this.currentView =
            nextView;


        /*
         * Normal Engine view açıldığında eski system-app
         * page state'in ekranda kalmasını engeller.
         *
         * State açıkça page içeriyorsa aşağıda uygulanır.
         */

        if(
            !Object.prototype
                .hasOwnProperty.call(
                    state,
                    "page"
                )
        ){

            this.currentEntityPage =
                null;

        }


        if(
            Object.prototype
                .hasOwnProperty.call(
                    state,
                    "world"
                )
        ){

            this.currentWorld =
                state.world;

        }


        if(
            Object.prototype
                .hasOwnProperty.call(
                    state,
                    "entity"
                )
        ){

            this.currentOpenedEntity =
                state.entity;

        }


        if(
            Object.prototype
                .hasOwnProperty.call(
                    state,
                    "page"
                )
        ){

            const page =
                state.page;


            this.currentEntityPage =
                page
                    ? String(page)
                    : null;

        }


        if(
            Object.prototype
                .hasOwnProperty.call(
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
            Object.prototype
                .hasOwnProperty.call(
                    state,
                    "entityType"
                )
        ){

            this.entityType =
                state.entityType;

        }


        this.syncAwareness(
            nextView
        );


        return this.mount(
            this.currentEntity
        );

    },


    /* =====================================================
       SYSTEM APPLICATION PAGE
    ===================================================== */

    openSystemPage(page){

        const normalizedPage =
            String(
                page ||
                ""
            )
                .trim()
                .toLowerCase();


        if(
            !this.isValidSystemPage(
                normalizedPage
            )
        ){

            console.warn(
                "Unknown VAERO system page:",
                normalizedPage
            );

            return false;

        }


        this.currentWorld =
            null;


        this.currentOpenedEntity =
            null;


        this.currentEntityPage =
            normalizedPage;


        this.entityCreateMode =
            false;


        this.entityType =
            null;


        this.syncAwareness(
            normalizedPage,
            {
                systemPage:
                    true
            }
        );


        return this.mount(
            this.currentEntity
        );

    },


    /* =====================================================
       HOME
    ===================================================== */

    openHome(){

        this.currentWorld =
            null;


        this.currentOpenedEntity =
            null;


        this.currentEntityPage =
            null;


        this.entityCreateMode =
            false;


        this.entityType =
            null;


        return this.setView(
            "home"
        );

    },


    /* =====================================================
       MOUNT
    ===================================================== */

    mount(
        entity =
            this.currentEntity
    ){

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


        try{

            return (
                this.renderer.render(
                    entity
                ) !== false
            );

        } catch(error){

            console.error(
                "Engine mount failed:",
                error
            );

            return false;

        }

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            started:
                this.started,

            starting:
                this.starting,

            startedAt:
                this.startedAt,

            currentView:
                this.currentView,

            currentPage:
                this.currentEntityPage,

            currentWorldId:
                this.currentWorld?.id ||
                null,

            currentOpenedEntityId:
                this.currentOpenedEntity?.id ||
                null,

            rootEntityId:
                this.rootEntity?.id ||
                null,

            entityCreateMode:
                this.entityCreateMode,

            entityType:
                this.entityType

        };

    }

};


/* =========================================================
   KERNEL BOOTSTRAP
========================================================= */

const vaeroKernel =
    VAERO.get(
        "kernel"
    );


if(vaeroKernel){

    if(
        typeof vaeroKernel.boot ===
            "function"
    ){

        vaeroKernel.boot();

    }

} else {

    console.error(
        "VAERO Kernel could not be booted."
    );

}


/* =========================================================
   GLOBAL
========================================================= */

window.Engine =
    Engine;
