/* =========================================================
   VAERO BRAIN MODE
   Proactivity / Conversation Behaviour Controller
========================================================= */

const BrainMode = {

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


    /* =====================================================
       SERVICE ACCESS
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

            return null;

        }

    },


    /* =====================================================
       NORMALIZE
    ===================================================== */

    normalize(mode){

        const value =
            String(
                mode ?? ""
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
                 * ACTIVE bile keyfi interrupt yetkisi almaz.
                 * Yalnız önemli sistem olayları için
                 * interrupt düşünülebilir.
                 */

                canInterrupt:
                    true,

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

        try{

            if(
                typeof VAERO !== "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    eventName,
                    payload
                );


                return true;

            }


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
                    eventName,
                    payload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `BrainMode event gönderilemedi: ${eventName}`,
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

                    mode:
                        this.mode,

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


            const mode =
                this.normalize(
                    parsed?.mode
                );


            if(!mode){
                return false;
            }


            this.mode =
                mode;


            this.changedAt =
                Number(
                    parsed?.changedAt
                ) ||
                Date.now();


            this.changedBy =
                String(
                    parsed?.changedBy ||
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
            String(
                options.source ||
                options.changedBy ||
                "user"
            );


        const previous =
            this.mode;


        if(
            previous ===
            nextMode
        ){

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

        return this
            .getCapabilities()
            .canSpeak;

    },


    canSuggest(){

        return this
            .getCapabilities()
            .canSuggest;

    },


    canInitiate(){

        return this
            .getCapabilities()
            .canInitiate;

    },


    canReadContext(){

        return this
            .getCapabilities()
            .canReadContext;

    },


    canObserve(){

        return this
            .getCapabilities()
            .canObserve;

    },


    canInterrupt(){

        return this
            .getCapabilities()
            .canInterrupt;

    },


    canSurfaceWarnings(){

        return this
            .getCapabilities()
            .canSurfaceWarnings;

    },


    canSurfaceCritical(){

        return this
            .getCapabilities()
            .canSurfaceCritical;

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
                capabilities.canReadContext,

            interrupt:
                capabilities.canInterrupt,

            warning:
                capabilities.canSurfaceWarnings,

            critical:
                capabilities.canSurfaceCritical

        };


        /*
         * Güvenlik / kritik sistem uyarıları Silent modda da
         * tamamen bastırılmaz.
         */

        if(
            key === "critical"
        ){

            return (
                capabilities
                    .canSurfaceCritical
            );

        }


        if(
            key === "warning" &&
            context.severity ===
                "critical"
        ){

            return (
                capabilities
                    .canSurfaceCritical
            );

        }


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
         * Kullanıcı modu daha önce manuel değiştirdiyse
         * Discovery sessizce üzerine yazmaz.
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

            canInterrupt:
                capabilities.canInterrupt,

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
       BOOT
    ===================================================== */

    boot(){

        if(
            this.booted
        ){

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

            try{

                events.on(
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

            } catch(error){

                /* optional */
            }


            try{

                events.on(
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

            } catch(error){

                /* optional */
            }

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

        this.previousMode =
            this.mode;


        this.mode =
            this.modes.SILENT;


        this.changedAt =
            Date.now();


        this.changedBy =
            options.source ||
            "reset";


        if(
            options.persist !==
                false
        ){

            this.save();

        }


        this.emit(
            "brain:mode:changed",
            {

                previousMode:
                    this.previousMode,

                mode:
                    this.mode,

                changedAt:
                    this.changedAt,

                changedBy:
                    this.changedBy,

                capabilities:
                    this.getCapabilities()

            }
        );


        return this.snapshot();

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const snapshot =
            this.snapshot();


        return {

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

            canSpeak:
                snapshot.canSpeak,

            canSuggest:
                snapshot.canSuggest,

            canInitiate:
                snapshot.canInitiate,

            canInterrupt:
                snapshot.canInterrupt,

            suggestionLevel:
                snapshot.suggestionLevel

        };

    }

};


VAERO.register(
    "brainMode",
    BrainMode
);


window.BrainMode =
    BrainMode;


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
