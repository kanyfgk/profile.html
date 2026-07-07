const BrainProvider = {

    async ask(prompt, context){

        console.log("Prompt:", prompt);
        console.log("Context:", context);

        return {
            reply: "Henüz AI bağlı değil."
        };

    }

};

VAERO.get("brainCore").register(BrainProvider);
