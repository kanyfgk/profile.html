/* =========================================================
   VAERO BRAIN AWARENESS
   Runtime App / Screen / Context Awareness
========================================================= */

const BrainAwareness = {

    currentApp:
        "home",

    currentScreen:
        "home",

    currentPage:
        null,

    previousApp:
        null,

    previousScreen:
        null,

    metadata:
        {},

    enteredAt:
        Date.now(),

    transitions:
        [],

    historyLimit:
        20,

    booted:
        false,

    bootedAt:
        null,

    subscriptions:
        [],

    maxMetadataDepth:
        3,

    maxMetadataArray:
        30,

    maxMetadataKeys:
        60,

    maxStringLength:
        2000,


    /* =====================================================
       SERVICE ACCESS
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

            return null;

        }

    },


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
       NORMALIZATION
    ===================================================== */

    normalizeApp(app){

        const normalized =
            String(
                app ??
                    ""
            )
                .trim()
                .toLowerCase()
                .slice(
                    0,
                    160
                );


        return (
            normalized ||
            "home"
        );

    },


    normalizeScreen(screen){

        const normalized =
            String(
                screen ??
                    ""
            )
                .trim()
                .toLowerCase()
                .slice(
                    0,
                    160
                );


        return (
            normalized ||
            "home"
        );

    },


    normalizePage(page){

        const normalized =
            String(
                page ??
                    ""
            )
                .trim()
                .toLowerCase()
                .slice(
                    0,
                    160
                );


        return (
            normalized ||
            null
        );

    },


    normalizeTimestamp(
        value,
        fallback = null
    ){

        const timestamp =
            Number(
                value
            );


        return (
            Number.isFinite(
                timestamp
            ) &&
            timestamp >
                0
        )
            ? timestamp
            : fallback;

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
       METADATA SANITIZATION
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
                    this.maxMetadataKeys
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


    normalizeMetadata(metadata){

        if(
            !metadata ||
            typeof metadata !==
                "object" ||
            Array.isArray(
                metadata
            )
        ){

            return {};

        }


        const sanitized =
            this.sanitizeValue(
                metadata
            );


        return (
            sanitized &&
            typeof sanitized ===
                "object" &&
            !Array.isArray(
                sanitized
            )
                ? sanitized
                : {}
        );

    },


    /* =====================================================
       ENGINE CONTEXT METADATA
    ===================================================== */

    buildEngineMetadata(
        metadata = {}
    ){

        const engine =
            this.getEngine();


        const entity =

            engine?.currentOpenedEntity ||
            engine?.currentEntity ||
            engine?.rootEntity ||
            null;


        const world =
            engine?.currentWorld ||
            null;


        return this.normalizeMetadata({

            ...metadata,

            entityId:
                metadata.entityId ||
                entity?.id ||
                null,

            entityName:
                metadata.entityName ||
                entity?.name ||
                null,

            entityType:
                metadata.entityType ||
                entity?.type ||
                null,

            worldId:
                metadata.worldId ||
                world?.id ||
                null,

            worldName:
                metadata.worldName ||
                world?.name ||
                null

        });

    },


    /* =====================================================
       TRANSITION HISTORY
    ===================================================== */

    createTransitionId(){

        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){

                return crypto.randomUUID();

            }

        } catch(error){

            /* fallback */

        }


        return `awareness_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,8)}`;

    },


    recordTransition({
        from,
        to,
        fromScreen = null,
        toScreen = null,
        fromPage = null,
        page = null,
        metadata = {},
        enteredAt = null
    }){

        const transition = {

            id:
                this.createTransitionId(),

            from:
                from ||
                null,

            to:
                to ||
                "home",

            fromScreen:
                fromScreen ||
                null,

            toScreen:
                toScreen ||
                to ||
                "home",

            fromPage:
                fromPage ||
                null,

            page:
                page ||
                null,

            metadata:
                this.normalizeMetadata(
                    metadata
                ),

            enteredAt:
                this.normalizeTimestamp(
                    enteredAt,
                    Date.now()
                )

        };


        this.transitions.push(
            transition
        );


        if(
            this.transitions.length >
                this.historyLimit
        ){

            this.transitions =
                this.transitions.slice(
                    -this.historyLimit
                );

        }


        return (
            this.clone(
                transition
            ) ||
            null
        );

    },


    /* =====================================================
       ENTER
    ===================================================== */

    enter(
        app,
        metadata = {}
    ){

        const nextApp =
            this.normalizeApp(
                app
            );


        const engine =
            this.getEngine();


        const nextScreen =
            this.normalizeScreen(
                metadata.screen ||
                engine?.currentView ||
                nextApp
            );


        const nextPage =
            this.normalizePage(
                metadata.page ??
                engine?.currentEntityPage ??
                null
            );


        const previousApp =
            this.currentApp ||
            "home";


        const previousScreen =
            this.currentScreen ||
            previousApp;


        const previousPage =
            this.currentPage ||
            null;


        const normalizedMetadata =
            this.buildEngineMetadata(
                metadata
            );


        const changed =
            previousApp !==
                nextApp ||
            previousScreen !==
                nextScreen ||
            previousPage !==
                nextPage;


        const now =
            Date.now();


        if(changed){

            this.previousApp =
                previousApp;


            this.previousScreen =
                previousScreen;


            this.recordTransition({

                from:
                    previousApp,

                to:
                    nextApp,

                fromScreen:
                    previousScreen,

                toScreen:
                    nextScreen,

                fromPage:
                    previousPage,

                page:
                    nextPage,

                metadata:
                    normalizedMetadata,

                enteredAt:
                    now

            });


            /*
             * enteredAt only changes when the actual
             * application/screen/page context changes.
             *
             * Metadata refreshes therefore do not reset
             * time-in-context.
             */

            this.enteredAt =
                now;

        }


        this.currentApp =
            nextApp;


        this.currentScreen =
            nextScreen;


        this.currentPage =
            nextPage;


        this.metadata =
            normalizedMetadata;


        const snapshot =
            this.snapshot();


        this.emit(
            changed
                ? "brain:awareness:entered"
                : "brain:awareness:updated",
            snapshot
        );


        return snapshot;

    },


    /* =====================================================
       SCREEN UPDATE
    ===================================================== */

    setScreen(
        screen,
        page = null,
        metadata = {}
    ){

        const nextScreen =
            this.normalizeScreen(
                screen
            );


        const nextPage =
            this.normalizePage(
                page
            );


        return this.enter(
            this.currentApp ||
            nextPage ||
            nextScreen ||
            "home",
            {

                ...metadata,

                screen:
                    nextScreen,

                page:
                    nextPage

            }
        );

    },


    /* =====================================================
       APP UPDATE
    ===================================================== */

    setApp(
        app,
        metadata = {}
    ){

        return this.enter(
            app,
            metadata
        );

    },


    /* =====================================================
       METADATA UPDATE
    ===================================================== */

    updateMetadata(
        metadata = {},
        {
            merge = true
        } = {}
    ){

        const nextMetadata =
            this.buildEngineMetadata(
                metadata
            );


        this.metadata =
            merge
                ? this.normalizeMetadata({

                    ...this.metadata,

                    ...nextMetadata

                })
                : nextMetadata;


        const snapshot =
            this.snapshot();


        this.emit(
            "brain:awareness:metadata",
            snapshot
        );


        return snapshot;

    },


    /* =====================================================
       EVENT PAYLOAD HINTS
    ===================================================== */

    extractEventHints(
        eventName,
        payload = {}
    ){

        const data =
            payload &&
            typeof payload ===
                "object" &&
            !Array.isArray(
                payload
            )
                ? payload
                : {};


        const hints = {

            source:
                eventName,

            screen:
                data.screen ||
                data.view ||
                null,

            page:
                data.page ||
                data.entityPage ||
                null,

            app:
                data.app ||
                data.appId ||
                data.applicationId ||
                null,

            entityId:
                data.entityId ||
                data.entity?.id ||
                null,

            entityName:
                data.entityName ||
                data.entity?.name ||
                null,

            entityType:
                data.entityType ||
                data.entity?.type ||
                null,

            worldId:
                data.worldId ||
                data.world?.id ||
                null,

            worldName:
                data.worldName ||
                data.world?.name ||
                null

        };


        return this.normalizeMetadata(
            hints
        );

    },


    /* =====================================================
       SYNC WITH ENGINE
    ===================================================== */

    syncFromEngine(
        metadata = {}
    ){

        const engine =
            this.getEngine();


        if(!engine){

            /*
             * Even before Engine is available, explicit
             * application hints can still update Awareness.
             */

            if(metadata.app){

                return this.enter(
                    metadata.app,
                    metadata
                );

            }


            return this.snapshot();

        }


        const page =
            this.normalizePage(
                metadata.page ??
                engine.currentEntityPage ??
                null
            );


        const screen =
            this.normalizeScreen(
                metadata.screen ||
                engine.currentView ||
                "home"
            );


        let app =
            metadata.app ||
            page ||
            screen ||
            "home";


        if(
            screen ===
                "vaero"
        ){

            app =
                "vaero";

        }


        if(
            screen ===
                "applications"
        ){

            app =
                "applications";

        }


        return this.enter(
            app,
            {

                ...metadata,

                screen,

                page,

                source:
                    metadata.source ||
                    "engine-sync"

            }
        );

    },


    /* =====================================================
       CURRENT
    ===================================================== */

    current(){

        return (
            this.currentApp ||
            "home"
        );

    },


    currentContext(){

        return {

            app:
                this.current(),

            screen:
                this.currentScreen ||
                "home",

            page:
                this.currentPage ||
                null

        };

    },


    /* =====================================================
       TIME IN CONTEXT
    ===================================================== */

    duration(){

        const enteredAt =
            Number(
                this.enteredAt
            );


        if(
            !Number.isFinite(
                enteredAt
            ) ||
            enteredAt <=
                0
        ){

            return 0;

        }


        return Math.max(
            0,
            Date.now() -
            enteredAt
        );

    },


    /* =====================================================
       SNAPSHOT
    ===================================================== */

    snapshot(){

        return {

            app:
                this.current(),

            screen:
                this.currentScreen ||
                "home",

            page:
                this.currentPage ||
                null,

            previousApp:
                this.previousApp,

            previousScreen:
                this.previousScreen,

            metadata:
                this.normalizeMetadata(
                    this.metadata
                ),

            enteredAt:
                this.enteredAt,

            duration:
                this.duration(),

            booted:
                this.booted

        };

    },


    /* =====================================================
       HISTORY
    ===================================================== */

    history(limit = 8){

        const numeric =
            Number(
                limit
            );


        const safeLimit =
            Math.max(
                1,
                Math.min(
                    this.historyLimit,
                    Number.isFinite(
                        numeric
                    )
                        ? Math.floor(
                            numeric
                        )
                        : 8
                )
            );


        return (
            this.clone(
                this.transitions.slice(
                    -safeLimit
                )
            ) ||
            []
        );

    },


    lastTransition(){

        if(
            this.transitions.length ===
                0
        ){

            return null;

        }


        return (
            this.clone(
                this.transitions[
                    this.transitions.length -
                    1
                ]
            ) ||
            null
        );

    },


    /* =====================================================
       EVENT
    ===================================================== */

    emit(
        eventName,
        payload = {}
    ){

        const name =
            String(
                eventName ??
                    ""
            ).trim();


        if(!name){

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
                    name,
                    payload
                );


                return true;

            }

        } catch(error){

            /* fallback */

        }


        try{

            const events =
                this.getService(
                    "events"
                );


            if(
                events &&
                typeof events.emit ===
                    "function"
            ){

                events.emit(
                    name,
                    payload
                );


                return true;

            }

        } catch(error){

            return false;

        }


        return false;

    },


    /* =====================================================
       SUBSCRIPTIONS
    ===================================================== */

    subscribe(
        events,
        eventName,
        callback
    ){

        if(
            !events ||
            typeof events.on !==
                "function" ||
            typeof callback !==
                "function"
        ){

            return false;

        }


        try{

            const unsubscribe =
                events.on(
                    eventName,
                    callback
                );


            if(
                typeof unsubscribe ===
                    "function"
            ){

                this.subscriptions.push(
                    unsubscribe
                );

            }


            return true;

        } catch(error){

            return false;

        }

    },


    clearSubscriptions(){

        this.subscriptions.forEach(
            unsubscribe => {

                if(
                    typeof unsubscribe !==
                        "function"
                ){

                    return;

                }


                try{

                    unsubscribe();

                } catch(error){

                    /* ignore */

                }

            }
        );


        this.subscriptions =
            [];


        return true;

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(this.booted){

            return this.snapshot();

        }


        const events =
            this.getService(
                "events"
            );


        this.booted =
            true;


        this.bootedAt =
            Date.now();


        if(
            events &&
            typeof events.on ===
                "function"
        ){

            const subscriptions = [

                "engine.started",
                "engine:started",

                "engine:view:changed",
                "engine.view.changed",

                "entity:mounted",
                "entity.mounted",

                "world:opened",
                "world.opened",

                "application:opened",
                "application.opened"

            ];


            subscriptions.forEach(
                eventName => {

                    this.subscribe(
                        events,
                        eventName,
                        payload => {

                            try{

                                const hints =
                                    this.extractEventHints(
                                        eventName,
                                        payload
                                    );


                                this.syncFromEngine(
                                    hints
                                );

                            } catch(error){

                                console.warn(
                                    `Brain Awareness sync başarısız: ${eventName}`,
                                    error
                                );

                            }

                        }
                    );

                }
            );

        }


        this.syncFromEngine({
            source:
                "brain-awareness:boot"
        });


        this.emit(
            "brain:awareness:online",
            {
                bootedAt:
                    this.bootedAt,

                state:
                    this.snapshot()
            }
        );


        return this.snapshot();

    },


    /* =====================================================
       RESET
    ===================================================== */

    reset(){

        const now =
            Date.now();


        const previousApp =
            this.currentApp ||
            null;


        const previousScreen =
            this.currentScreen ||
            null;


        const previousPage =
            this.currentPage ||
            null;


        if(
            previousApp !==
                "home" ||
            previousScreen !==
                "home" ||
            previousPage !==
                null
        ){

            this.recordTransition({

                from:
                    previousApp,

                to:
                    "home",

                fromScreen:
                    previousScreen,

                toScreen:
                    "home",

                fromPage:
                    previousPage,

                page:
                    null,

                metadata:{},

                enteredAt:
                    now

            });

        }


        this.previousApp =
            previousApp;


        this.previousScreen =
            previousScreen;


        this.currentApp =
            "home";


        this.currentScreen =
            "home";


        this.currentPage =
            null;


        this.metadata =
            {};


        this.enteredAt =
            now;


        const snapshot =
            this.snapshot();


        this.emit(
            "brain:awareness:reset",
            snapshot
        );


        return snapshot;

    },


    /* =====================================================
       HARD RESET
    ===================================================== */

    clear(){

        this.currentApp =
            "home";


        this.currentScreen =
            "home";


        this.currentPage =
            null;


        this.previousApp =
            null;


        this.previousScreen =
            null;


        this.metadata =
            {};


        this.enteredAt =
            Date.now();


        this.transitions =
            [];


        const snapshot =
            this.snapshot();


        this.emit(
            "brain:awareness:cleared",
            snapshot
        );


        return snapshot;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const snapshot =
            this.snapshot();


        return {

            booted:
                this.booted,

            bootedAt:
                this.bootedAt,

            app:
                snapshot.app,

            screen:
                snapshot.screen,

            page:
                snapshot.page,

            previousApp:
                snapshot.previousApp,

            previousScreen:
                snapshot.previousScreen,

            duration:
                snapshot.duration,

            transitions:
                this.transitions.length,

            subscriptions:
                this.subscriptions.length,

            entityId:
                snapshot.metadata
                    ?.entityId ||
                null,

            worldId:
                snapshot.metadata
                    ?.worldId ||
                null

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
            "brainAwareness",
            BrainAwareness
        );

    }

} catch(error){

    console.error(
        "BrainAwareness register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.BrainAwareness =
        BrainAwareness;

}


/* =========================================================
   BOOT
========================================================= */

try{

    BrainAwareness.boot();

} catch(error){

    console.warn(
        "Brain Awareness boot başarısız:",
        error
    );

}
