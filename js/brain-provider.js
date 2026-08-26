/* =========================================================
   VAERO BRAIN PROVIDER
   Local Fallback Provider
========================================================= */

const BrainProvider = {

    id:
        "vaero-local-fallback",

    name:
        "VAERO Local Brain",

    version:
        "1.0.0",


    /* =====================================================
       NORMALIZE
    ===================================================== */

    normalizePrompt(prompt){

        return String(
            prompt ?? ""
        ).trim();

    },


    normalizeContext(context){

        if(
            !context ||
            typeof context !== "object" ||
            Array.isArray(context)
        ){
            return {};
        }

        return context;

    },


    /* =====================================================
       LOCAL RESPONSE
    ===================================================== */

    buildFallbackReply(
        prompt,
        context
    ){

        const brainContext =
            context?.brain ||
            {};


        /*
         * Eğer BrainCore lokal bir Engine aksiyonunu
         * zaten gerçekleştirdiyse provider bunu
         * doğal bir cevap olarak yansıtabilir.
         */

        if(
            brainContext.executed &&
            brainContext.actionResult
        ){

            const actionMessage =
                brainContext
                    .actionResult
                    .message;


            if(actionMessage){

                return String(
                    actionMessage
                );

            }


            return (
                "İşlem tamamlandı."
            );

        }


        /*
         * Confirmation gereken işlemler provider
         * tarafından otomatik yürütülmez.
         */

        if(
            brainContext
                .requiresConfirmation &&
            !brainContext.executed
        ){

            return (
                "Bu işlem devam etmeden önce onayını gerektiriyor."
            );

        }


        /*
         * Policy tarafından engellenmiş işlem.
         */

        if(
            brainContext.blocked
        ){

            return (
                brainContext
                    .policy
                    ?.reason ||
                "Bu işlem Brain tarafından uygulanamaz."
            );

        }


        const app =
            context?.app ||
            context?.screen ||
            null;


        if(app){

            return (
                `${app} bağlamındayım. ` +
                "Engine içindeki desteklenen işlemleri anlayabilir ve yönlendirebilirim. " +
                "Dış AI motoru henüz bağlı değil."
            );

        }


        return (
            "VAERO Brain aktif. " +
            "Engine içindeki desteklenen işlemleri anlayabilirim; " +
            "dış AI motoru henüz bağlı değil."
        );

    },


    /* =====================================================
       ASK
    ===================================================== */

    async ask(
        prompt,
        context = {}
    ){

        const normalizedPrompt =
            this.normalizePrompt(
                prompt
            );


        const safeContext =
            this.normalizeContext(
                context
            );


        if(!normalizedPrompt){

            return {

                reply:
                    "Ne yapmak istediğini yazabilirsin.",

                provider:
                    this.id,

                local:
                    true

            };

        }


        return {

            reply:
                this.buildFallbackReply(
                    normalizedPrompt,
                    safeContext
                ),

            provider:
                this.id,

            providerName:
                this.name,

            local:
                true,

            externalAI:
                false,

            generatedAt:
                Date.now()

        };

    },


    /* =====================================================
       STATUS
    ===================================================== */

    status(){

        return {

            id:
                this.id,

            name:
                this.name,

            version:
                this.version,

            available:
                true,

            local:
                true,

            externalAI:
                false

        };

    }

};


/* =========================================================
   REGISTER
========================================================= */

try{

    const brainCore =
        typeof VAERO !== "undefined" &&
        typeof VAERO.get === "function"
            ? VAERO.get(
                "brainCore"
            )
            : null;


    if(
        brainCore &&
        typeof brainCore.register ===
            "function"
    ){

        brainCore.register(
            BrainProvider,
            {
                id:
                    BrainProvider.id,

                name:
                    BrainProvider.name,

                version:
                    BrainProvider.version,

                type:
                    "local-fallback"
            }
        );

    } else {

        console.warn(
            "Brain Provider kaydedilemedi: Brain Core hazır değil."
        );

    }

} catch(error){

    console.error(
        "Brain Provider registration error:",
        error
    );

}


window.BrainProvider =
    BrainProvider;
