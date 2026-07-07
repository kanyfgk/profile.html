const BrainContext = {

    build(){

        return {

            app: VAERO.get("brainAwareness").current(),

            entity: VAERO.engine.currentOpenedEntity,

            world: VAERO.engine.currentWorld,

            user: VAERO.engine.currentEntity

        };

    }

};

VAERO.register("brainContext", BrainContext);
