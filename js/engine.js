/* =========================================================
   VAERO ENGINE
   Core Engine Lifecycle / Navigation / Mount Controller
========================================================= */

const Engine = {

    version:
        "3.0.0",


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

    lastStartError:
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

        const serviceName =
            String(
                name ??
                ""
            ).trim();


        if(!serviceName){

            return null;

        }


        try{

            if(
                typeof VAERO ===
                    "undefined" ||
                typeof VAERO.get !==
                    "function"
            ){

                return null;

            }


            return (
                VAERO.get(
                    serviceName
                ) ||
                null
            );

        } catch(error){

            console.warn(
                `Engine service lookup failed: ${serviceName}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       ENGINE REGISTRATION
    ===================================================== */

    registerRuntime(){

        try{

            if(
                typeof VAERO ===
                    "undefined"
            ){

                return false;

            }


            if(
                typeof VAERO.setEngine ===
                    "function"
            ){

                VAERO.setEngine(
                    this
                );

            } else {

                VAERO.engine =
                    this;

            }


            if(
                typeof VAERO.register ===
                    "function"
            ){

                VAERO.register(
                    "engine",
                    this
                );

            }


            return true;

        } catch(error){

            console.error(
                "Engine runtime registration failed:",
                error
            );


            return false;

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
                .trim()
                .toLowerCase()
        );

    },


    isValidSystemPage(page){

        return this.systemPages.includes(
            String(
                page ||
                    ""
            )
                .trim()
                .toLowerCase()
        );

    },


    /* =====================================================
       SAFE EVENT EMIT
    ===================================================== */

    emit(
        name,
        payload = {}
    ){

        const eventName =
            String(
                name ??
                    ""
            ).trim();


        if(!eventName){

            return false;

        }


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    eventName,
                    payload
                );


                return true;

            }

        } catch(error){

            /* events fallback */

        }


        const events =
            this.getService(
                "events"
            );


        if(
            !events ||
            typeof events.emit !==
                "function"
        ){

            return false;

        }


        try{

            events.emit(
                eventName,
                payload
            );


            return true;

        } catch(error){

            console.warn(
                `Engine event emit failed: ${eventName}`,
                error
            );


            return false;

        }

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


        /*
         * Kernel is the primary lifecycle authority.
         * Do not re-run services which clearly expose an
         * already-booted state.
         */

        if(
            service.booted ===
                true ||
            service.started ===
                true ||
            service.initialized ===
                true
        ){

            return true;

        }


        try{

            const result =
                service.boot();


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                console.warn(
                    `${name} boot is async; Engine.start is synchronous.`
                );


                return false;

            }


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
       ROOT ENTITY RESOLUTION
    ===================================================== */

    resolveRootEntity(
        entityManager
    ){

        if(!entityManager){

            return null;

        }


        let entity =
            null;


        try{

            if(
                typeof entityManager.get ===
                    "function"
            ){

                entity =
                    entityManager.get(
                        "vaero-root"
                    ) ||
                    null;

            }

        } catch(error){

            entity =
                null;

        }


        if(entity){

            return entity;

        }


        if(
            typeof entityManager.create !==
                "function"
        ){

            return null;

        }


        try{

            return (
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

                    metadata:{

                        system:
                            true,

                        removable:
                            false,

                        root:
                            true

                    },

                    organs:
                        []

                }) ||
                null
            );

        } catch(error){

            console.error(
                "VAERO root entity creation failed:",
                error
            );


            return null;

        }

    },


    /* =====================================================
       ROOT IDENTITY
    ===================================================== */

    ensureRootIdentity(
        entity,
        identity
    ){

        if(
            !entity ||
            !identity
        ){

            return null;

        }


        let rootIdentity =
            entity.identity ||
            null;


        if(!rootIdentity){

            try{

                if(
                    typeof identity.get ===
                        "function"
                ){

                    rootIdentity =
                        identity.get(
                            entity.id
                        ) ||
                        identity.get(
                            entity
                        ) ||
                        null;

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

            try{

                rootIdentity =
                    identity.create(
                        entity
                    ) ||
                    null;

            } catch(error){

                console.error(
                    "VAERO root identity creation failed:",
                    error
                );


                rootIdentity =
                    null;

            }

        }


        if(rootIdentity){

            entity.identity =
                rootIdentity;

        }


        /*
         * Engine never self-verifies identity.
         *
         * Verification authority belongs to the dedicated
         * verification/trust boundary.
         */

        return rootIdentity;

    },


    /* =====================================================
       ROOT PROFILE
    ===================================================== */

    ensureRootProfile(
        entity,
        profile
    ){

        if(
            !entity ||
            !profile
        ){

            return null;

        }


        let rootProfile =
            entity.profile ||
            null;


        if(!rootProfile){

            try{

                if(
                    typeof profile.get ===
                        "function"
                ){

                    rootProfile =
                        profile.get(
                            entity.id
                        ) ||
                        profile.get(
                            entity
                        ) ||
                        null;

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

            try{

                rootProfile =
                    profile.create(
                        entity
                    ) ||
                    null;

            } catch(error){

                console.warn(
                    "VAERO root profile creation failed:",
                    error
                );


                rootProfile =
                    null;

            }

        }


        if(rootProfile){

            entity.profile =
                rootProfile;

        }


        return rootProfile;

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


        this.lastStartError =
            null;


        try{

            if(
                typeof VAERO ===
                    "undefined"
            ){

                throw new Error(
                    "VAERO runtime is unavailable."
                );

            }


            if(
                !this.registerRuntime()
            ){

                throw new Error(
                    "Engine could not register with VAERO runtime."
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

                throw new Error(
                    "VAERO Kernel could not be found."
                );

            }


            if(
                kernel.booted !==
                    true
            ){

                if(
                    typeof kernel.boot !==
                        "function"
                ){

                    throw new Error(
                        "VAERO Kernel boot API is unavailable."
                    );

                }


                const kernelResult =
                    kernel.boot();


                if(
                    kernelResult &&
                    typeof kernelResult.then ===
                        "function"
                ){

                    throw new Error(
                        "Kernel boot is async but Engine.start is synchronous."
                    );

                }


                if(
                    kernelResult ===
                        false
                ){

                    throw new Error(
                        "VAERO Kernel could not be booted."
                    );

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
                    typeof window !==
                        "undefined"
                        ? window.OrganSystem ||
                          null
                        : null
                );


            const organStatus =
                this.resolveKernelService(
                    kernel,
                    "organStatus",
                    typeof window !==
                        "undefined"
                        ? window.OrganStatus ||
                          null
                        : null
                );


            const appRegistry =
                this.resolveKernelService(
                    kernel,
                    "appRegistry",
                    typeof window !==
                        "undefined"
                        ? window.AppRegistry ||
                          null
                        : null
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
                    typeof window !==
                        "undefined"
                        ? window.Renderer ||
                          null
                        : null
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
                        (
                            [
                                ,
                                service
                            ]
                        ) =>
                            !service
                    )
                    .map(
                        (
                            [
                                name
                            ]
                        ) =>
                            name
                    );


            if(
                missingServices.length >
                    0
            ){

                throw new Error(
                    `Engine missing required services: ${missingServices.join(", ")}`
                );

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

                    throw new Error(
                        "Engine start blocked: security layer is not ready."
                    );

                }

            }


            /* =================================================
               OPTIONAL / NON-KERNEL LIFECYCLE
            ================================================= */

            const optionalBootServices = [

                [
                    "organStatus",
                    organStatus
                ],

                [
                    "appRegistry",
                    appRegistry
                ],

                [
                    "brainService",
                    brainService
                ]

            ];


            for(
                const [
                    name,
                    service
                ] of
                    optionalBootServices
            ){

                if(!service){

                    continue;

                }


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
                        `${name} could not complete optional boot.`
                    );

                }

            }


            /* =================================================
               ROOT ENTITY
            ================================================= */

            const vaeroEntity =
                this.resolveRootEntity(
                    entityManager
                );


            if(!vaeroEntity){

                throw new Error(
                    "VAERO root entity could not be resolved."
                );

            }


            /* =================================================
               ROOT IDENTITY
            ================================================= */

            const rootIdentity =
                this.ensureRootIdentity(
                    vaeroEntity,
                    identity
                );


            if(!rootIdentity){

                throw new Error(
                    "VAERO root identity could not be resolved."
                );

            }


            /* =================================================
               ROOT PROFILE
            ================================================= */

            this.ensureRootProfile(
                vaeroEntity,
                profile
            );


            /* =================================================
               CONTINUE IN PART 2
            ================================================= */

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


            for(
                const [
                    name,
                    slug
                ] of rootOrgans
            ){

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

                    try{

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
                                        true,

                                    metadata:{

                                        system:
                                            true,

                                        root:
                                            true

                                    }

                                }
                            ) ||
                            null;

                    } catch(error){

                        console.warn(
                            `Root organ could not be created: ${slug}`,
                            error
                        );


                        organ =
                            null;

                    }

                }


                if(
                    !organ ||
                    typeof vaeroEntity.addOrgan !==
                        "function"
                ){

                    continue;

                }


                let existing =
                    null;


                try{

                    if(
                        typeof vaeroEntity.getOrgan ===
                            "function"
                    ){

                        existing =
                            vaeroEntity.getOrgan(
                                organ.id ||
                                slug
                            ) ||
                            null;

                    }

                } catch(error){

                    existing =
                        null;

                }


                if(existing){

                    continue;

                }


                try{

                    vaeroEntity.addOrgan(
                        organ
                    );

                } catch(error){

                    console.warn(
                        `Root organ could not be attached: ${slug}`,
                        error
                    );

                }

            }


            /* =================================================
               GUARDIAN VALIDATION
            ================================================= */

            if(
                typeof guardian.validate !==
                    "function"
            ){

                throw new Error(
                    "Guardian validation API is unavailable."
                );

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
                                "entity",

                            source:
                                "engine.start"
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

                throw new Error(
                    "VAERO root entity was rejected by Guardian."
                );

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

            let rootWorld =
                null;


            if(
                typeof world.ensureRootWorld ===
                    "function"
            ){

                try{

                    rootWorld =
                        world.ensureRootWorld(
                            vaeroEntity.id
                        ) ||
                        null;

                } catch(error){

                    console.warn(
                        "VAERO root world could not be ensured:",
                        error
                    );


                    rootWorld =
                        null;

                }

            }


            /*
             * Root World belongs to World authority.
             * It is not automatically opened during Engine boot.
             * Home remains the initial UI state.
             */

            this.currentWorld =
                null;


            /* =================================================
               ENTITY MOUNT EVENT
            ================================================= */

            this.emit(
                "entity.mounted",
                {
                    entityId:
                        vaeroEntity.id,

                    entityName:
                        vaeroEntity.name,

                    root:
                        true,

                    time:
                        Date.now()
                }
            );


            /* =================================================
               EVOLUTION START EVENT
            ================================================= */

            let evolutionHistory =
                [];


            try{

                if(
                    typeof evolution.all ===
                        "function"
                ){

                    const result =
                        evolution.all();


                    evolutionHistory =
                        Array.isArray(
                            result
                        )
                            ? result
                            : [];

                }

            } catch(error){

                evolutionHistory =
                    [];

            }


            const engineStartExists =
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

                try{

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

                } catch(error){

                    console.warn(
                        "Engine start Evolution event could not be recorded:",
                        error
                    );

                }

            }


            /* =================================================
               INITIAL RENDER
            ================================================= */

            this.started =
                true;


            this.startedAt =
                Date.now();


            const mounted =
                this.mount(
                    vaeroEntity
                );


            if(!mounted){

                this.started =
                    false;


                this.startedAt =
                    null;


                throw new Error(
                    "VAERO Engine initial render failed."
                );

            }


            /* =================================================
               INITIAL AWARENESS
            ================================================= */

            this.syncAwareness(
                "home",
                {
                    source:
                        "engine.start",

                    rootWorldId:
                        rootWorld?.id ||
                        null
                }
            );


            /* =================================================
               ENGINE START EVENT
            ================================================= */

            this.emit(
                "engine.started",
                {
                    time:
                        this.startedAt,

                    entityId:
                        vaeroEntity.id,

                    entityName:
                        vaeroEntity.name,

                    rootWorldId:
                        rootWorld?.id ||
                        null
                }
            );


            console.log(
                "VAERO Engine Started"
            );


            return true;

        } catch(error){

            this.started =
                false;


            this.startedAt =
                null;


            this.lastStartError =
                error?.message ||
                String(
                    error
                );


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

        const requestedView =
            String(
                view ||
                    ""
            )
                .trim()
                .toLowerCase();


        const nextView =
            this.isValidView(
                requestedView
            )
                ? requestedView
                : "home";


        this.currentView =
            nextView;


        /*
         * A normal view transition clears system-page state
         * unless the caller explicitly provides a page.
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
                state.world ||
                null;

        }


        if(
            Object.prototype
                .hasOwnProperty.call(
                    state,
                    "entity"
                )
        ){

            this.currentOpenedEntity =
                state.entity ||
                null;

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
                        .trim()
                        .toLowerCase()
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
                state.entityCreateMode ===
                    true;

        }


        if(
            Object.prototype
                .hasOwnProperty.call(
                    state,
                    "entityType"
                )
        ){

            this.entityType =
                state.entityType ||
                null;

        }


        if(
            Object.prototype
                .hasOwnProperty.call(
                    state,
                    "worldEditMode"
                )
        ){

            this.worldEditMode =
                state.worldEditMode ===
                    true;

        }


        if(
            Object.prototype
                .hasOwnProperty.call(
                    state,
                    "entityEditMode"
                )
        ){

            this.entityEditMode =
                state.entityEditMode ===
                    true;

        }


        this.syncAwareness(
            nextView,
            {
                source:
                    "engine.setView"
            }
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
                source:
                    "engine.openSystemPage",

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
            "home",
            {
                source:
                    "engine.openHome"
            }
        );


        return this.mount(
            this.currentEntity
        );

    },


    /* =====================================================
       OPEN WORLD
    ===================================================== */

    openWorld(worldRecord){

        if(
            !worldRecord ||
            typeof worldRecord !==
                "object"
        ){

            return false;

        }


        this.currentView =
            "world";


        this.currentWorld =
            worldRecord;


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


        this.syncAwareness(
            "world",
            {
                source:
                    "engine.openWorld",

                worldId:
                    worldRecord.id ||
                    null
            }
        );


        return this.mount(
            this.currentEntity
        );

    },


    /* =====================================================
       OPEN ENTITY
    ===================================================== */

    openEntity(
        entity,
        page = null
    ){

        if(
            !entity ||
            typeof entity !==
                "object"
        ){

            return false;

        }


        this.currentView =
            "entity";


        this.currentOpenedEntity =
            entity;


        this.currentEntityPage =
            page
                ? String(
                    page
                )
                    .trim()
                    .toLowerCase()
                : null;


        this.entityCreateMode =
            false;


        this.entityType =
            null;


        this.entityEditMode =
            false;


        this.syncAwareness(
            this.currentEntityPage ||
            "entity",
            {
                source:
                    "engine.openEntity",

                entityId:
                    entity.id ||
                    null
            }
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


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                console.error(
                    "Renderer.render returned a Promise, but Engine.mount is synchronous."
                );


                return false;

            }


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
       CONTINUE IN PART 3
    ===================================================== */

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


        const kernel =
            this.getService(
                "kernel"
            );


        let organReport =
            null;


        let healthReport =
            null;


        let kernelReport =
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


        try{

            kernelReport =
                kernel?.report?.() ||
                null;

        } catch(error){

            kernelReport =
                null;

        }


        return {

            version:
                this.version,

            started:
                this.started,

            starting:
                this.starting,

            startedAt:
                this.startedAt,

            lastStartError:
                this.lastStartError,

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

            rendererAvailable:
                Boolean(
                    this.renderer &&
                    typeof this.renderer.render ===
                        "function"
                ),

            kernel:
                kernelReport,

            organs:
                organReport,

            organHealth:
                healthReport

        };

    },


    /* =====================================================
       RESET RUNTIME
    ===================================================== */

    resetRuntime(
        options = {}
    ){

        const preserveRoot =
            options.preserveRoot !==
                false;


        const root =
            preserveRoot
                ? this.rootEntity
                : null;


        this.currentEntity =
            root;


        this.rootEntity =
            root;


        this.currentView =
            "home";


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


        this.lastStartError =
            null;


        return true;

    },


    /* =====================================================
       STOP
    ===================================================== */

    stop(){

        if(
            this.starting ===
                true
        ){

            return false;

        }


        if(
            this.started !==
                true
        ){

            return true;

        }


        const runtime =
            this.getService(
                "runtime"
            );


        const brain =
            this.getService(
                "brain"
            );


        try{

            if(
                runtime &&
                typeof runtime.stop ===
                    "function"
            ){

                runtime.stop();

            }

        } catch(error){

            console.warn(
                "Runtime stop failed:",
                error
            );

        }


        try{

            if(
                brain &&
                typeof brain.clearSubscriptions ===
                    "function"
            ){

                brain.clearSubscriptions();

            }

        } catch(error){

            console.warn(
                "Brain subscription cleanup failed:",
                error
            );

        }


        this.emit(
            "engine.stopped",
            {

                time:
                    Date.now(),

                entityId:
                    this.currentEntity?.id ||
                    null

            }
        );


        this.started =
            false;


        this.startedAt =
            null;


        this.resetRuntime({
            preserveRoot:
                true
        });


        return true;

    }

};


/* =========================================================
   REGISTER
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        VAERO.register(
            "engine",
            Engine
        );

    }


    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.setEngine ===
            "function"
    ){

        VAERO.setEngine(
            Engine
        );

    }
    else if(
        typeof VAERO !==
            "undefined"
    ){

        VAERO.engine =
            Engine;

    }

} catch(error){

    console.error(
        "VAERO Engine registration failed:",
        error
    );

}


/* =========================================================
   GLOBAL
========================================================= */

if(
    typeof window !==
        "undefined"
){

    window.Engine =
        Engine;

}
