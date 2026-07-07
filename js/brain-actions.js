const BrainActions = {

    actions: {},

    register(name, handler){
        this.actions[name] = handler;
    },

    run(name, payload = {}){

        const action = this.actions[name];

        if(!action){
            return {
                success: false,
                message: "Brain action bulunamadı."
            };
        }

        return action(payload);

    }

};

VAERO.register("brainActions", BrainActions);
window.BrainActions = BrainActions;
