const BrainService = {

    async ask(prompt){

        const context = VAERO.get("brainContext").build();

        const brain = VAERO.get("brainCore");

        return await brain.ask(prompt, context);

    }

};

VAERO.register("brainService", BrainService);
