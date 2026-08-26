/* =========================================================
   VAERO BRAIN AWARENESS
   Runtime Screen / App Awareness State
========================================================= */

const BrainAwareness = {

    currentApp:
        "home",

    previousApp:
        null,

    metadata:
        {},

    enteredAt:
        Date.now(),

    transitions:
        [],

    historyLimit:
        12,


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


        return normalized ||
            "home";

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

            /* JSON fallback below */
        }


        try{

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch(error){

            return value;

        }

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


        const cloned =
            this.clone(
                metadata
            );


        return (
            cloned &&
            typeof cloned ===
                "object" &&
            !Array.isArray(
                cloned
            )
        )
            ? cloned
            : {};

    },


    /* =====================================================
       TRANSITION HISTORY
    ===================================================== */

    recordTransition({
        from,
        to,
        metadata,
        enteredAt
    }){

        const transition = {

            from:
                from || null,

            to:
                to || "home",

            metadata:
                this.normalizeMetadata(
                    metadata
                ),

            enteredAt:
                Number(enteredAt) ||
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


        const now =
            Date.now();


        const previous =
            this.currentApp ||
            "home";


        /*
         * Gerçek bir ekran/app değişimi varsa
         * previousApp güncellenir.
         */

        if(
            previous !==
            nextApp
        ){

            this.previousApp =
                previous;


            this.recordTransition({

                from:
                    previous,

                to:
                    nextApp,

                metadata,

                enteredAt:
                    now

            });

        }


        this.currentApp =
            nextApp;


        this.metadata =
            this.normalizeMetadata(
                metadata
            );


        this.enteredAt =
            now;


        return this.snapshot();

    },


    /* =====================================================
       METADATA UPDATE
       Aynı context içindeyken app değiştirmeden
       awareness metadata güncellenebilir.
    ===================================================== */

    updateMetadata(
        metadata = {},
        {
            merge = true
        } = {}
    ){

        const nextMetadata =
            this.normalizeMetadata(
                metadata
            );


        this.metadata =
            merge
                ? {
                    ...this.metadata,
                    ...nextMetadata
                }
                : nextMetadata;


        return this.snapshot();

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

            previousApp:
                this.previousApp,

            metadata:
                this.normalizeMetadata(
                    this.metadata
                ),

            enteredAt:
                this.enteredAt,

            duration:
                this.duration()

        };

    },


    /* =====================================================
       HISTORY
    ===================================================== */

    history(limit = 6){

        const safeLimit =
            Math.max(
                1,
                Math.min(
                    this.historyLimit,
                    Number(limit) || 6
                )
            );


        return this.clone(
            this.transitions.slice(
                -safeLimit
            )
        );

    },


    lastTransition(){

        if(
            this.transitions.length ===
            0
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

                metadata:{},

                enteredAt:
                    now

            });

        }


        this.previousApp =
            previous;


        this.currentApp =
            "home";


        this.metadata =
            {};


        this.enteredAt =
            now;


        return this.snapshot();

    },


    /* =====================================================
       HARD RESET
       Debug / test için geçmiş dahil temizler.
    ===================================================== */

    clear(){

        this.currentApp =
            "home";

        this.previousApp =
            null;

        this.metadata =
            {};

        this.enteredAt =
            Date.now();

        this.transitions =
            [];


        return this.snapshot();

    }

};


VAERO.register(
    "brainAwareness",
    BrainAwareness
);


window.BrainAwareness =
    BrainAwareness;
