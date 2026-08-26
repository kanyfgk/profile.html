/* =========================================================
   VAERO BRAIN MODE
   Proactivity / Conversation Behaviour
========================================================= */

const BrainMode = {

    modes: {
        SILENT: "silent",
        BALANCED: "balanced",
        ACTIVE: "active"
    },

    mode: "silent",

    previousMode: null,

    changedAt: Date.now(),


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


        const allowed =
            Object.values(
                this.modes
            );


        return allowed.includes(
            value
        )
            ? value
            : null;

    },


    /* =====================================================
       SET
    ===================================================== */

    set(mode){

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


        if(
            this.mode !==
            nextMode
        ){

            this.previousMode =
                this.mode;

            this.mode =
                nextMode;

            this.changedAt =
                Date.now();

        }


        return this.snapshot();

    },


    /* =====================================================
       GET
    ===================================================== */

    get(){

        return (
            this.mode ||
            this.modes.SILENT
        );

    },


    /* =====================================================
       BEHAVIOUR
    ===================================================== */

    canSpeak(){

        return (
            this.mode ===
                this.modes.BALANCED ||
            this.mode ===
                this.modes.ACTIVE
        );

    },


    canSuggest(){

        return (
            this.mode ===
                this.modes.BALANCED ||
            this.mode ===
                this.modes.ACTIVE
        );

    },


    canInitiate(){

        return (
            this.mode ===
            this.modes.ACTIVE
        );

    },


    isSilent(){

        return (
            this.mode ===
            this.modes.SILENT
        );

    },


    /* =====================================================
       SNAPSHOT
    ===================================================== */

    snapshot(){

        return {

            mode:
                this.get(),

            previousMode:
                this.previousMode,

            changedAt:
                this.changedAt,

            canSpeak:
                this.canSpeak(),

            canSuggest:
                this.canSuggest(),

            canInitiate:
                this.canInitiate()

        };

    },


    /* =====================================================
       RESET
    ===================================================== */

    reset(){

        this.previousMode =
            this.mode;

        this.mode =
            this.modes.SILENT;

        this.changedAt =
            Date.now();


        return this.snapshot();

    }

};


VAERO.register(
    "brainMode",
    BrainMode
);


window.BrainMode =
    BrainMode;
