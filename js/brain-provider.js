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
        "3.0.0",

    type:
        "local-fallback",

    local:
        true,

    externalAI:
        false,


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizePrompt(prompt){

        return String(
            prompt ??
                ""
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
            typeof context !==
                "object" ||
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
            value ??
                ""
        )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            )
            .replaceAll(
                "ı",
                "i"
            )
            .replaceAll(
                "ğ",
                "g"
            )
            .replaceAll(
                "ü",
                "u"
            )
            .replaceAll(
                "ş",
                "s"
            )
            .replaceAll(
                "ö",
                "o"
            )
            .replaceAll(
                "ç",
                "c"
            )
            .replace(
                /[?.!,;:()[\]{}"'`]/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
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


        if(
            !normalized ||
            !Array.isArray(
                phrases
            )
        ){

            return false;

        }


        return phrases.some(
            phrase => {

                const target =
                    this.normalizeText(
                        phrase
                    );


                return (
                    target &&
                    normalized.includes(
                        target
                    )
                );

            }
        );

    },


    getBrainContext(context){

        return (
            context?.brain &&
            typeof context.brain ===
                "object" &&
            !Array.isArray(
                context.brain
            )
                ? context.brain
                : {}
        );

    },


    /* =====================================================
       ROUTE / POLICY RESPONSE
    ===================================================== */

    getRouteReply(context){

        const brainContext =
            this.getBrainContext(
                context
            );


        if(
            brainContext.executed ===
                true &&
            brainContext.actionResult
        ){

            const actionResult =
                brainContext.actionResult;


            if(
                typeof actionResult ===
                    "string"
            ){

                return actionResult;

            }


            if(
                typeof actionResult ===
                    "object"
            ){

                const actionMessage =
                    actionResult.message ||
                    actionResult.reply ||
                    actionResult.text ||
                    null;


                if(actionMessage){

                    return String(
                        actionMessage
                    );

                }

            }


            return "İşlem tamamlandı.";

        }


        if(
            brainContext.requiresConfirmation ===
                true &&
            brainContext.executed !==
                true
        ){

            return (
                brainContext.policy
                    ?.reason ||
                brainContext.reason ||
                "Bu işlem devam etmeden önce onayını gerektiriyor."
            );

        }


        if(
            brainContext.blocked ===
                true
        ){

            return (
                brainContext.policy
                    ?.reason ||
                brainContext.reason ||
                "Bu işlem mevcut Brain policy kapsamında uygulanamaz."
            );

        }


        if(
            brainContext.policy?.allowed ===
                false
        ){

            return (
                brainContext.policy
                    ?.reason ||
                "Bu işlem mevcut Brain policy tarafından engellendi."
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


        const runtime =
            context?.runtime ||
            null;


        const kernel =
            context?.kernel ||
            null;


        const data =
            context?.data ||
            {};


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

            builtInApplications:
                applications?.builtIn ??
                null,

            organStatus:
                organs?.status ||
                null,

            organTotal:
                organs?.total ??
                null,

            problematicOrgans:
                organs?.problematic ??
                null,

            runtimeStatus:
                runtime?.status ||
                null,

            runtimeRunning:
                runtime?.running ===
                    true,

            runtimePaused:
                runtime?.paused ===
                    true,

            kernelStatus:
                kernel?.status ||
                null,

            kernelBooted:
                kernel?.booted ===
                    true,

            securityReady:
                kernel?.securityReady ===
                    true,

            discoveryCompleted:
                discovery?.completed ===
                    true,

            discoveryDirection:
                discovery?.direction ||
                null,

            brainMode:
                discovery?.brainMode ||
                null,

            memoryTotal:
                Number(
                    data?.memory?.total
                ) ||
                0,

            timelineTotal:
                Number(
                    data?.timeline?.total
                ) ||
                0,

            evolutionTotal:
                Number(
                    data?.evolution?.total
                ) ||
                0,

            bridgeTotal:
                Number(
                    data?.bridge?.total
                ) ||
                0,

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
                "Applications, Engine içindeki uygulamaları keşfetme ve yönetme katmanıdır."
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
                "Şu anda aktif bir World bağlamı görünmüyor."
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
                "Şu anda aktif bir Entity bağlamı görünmüyor."
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

                if(
                    summary.discoveryDirection
                ){

                    return (
                        `Discovery tamamlandı. Başlangıç yönü: ${summary.discoveryDirection}.`
                    );

                }


                return (
                    "Discovery tamamlandı ve Engine bağlamına işlendi."
                );

            }


            return (
                "Discovery henüz tamamlanmış görünmüyor."
            );

        }


        /* -------------------------------------------------
           SYSTEM HEALTH
        ------------------------------------------------- */

        if(
            this.includesAny(
                normalized,
                [
                    "organ",
                    "organlar",
                    "sistem durumu",
                    "engine health",
                    "health",
                    "kernel",
                    "runtime",
                    "guvenlik"
                ]
            )
        ){

            const parts =
                [];


            if(
                summary.kernelStatus
            ){

                parts.push(
                    `Kernel: ${summary.kernelStatus}`
                );

            }


            if(
                summary.runtimeStatus
            ){

                parts.push(
                    `Runtime: ${summary.runtimeStatus}`
                );

            }


            if(
                summary.organStatus
            ){

                parts.push(
                    `Organlar: ${summary.organStatus}`
                );

            }


            parts.push(
                `Security ready: ${
                    summary.securityReady
                        ? "evet"
                        : "hayır"
                }`
            );


            return (
                parts.join(
                    ", "
                ) +
                "."
            );

        }


        /* -------------------------------------------------
           MEMORY
        ------------------------------------------------- */

        if(
            this.includesAny(
                normalized,
                [
                    "hafiza",
                    "memory",
                    "hatira",
                    "kayit"
                ]
            )
        ){

            return (
                `Aktif Entity bağlamında ${summary.memoryTotal} Memory kaydı görünüyor.`
            );

        }


        /* -------------------------------------------------
           TIMELINE
        ------------------------------------------------- */

        if(
            this.includesAny(
                normalized,
                [
                    "timeline",
                    "zaman cizelgesi",
                    "gecmis"
                ]
            )
        ){

            return (
                `Aktif Entity bağlamında ${summary.timelineTotal} Timeline olayı görünüyor.`
            );

        }


        /* -------------------------------------------------
           BRIDGE
        ------------------------------------------------- */

        if(
            this.includesAny(
                normalized,
                [
                    "bridge",
                    "kopru",
                    "baglanti",
                    "baglantilar"
                ]
            )
        ){

            return (
                `Aktif Entity bağlamında ${summary.bridgeTotal} Bridge bağlantısı görünüyor.`
            );

        }


        /* -------------------------------------------------
           EVOLUTION
        ------------------------------------------------- */

        if(
            this.includesAny(
                normalized,
                [
                    "evolution",
                    "evrim",
                    "gelisim"
                ]
            )
        ){

            return (
                `Aktif Entity bağlamında ${summary.evolutionTotal} Evolution olayı görünüyor.`
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
                "VAERO Brain'in yerel fallback provider'ıyım. Engine contextini okuyabilir, route ve policy sonuçlarını yansıtabilir ve desteklenen yerel sistem bilgilerini açıklayabilirim. Dış AI provider bağlı değilse genel bilgi üretmem."
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


        const parts =
            [];


        if(summary.app){

            parts.push(
                `${summary.app} bağlamı`
            );

        }


        if(summary.entityName){

            parts.push(
                `Entity: ${summary.entityName}`
            );

        }


        if(summary.worldName){

            parts.push(
                `World: ${summary.worldName}`
            );

        }


        if(parts.length > 0){

            return (
                `${parts.join(", ")}. ` +
                "Yerel fallback provider olarak bu bağlamdaki desteklenen Engine işlemlerini ve mevcut sistem durumunu yansıtabilirim."
            );

        }


        return (
            "VAERO Local Brain aktif. Yerel Engine bağlamını ve desteklenen işlem sonuçlarını yansıtabilirim."
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
         * 1. Route / Policy sonucu her şeyden önce gelir.
         */

        const routeReply =
            this.getRouteReply(
                context
            );


        if(routeReply){

            return routeReply;

        }


        /*
         * 2. Yerel Engine bilgisinden desteklenen cevap.
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
         * 3. Local provider bilmediği konuda uydurmaz.
         */

        return (
            "Bu istek için yerel Engine bağlamında yeterli bilgi yok. Dış AI provider bağlı değilse bu konuda genel cevap üretemem."
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

            type:
                this.type,

            local:
                true,

            externalAI:
                false,

            contextual:
                true,

            fallback:
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

            fallback:
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
                "organ.context",
                "kernel.context",
                "runtime.context",
                "memory.context",
                "timeline.context",
                "bridge.context",
                "evolution.context"

            ]

        };

    }

};


/* =========================================================
   REGISTER
========================================================= */

try{

    const brainCore =
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.get ===
            "function"
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

                fallback:
                    true,

                externalAI:
                    false,

                capabilities:
                    [
                        ...BrainProvider
                            .status()
                            .capabilities
                    ]

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


/* =========================================================
   GLOBAL
========================================================= */

if(
    typeof window !==
        "undefined"
){

    window.BrainProvider =
        BrainProvider;

}
