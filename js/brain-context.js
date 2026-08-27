/* =========================================================
   VAERO BRAIN CONTEXT
   Cross-App Runtime Context Builder
========================================================= */

const BrainContext = {

    version:
        3,

    maxMetadataDepth:
        3,

    maxMetadataArray:
        30,

    maxObjectKeys:
        80,

    maxStringLength:
        2000,


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
                `Brain Context servisi okunamadı: ${serviceName}`,
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
                typeof VAERO !==
                    "undefined" &&
                VAERO.engine
            ){

                return VAERO.engine;

            }

        } catch(error){

            /* fallback below */

        }


        if(
            typeof window !==
                "undefined" &&
            window.Engine
        ){

            return window.Engine;

        }


        return null;

    },


    /* =====================================================
       SAFE CLONE
    ===================================================== */

    clone(value){

        if(
            value ===
                null ||
            value ===
                undefined
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

            /* JSON fallback below */

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
            value ===
                null ||
            value ===
                undefined
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
                this.maxStringLength
            );

        }


        if(
            typeof value ===
                "number"
        ){

            return Number.isFinite(
                value
            )
                ? value
                : null;

        }


        if(
            typeof value ===
                "boolean"
        ){

            return value;

        }


        if(
            typeof value ===
                "bigint"
        ){

            return String(
                value
            );

        }


        if(
            typeof value ===
                "function" ||
            typeof value ===
                "symbol"
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
                )
                .filter(
                    item =>
                        item !==
                            undefined
                );

        }


        if(
            value instanceof Date
        ){

            const timestamp =
                value.getTime();


            return Number.isFinite(
                timestamp
            )
                ? value.toISOString()
                : null;

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
                    "clientsecret",
                    "client_secret",
                    "token",
                    "idtoken",
                    "id_token",
                    "accesstoken",
                    "access_token",
                    "refreshtoken",
                    "refresh_token",
                    "authorization",
                    "apikey",
                    "api_key",
                    "privatekey",
                    "private_key",
                    "cardnumber",
                    "card_number",
                    "cvv",
                    "cvc",
                    "pin"

                ]);


            const result =
                {};


            Object.entries(
                value
            )
                .slice(
                    0,
                    this.maxObjectKeys
                )
                .forEach(
                    (
                        [
                            key,
                            item
                        ]
                    ) => {

                        const normalizedKey =
                            String(
                                key
                            )
                                .trim()
                                .toLowerCase()
                                .replace(
                                    /[\s-]/g,
                                    ""
                                );


                        if(
                            blockedKeys.has(
                                normalizedKey
                            )
                        ){

                            result[
                                key
                            ] =
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

                            result[
                                key
                            ] =
                                sanitized;

                        }

                    }
                );


            return result;

        }


        return String(
            value
        ).slice(
            0,
            this.maxStringLength
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


            const enteredAt =
                Number(
                    snapshot.enteredAt
                );


            return {

                app:
                    String(
                        snapshot.app ||
                        fallback.app
                    ),

                previousApp:
                    snapshot.previousApp
                        ? String(
                            snapshot.previousApp
                        )
                        : null,

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
                        enteredAt
                    ) &&
                    enteredAt >
                        0
                        ? enteredAt
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

        if(
            !entity ||
            typeof entity !==
                "object"
        ){

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
                typeof entity.description ===
                    "string"
                    ? entity.description.slice(
                        0,
                        1000
                    )
                    : null,

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
                    ? entity.tags
                        .slice(
                            0,
                            20
                        )
                    : [],

            permissions:
                Array.isArray(
                    entity.permissions
                )
                    ? entity.permissions
                        .slice(
                            0,
                            30
                        )
                    : [],

            capabilities:
                Array.isArray(
                    entity.capabilities
                )
                    ? entity.capabilities
                        .slice(
                            0,
                            30
                        )
                    : [],

            organCount:
                Array.isArray(
                    entity.organs
                )
                    ? entity.organs.length
                    : 0,

            bridgeCount:
                Array.isArray(
                    entity.bridges
                )
                    ? entity.bridges.length
                    : 0,

            createdAt:
                entity.createdAt ||
                null,

            updatedAt:
                entity.updatedAt ||
                null

        };

    },


    /* =====================================================
       WORLD SNAPSHOT
    ===================================================== */

    compactWorld(world){

        if(
            !world ||
            typeof world !==
                "object"
        ){

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
                typeof world.description ===
                    "string"
                    ? world.description.slice(
                        0,
                        1000
                    )
                    : null,

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
                    : [],

            createdAt:
                world.createdAt ||
                null,

            updatedAt:
                world.updatedAt ||
                null

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
            (
                typeof window !==
                    "undefined"
                    ? (
                        window.AppRegistry ||
                        null
                    )
                    : null
            );


        if(!registry){

            return {

                available:
                    false,

                total:
                    0,

                installed:
                    0,

                builtIn:
                    0,

                installable:
                    0,

                paid:
                    0,

                manifestVersion:
                    null

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
                        includeDisabled:
                            true
                    });

            }

        } catch(error){

            try{

                apps =
                    registry.all();

            } catch(secondError){

                apps =
                    [];

            }

        }


        if(
            !Array.isArray(
                apps
            )
        ){

            apps =
                [];

        }


        const organSystem =
            this.getService(
                "organSystem"
            );


        let installed =
            0;


        let builtIn =
            0;


        apps.forEach(
            app => {

                if(
                    !app ||
                    typeof app !==
                        "object"
                ){

                    return;

                }


                const isBuiltIn =
                    app.system ===
                        true ||
                    app.distribution ===
                        "built-in" ||
                    app.builtIn ===
                        true;


                if(isBuiltIn){

                    builtIn +=
                        1;


                    installed +=
                        1;


                    return;

                }


                if(!organSystem){

                    return;

                }


                try{

                    const organ =

                        (
                            typeof organSystem.get ===
                                "function"
                                ? organSystem.get(
                                    app.id
                                )
                                : null
                        ) ||

                        (
                            typeof organSystem.findBySlug ===
                                "function"
                                ? organSystem.findBySlug(
                                    app.id
                                )
                                : null
                        ) ||

                        null;


                    if(
                        organ?.installed ===
                            true ||
                        organ?.status ===
                            "active" ||
                        organ?.status ===
                            "inactive" ||
                        organ?.status ===
                            "paused" ||
                        organ?.status ===
                            "disabled"
                    ){

                        installed +=
                            1;

                    }

                } catch(error){

                    /* ignore individual app */

                }

            }
        );


        const catalogBuiltIn =
            Number(
                catalog?.builtIn
            );


        const catalogInstallable =
            Number(
                catalog?.installable
            );


        const catalogPaid =
            Number(
                catalog?.paid
            );


        const catalogSubscriptions =
            Number(
                catalog?.subscriptions
            );


        return {

            available:
                true,

            total:
                apps.length,

            installed,

            builtIn:
                Number.isFinite(
                    catalogBuiltIn
                )
                    ? catalogBuiltIn
                    : builtIn,

            installable:
                Number.isFinite(
                    catalogInstallable
                )
                    ? catalogInstallable
                    : apps.filter(
                        app =>
                            app?.installable ===
                                true
                    ).length,

            paid:
                (
                    Number.isFinite(
                        catalogPaid
                    )
                        ? catalogPaid
                        : 0
                ) +
                (
                    Number.isFinite(
                        catalogSubscriptions
                    )
                        ? catalogSubscriptions
                        : 0
                ),

            manifestVersion:
                catalog?.manifestVersion ||
                registry?.manifestVersion ||
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

                available:
                    false,

                status:
                    "unknown",

                total:
                    0,

                active:
                    0,

                problematic:
                    0,

                averageHealth:
                    null

            };

        }


        let health =
            null;


        try{

            if(
                typeof organStatus.health ===
                    "function"
            ){

                health =
                    organStatus.health();

            }

            else if(
                typeof organStatus.report ===
                    "function"
            ){

                health =
                    organStatus.report();

            }

        } catch(error){

            health =
                null;

        }


        if(
            !health ||
            typeof health !==
                "object"
        ){

            return {

                available:
                    true,

                status:
                    "unknown",

                total:
                    0,

                active:
                    0,

                problematic:
                    0,

                averageHealth:
                    null

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


        const problematic =
            Array.isArray(
                health.problematic
            )
                ? health.problematic.length
                : (
                    Number(
                        health.problematic
                    ) ||
                    0
                );


        const averageHealthRaw =
            health.averageHealth ??
            health.average;


        const averageHealthNumber =
            Number(
                averageHealthRaw
            );


        const averageHealth =
            Number.isFinite(
                averageHealthNumber
            )
                ? averageHealthNumber
                : null;


        return {

            available:
                true,

            status:
                health.status ||
                (
                    problematic >
                        0
                        ? "degraded"
                        : total >
                            0
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

                available:
                    false,

                running:
                    false,

                paused:
                    false,

                status:
                    null

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

        } catch(error){

            report =
                null;

        }


        const status =
            report?.status ||
            runtime.status ||
            null;


        return {

            available:
                true,

            running:
                status ===
                    "running",

            paused:
                status ===
                    "paused",

            status,

            startedAt:
                report?.startedAt ||
                runtime.startedAt ||
                null,

            stoppedAt:
                report?.stoppedAt ||
                runtime.stoppedAt ||
                null,

            lastTickAt:
                report?.lastTickAt ||
                runtime.lastTickAt ||
                null,

            ticks:
                Number(
                    report?.ticks ??
                    runtime.ticks
                ) ||
                0,

            uptime:
                Number(
                    report?.uptime
                ) ||
                0,

            heartbeatInterval:
                Number(
                    report
                        ?.heartbeatInterval ??
                    runtime
                        .heartbeatInterval
                ) ||
                null,

            heartbeatActive:
                report?.heartbeatActive ===
                    true,

            health:
                report?.health?.status ||
                report?.health ||
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
                typeof window !==
                    "undefined" &&
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


        /*
         * Legacy/local Discovery fallback.
         *
         * This is only contextual reading.
         * BrainContext never becomes Discovery authority.
         */

        if(!result){

            try{

                if(
                    typeof localStorage !==
                        "undefined"
                ){

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

                }

            } catch(error){

                result =
                    null;

            }

        }


        if(!result){

            return {

                completed:
                    false,

                direction:
                    null,

                directionId:
                    null,

                brainMode:
                    null,

                recommendedApps:
                    [],

                generatedAt:
                    null

            };

        }


        return {

            completed:
                true,

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
       KERNEL SNAPSHOT
    ===================================================== */

    getKernelSnapshot(){

        const kernel =
            this.getService(
                "kernel"
            );


        if(!kernel){

            return {

                available:
                    false,

                status:
                    "unknown",

                securityReady:
                    false

            };

        }


        let health =
            null;


        try{

            if(
                typeof kernel.health ===
                    "function"
            ){

                health =
                    kernel.health();

            }

        } catch(error){

            health =
                null;

        }


        return {

            available:
                true,

            status:
                health?.status ||
                "unknown",

            booted:
                health?.booted ===
                    true ||
                kernel.booted ===
                    true,

            securityReady:
                health?.securityReady ===
                    true,

            criticalMissing:
                Array.isArray(
                    health?.criticalMissing
                )
                    ? health.criticalMissing
                        .slice(
                            0,
                            30
                        )
                    : [],

            missing:
                Array.isArray(
                    health?.missing
                )
                    ? health.missing
                        .slice(
                            0,
                            50
                        )
                    : [],

            checkedAt:
                health?.checkedAt ||
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

                        /* all fallback below */

                    }

                }


                try{

                    if(
                        typeof service.all ===
                            "function"
                    ){

                        const records =
                            service.all();


                        return Array.isArray(
                            records
                        )
                            ? records
                            : [];

                    }

                } catch(error){

                    return [];

                }


                return [];

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
       WORLD RESOLUTION
    ===================================================== */

    resolveWorld(engine){

        if(!engine){

            return null;

        }


        if(
            engine.currentWorld &&
            typeof engine.currentWorld ===
                "object"
        ){

            return engine.currentWorld;

        }


        const worldService =
            this.getService(
                "world"
            );


        const candidateId =
            engine.currentWorldId ||
            engine.worldId ||
            null;


        if(
            candidateId &&
            worldService
        ){

            const methods = [

                "get",
                "find",
                "getById"

            ];


            for(
                const method of methods
            ){

                if(
                    typeof worldService[
                        method
                    ] !==
                        "function"
                ){

                    continue;

                }


                try{

                    const world =
                        worldService[
                            method
                        ](
                            candidateId
                        );


                    if(world){

                        return world;

                    }

                } catch(error){

                    /* next resolver */

                }

            }

        }


        return null;

    },


    /* =====================================================
       ENTITY RESOLUTION
    ===================================================== */

    resolveEntity(engine){

        if(!engine){

            return null;

        }


        const direct =

            engine.currentOpenedEntity ||
            engine.currentEntity ||
            engine.rootEntity ||
            null;


        if(
            direct &&
            typeof direct ===
                "object"
        ){

            return direct;

        }


        const entityManager =
            this.getService(
                "entityManager"
            );


        const candidateId =
            engine.currentOpenedEntityId ||
            engine.currentEntityId ||
            engine.rootEntityId ||
            null;


        if(
            candidateId &&
            entityManager
        ){

            const methods = [

                "get",
                "find",
                "getById"

            ];


            for(
                const method of methods
            ){

                if(
                    typeof entityManager[
                        method
                    ] !==
                        "function"
                ){

                    continue;

                }


                try{

                    const entity =
                        entityManager[
                            method
                        ](
                            candidateId
                        );


                    if(entity){

                        return entity;

                    }

                } catch(error){

                    /* next resolver */

                }

            }

        }


        return null;

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


        const applications =
            this.getApplicationsSnapshot();


        const organs =
            this.getOrganSnapshot();


        const runtime =
            this.getRuntimeSnapshot();


        const kernel =
            this.getKernelSnapshot();


        const discovery =
            this.getDiscoverySnapshot();


        /* =================================================
           ENGINE NOT READY
        ================================================= */

        if(!engine){

            return {

                version:
                    this.version,

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

                entityId:
                    null,

                world:
                    null,

                worldId:
                    null,

                user:
                    null,

                rootEntity:
                    null,

                applications,

                organs,

                runtime,

                kernel,

                discovery,

                data:{

                    memory:{
                        total:
                            0,

                        important:
                            0,

                        pinned:
                            0
                    },

                    timeline:{
                        total:
                            0
                    },

                    evolution:{
                        total:
                            0,

                        xp:
                            0
                    },

                    bridge:{
                        total:
                            0,

                        favorites:
                            0
                    }

                },

                engineReady:
                    false,

                contextSource:
                    "awareness+services",

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
            null;


        const entity =
            this.resolveEntity(
                engine
            ) ||
            rootEntity ||
            null;


        const world =
            this.resolveWorld(
                engine
            );


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
                : (
                    currentPage ||
                    currentView ||
                    "home"
                );


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
                this.version,

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

            applications,

            organs,

            runtime,

            kernel,

            discovery,

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
                    null,

                lastTickAt:
                    context.runtime
                        ?.lastTickAt ||
                    null

            },

            kernel:{

                available:
                    context.kernel
                        ?.available ===
                    true,

                status:
                    context.kernel
                        ?.status ||
                    "unknown",

                booted:
                    context.kernel
                        ?.booted ===
                    true,

                securityReady:
                    context.kernel
                        ?.securityReady ===
                    true

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

            version:
                this.version,

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

            runtimeStatus:
                context.runtime
                    .status,

            kernelStatus:
                context.kernel
                    .status,

            securityReady:
                context.kernel
                    .securityReady,

            discoveryCompleted:
                context.discovery
                    .completed,

            memoryRecords:
                context.data
                    .memory
                    .total ||
                0,

            timelineEvents:
                context.data
                    .timeline
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
            "brainContext",
            BrainContext
        );

    }

} catch(error){

    console.error(
        "BrainContext register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.BrainContext =
        BrainContext;

}
