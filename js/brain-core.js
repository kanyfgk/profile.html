/* =========================================================
   VAERO BRAIN CORE
   Analysis / Policy / Confirmation / Execution / Provider
========================================================= */

const BrainCore = {

    version:
        "3.0.0",

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

    maxContextKeys:
        100,

    maxPromptLength:
        8000,


    /* =====================================================
       SERVICE ACCESS
    ===================================================== */

    getService(name){

        const serviceName =
            String(
                name ??
                ""
            ).trim();


        if(!serviceName){

            return null;

        }


        try{

            if(
                typeof VAERO ===
                    "undefined" ||
                typeof VAERO.get !==
                    "function"
            ){

                return null;

            }


            return (
                VAERO.get(
                    serviceName
                ) ||
                null
            );

        } catch(error){

            console.warn(
                `Brain service okunamadı: ${serviceName}`,
                error
            );


            return null;

        }

    },


    getEngine(){

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                VAERO.engine
            ){

                return VAERO.engine;

            }

        } catch(error){

            /* fallback below */

        }


        if(
            typeof window !==
                "undefined" &&
            window.Engine
        ){

            return window.Engine;

        }


        return null;

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(prefix = "brain"){

        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){

                return crypto.randomUUID();

            }

        } catch(error){

            /* fallback */

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
            value ===
                null ||
            value ===
                undefined
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
            value ===
                null ||
            value ===
                undefined
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
            typeof value ===
                "number"
        ){

            return Number.isFinite(
                value
            )
                ? value
                : null;

        }


        if(
            typeof value ===
                "boolean"
        ){

            return value;

        }


        if(
            typeof value ===
                "bigint"
        ){

            return String(
                value
            );

        }


        if(
            typeof value ===
                "function" ||
            typeof value ===
                "symbol"
        ){

            return undefined;

        }


        if(
            value instanceof Date
        ){

            const timestamp =
                value.getTime();


            return Number.isFinite(
                timestamp
            )
                ? value.toISOString()
                : null;

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
                )
                .filter(
                    item =>
                        item !==
                            undefined
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


            const blockedKeys =
                new Set([

                    "password",
                    "passphrase",
                    "secret",
                    "clientsecret",
                    "client_secret",
                    "token",
                    "idtoken",
                    "id_token",
                    "accesstoken",
                    "access_token",
                    "refreshtoken",
                    "refresh_token",
                    "authorization",
                    "apikey",
                    "api_key",
                    "privatekey",
                    "private_key",
                    "cardnumber",
                    "card_number",
                    "cvv",
                    "cvc",
                    "pin"

                ]);


            const output =
                {};


            Object.entries(
                value
            )
                .slice(
                    0,
                    this.maxContextKeys
                )
                .forEach(
                    (
                        [
                            key,
                            item
                        ]
                    ) => {

                        const normalizedKey =
                            String(
                                key
                            )
                                .trim()
                                .toLowerCase()
                                .replace(
                                    /[\s-]/g,
                                    ""
                                );


                        if(
                            blockedKeys.has(
                                normalizedKey
                            )
                        ){

                            output[
                                key
                            ] =
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

                            output[
                                key
                            ] =
                                sanitized;

                        }

                    }
                );


            return output;

        }


        return String(
            value
        ).slice(
            0,
            4000
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


        const sanitized =
            this.sanitizeValue(
                context
            );


        return (
            sanitized &&
            typeof sanitized ===
                "object" &&
            !Array.isArray(
                sanitized
            )
                ? sanitized
                : {}
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


        const now =
            Date.now();


        const capabilities =
            Array.isArray(
                meta.capabilities
            )
                ? [
                    ...new Set(
                        meta.capabilities
                            .map(
                                item =>
                                    String(
                                        item ??
                                            ""
                                    )
                                        .trim()
                            )
                            .filter(
                                Boolean
                            )
                    )
                ]
                : [];


        this.provider =
            provider;


        this.providerMeta = {

            id:
                String(
                    meta.id ||
                    provider.id ||
                    provider.name ||
                    "brain-provider"
                )
                    .trim()
                    .slice(
                        0,
                        240
                    ),

            name:
                String(
                    meta.name ||
                    provider.name ||
                    "Brain Provider"
                )
                    .trim()
                    .slice(
                        0,
                        240
                    ),

            version:
                meta.version ||
                provider.version ||
                null,

            type:
                meta.type ||
                provider.type ||
                null,

            local:
                meta.local ===
                    true ||
                provider.local ===
                    true,

            fallback:
                meta.fallback ===
                    true,

            externalAI:
                meta.externalAI ===
                    true ||
                provider.externalAI ===
                    true,

            capabilities,

            registeredAt:
                now

        };


        this.emit(
            "brain:provider:registered",
            {
                provider:
                    this.getProviderInfo(),

                time:
                    now
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

        const name =
            String(
                eventName ??
                    ""
            ).trim();


        if(!name){

            return false;

        }


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    name,
                    payload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `BrainCore event gönderilemedi: ${name}`,
                error
            );

        }


        try{

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
                    name,
                    payload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `BrainCore event fallback gönderilemedi: ${name}`,
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
            prompt ??
                ""
        )
            .trim()
            .slice(
                0,
                this.maxPromptLength
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


        const safeIntent =
            this.sanitizeValue(
                intent
            ) ||
            {};


        const intentFingerprint =
            Object.keys(
                safeIntent
            )
                .sort()
                .map(
                    key =>
                        `${key}=${JSON.stringify(safeIntent[key])}`
                )
                .join("&");


        return [
            String(
                entityId ||
                "no-entity"
            ),

            String(
                worldId ||
                "no-world"
            ),

            intentFingerprint
        ].join(
            "::"
        );

    },

    /* =====================================================
       CONFIRMATION CLEANUP
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
                        confirmation.used ===
                            true ||
                        Number(
                            confirmation.expiresAt
                        ) <=
                            now
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


    /* =====================================================
       CONFIRMATION
    ===================================================== */

    createConfirmation(
        analysis
    ){

        this.cleanExpiredConfirmations();


        if(
            !analysis ||
            typeof analysis !==
                "object"
        ){

            return null;

        }


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
                analysis.intent
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
                    this.clone(
                        confirmation.intent
                    ),

                actionType:
                    confirmation.actionType,

                expiresAt:
                    confirmation.expiresAt,

                time:
                    now
            }
        );


        return (
            this.clone(
                confirmation
            ) ||
            null
        );

    },


    getConfirmation(id){

        this.cleanExpiredConfirmations();


        const confirmationId =
            String(
                id ??
                    ""
            ).trim();


        if(!confirmationId){

            return null;

        }


        const confirmation =
            this.pendingConfirmations.get(
                confirmationId
            );


        return confirmation
            ? (
                this.clone(
                    confirmation
                ) ||
                null
            )
            : null;

    },


    consumeConfirmation(
        id,
        analysis
    ){

        this.cleanExpiredConfirmations();


        const confirmationId =
            String(
                id ??
                    ""
            ).trim();


        if(
            !confirmationId ||
            !analysis
        ){

            return false;

        }


        const confirmation =
            this.pendingConfirmations.get(
                confirmationId
            );


        if(
            !confirmation ||
            confirmation.used ===
                true
        ){

            return false;

        }


        if(
            Number(
                confirmation.expiresAt
            ) <=
                Date.now()
        ){

            this.pendingConfirmations
                .delete(
                    confirmationId
                );


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

            this.emit(
                "brain:confirmation:rejected",
                {
                    confirmationId,

                    reason:
                        "fingerprint-mismatch",

                    time:
                        Date.now()
                }
            );


            return false;

        }


        const policyActionType =
            analysis.policy
                ?.actionType ||
            null;


        if(
            confirmation.actionType &&
            policyActionType &&
            confirmation.actionType !==
                policyActionType
        ){

            this.emit(
                "brain:confirmation:rejected",
                {
                    confirmationId,

                    reason:
                        "action-type-mismatch",

                    time:
                        Date.now()
                }
            );


            return false;

        }


        confirmation.used =
            true;


        this.pendingConfirmations.delete(
            confirmationId
        );


        this.emit(
            "brain:confirmation:consumed",
            {
                confirmationId,

                fingerprint,

                actionType:
                    confirmation.actionType,

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

                const detected =
                    intentService.detect(
                        normalizedPrompt,
                        safeContext
                    );


                if(
                    detected &&
                    typeof detected ===
                        "object"
                ){

                    intent =
                        detected;

                }

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

                const evaluated =
                    policyService.evaluateIntent(
                        intent,
                        safeContext
                    );


                if(
                    evaluated &&
                    typeof evaluated ===
                        "object"
                ){

                    policy =
                        evaluated;

                }

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

            intent:
                this.sanitizeValue(
                    intent
                ) ||
                intent,

            policy:
                this.sanitizeValue(
                    policy
                ) ||
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


        const confirmationId =
            String(
                options.confirmationId ??
                    ""
            ).trim();


        /*
         * Confirmation is accepted only when bound to the
         * exact intent/context fingerprint.
         *
         * A raw boolean such as confirmed:true is NOT an
         * execution authority.
         */

        if(confirmationId){

            confirmationApproved =
                this.consumeConfirmation(
                    confirmationId,
                    analysis
                );


            confirmationMode =
                confirmationApproved
                    ? "bound-confirmation"
                    : "invalid-confirmation";

        }


        const actionService =
            this.getService(
                "brainActions"
            );


        let confirmation =
            null;


        if(
            analysis.policy
                ?.requiresConfirmation ===
                true &&
            !confirmationApproved
        ){

            /*
             * Do not create another confirmation when the
             * caller supplied an invalid/expired ID.
             *
             * The caller must explicitly restart the route.
             */

            if(!confirmationId){

                confirmation =
                    this.createConfirmation(
                        analysis
                    );

            }

        }


        let executed =
            false;


        let actionResult =
            null;


        let executionReason =
            null;


        const policyAllows =
            analysis.policy?.allowed ===
                true;


        const policyExecutable =
            analysis.policy?.executable ===
                true;


        const policyBlocked =
            analysis.policy?.blocked ===
                true;


        const requiresConfirmation =
            analysis.policy?.requiresConfirmation ===
                true;


        const confirmationSatisfied =
            !requiresConfirmation ||
            confirmationApproved;


        const canExecute =
            Boolean(

                shouldExecute &&

                policyAllows &&

                policyExecutable &&

                !policyBlocked &&

                confirmationSatisfied &&

                actionService &&

                typeof actionService.execute ===
                    "function"

            );


        if(canExecute){

            try{

                const executionContext = {

                    ...analysis.context,

                    message:
                        analysis.prompt,

                    confirmed:
                        confirmationApproved,

                    confirmationId:
                        confirmationApproved
                            ? confirmationId
                            : null,

                    confirmationMode:
                        confirmationApproved
                            ? "bound-confirmation"
                            : null
                };


                const result =
                    actionService.execute(
                        analysis.intent,
                        executionContext
                    );


                if(
                    result &&
                    typeof result ===
                        "object"
                ){

                    actionResult =
                        result;


                    executed =
                        result.executed ===
                            true ||
                        (
                            result.executed ===
                                undefined &&
                            result.success !==
                                false
                        );

                } else {

                    executed =
                        result ===
                            true;


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

        }
        else {

            if(policyBlocked){

                executionReason =
                    analysis.policy?.reason ||
                    "Aksiyon policy tarafından engellendi.";

            }
            else if(
                requiresConfirmation &&
                confirmationId &&
                !confirmationApproved
            ){

                executionReason =
                    "Confirmation geçersiz, süresi dolmuş veya bu intent ile eşleşmiyor.";

            }
            else if(
                requiresConfirmation &&
                !confirmationApproved
            ){

                executionReason =
                    "Kullanıcı onayı gerekiyor.";

            }
            else if(!policyAllows){

                executionReason =
                    analysis.policy?.reason ||
                    "Aksiyona izin verilmedi.";

            }
            else if(!policyExecutable){

                executionReason =
                    "Intent yürütülebilir bir aksiyon değil.";

            }
            else if(!shouldExecute){

                executionReason =
                    "Execution devre dışı.";

            }
            else if(
                !actionService ||
                typeof actionService.execute !==
                    "function"
            ){

                executionReason =
                    "Brain Actions servisi bulunamadı.";

            }

        }


        const routeResult = {

            ...analysis,

            executed:
                executed ===
                    true,

            actionResult,

            executionReason,

            requiresConfirmation,

            confirmationApproved,

            confirmationMode,

            confirmation,

            blocked:
                policyBlocked,

            routedAt:
                Date.now()

        };


        this.lastRoute =
            routeResult;


        this.emit(
            "brain:routed",
            {
                intent:
                    this.clone(
                        routeResult.intent
                    ),

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

                confirmationId:
                    confirmation?.id ||
                    null,

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
                        routeResult.policy
                            ?.allowed ===
                        true,

                    executable:
                        routeResult.policy
                            ?.executable ===
                        true,

                    blocked:
                        routeResult.policy
                            ?.blocked ===
                        true,

                    requiresConfirmation:
                        routeResult.policy
                            ?.requiresConfirmation ===
                        true,

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
                    routeResult.executed ===
                    true,

                actionResult:
                    routeResult.actionResult,

                requiresConfirmation:
                    routeResult
                        .requiresConfirmation ===
                    true,

                confirmationApproved:
                    routeResult
                        .confirmationApproved ===
                    true,

                confirmationMode:
                    routeResult
                        .confirmationMode ||
                    null,

                blocked:
                    routeResult.blocked ===
                    true

            }

        });

    },


    /* =====================================================
       PROVIDER TIMEOUT
    ===================================================== */

    normalizeProviderTimeout(value){

        const timeout =
            Number(
                value
            );


        if(
            !Number.isFinite(
                timeout
            )
        ){

            return this.providerTimeout;

        }


        return Math.max(
            1000,
            Math.min(
                60000,
                Math.round(
                    timeout
                )
            )
        );

    },


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
            this.normalizeProviderTimeout(
                options.providerTimeout ||
                this.providerTimeout
            );


        const timerAPI =
            typeof globalThis !==
                "undefined"
                ? globalThis
                : null;


        if(
            !timerAPI ||
            typeof timerAPI.setTimeout !==
                "function"
        ){

            return await Promise.resolve(
                this.provider.ask(
                    prompt,
                    context,
                    options
                )
            );

        }


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
                            timerAPI.setTimeout(
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

            if(
                timer !==
                    null &&
                typeof timerAPI.clearTimeout ===
                    "function"
            ){

                timerAPI.clearTimeout(
                    timer
                );

            }

        }

    },


    /* =====================================================
       LOCAL ROUTE REPLY
    ===================================================== */

    createLocalRouteReply(
        routeResult
    ){

        if(
            routeResult.executed ===
                true
        ){

            return (
                routeResult
                    .actionResult
                    ?.message ||
                routeResult
                    .actionResult
                    ?.reply ||
                "İşlem tamamlandı."
            );

        }


        if(
            routeResult.requiresConfirmation ===
                true &&
            routeResult.confirmationApproved !==
                true
        ){

            return (
                routeResult.executionReason ||
                routeResult.policy
                    ?.reason ||
                "Bu işlem devam etmeden önce onayını gerektiriyor."
            );

        }


        if(
            routeResult.blocked ===
                true
        ){

            return (
                routeResult.policy
                    ?.reason ||
                routeResult.executionReason ||
                "Bu işlem gerçekleştirilemiyor."
            );

        }


        if(routeResult.executionReason){

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

           Action routing remains local.
           Missing provider never grants or blocks action
           authority.
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


            this.emit(
                "brain:response",
                {
                    requestId,

                    provider:
                        null,

                    executed:
                        result.executed,

                    blocked:
                        result.blocked,

                    requiresConfirmation:
                        result
                            .requiresConfirmation,

                    error:
                        false,

                    local:
                        true,

                    time:
                        result.respondedAt
                }
            );


            return result;

        }


        /* =================================================
           PROVIDER

           Provider may generate language/reasoning output,
           but cannot overwrite action authority.
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
                    "object" &&
                !Array.isArray(
                    providerResult
                )
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
                        ? (
                            routeResult
                                .actionResult
                                ?.message ||
                            routeResult
                                .actionResult
                                ?.reply ||
                            null
                        )
                        : null
                ) ||

                this.createLocalRouteReply(
                    routeResult
                ) ||

                "Brain yanıt üretemedi.";


            /*
             * Authority fields are spread AFTER provider
             * payload so provider cannot forge them.
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
                    providerPayload.error ===
                        true,

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
                            routeResult
                                .actionResult
                                ?.reply ||
                            "İşlem tamamlandı ancak Brain provider yanıtı alınamadı."
                        )
                        : routeResult
                            .requiresConfirmation &&
                          !routeResult
                              .confirmationApproved
                            ? (
                                routeResult
                                    .executionReason ||
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
        prompt = "",
        context = {},
        options = {}
    ){

        const id =
            String(
                confirmationId ??
                    ""
            ).trim();


        if(!id){

            return {
                success:
                    false,

                executed:
                    false,

                confirmationApproved:
                    false,

                error:
                    "confirmation-id-required",

                message:
                    "Confirmation ID gerekli."
            };

        }


        const cleanPrompt =
            this.normalizePrompt(
                prompt
            );


        if(!cleanPrompt){

            return {
                success:
                    false,

                executed:
                    false,

                confirmationApproved:
                    false,

                error:
                    "confirmation-prompt-required",

                message:
                    "Confirmation için orijinal işlem isteği gerekli."
            };

        }


        return this.route(
            cleanPrompt,
            context,
            {
                ...options,

                execute:
                    true,

                confirmationId:
                    id
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
                confirmationId ??
                    ""
            ).trim();


        if(!id){

            return false;

        }


        this.cleanExpiredConfirmations();


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

            version:
                this.version,

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

                skills:
                    Boolean(
                        this.getService(
                            "brainSkills"
                        )
                    ),

                mode:
                    Boolean(
                        this.getService(
                            "brainMode"
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


        this.emit(
            "brain:runtime:reset",
            {
                time:
                    Date.now()
            }
        );


        return true;

    }

};


/* =========================================================
   REGISTER
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        VAERO.register(
            "brainCore",
            BrainCore
        );

    }

} catch(error){

    console.error(
        "BrainCore register edilemedi:",
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

    window.BrainCore =
        BrainCore;

}
