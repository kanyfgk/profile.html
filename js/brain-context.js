/* =========================================================
   VAERO BRAIN CONTEXT
   Runtime Context Builder
========================================================= */

const BrainContext = {

    /* =====================================================
       SAFE SERVICE ACCESS
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

            console.warn(
                `Brain Context servisi okunamadı: ${name}`,
                error
            );

            return null;

        }

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


    /* =====================================================
       AWARENESS SNAPSHOT
    ===================================================== */

    getAwarenessSnapshot(){

        const fallback = {

            app:"home",
            previousApp:null,
            metadata:{},
            enteredAt:null

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
                        ? this.clone(
                            snapshot.metadata
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

            /* fallback below */
        }


        if(
            typeof window !== "undefined" &&
            window.Engine
        ){

            return window.Engine;

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
            typeof extra === "object" &&
            !Array.isArray(extra)
                ? extra
                : {};


        /* =================================================
           ENGINE NOT READY
        ================================================= */

        if(!engine){

            return {

                app:
                    awarenessState.app,

                screen:
                    awarenessState.app ||
                    "home",

                page:
                    null,

                previousApp:
                    awarenessState.previousApp,

                metadata:
                    {
                        ...awarenessState.metadata
                    },

                entity:
                    null,

                world:
                    null,

                user:
                    null,

                engineReady:
                    false,

                contextSource:
                    "awareness",

                enteredAt:
                    awarenessState.enteredAt,

                builtAt:
                    Date.now(),

                ...this.clone(
                    safeExtra
                )

            };

        }


        /* =================================================
           ENGINE STATE
        ================================================= */

        const entity =
            engine.currentOpenedEntity ||
            null;


        const world =
            engine.currentWorld ||
            null;


        const user =
            engine.currentEntity ||
            null;


        const currentView =
            engine.currentView ||
            null;


        const currentPage =
            engine.currentEntityPage ||
            null;


        return {

            app:
                awarenessState.app ||
                currentPage ||
                currentView ||
                "home",

            screen:
                currentView ||
                awarenessState.app ||
                "home",

            page:
                currentPage,

            previousApp:
                awarenessState.previousApp,

            metadata:
                {
                    ...awarenessState.metadata
                },

            entity:
                this.clone(
                    entity
                ),

            world:
                this.clone(
                    world
                ),

            user:
                this.clone(
                    user
                ),

            engineReady:
                true,

            contextSource:
                "engine+awareness",

            enteredAt:
                awarenessState.enteredAt,

            builtAt:
                Date.now(),

            ...this.clone(
                safeExtra
            )

        };

    },


    /* =====================================================
       COMPACT SNAPSHOT
       Provider / logs için daha küçük context
    ===================================================== */

    compact(extra = {}){

        const context =
            this.build(
                extra
            );


        return {

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
                            context.entity.id ||
                            null,

                        name:
                            context.entity.name ||
                            null,

                        type:
                            context.entity.type ||
                            null
                    }
                    : null,

            world:
                context.world
                    ? {
                        id:
                            context.world.id ||
                            null,

                        name:
                            context.world.name ||
                            null
                    }
                    : null,

            user:
                context.user
                    ? {
                        id:
                            context.user.id ||
                            null,

                        name:
                            context.user.name ||
                            null,

                        type:
                            context.user.type ||
                            null
                    }
                    : null,

            metadata:
                context.metadata,

            engineReady:
                context.engineReady,

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
