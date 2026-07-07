const BrainProvider = {

    async ask(prompt, context){

        console.log("BRAIN PROMPT:", prompt);
        console.log("BRAIN CONTEXT:", context);

        return {
            reply: "VAERO Brain aktif. Henüz dış AI motoru bağlı değil."
        };

    }

};

VAERO.get("brainCore").register(BrainProvider);
window.BrainProvider = BrainProvider;
