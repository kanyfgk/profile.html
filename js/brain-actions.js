const BrainActions = {

    execute(intent){
        if(!intent || intent.type !== "navigate") return false;

        if(!VAERO.engine.currentOpenedEntity){
            return false;
        }

        VAERO.engine.currentEntityPage = intent.target;
        VAERO.engine.mount(VAERO.engine.currentEntity);

        return true;
    }

};

VAERO.register("brainActions", BrainActions);
