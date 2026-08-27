/* =========================================================
   VAERO BRAIN SERVICE
   Public Brain Gateway
========================================================= */

const BrainService = {

    version:
        "3.0.0",

    lastRequest:
        null,

    lastResponse:
        null,

    lastAnalysis:
        null,

    lastRoute:
        null,

    lastConfirmation:
        null,

    requestSequence:
        0,

    maxPromptLength:
        8000,


    /* =====================================================
       SAFE SERVICE ACCESS
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
                `Brain Service bağı okunamadı: ${serviceName}`,
                error
            );


            return null;

        }

    },


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
                this.maxPromptLength
            );

    },


    normalizeOptions(options){

        if(
            !options ||
            typeof options !==
                "object" ||
            Array.isArray(
                options
            )
        ){

            return {};

        }


        return {
            ...options
        };

    },


    normalizeConfirmationId(value){

        const id =
            String(
                value ??
                    ""
            )
                .trim()
                .slice(
                    0,
                    240
                );


        return (
            id ||
            null
        );

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
                `BrainService event gönderilemedi: ${name}`,
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
                `BrainService event fallback gönderilemedi: ${name}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       CONTEXT
    ===================================================== */

    buildContext(
        extraContext = {},
        options = {}
    ){

        const contextService =
            this.getService(
                "brainContext"
            );


        const safeExtra =
            extraContext &&
            typeof extraContext ===
                "object" &&
            !Array.isArray(
                extraContext
            )
                ? extraContext
                : {};


        const compact =
            options.compact ===
                true;


        if(contextService){

            try{

                if(
                    compact &&
                    typeof contextService.compact ===
                        "function"
                ){

                    return contextService.compact(
                        safeExtra
                    );

                }


                if(
                    typeof contextService.build ===
                        "function"
                ){

                    return contextService.build(
                        safeExtra
                    );

                }

            } catch(error){

                console.warn(
                    "Brain context oluşturulamadı:",
                    error
                );

            }

        }


        return {

            ...safeExtra,

            engineReady:
                false,

            contextSource:
                "brain-service-fallback",

            builtAt:
                Date.now()

        };

    },


    /* =====================================================
       REQUEST RECORD
    ===================================================== */

    createRequestRecord({
        type,
        prompt = null,
        context = {},
        options = {}
    }){

        const now =
            Date.now();


        const request = {

            id:
                `brain_service_${now}_${++this.requestSequence}`,

            sequence:
                this.requestSequence,

            type:
                String(
                    type ||
                    "ask"
                ),

            prompt:
                prompt !==
                    null
                    ? this.normalizePrompt(
                        prompt
                    )
                    : null,

            context:
                this.clone(
                    context
                ),

            options:
                this.clone(
                    options
                ),

            requestedAt:
                now

        };


        this.lastRequest =
            request;


        return request;

    },


    /* =====================================================
       RESPONSE NORMALIZATION
    ===================================================== */

    normalizeResponse(
        response,
        fallbackReply =
            "Brain yanıt üretemedi."
    ){

        if(
            response &&
            typeof response ===
                "object" &&
            !Array.isArray(
                response
            )
        ){

            return {
                ...response
            };

        }


        return {

            reply:
                String(
                    response ??
                    fallbackReply
                )

        };

    },


    /* =====================================================
       ASK
    ===================================================== */

    async ask(
        prompt,
        options = {}
    ){

        const brain =
            this.getService(
                "brainCore"
            );


        const cleanPrompt =
            this.normalizePrompt(
                prompt
            );


        if(
            !brain ||
            typeof brain.ask !==
                "function"
        ){

            const result = {

                reply:
                    "Brain Core şu anda kullanılamıyor.",

                error:
                    true,

                serviceError:
                    "brain-core-unavailable",

                respondedAt:
                    Date.now()

            };


            this.lastResponse =
                result;


            return result;

        }


        const safeOptions =
            this.normalizeOptions(
                options
            );


        const {

            context:
                contextOverride = {},

            compactContext =
                false,

            ...brainOptions

        } = safeOptions;


        const context =
            this.buildContext(
                contextOverride,
                {
                    compact:
                        compactContext ===
                        true
                }
            );


        const request =
            this.createRequestRecord({

                type:
                    "ask",

                prompt:
                    cleanPrompt,

                context,

                options:
                    brainOptions

            });


        this.emit(
            "brain:service:request",
            {
                requestId:
                    request.id,

                sequence:
                    request.sequence,

                type:
                    "ask",

                time:
                    request.requestedAt
            }
        );


        try{

            const response =
                await brain.ask(
                    cleanPrompt,
                    context,
                    brainOptions
                );


            const normalizedResponse =
                this.normalizeResponse(
                    response
                );


            const respondedAt =
                Date.now();


            const result = {

                ...normalizedResponse,

                serviceRequestId:
                    request.id,

                serviceSequence:
                    request.sequence,

                serviceRespondedAt:
                    respondedAt,

                serviceDuration:
                    Math.max(
                        0,
                        respondedAt -
                        request.requestedAt
                    )

            };


            this.lastResponse =
                result;


            if(
                result.confirmation &&
                typeof result.confirmation ===
                    "object"
            ){

                this.lastConfirmation =
                    this.clone(
                        result.confirmation
                    );

            }


            this.emit(
                "brain:service:response",
                {
                    requestId:
                        request.id,

                    sequence:
                        request.sequence,

                    executed:
                        result.executed ===
                            true,

                    blocked:
                        result.blocked ===
                            true,

                    requiresConfirmation:
                        result.requiresConfirmation ===
                            true,

                    error:
                        result.error ===
                            true,

                    provider:
                        result.provider ||
                        result.providerId ||
                        null,

                    time:
                        respondedAt
                }
            );


            return result;

        } catch(error){

            console.error(
                "Brain Service ask error:",
                error
            );


            const respondedAt =
                Date.now();


            const result = {

                reply:
                    "Brain isteği şu anda tamamlanamadı.",

                error:
                    true,

                serviceError:
                    error?.message ||
                    String(
                        error
                    ),

                serviceRequestId:
                    request.id,

                serviceSequence:
                    request.sequence,

                respondedAt,

                serviceDuration:
                    Math.max(
                        0,
                        respondedAt -
                        request.requestedAt
                    )

            };


            this.lastResponse =
                result;


            this.emit(
                "brain:service:error",
                {
                    requestId:
                        request.id,

                    sequence:
                        request.sequence,

                    error:
                        result.serviceError,

                    time:
                        respondedAt
                }
            );


            return result;

        }

    },


    /* =====================================================
       ANALYZE ONLY
    ===================================================== */

    analyze(
        prompt,
        extraContext = {}
    ){

        const brain =
            this.getService(
                "brainCore"
            );


        if(
            !brain ||
            typeof brain.analyze !==
                "function"
        ){

            return null;

        }


        const cleanPrompt =
            this.normalizePrompt(
                prompt
            );


        const context =
            this.buildContext(
                extraContext
            );


        const request =
            this.createRequestRecord({

                type:
                    "analyze",

                prompt:
                    cleanPrompt,

                context,

                options:{}

            });


        try{

            const result =
                brain.analyze(
                    cleanPrompt,
                    context
                );


            this.lastAnalysis =
                result;


            this.emit(
                "brain:service:analyzed",
                {
                    requestId:
                        request.id,

                    sequence:
                        request.sequence,

                    intent:
                        result?.intent ||
                        null,

                    actionType:
                        result?.policy
                            ?.actionType ||
                        null,

                    blocked:
                        result?.blocked ===
                            true,

                    requiresConfirmation:
                        result?.requiresConfirmation ===
                            true,

                    time:
                        Date.now()
                }
            );


            return result;

        } catch(error){

            console.error(
                "Brain Service analyze error:",
                error
            );


            return null;

        }

    },


    /* =====================================================
       ROUTE ONLY
    ===================================================== */

    route(
        prompt,
        options = {}
    ){

        const brain =
            this.getService(
                "brainCore"
            );


        if(
            !brain ||
            typeof brain.route !==
                "function"
        ){

            return null;

        }


        const safeOptions =
            this.normalizeOptions(
                options
            );


        const {

            context:
                contextOverride = {},

            compactContext =
                false,

            ...routeOptions

        } = safeOptions;


        const cleanPrompt =
            this.normalizePrompt(
                prompt
            );


        const context =
            this.buildContext(
                contextOverride,
                {
                    compact:
                        compactContext ===
                        true
                }
            );


        const request =
            this.createRequestRecord({

                type:
                    "route",

                prompt:
                    cleanPrompt,

                context,

                options:
                    routeOptions

            });


        try{

            const result =
                brain.route(
                    cleanPrompt,
                    context,
                    routeOptions
                );


            this.lastRoute =
                result;


            if(
                result?.confirmation &&
                typeof result.confirmation ===
                    "object"
            ){

                this.lastConfirmation =
                    this.clone(
                        result.confirmation
                    );

            }


            this.emit(
                "brain:service:routed",
                {
                    requestId:
                        request.id,

                    sequence:
                        request.sequence,

                    executed:
                        result?.executed ===
                            true,

                    blocked:
                        result?.blocked ===
                            true,

                    requiresConfirmation:
                        result?.requiresConfirmation ===
                            true,

                    actionType:
                        result?.policy
                            ?.actionType ||
                        null,

                    time:
                        Date.now()
                }
            );


            return result;

        } catch(error){

            console.error(
                "Brain Service route error:",
                error
            );


            return null;

        }

    },


    /* =====================================================
       CONFIRM
    ===================================================== */

    confirm(
        confirmationId,
        prompt = "",
        options = {}
    ){

        const brain =
            this.getService(
                "brainCore"
            );


        if(
            !brain ||
            typeof brain.confirm !==
                "function"
        ){

            return {

                success:
                    false,

                executed:
                    false,

                error:
                    "brain-confirm-unavailable",

                message:
                    "Brain confirmation sistemi kullanılamıyor."

            };

        }


        const id =
            this.normalizeConfirmationId(
                confirmationId
            );


        if(!id){

            return {

                success:
                    false,

                executed:
                    false,

                error:
                    "confirmation-id-required",

                message:
                    "Confirmation ID gerekli."

            };

        }


        const safeOptions =
            this.normalizeOptions(
                options
            );


        const {

            context:
                contextOverride = {},

            ...confirmOptions

        } = safeOptions;


        const cleanPrompt =
            this.normalizePrompt(
                prompt
            );


        const context =
            this.buildContext(
                contextOverride
            );


        const request =
            this.createRequestRecord({

                type:
                    "confirm",

                prompt:
                    cleanPrompt,

                context,

                options:{
                    confirmationId:
                        id,

                    ...confirmOptions
                }

            });


        try{

            const result =
                brain.confirm(
                    id,
                    cleanPrompt,
                    context,
                    confirmOptions
                );


            this.lastRoute =
                result;


            if(
                result?.confirmationApproved ===
                    true ||
                result?.executed ===
                    true
            ){

                if(
                    this.lastConfirmation?.id ===
                        id
                ){

                    this.lastConfirmation =
                        null;

                }

            }


            this.emit(
                "brain:service:confirmed",
                {
                    requestId:
                        request.id,

                    sequence:
                        request.sequence,

                    confirmationId:
                        id,

                    approved:
                        result?.confirmationApproved ===
                            true,

                    executed:
                        result?.executed ===
                            true,

                    blocked:
                        result?.blocked ===
                            true,

                    time:
                        Date.now()
                }
            );


            return result;

        } catch(error){

            console.error(
                "Brain Service confirm error:",
                error
            );


            return {

                success:
                    false,

                executed:
                    false,

                error:
                    "brain-confirm-error",

                message:
                    error?.message ||
                    "Confirmation işlemi tamamlanamadı.",

                serviceRequestId:
                    request.id

            };

        }

    },


    /* =====================================================
       CANCEL CONFIRMATION
    ===================================================== */

    cancelConfirmation(
        confirmationId
    ){

        const brain =
            this.getService(
                "brainCore"
            );


        if(
            !brain ||
            typeof brain.cancelConfirmation !==
                "function"
        ){

            return false;

        }


        const id =
            this.normalizeConfirmationId(
                confirmationId
            );


        if(!id){

            return false;

        }


        try{

            const result =
                brain.cancelConfirmation(
                    id
                );


            if(
                result ===
                    true &&
                this.lastConfirmation
                    ?.id ===
                    id
            ){

                this.lastConfirmation =
                    null;

            }


            if(
                result ===
                    true
            ){

                this.emit(
                    "brain:service:confirmation-cancelled",
                    {
                        confirmationId:
                            id,

                        time:
                            Date.now()
                    }
                );

            }


            return result ===
                true;

        } catch(error){

            return false;

        }

    },


    /* =====================================================
       GET CONFIRMATION
    ===================================================== */

    getConfirmation(
        confirmationId = null
    ){

        const brain =
            this.getService(
                "brainCore"
            );


        const id =
            this.normalizeConfirmationId(
                confirmationId ||
                this.lastConfirmation
                    ?.id ||
                null
            );


        if(!id){

            return null;

        }


        if(
            brain &&
            typeof brain.getConfirmation ===
                "function"
        ){

            try{

                const confirmation =
                    brain.getConfirmation(
                        id
                    );


                if(confirmation){

                    return confirmation;

                }

            } catch(error){

                /* local fallback */

            }

        }


        return (
            this.lastConfirmation?.id ===
                id
                ? this.clone(
                    this.lastConfirmation
                )
                : null
        );

    },


    /* =====================================================
       SKILLS
    ===================================================== */

    async runSkill(
        name,
        payload = {},
        options = {}
    ){

        const skills =
            this.getService(
                "brainSkills"
            );


        if(
            !skills ||
            typeof skills.run !==
                "function"
        ){

            return {

                success:
                    false,

                executed:
                    false,

                error:
                    "brain-skills-unavailable",

                message:
                    "Brain Skills sistemi kullanılamıyor."

            };

        }


        const skillName =
            String(
                name ??
                    ""
            ).trim();


        if(!skillName){

            return {

                success:
                    false,

                executed:
                    false,

                error:
                    "brain-skill-name-required",

                message:
                    "Skill adı gerekli."

            };

        }


        const safeOptions =
            this.normalizeOptions(
                options
            );


        const {

            context:
                contextOverride = {},

            compactContext =
                false,

            ...skillOptions

        } = safeOptions;


        const context =
            this.buildContext(
                {
                    ...contextOverride,
                    skill:
                        skillName
                },
                {
                    compact:
                        compactContext ===
                        true
                }
            );


        const request =
            this.createRequestRecord({

                type:
                    "skill",

                prompt:
                    null,

                context,

                options:{
                    skill:
                        skillName,

                    ...skillOptions
                }

            });


        try{

            const response =
                await skills.run(
                    skillName,
                    payload,
                    context
                );


            const normalized =
                this.normalizeResponse(
                    response,
                    "Skill yanıt üretemedi."
                );


            this.lastResponse = {

                ...normalized,

                serviceRequestId:
                    request.id,

                serviceSequence:
                    request.sequence,

                serviceRespondedAt:
                    Date.now()

            };


            this.emit(
                "brain:service:skill",
                {
                    requestId:
                        request.id,

                    skill:
                        skillName,

                    success:
                        this.lastResponse.success !==
                            false,

                    executed:
                        this.lastResponse.executed ===
                            true,

                    time:
                        this.lastResponse
                            .serviceRespondedAt
                }
            );


            return this.lastResponse;

        } catch(error){

            console.error(
                "Brain Service skill error:",
                error
            );


            const result = {

                success:
                    false,

                executed:
                    false,

                error:
                    "brain-skill-error",

                message:
                    error?.message ||
                    "Skill çalıştırılamadı.",

                serviceRequestId:
                    request.id,

                serviceSequence:
                    request.sequence,

                serviceRespondedAt:
                    Date.now()

            };


            this.lastResponse =
                result;


            return result;

        }

    },


    /* =====================================================
       PUBLIC CONTEXT
    ===================================================== */

    context(
        extra = {},
        options = {}
    ){

        return this.buildContext(
            extra,
            options
        );

    },


    compactContext(
        extra = {}
    ){

        return this.buildContext(
            extra,
            {
                compact:
                    true
            }
        );

    },


    /* =====================================================
       MODE
    ===================================================== */

    getMode(){

        const mode =
            this.getService(
                "brainMode"
            );


        if(!mode){

            return null;

        }


        try{

            if(
                typeof mode.snapshot ===
                    "function"
            ){

                return mode.snapshot();

            }


            if(
                typeof mode.report ===
                    "function"
            ){

                return mode.report();

            }

        } catch(error){

            return null;

        }


        return null;

    },


    setMode(
        nextMode,
        options = {}
    ){

        const mode =
            this.getService(
                "brainMode"
            );


        if(
            !mode ||
            typeof mode.set !==
                "function"
        ){

            return false;

        }


        try{

            return mode.set(
                nextMode,
                options
            );

        } catch(error){

            return false;

        }

    },


    /* =====================================================
       PROVIDER
    ===================================================== */

    provider(){

        const brain =
            this.getService(
                "brainCore"
            );


        if(!brain){

            return null;

        }


        try{

            if(
                typeof brain.getProviderInfo ===
                    "function"
            ){

                return (
                    brain.getProviderInfo() ||
                    null
                );

            }


            if(
                typeof brain.provider ===
                    "function"
            ){

                return (
                    brain.provider() ||
                    null
                );

            }

        } catch(error){

            return null;

        }


        return null;

    },


    /* =====================================================
       STATUS
    ===================================================== */

    status(){

        const brain =
            this.getService(
                "brainCore"
            );


        const contextService =
            this.getService(
                "brainContext"
            );


        const skills =
            this.getService(
                "brainSkills"
            );


        const mode =
            this.getService(
                "brainMode"
            );


        let brainStatus =
            null;


        let contextStatus =
            null;


        let skillsStatus =
            null;


        let modeStatus =
            null;


        try{

            brainStatus =
                typeof brain?.status ===
                    "function"
                    ? brain.status()
                    : null;

        } catch(error){

            brainStatus =
                null;

        }


        try{

            contextStatus =
                contextService?.report?.() ||
                null;

        } catch(error){

            contextStatus =
                null;

        }


        try{

            skillsStatus =
                skills?.report?.() ||
                skills?.status?.() ||
                null;

        } catch(error){

            skillsStatus =
                null;

        }


        try{

            modeStatus =
                mode?.report?.() ||
                mode?.snapshot?.() ||
                null;

        } catch(error){

            modeStatus =
                null;

        }


        return {

            version:
                this.version,

            available:
                Boolean(
                    brain
                ),

            brain:
                brainStatus,

            provider:
                this.provider(),

            context:
                contextStatus,

            skills:
                skillsStatus,

            mode:
                modeStatus,

            pendingConfirmation:
                this.getConfirmation(),

            requestSequence:
                this.requestSequence,

            hasLastRequest:
                Boolean(
                    this.lastRequest
                ),

            hasLastResponse:
                Boolean(
                    this.lastResponse
                ),

            hasLastAnalysis:
                Boolean(
                    this.lastAnalysis
                ),

            hasLastRoute:
                Boolean(
                    this.lastRoute
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

            version:
                this.version,

            available:
                status.available,

            providerConnected:
                Boolean(
                    status.provider
                ),

            pendingConfirmation:
                Boolean(
                    status.pendingConfirmation
                ),

            mode:
                status.mode?.mode ||
                status.mode?.current ||
                null,

            skills:
                Number(
                    status.skills?.total
                ) ||
                0,

            contextReady:
                status.context
                    ?.engineReady ===
                    true,

            requests:
                status.requestSequence,

            hasLastResponse:
                status.hasLastResponse,

            hasLastAnalysis:
                status.hasLastAnalysis,

            hasLastRoute:
                status.hasLastRoute

        };

    },


    /* =====================================================
       RESET SERVICE STATE
    ===================================================== */

    clearServiceState(){

        this.lastRequest =
            null;


        this.lastResponse =
            null;


        this.lastAnalysis =
            null;


        this.lastRoute =
            null;


        this.lastConfirmation =
            null;


        this.requestSequence =
            0;


        return true;

    },


    /* =====================================================
       RESET RUNTIME
    ===================================================== */

    resetRuntime(
        options = {}
    ){

        this.clearServiceState();


        const brain =
            this.getService(
                "brainCore"
            );


        if(
            brain &&
            typeof brain.resetRuntime ===
                "function"
        ){

            try{

                brain.resetRuntime();

            } catch(error){

                console.warn(
                    "Brain Core reset başarısız:",
                    error
                );

            }

        }


        if(
            options.skills ===
                true
        ){

            const skills =
                this.getService(
                    "brainSkills"
                );


            try{

                if(
                    typeof skills?.resetRuntime ===
                        "function"
                ){

                    skills.resetRuntime();

                }

            } catch(error){

                /* optional */

            }

        }


        this.emit(
            "brain:service:reset",
            {
                skills:
                    options.skills ===
                    true,

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
            "brainService",
            BrainService
        );

    }

} catch(error){

    console.error(
        "BrainService register edilemedi:",
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

    window.BrainService =
        BrainService;

}
