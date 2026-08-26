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


    /* =====================================================
       SERVICE ACCESS
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

            return null;

        }

    },


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
       NORMALIZATION
    ===================================================== */

    normalizeApp(app){

        const normalized =
            String(
                app ?? ""
            )
                .trim()
                .toLowerCase();


        return (
            normalized ||
            "home"
        );

    },


    normalizeScreen(screen){

        const normalized =
            String(
                screen ?? ""
            )
                .trim()
                .toLowerCase();


        return (
            normalized ||
            "home"
        );

    },


    normalizePage(page){

        const normalized =
            String(
                page ?? ""
            )
                .trim()
                .toLowerCase();


        return (
            normalized ||
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
                typeof structuredClone === "function"
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
       METADATA
    ===================================================== */

    normalizeMetadata(metadata){

        if(
            !metadata ||
            typeof metadata !== "object" ||
            Array.isArray(
                metadata
            )
        ){

            return {};

        }


        const safe = {};


        Object.entries(
            metadata
        )
            .slice(
                0,
                60
            )
            .forEach(
                ([key,value]) => {

                    const normalizedKey =
                        String(
                            key
                        )
                            .trim()
                            .toLowerCase();


                    const blocked =
                        new Set([
                            "password",
                            "secret",
                            "token",
                            "authorization",
                            "apikey",
                            "api_key",
                            "privatekey",
                            "private_key",
                            "cardnumber",
                            "cvv"
                        ]);


                    if(
                        blocked.has(
                            normalizedKey
                        )
                    ){

                        safe[key] =
                            "[redacted]";

                        return;

                    }


                    const cloned =
                        this.clone(
                            value
                        );


                    if(
                        cloned !== undefined
                    ){

                        safe[key] =
                            cloned;

                    }

                }
            );


        return safe;

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

    recordTransition({
        from,
        to,
        fromScreen = null,
        toScreen = null,
        page = null,
        metadata = {},
        enteredAt = null
    }){

        const transition = {

            id:
                `awareness_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2,8)}`,

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

            page:
                page ||
                null,

            metadata:
                this.normalizeMetadata(
                    metadata
                ),

            enteredAt:
                Number(
                    enteredAt
                ) ||
                Date.now()

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


        return this.clone(
            transition
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
                metadata.page ||
                engine?.currentEntityPage ||
                null
            );


        const now =
            Date.now();


        const previousApp =
            this.currentApp ||
            "home";


        const previousScreen =
            this.currentScreen ||
            previousApp;


        const normalizedMetadata =
            this.buildEngineMetadata(
                metadata
            );


        const changed =
            previousApp !== nextApp ||
            previousScreen !== nextScreen ||
            this.currentPage !== nextPage;


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

                page:
                    nextPage,

                metadata:
                    normalizedMetadata,

                enteredAt:
                    now

            });

        }


        this.currentApp =
            nextApp;


        this.currentScreen =
            nextScreen;


        this.currentPage =
            nextPage;


        this.metadata =
            normalizedMetadata;


        this.enteredAt =
            now;


        this.emit(
            "brain:awareness:entered",
            this.snapshot()
        );


        return this.snapshot();

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


        return this.snapshot();

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
            return this.snapshot();
        }


        const page =
            engine.currentEntityPage ||
            null;


        const screen =
            engine.currentView ||
            "home";


        let app =
            page ||
            screen ||
            "home";


        if(
            screen === "vaero"
        ){

            app =
                "vaero";

        }


        if(
            screen === "applications"
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
            )
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

        const safeLimit =
            Math.max(
                1,
                Math.min(
                    this.historyLimit,
                    Number(limit) || 8
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
            this.transitions.length === 0
        ){
            return null;
        }


        return this.clone(
            this.transitions[
                this.transitions.length - 1
            ]
        );

    },


    /* =====================================================
       EVENT
    ===================================================== */

    emit(
        eventName,
        payload
    ){

        try{

            if(
                typeof VAERO !== "undefined" &&
                typeof VAERO.emit === "function"
            ){

                VAERO.emit(
                    eventName,
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


            events?.emit?.(
                eventName,
                payload
            );


            return true;

        } catch(error){

            return false;

        }

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(this.booted){

            return this.snapshot();

        }


        this.booted =
            true;


        this.bootedAt =
            Date.now();


        const events =
            this.getService(
                "events"
            );


        if(
            events &&
            typeof events.on === "function"
        ){

            const sync =
                source => {

                    try{

                        this.syncFromEngine({
                            source
                        });

                    } catch(error){

                        console.warn(
                            `Brain Awareness sync başarısız: ${source}`,
                            error
                        );

                    }

                };


            const subscriptions = [

                "engine.started",

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

                    try{

                        events.on(
                            eventName,
                            () => {

                                sync(
                                    eventName
                                );

                            }
                        );

                    } catch(error){

                        /* optional event */
                    }

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


        const previous =
            this.currentApp ||
            null;


        if(
            previous &&
            previous !== "home"
        ){

            this.recordTransition({

                from:
                    previous,

                to:
                    "home",

                fromScreen:
                    this.currentScreen,

                toScreen:
                    "home",

                page:
                    null,

                metadata:{},

                enteredAt:
                    now

            });

        }


        this.previousApp =
            previous;


        this.previousScreen =
            this.currentScreen;


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


        return this.snapshot();

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


        return this.snapshot();

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

            duration:
                snapshot.duration,

            transitions:
                this.transitions.length,

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


VAERO.register(
    "brainAwareness",
    BrainAwareness
);


window.BrainAwareness =
    BrainAwareness;


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
