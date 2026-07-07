const BrainCore = {

    provider: null,

    register(provider){
        this.provider = provider;
    },

    async ask(prompt, context = {}){

        if(!this.provider){
            throw new Error("Brain provider not registered.");
        }

        return await this.provider.ask(prompt, context);

    }

};

VAERO.register("brainCore", BrainCore);
