const BrainContext = {

    build(){

        const awareness =
            VAERO.get("brainAwareness");

        const engine =
            VAERO.engine ||
            window.Engine ||
            null;

        const awarenessState =
            awareness &&
            typeof awareness.snapshot === "function"
                ? awareness.snapshot()
                : {
                    app: "home",
                    previousApp: null,
                    metadata: {},
                    enteredAt: null
                };

        if(!engine){

            return {
                app: awarenessState.app,
                screen: awarenessState.app,
                page: null,
                previousApp:
                    awarenessState.previousApp,
                metadata:
                    awarenessState.metadata,
                entity: null,
                world: null,
                user: null
            };

        }

        return {
            app: awarenessState.app,

            screen:
                engine.currentView ||
                awarenessState.app ||
                "home",

            page:
                engine.currentEntityPage ||
                null,

            previousApp:
                awarenessState.previousApp,

            metadata:
                awarenessState.metadata,

            entity:
                engine.currentOpenedEntity ||
                null,

            world:
                engine.currentWorld ||
                null,

            user:
                engine.currentEntity ||
                null
        };

    }

};

VAERO.register(
    "brainContext",
    BrainContext
);
