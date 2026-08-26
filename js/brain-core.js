/* =========================================================
   VAERO BRAIN CORE
   Analysis / Policy / Confirmation / Execution / Provider
========================================================= */

const BrainCore = {

    provider:
        null,

    providerMeta:
        null,

    lastAnalysis:
        null,

    lastRoute:
        null,

    lastResponse:
        null,

    requestSequence:
        0,

    pendingConfirmations:
        new Map(),

    confirmationTTL:
        120000,

    providerTimeout:
        20000,

    maxContextDepth:
        4,

    maxContextArray:
        50,


    /* =====================================================
       SERVICE ACCESS
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !==
                    "function"
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


    getEngine(){

        try{

            return (
                VAERO?.engine ||
                window.Engine ||
                null
            );

        } catch(error){

            return (
                window.Engine ||
                null
            );

        }

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(prefix = "brain"){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID ===
                "function"
        ){

            return crypto.randomUUID();

        }


        return `${prefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       SAFE CLONE
    ===================================================== */

    clone(value){

        if(
            value === null ||
            value === undefined
        ){
            return value;
        }


        try{

            if(
                typeof structuredClone ===
                    "function"
            ){

                return structuredClone(
                    value
                );

            }

        } catch(error){

            /* JSON fallback */
        }


        try{

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       SAFE CONTEXT
    ===================================================== */

    sanitizeValue(
        value,
        depth = 0,
        seen = new WeakSet()
    ){

        if(
            value === null ||
            value === undefined
        ){
            return value;
        }


        if(
            depth >
            this.maxContextDepth
        ){
            return "[depth-limit]";
        }


        if(
            typeof value ===
                "string"
        ){

            return value.slice(
                0,
                4000
            );

        }


        if(
            typeof value === "number" ||
            typeof value === "boolean"
        ){

            return value;

        }


        if(
            typeof value ===
                "function"
        ){

            return undefined;

        }


        if(
            Array.isArray(
                value
            )
        ){

            return value
                .slice(
                    0,
                    this.maxContextArray
                )
                .map(
                    item =>
                        this.sanitizeValue(
                            item,
                            depth + 1,
                            seen
                        )
                );

        }


        if(
            typeof value ===
                "object"
        ){

            try{

                if(
                    seen.has(
                        value
                    )
                ){

                    return "[circular]";

                }


                seen.add(
                    value
                );

            } catch(error){

                return null;

            }


            const output = {};


            Object.entries(
                value
            )
                .slice(
                    0,
                    100
                )
                .forEach(
                    ([key,item]) => {

                        /*
                         * Provider / history context içine
                         * açık credential benzeri alanlar
                         * taşınmaz.
                         */

                        const normalizedKey =
                            String(
                                key
                            )
                                .trim()
                                .toLowerCase();


                        const blockedKeys =
                            new Set([
                                "password",
                                "passphrase",
                                "secret",
                                "token",
                                "accesstoken",
                                "refreshtoken",
                                "authorization",
                                "apikey",
                                "api_key",
                                "privatekey",
                                "private_key",
                                "cardnumber",
                                "cvv"
                            ]);


                        if(
                            blockedKeys.has(
                                normalizedKey
                            )
                        ){

                            output[key] =
                                "[redacted]";

                            return;

                        }


                        const sanitized =
                            this.sanitizeValue(
                                item,
                                depth + 1,
                                seen
                            );


                        if(
                            sanitized !==
                                undefined
                        ){

                            output[key] =
                                sanitized;

                        }

                    }
                );


            return output;

        }


        return String(
            value
        );

    },


    sanitizeContext(context){

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


        return (
            this.sanitizeValue(
                context
            ) ||
            {}
        );

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

            version:
                meta.version ||
                null,

            capabilities:
                Array.isArray(
                    meta.capabilities
                )
                    ? [
                        ...meta.capabilities
                    ]
                    : [],

            registeredAt:
                Date.now(),

            ...meta

        };


        this.emit(
            "brain:provider:registered",
            {
                provider:
                    this.getProviderInfo(),

                time:
                    Date.now()
            }
        );


        return true;

    },


    unregister(){

        const previous =
            this.getProviderInfo();


        this.provider =
            null;

        this.providerMeta =
            null;


        this.emit(
            "brain:provider:unregistered",
            {
                provider:
                    previous,

                time:
                    Date.now()
            }
        );


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

        if(
            !this.hasProvider()
        ){
            return null;
        }


        return {

            ...(
                this.providerMeta ||
                {}
            ),

            available:
                true

        };

    },


    /* =====================================================
       EVENTS
    ===================================================== */

    emit(
        eventName,
        payload = {}
    ){

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    eventName,
                    payload
                );


                return true;

            }


            const events =
                this.getService(
                    "events"
                );


            if(
                events &&
                typeof events.emit ===
                    "function"
            ){

                events.emit(
                    eventName,
                    payload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `BrainCore event gönderilemedi: ${eventName}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       PROMPT
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


    /* =====================================================
       INTENT FINGERPRINT
    ===================================================== */

    createIntentFingerprint(
        intent = {},
        context = {}
    ){

        const entityId =
            context?.entity?.id ||
            context?.entityId ||
            null;


        const worldId =
            context?.world?.id ||
            context?.worldId ||
            null;


        return [
            intent.type ||
                "unknown",

            intent.target ||
                "unknown",

            intent.operation ||
                "general",

            entityId ||
                "no-entity",

            worldId ||
                "no-world"
        ].join(
            "::"
        );

    },


    /* =====================================================
       CONFIRMATION
    ===================================================== */

    cleanExpiredConfirmations(){

        const now =
            Date.now();


        this.pendingConfirmations
            .forEach(
                (
                    confirmation,
                    id
                ) => {

                    if(
                        !confirmation ||
                        confirmation.expiresAt <=
                            now ||
                        confirmation.used ===
                            true
                    ){

                        this.pendingConfirmations
                            .delete(
                                id
                            );

                    }

                }
            );


        return true;

    },


    createConfirmation(
        analysis
    ){

        this.cleanExpiredConfirmations();


        const id =
            this.createId(
                "confirm"
            );


        const now =
            Date.now();


        const confirmation = {

            id,

            fingerprint:
                this.createIntentFingerprint(
                    analysis.intent,
                    analysis.context
                ),

            intent:
                this.clone(
                    analysis.intent
                ),

            actionType:
                analysis.policy
                    ?.actionType ||
                null,

            createdAt:
                now,

            expiresAt:
                now +
                this.confirmationTTL,

            used:
                false

        };


        this.pendingConfirmations.set(
            id,
            confirmation
        );


        this.emit(
            "brain:confirmation:required",
            {
                confirmationId:
                    id,

                intent:
                    confirmation.intent,

                actionType:
                    confirmation.actionType,

                expiresAt:
                    confirmation.expiresAt
            }
        );


        return this.clone(
            confirmation
        );

    },


    getConfirmation(id){

        this.cleanExpiredConfirmations();


        const confirmation =
            this.pendingConfirmations.get(
                String(
                    id ||
                    ""
                )
            );


        return confirmation
            ? this.clone(
                confirmation
            )
            : null;

    },


    consumeConfirmation(
        id,
        analysis
    ){

        this.cleanExpiredConfirmations();


        const confirmation =
            this.pendingConfirmations.get(
                String(
                    id ||
                    ""
                )
            );


        if(
            !confirmation ||
            confirmation.used ===
                true
        ){
            return false;
        }


        const fingerprint =
            this.createIntentFingerprint(
                analysis.intent,
                analysis.context
            );


        if(
            confirmation.fingerprint !==
                fingerprint
        ){

            return false;

        }


        if(
            confirmation.expiresAt <=
                Date.now()
        ){

            this.pendingConfirmations
                .delete(
                    confirmation.id
                );


            return false;

        }


        confirmation.used =
            true;


        this.pendingConfirmations.delete(
            confirmation.id
        );


        this.emit(
            "brain:confirmation:consumed",
            {
                confirmationId:
                    confirmation.id,

                fingerprint,

                time:
                    Date.now()
            }
        );


        return true;

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
            this.sanitizeContext(
                context
            );


        const intentService =
            this.getService(
                "brainIntent"
            );


        const policyService =
            this.getService(
                "brainActionPolicy"
            );


        let intent = {

            type:
                "chat",

            target:
                null,

            operation:
                "general",

            confidence:
                0,

            explicit:
                false

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

            allowed:
                false,

            requiresConfirmation:
                false,

            blocked:
                false,

            executable:
                false,

            actionType:
                null,

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

            fingerprint:
                this.createIntentFingerprint(
                    intent,
                    safeContext
                ),

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


        let confirmationApproved =
            false;


        let confirmationMode =
            null;


        /*
         * Yeni güvenli yol:
         * options.confirmationId
         */

        if(
            options.confirmationId
        ){

            confirmationApproved =
                this.consumeConfirmation(
                    options.confirmationId,
                    analysis
                );


            confirmationMode =
                confirmationApproved
                    ? "bound-confirmation"
                    : "invalid-confirmation";

        }


        /*
         * Legacy compatibility.
         *
         * brain-action-policy ve UI confirmation flow
         * güncellendiğinde bu yol kaldırılabilir.
         */

        if(
            !confirmationApproved &&
            options.confirmed ===
                true
        ){

            confirmationApproved =
                true;


            confirmationMode =
                "legacy-boolean";

        }


        const actionService =
            this.getService(
                "brainActions"
            );


        let confirmation =
            null;


        if(
            analysis.policy
                ?.requiresConfirmation &&
            !confirmationApproved
        ){

            confirmation =
                this.createConfirmation(
                    analysis
                );

        }


        let executed =
            false;


        let actionResult =
            null;


        let executionReason =
            null;


        const canExecute =
            Boolean(

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
                                confirmationApproved,

                            confirmationId:
                                options.confirmationId ||
                                null,

                            confirmationMode
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
                        Boolean(
                            result
                        );


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

                    success:
                        false,

                    executed:
                        false,

                    error:
                        true,

                    message:
                        "Brain aksiyonu yürütülemedi."

                };


                executionReason =
                    error?.message ||
                    "action-execution-error";

            }

        } else {

            if(
                analysis.policy
                    ?.blocked
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
            else if(
                !shouldExecute
            ){

                executionReason =
                    "Execution devre dışı.";

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

            confirmationMode,

            confirmation,

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


        this.emit(
            "brain:routed",
            {
                intent:
                    routeResult.intent,

                executed:
                    routeResult.executed,

                blocked:
                    routeResult.blocked,

                requiresConfirmation:
                    routeResult
                        .requiresConfirmation,

                confirmationApproved:
                    routeResult
                        .confirmationApproved,

                time:
                    routeResult.routedAt
            }
        );


        return routeResult;

    },

   /* =====================================================
       PROVIDER CONTEXT
    ===================================================== */

    buildProviderContext(
        routeResult,
        requestId
    ){

        return this.sanitizeContext({

            ...routeResult.context,

            brain:{

                requestId,

                intent:
                    routeResult.intent,

                policy:{

                    allowed:
                        Boolean(
                            routeResult.policy
                                ?.allowed
                        ),

                    executable:
                        Boolean(
                            routeResult.policy
                                ?.executable
                        ),

                    blocked:
                        Boolean(
                            routeResult.policy
                                ?.blocked
                        ),

                    requiresConfirmation:
                        Boolean(
                            routeResult.policy
                                ?.requiresConfirmation
                        ),

                    actionType:
                        routeResult.policy
                            ?.actionType ||
                        null,

                    reason:
                        routeResult.policy
                            ?.reason ||
                        null
                },

                executed:
                    routeResult.executed,

                actionResult:
                    routeResult.actionResult,

                requiresConfirmation:
                    routeResult
                        .requiresConfirmation,

                confirmationApproved:
                    routeResult
                        .confirmationApproved,

                blocked:
                    routeResult.blocked

            }

        });

    },


    /* =====================================================
       PROVIDER TIMEOUT
    ===================================================== */

    async callProvider(
        prompt,
        context,
        options = {}
    ){

        if(
            !this.hasProvider()
        ){

            throw new Error(
                "brain-provider-unavailable"
            );

        }


        const timeout =
            Math.max(
                1000,
                Math.min(
                    60000,
                    Number(
                        options.providerTimeout ||
                        this.providerTimeout
                    ) ||
                    this.providerTimeout
                )
            );


        let timer =
            null;


        try{

            const providerPromise =
                Promise.resolve(
                    this.provider.ask(
                        prompt,
                        context,
                        options
                    )
                );


            const timeoutPromise =
                new Promise(
                    (
                        resolve,
                        reject
                    ) => {

                        timer =
                            window.setTimeout(
                                () => {

                                    reject(
                                        new Error(
                                            "brain-provider-timeout"
                                        )
                                    );

                                },
                                timeout
                            );

                    }
                );


            return await Promise.race([
                providerPromise,
                timeoutPromise
            ]);

        } finally {

            if(timer){

                window.clearTimeout(
                    timer
                );

            }

        }

    },


    /* =====================================================
       LOCAL FALLBACK REPLY
    ===================================================== */

    createLocalRouteReply(
        routeResult
    ){

        if(
            routeResult.executed
        ){

            return (
                routeResult
                    .actionResult
                    ?.message ||
                "İşlem tamamlandı."
            );

        }


        if(
            routeResult
                .requiresConfirmation &&
            !routeResult
                .confirmationApproved
        ){

            return (
                routeResult.policy
                    ?.reason ||
                "Bu işlem devam etmeden önce onayını gerektiriyor."
            );

        }


        if(
            routeResult.blocked
        ){

            return (
                routeResult.policy
                    ?.reason ||
                routeResult.executionReason ||
                "Bu işlem gerçekleştirilemiyor."
            );

        }


        if(
            routeResult.executionReason
        ){

            return routeResult
                .executionReason;

        }


        return (
            "Brain provider henüz bağlı değil."
        );

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

                error:
                    false,

                empty:
                    true,

                executed:
                    false,

                actionResult:
                    null,

                requiresConfirmation:
                    false,

                confirmation:
                    null,

                blocked:
                    false,

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

           Provider yokluğu Action yürütülmesini engellemez.
           Brain local Engine coordinator olarak çalışmaya
           devam eder.
        ================================================= */

        if(
            !this.hasProvider()
        ){

            const result = {

                ...routeResult,

                requestId,

                reply:
                    this.createLocalRouteReply(
                        routeResult
                    ),

                provider:
                    null,

                providerAvailable:
                    false,

                local:
                    true,

                error:
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

           Provider yalnız language/reasoning response
           üretir.

           Engine action authority:
           Intent → Policy → BrainActions zincirindedir.
        ================================================= */

        try{

            const providerContext =
                this.buildProviderContext(
                    routeResult,
                    requestId
                );


            const providerResult =
                await this.callProvider(
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

                this.createLocalRouteReply(
                    routeResult
                ) ||

                "Brain yanıt üretemedi.";


            /*
             * Provider şu authority alanlarını
             * overwrite edemez:
             *
             * intent
             * policy
             * executed
             * blocked
             * confirmation
             * actionResult
             *
             * Spread sırası bu nedenle önemlidir.
             */

            const result = {

                ...providerPayload,

                ...routeResult,

                requestId,

                reply:
                    String(
                        reply
                    ),

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


            this.emit(
                "brain:response",
                {
                    requestId,

                    provider:
                        result.provider
                            ?.id ||
                        null,

                    executed:
                        result.executed,

                    blocked:
                        result.blocked,

                    requiresConfirmation:
                        result
                            .requiresConfirmation,

                    error:
                        result.error,

                    time:
                        result.respondedAt
                }
            );


            return result;

        } catch(error){

            console.error(
                "Brain provider error:",
                error
            );


            const providerError =
                error?.message ||
                String(
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
                            "İşlem tamamlandı ancak Brain provider yanıtı alınamadı."
                        )
                        : routeResult
                            .requiresConfirmation &&
                          !routeResult
                              .confirmationApproved
                            ? (
                                routeResult.policy
                                    ?.reason ||
                                "Bu işlem onayını gerektiriyor."
                            )
                            : routeResult.blocked
                                ? (
                                    routeResult.policy
                                        ?.reason ||
                                    "Bu işlem gerçekleştirilemiyor."
                                )
                                : providerError ===
                                    "brain-provider-timeout"
                                    ? "Brain provider zaman aşımına uğradı. Yerel Engine katmanı çalışmaya devam ediyor."
                                    : "Brain provider şu anda yanıt veremiyor.",

                provider:
                    this.getProviderInfo(),

                providerAvailable:
                    true,

                localFallback:
                    true,

                error:
                    true,

                providerError,

                respondedAt:
                    Date.now()

            };


            this.lastResponse =
                result;


            this.emit(
                "brain:provider:error",
                {
                    requestId,

                    provider:
                        result.provider
                            ?.id ||
                        null,

                    error:
                        providerError,

                    time:
                        result.respondedAt
                }
            );


            return result;

        }

    },


    /* =====================================================
       CONFIRM ACTION API
    ===================================================== */

    confirm(
        confirmationId,
        prompt,
        context = {},
        options = {}
    ){

        if(
            !confirmationId
        ){
            return null;
        }


        return this.route(
            prompt,
            context,
            {
                ...options,

                execute:
                    true,

                confirmationId
            }
        );

    },


    /* =====================================================
       CANCEL CONFIRMATION
    ===================================================== */

    cancelConfirmation(
        confirmationId
    ){

        const id =
            String(
                confirmationId ||
                ""
            );


        if(
            !this.pendingConfirmations.has(
                id
            )
        ){
            return false;
        }


        this.pendingConfirmations.delete(
            id
        );


        this.emit(
            "brain:confirmation:cancelled",
            {
                confirmationId:
                    id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       STATUS
    ===================================================== */

    status(){

        this.cleanExpiredConfirmations();


        return {

            providerConnected:
                this.hasProvider(),

            provider:
                this.getProviderInfo(),

            requestSequence:
                this.requestSequence,

            pendingConfirmations:
                this.pendingConfirmations
                    .size,

            confirmationTTL:
                this.confirmationTTL,

            providerTimeout:
                this.providerTimeout,

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
       REPORT
    ===================================================== */

    report(){

        const status =
            this.status();


        return {

            ...status,

            services:{

                intent:
                    Boolean(
                        this.getService(
                            "brainIntent"
                        )
                    ),

                policy:
                    Boolean(
                        this.getService(
                            "brainActionPolicy"
                        )
                    ),

                actions:
                    Boolean(
                        this.getService(
                            "brainActions"
                        )
                    ),

                context:
                    Boolean(
                        this.getService(
                            "brainContext"
                        )
                    ),

                provider:
                    status
                        .providerConnected
            }

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


        this.pendingConfirmations
            .clear();


        return true;

    }

};


VAERO.register(
    "brainCore",
    BrainCore
);


window.BrainCore =
    BrainCore;
