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

    worldEditMode:
        false,

    entityEditMode:
        false,

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
                typeof VAERO.get !==
                    "function"
            ){

                return null;

            }


            return (
                VAERO.get(
                    name
                ) ||
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
                        this.currentEntity?.id ||
                        null,

                    worldEditMode:
                        this.worldEditMode,

                    entityEditMode:
                        this.entityEditMode,

                    entityCreateMode:
                        this.entityCreateMode,

                    entityType:
                        this.entityType,

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


            if(
                result ===
                false
            ){

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
       RESOLVE KERNEL SERVICE
    ===================================================== */

    resolveKernelService(
        kernel,
        name,
        fallback = null
    ){

        try{

            if(
                kernel &&
                typeof kernel.service ===
                    "function"
            ){

                const service =
                    kernel.service(
                        name
                    );


                if(service){

                    return service;

                }

            }

        } catch(error){

            /* VAERO fallback */

        }


        return (
            this.getService(
                name
            ) ||
            fallback ||
            null
        );

    },


    /* =====================================================
       RESET TRANSIENT STATE
    ===================================================== */

    resetTransientState(){

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


        this.worldEditMode =
            false;


        this.entityEditMode =
            false;


        return true;

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

            if(
                typeof VAERO ===
                    "undefined"
            ){

                console.error(
                    "VAERO runtime is unavailable."
                );


                return false;

            }


            VAERO.engine =
                this;


            if(
                typeof VAERO.register ===
                    "function"
            ){

                VAERO.register(
                    "engine",
                    this
                );

            }


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
                this.resolveKernelService(
                    kernel,
                    "entityManager"
                );


            const identity =
                this.resolveKernelService(
                    kernel,
                    "identity"
                );


            const profile =
                this.resolveKernelService(
                    kernel,
                    "profile"
                );


            const organSystem =
                this.resolveKernelService(
                    kernel,
                    "organSystem",
                    window.OrganSystem ||
                    null
                );


            const organStatus =
                this.resolveKernelService(
                    kernel,
                    "organStatus",
                    window.OrganStatus ||
                    null
                );


            const appRegistry =
                this.resolveKernelService(
                    kernel,
                    "appRegistry",
                    window.AppRegistry ||
                    null
                );


            const timeline =
                this.resolveKernelService(
                    kernel,
                    "timeline"
                );


            const bridge =
                this.resolveKernelService(
                    kernel,
                    "bridge"
                );


            const graph =
                this.resolveKernelService(
                    kernel,
                    "graph"
                );


            const universe =
                this.resolveKernelService(
                    kernel,
                    "universe"
                );


            const world =
                this.resolveKernelService(
                    kernel,
                    "world"
                );


            const runtime =
                this.resolveKernelService(
                    kernel,
                    "runtime"
                );


            const guardian =
                this.resolveKernelService(
                    kernel,
                    "guardian"
                );


            const evolution =
                this.resolveKernelService(
                    kernel,
                    "evolution"
                );


            const brain =
                this.resolveKernelService(
                    kernel,
                    "brain"
                );


            const brainService =
                this.resolveKernelService(
                    kernel,
                    "brainService"
                );


            const memory =
                this.resolveKernelService(
                    kernel,
                    "memorySystem"
                ) ||
                this.resolveKernelService(
                    kernel,
                    "memory"
                );


            const events =
                this.resolveKernelService(
                    kernel,
                    "events"
                );


            const renderer =
                this.resolveKernelService(
                    kernel,
                    "renderer",
                    window.Renderer ||
                    null
                );


            this.renderer =
                renderer;


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
                renderer

            };


            const missingServices =
                Object.entries(
                    requiredServices
                )
                    .filter(
                        ([,service]) =>
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
                    "organSystem",
                    organSystem
                ],

                [
                    "organStatus",
                    organStatus
                ],

                [
                    "appRegistry",
                    appRegistry
                ],

                [
                    "brain",
                    brain
                ],

                [
                    "brainService",
                    brainService
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

                const booted =
                    this.bootService(
                        service,
                        name
                    );


                if(
                    booted ===
                    false
                ){

                    console.warn(
                        `${name} could not complete boot.`
                    );

                }

            }


            /* =================================================
               ROOT ENTITY
            ================================================= */

            let vaeroEntity =
                null;


            try{

                if(
                    typeof entityManager.get ===
                        "function"
                ){

                    vaeroEntity =
                        entityManager.get(
                            "vaero-root"
                        );

                }

            } catch(error){

                vaeroEntity =
                    null;

            }


            if(!vaeroEntity){

                vaeroEntity =
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
                            "active",

                        organs:
                            []
                    });

            }


            if(!vaeroEntity){

                console.error(
                    "VAERO root entity could not be created."
                );


                return false;

            }


            /* =================================================
               ROOT IDENTITY
            ================================================= */

            let rootIdentity =
                vaeroEntity.identity ||
                null;


            if(!rootIdentity){

                try{

                    if(
                        typeof identity.get ===
                            "function"
                    ){

                        rootIdentity =
                            identity.get(
                                vaeroEntity.id
                            );

                    }

                } catch(error){

                    rootIdentity =
                        null;

                }

            }


            if(
                !rootIdentity &&
                typeof identity.create ===
                    "function"
            ){

                rootIdentity =
                    identity.create(
                        vaeroEntity
                    );

            }


            if(!rootIdentity){

                console.error(
                    "VAERO root identity could not be created."
                );


                return false;

            }


            vaeroEntity.identity =
                rootIdentity;


            if(
                typeof identity.verify ===
                    "function"
            ){

                try{

                    identity.verify(
                        rootIdentity
                    );

                } catch(error){

                    console.warn(
                        "VAERO root identity verification failed:",
                        error
                    );

                }

            }


            /* =================================================
               ROOT PROFILE
            ================================================= */

            let rootProfile =
                vaeroEntity.profile ||
                null;


            if(!rootProfile){

                try{

                    if(
                        typeof profile.get ===
                            "function"
                    ){

                        rootProfile =
                            profile.get(
                                vaeroEntity.id
                            );

                    }

                } catch(error){

                    rootProfile =
                        null;

                }

            }


            if(
                !rootProfile &&
                typeof profile.create ===
                    "function"
            ){

                rootProfile =
                    profile.create(
                        vaeroEntity
                    );

            }


            if(rootProfile){

                vaeroEntity.profile =
                    rootProfile;

            }


            /* =================================================
               ROOT ORGANS
            ================================================= */

            const rootOrgans = [

                [
                    "Identity",
                    "identity"
                ],

                [
                    "Engine",
                    "engine"
                ],

                [
                    "Renderer",
                    "renderer"
                ],

                [
                    "Bridge",
                    "bridge"
                ],

                [
                    "Memory",
                    "memory"
                ],

                [
                    "Timeline",
                    "timeline"
                ],

                [
                    "Evolution",
                    "evolution"
                ],

                [
                    "Applications",
                    "applications"
                ]

            ];


            rootOrgans.forEach(
                ([
                    name,
                    slug
                ]) => {

                    let organ =
                        null;


                    try{

                        organ =
                            organSystem.get?.(
                                slug
                            ) ||
                            organSystem.findBySlug?.(
                                slug
                            ) ||
                            null;

                    } catch(error){

                        organ =
                            null;

                    }


                    if(!organ){

                        organ =
                            organSystem.create(
                                name,
                                "active",
                                {

                                    id:
                                        slug,

                                    slug,

                                    type:
                                        "system",

                                    source:
                                        "system",

                                    installed:
                                        true,

                                    trusted:
                                        true,

                                    removable:
                                        false,

                                    protected:
                                        true

                                }
                            );

                    }


                    if(
                        organ &&
                        typeof vaeroEntity.addOrgan ===
                            "function"
                    ){

                        try{

                            const existing =
                                typeof vaeroEntity.getOrgan ===
                                    "function"

                                    ? vaeroEntity.getOrgan(
                                        organ.id
                                    )

                                    : null;


                            if(!existing){

                                vaeroEntity.addOrgan(
                                    organ
                                );

                            }

                        } catch(error){

                            try{

                                vaeroEntity.addOrgan(
                                    organ
                                );

                            } catch(secondError){

                                /* non-fatal */

                            }

                        }

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


            let guardianAccepted =
                false;


            try{

                const validation =
                    guardian.validate(
                        vaeroEntity,
                        {
                            operation:
                                "engine-root-mount",

                            scope:
                                "entity"
                        }
                    );


                guardianAccepted =
                    !(
                        validation ===
                            false ||
                        validation?.valid ===
                            false
                    );

            } catch(error){

                console.error(
                    "Guardian root validation failed:",
                    error
                );


                guardianAccepted =
                    false;

            }


            if(!guardianAccepted){

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


            this.currentView =
                "home";


            this.resetTransientState();


            /* =================================================
               ROOT WORLD
            ================================================= */

            if(
                typeof world.ensureRootWorld ===
                    "function"
            ){

                try{

                    const rootWorld =
                        world.ensureRootWorld(
                            vaeroEntity.id
                        );


                    if(
                        rootWorld &&
                        this.currentWorld ===
                            null
                    ){

                        /*
                         * Root world exists in the World system,
                         * but Home remains the initial Engine view.
                         */

                    }

                } catch(error){

                    console.warn(
                        "VAERO root world could not be ensured:",
                        error
                    );

                }

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
                        vaeroEntity.name,

                    time:
                        Date.now()
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
                    ? String(
                        page
                    )
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


        if(
            Object.prototype
                .hasOwnProperty.call(
                    state,
                    "worldEditMode"
                )
        ){

            this.worldEditMode =
                Boolean(
                    state.worldEditMode
                );

        }


        if(
            Object.prototype
                .hasOwnProperty.call(
                    state,
                    "entityEditMode"
                )
        ){

            this.entityEditMode =
                Boolean(
                    state.entityEditMode
                );

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


        this.currentView =
            "home";


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


        this.worldEditMode =
            false;


        this.entityEditMode =
            false;


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

        this.currentView =
            "home";


        this.resetTransientState();


        this.syncAwareness(
            "home"
        );


        return this.mount(
            this.currentEntity
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

            const result =
                this.renderer.render(
                    entity
                );


            return (
                result !==
                false
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

        const organSystem =
            this.getService(
                "organSystem"
            );


        const organStatus =
            this.getService(
                "organStatus"
            );


        let organReport =
            null;


        let healthReport =
            null;


        try{

            organReport =
                organSystem?.report?.() ||
                null;

        } catch(error){

            organReport =
                null;

        }


        try{

            healthReport =
                organStatus?.report?.() ||
                null;

        } catch(error){

            healthReport =
                null;

        }


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

            currentEntityId:
                this.currentEntity?.id ||
                null,

            rootEntityId:
                this.rootEntity?.id ||
                null,

            entityCreateMode:
                this.entityCreateMode,

            entityType:
                this.entityType,

            worldEditMode:
                this.worldEditMode,

            entityEditMode:
                this.entityEditMode,

            organs:
                organReport,

            organHealth:
                healthReport

        };

    }

};


/* =========================================================
   KERNEL BOOTSTRAP
========================================================= */

let vaeroKernel =
    null;


try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.get ===
            "function"
    ){

        vaeroKernel =
            VAERO.get(
                "kernel"
            );

    }

} catch(error){

    vaeroKernel =
        null;

}


if(vaeroKernel){

    if(
        typeof vaeroKernel.boot ===
            "function"
    ){

        try{

            vaeroKernel.boot();

        } catch(error){

            console.error(
                "VAERO Kernel boot failed:",
                error
            );

        }

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
