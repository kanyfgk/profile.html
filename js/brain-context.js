/* =========================================================
   VAERO BRAIN CONTEXT
   Cross-App Runtime Context Builder
========================================================= */

const BrainContext = {

    maxMetadataDepth:
        3,

    maxMetadataArray:
        30,


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
                VAERO.get(name) ||
                null
            );

        } catch(error){

            console.warn(
                `Brain Context servisi okunamadı: ${name}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       ENGINE ACCESS
    ===================================================== */

    getEngine(){

        try{

            if(
                typeof VAERO !== "undefined" &&
                VAERO.engine
            ){

                return VAERO.engine;

            }

        } catch(error){

            /* fallback */
        }


        return (
            window.Engine ||
            null
        );

    },


    /* =====================================================
       SAFE CLONE
    ===================================================== */

    clone(value){

        if(
            value === null ||
            value === undefined
        ){
            return value;
        }


        try{

            if(
                typeof structuredClone ===
                    "function"
            ){

                return structuredClone(
                    value
                );

            }

        } catch(error){

            /* JSON fallback */
        }


        try{

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       SAFE CONTEXT VALUE
    ===================================================== */

    sanitizeValue(
        value,
        depth = 0,
        seen = new WeakSet()
    ){

        if(
            value === null ||
            value === undefined
        ){
            return value;
        }


        if(
            depth >
            this.maxMetadataDepth
        ){

            return "[depth-limit]";

        }


        if(
            typeof value ===
                "string"
        ){

            return value.slice(
                0,
                2000
            );

        }


        if(
            typeof value ===
                "number" ||
            typeof value ===
                "boolean"
        ){

            return value;

        }


        if(
            typeof value ===
                "function"
        ){

            return undefined;

        }


        if(
            Array.isArray(
                value
            )
        ){

            return value
                .slice(
                    0,
                    this.maxMetadataArray
                )
                .map(
                    item =>
                        this.sanitizeValue(
                            item,
                            depth + 1,
                            seen
                        )
                );

        }


        if(
            typeof value ===
                "object"
        ){

            try{

                if(
                    seen.has(
                        value
                    )
                ){

                    return "[circular]";

                }


                seen.add(
                    value
                );

            } catch(error){

                return null;

            }


            const blockedKeys =
                new Set([
                    "password",
                    "passphrase",
                    "secret",
                    "token",
                    "accesstoken",
                    "refreshtoken",
                    "authorization",
                    "apikey",
                    "api_key",
                    "privatekey",
                    "private_key",
                    "cardnumber",
                    "cvv"
                ]);


            const result = {};


            Object.entries(
                value
            )
                .slice(
                    0,
                    80
                )
                .forEach(
                    ([key,item]) => {

                        const normalizedKey =
                            String(
                                key
                            )
                                .trim()
                                .toLowerCase();


                        if(
                            blockedKeys.has(
                                normalizedKey
                            )
                        ){

                            result[key] =
                                "[redacted]";

                            return;

                        }


                        const sanitized =
                            this.sanitizeValue(
                                item,
                                depth + 1,
                                seen
                            );


                        if(
                            sanitized !==
                                undefined
                        ){

                            result[key] =
                                sanitized;

                        }

                    }
                );


            return result;

        }


        return String(
            value
        );

    },


    /* =====================================================
       AWARENESS SNAPSHOT
    ===================================================== */

    getAwarenessSnapshot(){

        const fallback = {

            app:
                "home",

            previousApp:
                null,

            metadata:{},

            enteredAt:
                null

        };


        const awareness =
            this.getService(
                "brainAwareness"
            );


        if(
            !awareness ||
            typeof awareness.snapshot !==
                "function"
        ){

            return fallback;

        }


        try{

            const snapshot =
                awareness.snapshot();


            if(
                !snapshot ||
                typeof snapshot !==
                    "object"
            ){

                return fallback;

            }


            return {

                app:
                    snapshot.app ||
                    fallback.app,

                previousApp:
                    snapshot.previousApp ||
                    null,

                metadata:
                    snapshot.metadata &&
                    typeof snapshot.metadata ===
                        "object"
                        ? (
                            this.sanitizeValue(
                                snapshot.metadata
                            ) ||
                            {}
                        )
                        : {},

                enteredAt:
                    Number.isFinite(
                        Number(
                            snapshot.enteredAt
                        )
                    )
                        ? Number(
                            snapshot.enteredAt
                        )
                        : null

            };

        } catch(error){

            console.warn(
                "Brain Awareness snapshot alınamadı:",
                error
            );


            return fallback;

        }

    },


    /* =====================================================
       ENTITY SNAPSHOT
    ===================================================== */

    compactEntity(entity){

        if(!entity){
            return null;
        }


        return {

            id:
                entity.id ||
                null,

            name:
                entity.name ||
                null,

            type:
                entity.type ||
                null,

            description:
                entity.description ||
                null,

            status:
                entity.status ||
                null,

            archived:
                entity.archived ===
                true,

            tags:
                Array.isArray(
                    entity.tags
                )
                    ? entity.tags.slice(
                        0,
                        20
                    )
                    : [],

            permissions:
                Array.isArray(
                    entity.permissions
                )
                    ? entity.permissions.slice(
                        0,
                        30
                    )
                    : [],

            capabilities:
                Array.isArray(
                    entity.capabilities
                )
                    ? entity.capabilities.slice(
                        0,
                        30
                    )
                    : []

        };

    },


    /* =====================================================
       WORLD SNAPSHOT
    ===================================================== */

    compactWorld(world){

        if(!world){
            return null;
        }


        return {

            id:
                world.id ||
                null,

            name:
                world.name ||
                null,

            description:
                world.description ||
                null,

            type:
                world.type ||
                null,

            status:
                world.status ||
                null,

            archived:
                world.archived ===
                true,

            owner:
                world.owner ||
                null,

            entityCount:
                Array.isArray(
                    world.entities
                )
                    ? world.entities.length
                    : 0,

            tags:
                Array.isArray(
                    world.tags
                )
                    ? world.tags.slice(
                        0,
                        20
                    )
                    : []

        };

    },


    /* =====================================================
       APPLICATION CONTEXT
    ===================================================== */

    getApplicationsSnapshot(){

        const registry =
            this.getService(
                "appRegistry"
            ) ||
            this.getService(
                "applicationRegistry"
            ) ||
            window.AppRegistry ||
            null;


        if(!registry){

            return {

                available:false,

                total:0,

                installed:0,

                catalog:null

            };

        }


        let catalog =
            null;


        let apps =
            [];


        try{

            if(
                typeof registry.catalog ===
                    "function"
            ){

                catalog =
                    registry.catalog();

            }

        } catch(error){

            catalog =
                null;

        }


        try{

            if(
                typeof registry.all ===
                    "function"
            ){

                apps =
                    registry.all({
                        includeDisabled:true
                    });

            }

        } catch(error){

            try{

                apps =
                    registry.all();

            } catch(secondError){

                apps = [];

            }

        }


        if(
            !Array.isArray(
                apps
            )
        ){

            apps = [];

        }


        const organSystem =
            this.getService(
                "organSystem"
            );


        let installed =
            0;


        apps.forEach(
            app => {

                if(
                    app?.system ===
                        true ||
                    app?.distribution ===
                        "built-in"
                ){

                    installed += 1;

                    return;

                }


                try{

                    const organ =
                        organSystem?.get?.(
                            app.id
                        ) ||
                        organSystem
                            ?.findBySlug?.(
                                app.id
                            ) ||
                        null;


                    if(
                        organ?.installed ===
                            true
                    ){

                        installed += 1;

                    }

                } catch(error){

                    /* ignore */
                }

            }
        );


        return {

            available:true,

            total:
                apps.length,

            installed,

            builtIn:
                Number(
                    catalog?.builtIn
                ) ||
                apps.filter(
                    app =>
                        app.system ===
                            true
                ).length,

            installable:
                Number(
                    catalog?.installable
                ) ||
                apps.filter(
                    app =>
                        app.installable ===
                            true
                ).length,

            paid:
                (
                    Number(
                        catalog?.paid
                    ) ||
                    0
                ) +
                (
                    Number(
                        catalog
                            ?.subscriptions
                    ) ||
                    0
                ),

            manifestVersion:
                catalog
                    ?.manifestVersion ||
                registry
                    ?.manifestVersion ||
                null

        };

    },


    /* =====================================================
       ORGAN HEALTH
    ===================================================== */

    getOrganSnapshot(){

        const organStatus =
            this.getService(
                "organStatus"
            );


        if(!organStatus){

            return {

                available:false,

                status:
                    "unknown",

                total:0,

                active:0,

                problematic:0,

                averageHealth:null

            };

        }


        let health =
            null;


        try{

            health =
                organStatus.health?.() ||
                null;

        } catch(error){

            health =
                null;

        }


        if(!health){

            return {

                available:true,

                status:
                    "unknown",

                total:0,

                active:0,

                problematic:0,

                averageHealth:null

            };

        }


        const total =
            Number(
                health.total
            ) ||
            0;


        const active =
            Number(
                health.active
            ) ||
            0;


        const problematicRaw =
            health.problematic;


        const problematic =
            Array.isArray(
                problematicRaw
            )
                ? problematicRaw.length
                : (
                    Number(
                        problematicRaw
                    ) ||
                    0
                );


        const averageHealth =
            Number.isFinite(
                Number(
                    health.averageHealth
                )
            )
                ? Number(
                    health.averageHealth
                )
                : Number.isFinite(
                    Number(
                        health.average
                    )
                )
                    ? Number(
                        health.average
                    )
                    : null;


        return {

            available:true,

            status:
                health.status ||
                (
                    problematic > 0
                        ? "degraded"
                        : total > 0
                            ? "healthy"
                            : "unknown"
                ),

            total,

            active,

            problematic,

            missing:
                Number(
                    health.missing
                ) ||
                0,

            error:
                Number(
                    health.error
                ) ||
                0,

            disabled:
                Number(
                    health.disabled
                ) ||
                0,

            paused:
                Number(
                    health.paused
                ) ||
                0,

            averageHealth

        };

    },


    /* =====================================================
       RUNTIME SNAPSHOT
    ===================================================== */

    getRuntimeSnapshot(){

        const runtime =
            this.getService(
                "runtime"
            );


        if(!runtime){

            return {

                available:false,

                running:false

            };

        }


        let report =
            null;


        try{

            if(
                typeof runtime.report ===
                    "function"
            ){

                report =
                    runtime.report();

            }
            else if(
                typeof runtime.health ===
                    "function"
            ){

                report =
                    runtime.health();

            }

        } catch(error){

            report =
                null;

        }


        return {

            available:true,

            running:
                report?.running ===
                    true ||
                report?.started ===
                    true ||
                runtime.running ===
                    true,

            paused:
                report?.paused ===
                    true ||
                runtime.paused ===
                    true,

            status:
                report?.status ||
                null,

            startedAt:
                report?.startedAt ||
                runtime.startedAt ||
                null,

            heartbeat:
                report?.heartbeat ||
                report?.lastHeartbeat ||
                null

        };

    },


    /* =====================================================
       DISCOVERY SNAPSHOT
    ===================================================== */

    getDiscoverySnapshot(){

        let result =
            null;


        try{

            if(
                window.DiscoveryApp &&
                typeof window.DiscoveryApp
                    .getResult ===
                    "function"
            ){

                result =
                    window.DiscoveryApp
                        .getResult();

            }

        } catch(error){

            result =
                null;

        }


        if(!result){

            try{

                const raw =
                    localStorage.getItem(
                        "vaero:discovery:result:v2"
                    );


                result =
                    raw
                        ? JSON.parse(
                            raw
                        )
                        : null;

            } catch(error){

                result =
                    null;

            }

        }


        if(!result){

            return {

                completed:false,

                direction:null,

                directionId:null,

                brainMode:null,

                recommendedApps:[]

            };

        }


        return {

            completed:true,

            direction:
                result
                    ?.primaryDirection
                    ?.label ||
                null,

            directionId:
                result
                    ?.primaryDirection
                    ?.id ||
                null,

            brainMode:
                result
                    ?.signals
                    ?.brainMode ||
                null,

            recommendedApps:
                Array.isArray(
                    result
                        ?.signals
                        ?.recommendedApps
                )
                    ? result.signals
                        .recommendedApps
                        .slice(
                            0,
                            20
                        )
                    : [],

            generatedAt:
                result.generatedAt ||
                null

        };

    },


    /* =====================================================
       DATA COUNTS
    ===================================================== */

    getDataSnapshot(entityId = null){

        const memory =
            this.getService(
                "memorySystem"
            );


        const timeline =
            this.getService(
                "timeline"
            );


        const evolution =
            this.getService(
                "evolution"
            );


        const bridge =
            this.getService(
                "bridge"
            );


        const getRecords =
            (
                service,
                scopedMethod = null
            ) => {

                if(!service){
                    return [];
                }


                if(
                    entityId &&
                    scopedMethod &&
                    typeof service[
                        scopedMethod
                    ] ===
                        "function"
                ){

                    try{

                        const records =
                            service[
                                scopedMethod
                            ](
                                entityId
                            );


                        if(
                            Array.isArray(
                                records
                            )
                        ){

                            return records;

                        }

                    } catch(error){

                        /* all fallback */
                    }

                }


                try{

                    const records =
                        service.all?.();


                    return Array.isArray(
                        records
                    )
                        ? records
                        : [];

                } catch(error){

                    return [];

                }

            };


        const memories =
            getRecords(
                memory,
                "forEntity"
            );


        const timelineEvents =
            getRecords(
                timeline,
                "forEntity"
            );


        const evolutionEvents =
            getRecords(
                evolution,
                "forEntity"
            );


        const bridgeLinks =
            getRecords(
                bridge,
                "forEntity"
            );


        const importantMemories =
            memories.filter(
                record =>
                    record?.important ===
                        true
            ).length;


        const pinnedMemories =
            memories.filter(
                record =>
                    record?.pinned ===
                        true
            ).length;


        const xp =
            evolutionEvents.reduce(
                (
                    total,
                    event
                ) =>
                    total +
                    (
                        Number(
                            event?.xp
                        ) ||
                        0
                    ),
                0
            );


        return {

            memory:{
                total:
                    memories.length,

                important:
                    importantMemories,

                pinned:
                    pinnedMemories
            },

            timeline:{
                total:
                    timelineEvents.length
            },

            evolution:{
                total:
                    evolutionEvents.length,

                xp
            },

            bridge:{
                total:
                    bridgeLinks.length,

                favorites:
                    bridgeLinks.filter(
                        link =>
                            link?.favorite ===
                                true
                    ).length
            }

        };

    },


    /* =====================================================
       BUILD CONTEXT
    ===================================================== */

    build(extra = {}){

        const awarenessState =
            this.getAwarenessSnapshot();


        const engine =
            this.getEngine();


        const safeExtra =
            extra &&
            typeof extra ===
                "object" &&
            !Array.isArray(
                extra
            )
                ? (
                    this.sanitizeValue(
                        extra
                    ) ||
                    {}
                )
                : {};


        /* =================================================
           ENGINE NOT READY
        ================================================= */

        if(!engine){

            return {

                version:
                    2,

                app:
                    awarenessState.app,

                screen:
                    awarenessState.app ||
                    "home",

                page:
                    null,

                previousApp:
                    awarenessState
                        .previousApp,

                metadata:{
                    ...awarenessState
                        .metadata
                },

                entity:
                    null,

                world:
                    null,

                user:
                    null,

                rootEntity:
                    null,

                applications:
                    this.getApplicationsSnapshot(),

                organs:
                    this.getOrganSnapshot(),

                runtime:
                    this.getRuntimeSnapshot(),

                discovery:
                    this.getDiscoverySnapshot(),

                data:{
                    memory:{
                        total:0,
                        important:0,
                        pinned:0
                    },

                    timeline:{
                        total:0
                    },

                    evolution:{
                        total:0,
                        xp:0
                    },

                    bridge:{
                        total:0,
                        favorites:0
                    }
                },

                engineReady:
                    false,

                contextSource:
                    "awareness",

                enteredAt:
                    awarenessState
                        .enteredAt,

                builtAt:
                    Date.now(),

                ...safeExtra

            };

        }


        /* =================================================
           ENGINE STATE
        ================================================= */

        const rootEntity =
            engine.rootEntity ||
            engine.currentEntity ||
            null;


        const entity =
            engine.currentOpenedEntity ||
            engine.currentEntity ||
            rootEntity ||
            null;


        const world =
            engine.currentWorld ||
            null;


        const user =
            engine.currentEntity ||
            rootEntity ||
            null;


        const currentView =
            engine.currentView ||
            "home";


        const currentPage =
            engine.currentEntityPage ||
            null;


        const app =
            awarenessState.app &&
            awarenessState.app !==
                "home"
                ? awarenessState.app
                : currentPage ||
                  currentView ||
                  "home";


        const entitySnapshot =
            this.compactEntity(
                entity
            );


        const worldSnapshot =
            this.compactWorld(
                world
            );


        const userSnapshot =
            this.compactEntity(
                user
            );


        const rootSnapshot =
            this.compactEntity(
                rootEntity
            );


        const data =
            this.getDataSnapshot(
                entitySnapshot?.id ||
                null
            );


        return {

            version:
                2,

            app,

            screen:
                currentView,

            page:
                currentPage,

            previousApp:
                awarenessState
                    .previousApp,

            metadata:{
                ...awarenessState
                    .metadata
            },

            entity:
                entitySnapshot,

            entityId:
                entitySnapshot?.id ||
                null,

            world:
                worldSnapshot,

            worldId:
                worldSnapshot?.id ||
                null,

            user:
                userSnapshot,

            rootEntity:
                rootSnapshot,

            applications:
                this.getApplicationsSnapshot(),

            organs:
                this.getOrganSnapshot(),

            runtime:
                this.getRuntimeSnapshot(),

            discovery:
                this.getDiscoverySnapshot(),

            data,

            engineReady:
                true,

            contextSource:
                "engine+awareness+services",

            enteredAt:
                awarenessState
                    .enteredAt,

            builtAt:
                Date.now(),

            ...safeExtra

        };

    },


    /* =====================================================
       COMPACT SNAPSHOT

       Provider, routing ve history için daha küçük context.
       Tam entity/world nesneleri provider'a aktarılmaz.
    ===================================================== */

    compact(extra = {}){

        const context =
            this.build(
                extra
            );


        return {

            version:
                context.version,

            app:
                context.app,

            screen:
                context.screen,

            page:
                context.page,

            previousApp:
                context.previousApp,

            entity:
                context.entity
                    ? {
                        id:
                            context.entity.id,

                        name:
                            context.entity.name,

                        type:
                            context.entity.type,

                        status:
                            context.entity.status
                    }
                    : null,

            entityId:
                context.entityId ||
                null,

            world:
                context.world
                    ? {
                        id:
                            context.world.id,

                        name:
                            context.world.name,

                        type:
                            context.world.type,

                        status:
                            context.world.status,

                        entityCount:
                            context.world
                                .entityCount
                    }
                    : null,

            worldId:
                context.worldId ||
                null,

            user:
                context.user
                    ? {
                        id:
                            context.user.id,

                        name:
                            context.user.name,

                        type:
                            context.user.type
                    }
                    : null,

            applications:{
                total:
                    context.applications
                        ?.total ||
                    0,

                installed:
                    context.applications
                        ?.installed ||
                    0,

                builtIn:
                    context.applications
                        ?.builtIn ||
                    0,

                manifestVersion:
                    context.applications
                        ?.manifestVersion ||
                    null
            },

            organs:{
                status:
                    context.organs
                        ?.status ||
                    "unknown",

                total:
                    context.organs
                        ?.total ||
                    0,

                active:
                    context.organs
                        ?.active ||
                    0,

                problematic:
                    context.organs
                        ?.problematic ||
                    0,

                averageHealth:
                    context.organs
                        ?.averageHealth ??
                    null
            },

            runtime:{
                available:
                    context.runtime
                        ?.available ===
                    true,

                running:
                    context.runtime
                        ?.running ===
                    true,

                paused:
                    context.runtime
                        ?.paused ===
                    true,

                status:
                    context.runtime
                        ?.status ||
                    null
            },

            discovery:{
                completed:
                    context.discovery
                        ?.completed ===
                    true,

                direction:
                    context.discovery
                        ?.direction ||
                    null,

                directionId:
                    context.discovery
                        ?.directionId ||
                    null,

                brainMode:
                    context.discovery
                        ?.brainMode ||
                    null,

                recommendedApps:
                    Array.isArray(
                        context.discovery
                            ?.recommendedApps
                    )
                        ? [
                            ...context.discovery
                                .recommendedApps
                        ]
                        : []
            },

            data:{
                memory:{
                    ...(
                        context.data
                            ?.memory ||
                        {}
                    )
                },

                timeline:{
                    ...(
                        context.data
                            ?.timeline ||
                        {}
                    )
                },

                evolution:{
                    ...(
                        context.data
                            ?.evolution ||
                        {}
                    )
                },

                bridge:{
                    ...(
                        context.data
                            ?.bridge ||
                        {}
                    )
                }
            },

            metadata:
                this.sanitizeValue(
                    context.metadata
                ) ||
                {},

            engineReady:
                context.engineReady,

            contextSource:
                context.contextSource,

            builtAt:
                context.builtAt

        };

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const context =
            this.compact();


        return {

            engineReady:
                context.engineReady,

            app:
                context.app,

            screen:
                context.screen,

            page:
                context.page,

            entityId:
                context.entityId,

            worldId:
                context.worldId,

            applications:
                context.applications
                    .total,

            installedApplications:
                context.applications
                    .installed,

            organStatus:
                context.organs
                    .status,

            discoveryCompleted:
                context.discovery
                    .completed,

            memoryRecords:
                context.data
                    .memory
                    .total ||
                0,

            evolutionEvents:
                context.data
                    .evolution
                    .total ||
                0,

            bridgeConnections:
                context.data
                    .bridge
                    .total ||
                0,

            builtAt:
                context.builtAt

        };

    }

};


VAERO.register(
    "brainContext",
    BrainContext
);


window.BrainContext =
    BrainContext;
