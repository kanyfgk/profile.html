/* =========================================================
   VAERO BRAIN MODE
   Proactivity / Conversation Behaviour Controller
========================================================= */

const BrainMode = {

    version:
        "3.0.0",


    /* =====================================================
       MODES
    ===================================================== */

    modes: {

        SILENT:
            "silent",

        BALANCED:
            "balanced",

        ACTIVE:
            "active"

    },


    mode:
        "silent",

    previousMode:
        null,

    changedAt:
        Date.now(),

    changedBy:
        "system",

    booted:
        false,

    bootedAt:
        null,

    storageKey:
        "vaero:brain:mode:v2",

    subscriptions:
        [],


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


    /* =====================================================
       NORMALIZE
    ===================================================== */

    normalize(mode){

        const value =
            String(
                mode ??
                    ""
            )
                .trim()
                .toLowerCase();


        const aliases = {

            quiet:
                this.modes.SILENT,

            passive:
                this.modes.SILENT,

            minimal:
                this.modes.SILENT,

            normal:
                this.modes.BALANCED,

            default:
                this.modes.BALANCED,

            assist:
                this.modes.BALANCED,

            proactive:
                this.modes.ACTIVE,

            engaged:
                this.modes.ACTIVE

        };


        const normalized =
            aliases[value] ||
            value;


        const allowed =
            Object.values(
                this.modes
            );


        return allowed.includes(
            normalized
        )
            ? normalized
            : null;

    },


    normalizeSource(
        value,
        fallback = "system"
    ){

        const source =
            String(
                value ??
                    fallback
            )
                .trim()
                .toLowerCase()
                .slice(
                    0,
                    120
                );


        return (
            source ||
            fallback
        );

    },


    normalizeSeverity(value){

        const severity =
            String(
                value ??
                    ""
            )
                .trim()
                .toLowerCase();


        const aliases = {

            info:
                "info",

            informational:
                "info",

            notice:
                "info",

            low:
                "info",

            warn:
                "warning",

            warning:
                "warning",

            medium:
                "warning",

            high:
                "warning",

            critical:
                "critical",

            fatal:
                "critical",

            emergency:
                "critical"

        };


        return (
            aliases[
                severity
            ] ||
            null
        );

    },


    /* =====================================================
       MODE CAPABILITIES
    ===================================================== */

    getCapabilities(mode = this.mode){

        const normalized =
            this.normalize(
                mode
            ) ||
            this.modes.SILENT;


        const capabilities = {

            [this.modes.SILENT]: {

                canSpeak:
                    false,

                canSuggest:
                    false,

                canInitiate:
                    false,

                canReadContext:
                    true,

                canObserve:
                    true,

                canInterrupt:
                    false,

                canSurfaceWarnings:
                    true,

                canSurfaceCritical:
                    true,

                suggestionLevel:
                    0

            },


            [this.modes.BALANCED]: {

                canSpeak:
                    true,

                canSuggest:
                    true,

                canInitiate:
                    false,

                canReadContext:
                    true,

                canObserve:
                    true,

                canInterrupt:
                    false,

                canSurfaceWarnings:
                    true,

                canSurfaceCritical:
                    true,

                suggestionLevel:
                    1

            },


            [this.modes.ACTIVE]: {

                canSpeak:
                    true,

                canSuggest:
                    true,

                canInitiate:
                    true,

                canReadContext:
                    true,

                canObserve:
                    true,

                /*
                 * Generic interruption is intentionally false.
                 *
                 * ACTIVE gives Brain more proactivity,
                 * not unrestricted interruption authority.
                 *
                 * Critical/warning interruption is resolved
                 * by allows() using severity.
                 */

                canInterrupt:
                    false,

                canSurfaceWarnings:
                    true,

                canSurfaceCritical:
                    true,

                suggestionLevel:
                    2

            }

        };


        return {
            ...capabilities[
                normalized
            ]
        };

    },


    /* =====================================================
       EVENTS
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

            console.warn(
                `BrainMode event gönderilemedi: ${name}`,
                error
            );

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

            console.warn(
                `BrainMode event fallback gönderilemedi: ${name}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       STORAGE
    ===================================================== */

    save(){

        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){

                return false;

            }


            localStorage.setItem(
                this.storageKey,
                JSON.stringify({

                    version:
                        this.version,

                    mode:
                        this.get(),

                    changedAt:
                        this.changedAt,

                    changedBy:
                        this.changedBy

                })
            );


            return true;

        } catch(error){

            return false;

        }

    },


    load(){

        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){

                return false;

            }


            const raw =
                localStorage.getItem(
                    this.storageKey
                );


            if(!raw){

                return false;

            }


            const parsed =
                JSON.parse(
                    raw
                );


            if(
                !parsed ||
                typeof parsed !==
                    "object"
            ){

                return false;

            }


            const mode =
                this.normalize(
                    parsed.mode
                );


            if(!mode){

                return false;

            }


            this.mode =
                mode;


            const changedAt =
                Number(
                    parsed.changedAt
                );


            this.changedAt =
                Number.isFinite(
                    changedAt
                ) &&
                changedAt >
                    0
                    ? changedAt
                    : Date.now();


            this.changedBy =
                this.normalizeSource(
                    parsed.changedBy,
                    "storage"
                );


            return true;

        } catch(error){

            return false;

        }

    },


    /* =====================================================
       SET
    ===================================================== */

    set(
        mode,
        options = {}
    ){

        const nextMode =
            this.normalize(
                mode
            );


        if(!nextMode){

            console.warn(
                `Geçersiz Brain mode: ${mode}`
            );


            return false;

        }


        const source =
            this.normalizeSource(
                options.source ||
                options.changedBy ||
                "user",
                "user"
            );


        const previous =
            this.get();


        if(
            previous ===
                nextMode
        ){

            /*
             * Same mode does not rewrite changedAt.
             * Behaviour duration therefore remains truthful.
             */

            return this.snapshot();

        }


        this.previousMode =
            previous;


        this.mode =
            nextMode;


        this.changedAt =
            Date.now();


        this.changedBy =
            source;


        if(
            options.persist !==
                false
        ){

            this.save();

        }


        const snapshot =
            this.snapshot();


        this.emit(
            "brain:mode:changed",
            {

                previousMode:
                    previous,

                mode:
                    nextMode,

                changedAt:
                    this.changedAt,

                changedBy:
                    this.changedBy,

                capabilities:
                    snapshot.capabilities

            }
        );


        return snapshot;

    },


    /* =====================================================
       GET
    ===================================================== */

    get(){

        return (
            this.normalize(
                this.mode
            ) ||
            this.modes.SILENT
        );

    },


    /* =====================================================
       MODE HELPERS
    ===================================================== */

    is(mode){

        const normalized =
            this.normalize(
                mode
            );


        if(!normalized){

            return false;

        }


        return (
            this.get() ===
            normalized
        );

    },


    isSilent(){

        return this.is(
            this.modes.SILENT
        );

    },


    isBalanced(){

        return this.is(
            this.modes.BALANCED
        );

    },


    isActive(){

        return this.is(
            this.modes.ACTIVE
        );

    },


    /* =====================================================
       BEHAVIOUR
    ===================================================== */

    canSpeak(){

        return (
            this
                .getCapabilities()
                .canSpeak ===
            true
        );

    },


    canSuggest(){

        return (
            this
                .getCapabilities()
                .canSuggest ===
            true
        );

    },


    canInitiate(){

        return (
            this
                .getCapabilities()
                .canInitiate ===
            true
        );

    },


    canReadContext(){

        return (
            this
                .getCapabilities()
                .canReadContext ===
            true
        );

    },


    canObserve(){

        return (
            this
                .getCapabilities()
                .canObserve ===
            true
        );

    },


    canInterrupt(
        context = {}
    ){

        return this.allows(
            "interrupt",
            context
        );

    },


    canSurfaceWarnings(){

        return (
            this
                .getCapabilities()
                .canSurfaceWarnings ===
            true
        );

    },


    canSurfaceCritical(){

        return (
            this
                .getCapabilities()
                .canSurfaceCritical ===
            true
        );

    },


    /* =====================================================
       PROACTIVITY DECISION
    ===================================================== */

    allows(
        behaviour,
        context = {}
    ){

        const key =
            String(
                behaviour ||
                    ""
            )
                .trim()
                .toLowerCase();


        const capabilities =
            this.getCapabilities();


        const severity =
            this.normalizeSeverity(
                context?.severity
            );


        /*
         * Critical system information is never fully hidden
         * by conversation proactivity mode.
         */

        if(
            key ===
                "critical"
        ){

            return (
                capabilities
                    .canSurfaceCritical ===
                true
            );

        }


        /*
         * Warnings can be surfaced in every mode because
         * they represent system/user protection information.
         */

        if(
            key ===
                "warning"
        ){

            if(
                severity ===
                    "critical"
            ){

                return (
                    capabilities
                        .canSurfaceCritical ===
                    true
                );

            }


            return (
                capabilities
                    .canSurfaceWarnings ===
                true
            );

        }


        /*
         * Interruption is much stricter than speaking.
         *
         * Normal suggestions never gain interruption rights.
         * Only warning/critical context may interrupt.
         */

        if(
            key ===
                "interrupt"
        ){

            if(
                severity ===
                    "critical"
            ){

                return (
                    capabilities
                        .canSurfaceCritical ===
                    true
                );

            }


            if(
                severity ===
                    "warning"
            ){

                return (
                    capabilities
                        .canSurfaceWarnings ===
                    true &&
                    this.isActive()
                );

            }


            return false;

        }


        const map = {

            speak:
                capabilities.canSpeak,

            suggest:
                capabilities.canSuggest,

            initiate:
                capabilities.canInitiate,

            observe:
                capabilities.canObserve,

            context:
                capabilities.canReadContext

        };


        return (
            map[key] ===
            true
        );

    },


    /* =====================================================
       DISCOVERY MODE
    ===================================================== */

    applyDiscoveryMode(
        discoveryResult,
        options = {}
    ){

        if(
            !discoveryResult ||
            typeof discoveryResult !==
                "object"
        ){

            return false;

        }


        const suggestedMode =

            discoveryResult
                ?.signals
                ?.brainMode ||

            discoveryResult
                ?.brainMode ||

            null;


        const normalized =
            this.normalize(
                suggestedMode
            );


        if(!normalized){

            return false;

        }


        /*
         * Once the user has manually selected a mode,
         * Discovery does not silently overwrite it.
         */

        if(
            options.force !==
                true &&
            this.changedBy ===
                "user"
        ){

            return this.snapshot();

        }


        return this.set(
            normalized,
            {
                source:
                    "discovery",

                persist:
                    options.persist !==
                    false
            }
        );

    },


    /* =====================================================
       SETTINGS MODE
    ===================================================== */

    applySettings(
        settings,
        options = {}
    ){

        if(
            !settings ||
            typeof settings !==
                "object"
        ){

            return false;

        }


        const mode =

            settings.brainMode ||

            settings.brain?.mode ||

            settings.brain?.proactivity ||

            null;


        const normalized =
            this.normalize(
                mode
            );


        if(!normalized){

            return false;

        }


        return this.set(
            normalized,
            {
                source:
                    options.source ||
                    "settings",

                persist:
                    options.persist !==
                    false
            }
        );

    },


    /* =====================================================
       SNAPSHOT
    ===================================================== */

    snapshot(){

        const mode =
            this.get();


        const capabilities =
            this.getCapabilities(
                mode
            );


        return {

            version:
                this.version,

            mode,

            previousMode:
                this.previousMode,

            changedAt:
                this.changedAt,

            changedBy:
                this.changedBy,

            capabilities,

            canSpeak:
                capabilities.canSpeak,

            canSuggest:
                capabilities.canSuggest,

            canInitiate:
                capabilities.canInitiate,

            canReadContext:
                capabilities.canReadContext,

            canObserve:
                capabilities.canObserve,

            /*
             * Base capability.
             * Contextual interruption must use canInterrupt()
             * or allows("interrupt", context).
             */

            canInterrupt:
                capabilities.canInterrupt,

            canSurfaceWarnings:
                capabilities
                    .canSurfaceWarnings,

            canSurfaceCritical:
                capabilities
                    .canSurfaceCritical,

            suggestionLevel:
                capabilities
                    .suggestionLevel,

            booted:
                this.booted,

            bootedAt:
                this.bootedAt

        };

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


        this.load();


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
            typeof events.on ===
                "function"
        ){

            this.subscribe(
                events,
                "discovery:completed",
                payload => {

                    const result =
                        payload?.result ||
                        payload ||
                        null;


                    this.applyDiscoveryMode(
                        result
                    );

                }
            );


            this.subscribe(
                events,
                "settings:changed",
                payload => {

                    const settings =
                        payload?.settings ||
                        payload ||
                        null;


                    this.applySettings(
                        settings,
                        {
                            source:
                                "settings"
                        }
                    );

                }
            );

        }


        this.emit(
            "brain:mode:online",
            this.snapshot()
        );


        return this.snapshot();

    },


    /* =====================================================
       RESET
    ===================================================== */

    reset(
        options = {}
    ){

        const previous =
            this.get();


        this.previousMode =
            previous;


        this.mode =
            this.modes.SILENT;


        this.changedAt =
            Date.now();


        this.changedBy =
            this.normalizeSource(
                options.source ||
                "reset",
                "reset"
            );


        if(
            options.persist !==
                false
        ){

            this.save();

        }


        const snapshot =
            this.snapshot();


        this.emit(
            "brain:mode:changed",
            {

                previousMode:
                    previous,

                mode:
                    this.mode,

                changedAt:
                    this.changedAt,

                changedBy:
                    this.changedBy,

                capabilities:
                    snapshot.capabilities

            }
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

            version:
                this.version,

            mode:
                snapshot.mode,

            previousMode:
                snapshot.previousMode,

            changedBy:
                snapshot.changedBy,

            changedAt:
                snapshot.changedAt,

            booted:
                snapshot.booted,

            bootedAt:
                snapshot.bootedAt,

            canSpeak:
                snapshot.canSpeak,

            canSuggest:
                snapshot.canSuggest,

            canInitiate:
                snapshot.canInitiate,

            canInterrupt:
                snapshot.canInterrupt,

            canSurfaceWarnings:
                snapshot
                    .canSurfaceWarnings,

            canSurfaceCritical:
                snapshot
                    .canSurfaceCritical,

            suggestionLevel:
                snapshot.suggestionLevel,

            subscriptions:
                this.subscriptions.length

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
            "brainMode",
            BrainMode
        );

    }

} catch(error){

    console.error(
        "BrainMode register edilemedi:",
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

    window.BrainMode =
        BrainMode;

}


/* =========================================================
   BOOT
========================================================= */

try{

    BrainMode.boot();

} catch(error){

    console.warn(
        "Brain Mode boot başarısız:",
        error
    );

}
