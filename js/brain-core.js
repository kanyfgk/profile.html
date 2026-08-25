/* =========================================================
   VAERO BRAIN CORE
   Analysis / Routing / Provider Orchestration
========================================================= */

const BrainCore = {

    provider: null,

    providerMeta: null,

    lastAnalysis: null,

    lastRoute: null,

    lastResponse: null,

    requestSequence: 0,


    /* =====================================================
       SERVICE ACCESS
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
            ){
                return null;
            }

            return (
                VAERO.get(name) ||
                null
            );

        } catch(error){

            console.warn(
                `Brain service okunamadı: ${name}`,
                error
            );

            return null;

        }

    },


    /* =====================================================
       PROVIDER
    ===================================================== */

    register(
        provider,
        meta = {}
    ){

        if(
            !provider ||
            typeof provider.ask !==
                "function"
        ){

            console.error(
                "Brain provider kaydedilemedi: ask() fonksiyonu eksik."
            );

            return false;

        }


        this.provider =
            provider;


        this.providerMeta = {

            id:
                String(
                    meta.id ||
                    provider.id ||
                    provider.name ||
                    "brain-provider"
                ),

            name:
                String(
                    meta.name ||
                    provider.name ||
                    "Brain Provider"
                ),

            registeredAt:
                Date.now(),

            ...meta

        };


        return true;

    },


    unregister(){

        this.provider =
            null;

        this.providerMeta =
            null;

        return true;

    },


    hasProvider(){

        return Boolean(
            this.provider &&
            typeof this.provider.ask ===
                "function"
        );

    },


    getProviderInfo(){

        if(!this.hasProvider()){
            return null;
        }


        return {

            ...(this.providerMeta || {}),

            available:
                true

        };

    },


    /* =====================================================
       PROMPT
    ===================================================== */

    normalizePrompt(prompt){

        return String(
            prompt ?? ""
        ).trim();

    },


    /* =====================================================
       ANALYSIS
    ===================================================== */

    analyze(
        prompt,
        context = {}
    ){

        const normalizedPrompt =
            this.normalizePrompt(
                prompt
            );


        const safeContext =
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(context)
                ? context
                : {};


        const intentService =
            this.getService(
                "brainIntent"
            );


        const policyService =
            this.getService(
                "brainActionPolicy"
            );


        let intent = {

            type:"chat",

            target:null,

            operation:
                "general",

            confidence:0,

            explicit:false

        };


        if(
            normalizedPrompt &&
            intentService &&
            typeof intentService.detect ===
                "function"
        ){

            try{

                intent =
                    intentService.detect(
                        normalizedPrompt,
                        safeContext
                    ) ||
                    intent;

            } catch(error){

                console.warn(
                    "Brain intent analizi başarısız:",
                    error
                );

            }

        }


        let policy = {

            allowed:false,

            requiresConfirmation:false,

            blocked:false,

            executable:false,

            actionType:null,

            reason:
                "Action Policy bulunamadı."

        };


        if(
            policyService &&
            typeof policyService.evaluateIntent ===
                "function"
        ){

            try{

                policy =
                    policyService.evaluateIntent(
                        intent,
                        safeContext
                    ) ||
                    policy;

            } catch(error){

                console.warn(
                    "Brain action policy değerlendirilemedi:",
                    error
                );

            }

        }


        const analysis = {

            prompt:
                normalizedPrompt,

            context:
                safeContext,

            intent,

            policy,

            analyzedAt:
                Date.now()

        };


        this.lastAnalysis =
            analysis;


        return analysis;

    },


    /* =====================================================
       ROUTE
    ===================================================== */

    route(
        prompt,
        context = {},
        options = {}
    ){

        const analysis =
            this.analyze(
                prompt,
                context
            );


        const shouldExecute =
            options.execute !==
            false;


        const confirmationApproved =
            options.confirmed ===
            true;


        const actionService =
            this.getService(
                "brainActions"
            );


        let executed =
            false;

        let actionResult =
            null;

        let executionReason =
            null;


        const canExecute = Boolean(

            shouldExecute &&

            analysis.policy &&

            analysis.policy.allowed &&

            analysis.policy.executable &&

            !analysis.policy.blocked &&

            (
                !analysis.policy
                    .requiresConfirmation ||
                confirmationApproved
            ) &&

            actionService &&

            typeof actionService.execute ===
                "function"

        );


        if(canExecute){

            try{

                const result =
                    actionService.execute(
                        analysis.intent,
                        {
                            ...analysis.context,

                            message:
                                analysis.prompt,

                            confirmed:
                                confirmationApproved
                        }
                    );


                if(
                    result &&
                    typeof result ===
                        "object"
                ){

                    actionResult =
                        result;

                    executed =
                        result.executed !==
                        false;

                } else {

                    executed =
                        Boolean(result);

                    actionResult =
                        actionService.lastResult ||
                        null;

                }

            } catch(error){

                console.error(
                    "Brain action execution error:",
                    error
                );


                executed =
                    false;


                actionResult = {

                    success:false,

                    error:true,

                    message:
                        "Brain aksiyonu yürütülemedi."

                };

            }

        } else {

            if(
                analysis.policy?.blocked
            ){

                executionReason =
                    analysis.policy.reason ||
                    "Aksiyon policy tarafından engellendi.";

            }
            else if(
                analysis.policy
                    ?.requiresConfirmation &&
                !confirmationApproved
            ){

                executionReason =
                    "Kullanıcı onayı gerekiyor.";

            }
            else if(
                !analysis.policy
                    ?.allowed
            ){

                executionReason =
                    analysis.policy?.reason ||
                    "Aksiyona izin verilmedi.";

            }
            else if(
                !analysis.policy
                    ?.executable
            ){

                executionReason =
                    "Intent yürütülebilir bir aksiyon değil.";

            }
            else if(
                !actionService
            ){

                executionReason =
                    "Brain Actions servisi bulunamadı.";

            }

        }


        const routeResult = {

            ...analysis,

            executed:
                Boolean(
                    executed
                ),

            actionResult,

            executionReason,

            requiresConfirmation:
                Boolean(
                    analysis.policy
                        ?.requiresConfirmation
                ),

            confirmationApproved,

            blocked:
                Boolean(
                    analysis.policy
                        ?.blocked
                ),

            routedAt:
                Date.now()

        };


        this.lastRoute =
            routeResult;


        return routeResult;

    },


    /* =====================================================
       PROVIDER REQUEST
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


        if(!normalizedPrompt){

            const emptyResult = {

                reply:
                    "Ne yapmak istediğini yazabilirsin.",

                error:false,

                empty:true,

                executed:false,

                actionResult:null,

                requiresConfirmation:
                    false,

                blocked:false,

                respondedAt:
                    Date.now()

            };


            this.lastResponse =
                emptyResult;


            return emptyResult;

        }


        const requestId =
            ++this.requestSequence;


        const routeResult =
            this.route(
                normalizedPrompt,
                context,
                options
            );


        /* =================================================
           NO PROVIDER
        ================================================= */

        if(!this.hasProvider()){

            const result = {

                ...routeResult,

                requestId,

                reply:
                    routeResult.executed
                        ? (
                            routeResult
                                .actionResult
                                ?.message ||
                            "İşlem tamamlandı."
                        )
                        : routeResult
                            .requiresConfirmation &&
                          !routeResult
                              .confirmationApproved
                            ? "Bu işlem devam etmeden önce onayını gerektiriyor."
                            : routeResult.blocked
                                ? (
                                    routeResult
                                        .policy
                                        ?.reason ||
                                    "Bu işlem gerçekleştirilemiyor."
                                )
                                : "Brain provider henüz bağlı değil.",

                provider:
                    null,

                providerAvailable:
                    false,

                respondedAt:
                    Date.now()

            };


            this.lastResponse =
                result;


            return result;

        }


        /* =================================================
           PROVIDER
        ================================================= */

        try{

            const providerContext = {

                ...routeResult.context,

                brain: {

                    requestId,

                    intent:
                        routeResult.intent,

                    policy:
                        routeResult.policy,

                    executed:
                        routeResult.executed,

                    actionResult:
                        routeResult.actionResult,

                    requiresConfirmation:
                        routeResult
                            .requiresConfirmation,

                    blocked:
                        routeResult.blocked

                }

            };


            const providerResult =
                await this.provider.ask(
                    normalizedPrompt,
                    providerContext,
                    options
                );


            let providerPayload =
                {};


            if(
                typeof providerResult ===
                    "string"
            ){

                providerPayload = {

                    reply:
                        providerResult

                };

            }
            else if(
                providerResult &&
                typeof providerResult ===
                    "object"
            ){

                providerPayload = {

                    ...providerResult

                };

            }


            const reply =

                providerPayload.reply ||

                providerPayload.message ||

                providerPayload.text ||

                (
                    routeResult.executed
                        ? routeResult
                            .actionResult
                            ?.message
                        : null
                ) ||

                "Brain yanıt üretemedi.";


            /*
             * Route sonucu provider tarafından ezilemez.
             * Provider yalnız kendi payload'ını ekler.
             */

            const result = {

                ...providerPayload,

                ...routeResult,

                requestId,

                reply:
                    String(reply),

                provider:
                    this.getProviderInfo(),

                providerAvailable:
                    true,

                error:
                    Boolean(
                        providerPayload.error
                    ),

                respondedAt:
                    Date.now()

            };


            this.lastResponse =
                result;


            return result;


        } catch(error){

            console.error(
                "Brain provider error:",
                error
            );


            const result = {

                ...routeResult,

                requestId,

                reply:
                    routeResult.executed
                        ? (
                            routeResult
                                .actionResult
                                ?.message ||
                            "İşlem tamamlandı ancak Brain yanıtı alınamadı."
                        )
                        : "Brain provider şu anda yanıt veremiyor.",

                provider:
                    this.getProviderInfo(),

                providerAvailable:
                    true,

                error:true,

                providerError:
                    error?.message ||
                    String(error),

                respondedAt:
                    Date.now()

            };


            this.lastResponse =
                result;


            return result;

        }

    },


    /* =====================================================
       STATUS
    ===================================================== */

    status(){

        return {

            providerConnected:
                this.hasProvider(),

            provider:
                this.getProviderInfo(),

            requestSequence:
                this.requestSequence,

            hasLastAnalysis:
                Boolean(
                    this.lastAnalysis
                ),

            hasLastRoute:
                Boolean(
                    this.lastRoute
                ),

            hasLastResponse:
                Boolean(
                    this.lastResponse
                )

        };

    },


    /* =====================================================
       RESET RUNTIME
    ===================================================== */

    resetRuntime(){

        this.lastAnalysis =
            null;

        this.lastRoute =
            null;

        this.lastResponse =
            null;

        this.requestSequence =
            0;

        return true;

    }

};


VAERO.register(
    "brainCore",
    BrainCore
);


window.BrainCore =
    BrainCore;
