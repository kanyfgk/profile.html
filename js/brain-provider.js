/* =========================================================
   VAERO BRAIN PROVIDER
   Local Context-Aware Fallback Provider
========================================================= */

const BrainProvider = {

    id:
        "vaero-local-fallback",

    name:
        "VAERO Local Brain",

    version:
        "2.0.0",

    type:
        "local-fallback",

    externalAI:
        false,


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizePrompt(prompt){

        return String(
            prompt ?? ""
        )
            .trim()
            .slice(
                0,
                8000
            );

    },


    normalizeContext(context){

        if(
            !context ||
            typeof context !== "object" ||
            Array.isArray(
                context
            )
        ){
            return {};
        }


        return context;

    },


    normalizeText(value){

        return String(
            value ?? ""
        )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            )
            .replaceAll("ı", "i")
            .replaceAll("ğ", "g")
            .replaceAll("ü", "u")
            .replaceAll("ş", "s")
            .replaceAll("ö", "o")
            .replaceAll("ç", "c")
            .replace(/[?.!,;:()[\]{}"'`]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    },


    /* =====================================================
       HELPERS
    ===================================================== */

    includesAny(
        text,
        phrases = []
    ){

        const normalized =
            this.normalizeText(
                text
            );


        return phrases.some(
            phrase =>
                normalized.includes(
                    this.normalizeText(
                        phrase
                    )
                )
        );

    },


    getBrainContext(context){

        return (
            context?.brain &&
            typeof context.brain ===
                "object"
                ? context.brain
                : {}
        );

    },


    /* =====================================================
       ROUTE-AWARE RESPONSE
    ===================================================== */

    getRouteReply(context){

        const brainContext =
            this.getBrainContext(
                context
            );


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


        if(
            brainContext
                .requiresConfirmation &&
            !brainContext.executed
        ){

            return (
                brainContext
                    .policy
                    ?.reason ||
                "Bu işlem devam etmeden önce onayını gerektiriyor."
            );

        }


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


        return null;

    },


    /* =====================================================
       CONTEXT SUMMARY
    ===================================================== */

    buildContextSummary(context){

        const app =
            context?.app ||
            context?.page ||
            context?.screen ||
            "home";


        const entity =
            context?.entity ||
            null;


        const world =
            context?.world ||
            null;


        const applications =
            context?.applications ||
            null;


        const organs =
            context?.organs ||
            null;


        const discovery =
            context?.discovery ||
            null;


        return {

            app,

            screen:
                context?.screen ||
                null,

            page:
                context?.page ||
                null,

            entityName:
                entity?.name ||
                null,

            entityId:
                entity?.id ||
                context?.entityId ||
                null,

            worldName:
                world?.name ||
                null,

            worldId:
                world?.id ||
                context?.worldId ||
                null,

            applications:
                applications?.total ??
                null,

            installedApplications:
                applications?.installed ??
                null,

            organStatus:
                organs?.status ||
                null,

            discoveryCompleted:
                discovery?.completed ===
                    true,

            discoveryDirection:
                discovery?.direction ||
                null,

            brainMode:
                discovery?.brainMode ||
                null,

            engineReady:
                context?.engineReady !==
                false

        };

    },


    /* =====================================================
       LOCAL KNOWLEDGE
    ===================================================== */

    buildKnowledgeReply(
        prompt,
        context
    ){

        const normalized =
            this.normalizeText(
                prompt
            );


        const summary =
            this.buildContextSummary(
                context
            );


        /* -------------------------------------------------
           APPLICATIONS
        ------------------------------------------------- */

        if(
            this.includesAny(
                normalized,
                [
                    "uygulama",
                    "uygulamalar",
                    "applications",
                    "application",
                    "app"
                ]
            )
        ){

            if(
                summary.applications !==
                    null
            ){

                return (
                    `Applications kataloğunda ${summary.applications} uygulama bulunuyor. ` +
                    `${summary.installedApplications ?? 0} tanesi Engine içinde kullanılabilir durumda.`
                );

            }


            return (
                "Applications, Engine içindeki uygulamaları keşfetme, yükleme, güncelleme ve izinlerini yönetme katmanıdır."
            );

        }


        /* -------------------------------------------------
           WORLD
        ------------------------------------------------- */

        if(
            this.includesAny(
                normalized,
                [
                    "dunya",
                    "world"
                ]
            )
        ){

            if(
                summary.worldName
            ){

                return (
                    `${summary.worldName} şu an aktif World bağlamı.`
                );

            }


            return (
                "Şu anda aktif bir World bağlamı bulunmuyor."
            );

        }


        /* -------------------------------------------------
           ENTITY
        ------------------------------------------------- */

        if(
            this.includesAny(
                normalized,
                [
                    "varlik",
                    "entity"
                ]
            )
        ){

            if(
                summary.entityName
            ){

                return (
                    `${summary.entityName} şu anda aktif Entity bağlamında.`
                );

            }


            return (
                "Şu anda aktif bir Entity bağlamı bulunmuyor."
            );

        }


        /* -------------------------------------------------
           DISCOVERY
        ------------------------------------------------- */

        if(
            this.includesAny(
                normalized,
                [
                    "discovery",
                    "kesif",
                    "yonum",
                    "hedefim"
                ]
            )
        ){

            if(
                summary.discoveryCompleted
            ){

                return summary.discoveryDirection
                    ? `Discovery tamamlandı. Şu anki başlangıç yönün: ${summary.discoveryDirection}.`
                    : "Discovery tamamlandı ve kişisel Engine bağlamına işlendi.";

            }


            return (
                "Discovery henüz tamamlanmış görünmüyor."
            );

        }


        /* -------------------------------------------------
           ORGAN HEALTH
        ------------------------------------------------- */

        if(
            this.includesAny(
                normalized,
                [
                    "organ",
                    "organlar",
                    "sistem durumu",
                    "engine health",
                    "health"
                ]
            )
        ){

            if(
                summary.organStatus
            ){

                return (
                    `Engine organ durumu: ${summary.organStatus}.`
                );

            }


            return (
                "Organ health bilgisi şu anda kullanılabilir değil."
            );

        }


        /* -------------------------------------------------
           BRAIN
        ------------------------------------------------- */

        if(
            this.includesAny(
                normalized,
                [
                    "brain",
                    "beyin",
                    "sen nesin",
                    "ne yapabilirsin"
                ]
            )
        ){

            return (
                "VAERO Brain şu anda yerel Engine bağlamını, Intent, Policy, Actions, Skills, Applications ve kullanıcı contextini koordine edebiliyor. Dış AI provider henüz bağlı değil."
            );

        }


        return null;

    },


    /* =====================================================
       CONTEXTUAL RESPONSE
    ===================================================== */

    buildContextualReply(context){

        const summary =
            this.buildContextSummary(
                context
            );


        const parts = [];


        if(
            summary.app
        ){

            parts.push(
                `${summary.app} bağlamındayım`
            );

        }


        if(
            summary.entityName
        ){

            parts.push(
                `aktif Entity: ${summary.entityName}`
            );

        }


        if(
            summary.worldName
        ){

            parts.push(
                `aktif World: ${summary.worldName}`
            );

        }


        if(
            parts.length > 0
        ){

            return (
                `${parts.join(", ")}. ` +
                "Engine içindeki desteklenen işlemleri anlayabilir ve güvenli işlem zincirine yönlendirebilirim."
            );

        }


        return (
            "VAERO Brain aktif. Engine içindeki desteklenen işlemleri anlayabilir ve güvenli işlem zincirine yönlendirebilirim."
        );

    },


    /* =====================================================
       FALLBACK RESPONSE
    ===================================================== */

    buildFallbackReply(
        prompt,
        context
    ){

        /*
         * 1. Action / Policy sonucu her şeyden önce gelir.
         */

        const routeReply =
            this.getRouteReply(
                context
            );


        if(routeReply){

            return routeReply;

        }


        /*
         * 2. Yerel Engine bilgisinden anlamlı cevap.
         */

        const knowledgeReply =
            this.buildKnowledgeReply(
                prompt,
                context
            );


        if(knowledgeReply){

            return knowledgeReply;

        }


        /*
         * 3. Aktif bağlama göre genel fallback.
         */

        return this.buildContextualReply(
            context
        );

    },


    /* =====================================================
       ASK
    ===================================================== */

    async ask(
        prompt,
        context = {},
        options = {}
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

                providerName:
                    this.name,

                local:
                    true,

                externalAI:
                    false,

                generatedAt:
                    Date.now()

            };

        }


        const reply =
            this.buildFallbackReply(
                normalizedPrompt,
                safeContext
            );


        return {

            reply,

            provider:
                this.id,

            providerName:
                this.name,

            providerVersion:
                this.version,

            local:
                true,

            externalAI:
                false,

            contextual:
                true,

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

            type:
                this.type,

            available:
                true,

            local:
                true,

            externalAI:
                false,

            capabilities:[
                "context.reply",
                "route.reflect",
                "policy.reflect",
                "applications.context",
                "world.context",
                "entity.context",
                "discovery.context",
                "organ.context"
            ]

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
                    BrainProvider.type,

                local:
                    true,

                externalAI:
                    false,

                capabilities:
                    BrainProvider
                        .status()
                        .capabilities

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
