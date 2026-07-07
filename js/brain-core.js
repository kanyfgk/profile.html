const BrainCore = {

    provider: null,

    register(provider){
        this.provider = provider;
    },

    async ask(prompt, context = {}){

        if(!this.provider){
            return {
                reply: "Brain provider henüz bağlı değil."
            };
        }

        return await this.provider.ask(prompt, context);

    }

};

VAERO.register("brainCore", BrainCore);
window.BrainCore = BrainCore;
