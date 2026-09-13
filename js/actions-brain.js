/* =========================================================
   VAERO ACTIONS BRAIN

   Brain Action Continuation Layer

   Actions V2 remains the main interaction entry point.
   This module owns the growing Brain message pipeline:

   Command
      ↓
   Context
      ↓
   Memory Retrieval
      ↓
   Brain Gateway
      ↓
   Decision / Action
      ↓
   Outcome
      ↓
   Memory Learning
      ↓
   Conversation Continuity
========================================================= */


const ActionsBrain = {

    version:
        "1.0.0",

    initialized:
        false,

    initializedAt:
        null,

    requestSequence:
        0,

    activeRequests:
        new Map(),

    lastRequest:
        null,

    lastResponse:
        null,

    lastLearning:
        null,

    lastDecisionTrace:
        null,


    /* =====================================================
       SERVICE ACCESS
    ===================================================== */

    getService(name){

        const key =
            String(
                name ||
                ""
            ).trim();


        if(!key){

            return null;

        }


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.get ===
                    "function"
            ){

                return (
                    VAERO.get(
                        key
                    ) ||
                    null
                );

            }

        } catch(error){

            console.warn(
                `ActionsBrain service unavailable: ${key}`,
                error
            );

        }


        return null;

    },


    getGateway(actions = null){

        try{

            if(
                actions &&
                typeof actions.getBrainGateway ===
                    "function"
            ){

                const gateway =
                    actions.getBrainGateway();


                if(gateway){

                    return gateway;

                }

            }

        } catch(error){

            /* fallback */

        }


        return (
            this.getService(
                "brainService"
            ) ||
            (
                typeof window !==
                    "undefined"
                    ? window.BrainService ||
                      null
                    : null
            )
        );

    },


    getMemory(actions = null){

        try{

            if(
                actions &&
                typeof actions.getBrainMemory ===
                    "function"
            ){

                const memory =
                    actions.getBrainMemory();


                if(memory){

                    return memory;

                }

            }

        } catch(error){

            /* fallback */

        }


        return (
            this.getService(
                "brainMemory"
            ) ||
            (
                typeof window !==
                    "undefined"
                    ? window.BrainMemory ||
                      null
                    : null
            )
        );

    },


    getContextService(){

        return this.getService(
            "brainContext"
        );

    },


    getInteraction(){

        return (
            this.getService(
                "interaction"
            ) ||
            (
                typeof window !==
                    "undefined"
                    ? window.InteractionCore ||
                      null
                    : null
            )
        );

    },

   getIntelligence(){

    return (
        this.getService(
            "brainIntelligence"
        ) ||
        (
            typeof window !==
                "undefined"
                ? window.BrainIntelligence ||
                  null
                : null
        )
    );

},


    /* =====================================================
       SAFE HELPERS
    ===================================================== */

    createId(
        prefix = "brain-request"
    ){

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


        this.requestSequence +=
            1;


        return (
            `${prefix}_${Date.now()}_${this.requestSequence}_${Math.random()
                .toString(36)
                .slice(2,10)}`
        );

    },


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


    normalizeText(
        value,
        maxLength = 12000
    ){

        return String(
            value ??
            ""
        )
            .trim()
            .slice(
                0,
                maxLength
            );

    },


    number(
        value,
        fallback = null
    ){

        const result =
            Number(
                value
            );


        return Number.isFinite(
            result
        )
            ? result
            : fallback;

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
                eventName ||
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
                `ActionsBrain event failed: ${name}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       REQUEST
    ===================================================== */

    createRequest(
        text,
        context = {}
    ){

        const now =
            Date.now();


        const request = {

            id:
                this.createId(
                    "brain-request"
                ),

            sequence:
                ++this.requestSequence,

            text:
                this.normalizeText(
                    text
                ),

            context:
                this.clone(
                    context
                ) ||
                {},

            startedAt:
                now,

            completedAt:
                null,

            duration:
                null,

            status:
                "running"

        };


        this.activeRequests.set(
            request.id,
            request
        );


        this.lastRequest =
            request;


        this.emit(
            "brain:intelligence:request",
            {

                requestId:
                    request.id,

                sequence:
                    request.sequence,

                time:
                    now

            }
        );


        return request;

    },


    finishRequest(
        request,
        status = "completed"
    ){

        if(!request){

            return null;

        }


        request.completedAt =
            Date.now();

        request.duration =
            Math.max(
                0,
                request.completedAt -
                request.startedAt
            );

        request.status =
            status;


        this.activeRequests.delete(
            request.id
        );


        return request;

    },


    /* =====================================================
       CONTEXT
    ===================================================== */

    buildContext(
        actions,
        text
    ){

        const contextService =
            this.getContextService();


        let context =
            {};


        try{

            if(
                contextService &&
                typeof contextService.build ===
                    "function"
            ){

                context =
                    contextService.build({

                        message:
                            text,

                        source:
                            "actions-brain",

                        requestedAt:
                            Date.now()

                    }) ||
                    {};

            }

        } catch(error){

            console.warn(
                "ActionsBrain context build failed:",
                error
            );

            context =
                {};

        }


        try{

            const engine =
                actions &&
                typeof actions.getEngine ===
                    "function"
                    ? actions.getEngine()
                    : null;


            if(engine){

                context = {

                    ...context,

                    applicationContext:
                        engine.currentApplicationContext &&
                        typeof engine.currentApplicationContext ===
                            "object"
                            ? {
                                ...engine.currentApplicationContext,

                                /*
                                 * Runtime secrets must never
                                 * reach Brain context.
                                 */
                                accessToken:
                                    undefined
                            }
                            : null

                };

            }

        } catch(error){

            /* non-fatal */

        }


        return context;

    },


    /* =====================================================
       LEARNING RETRIEVAL
    ===================================================== */

    getLearningContext(
        memory,
        text,
        context
    ){

        if(
            !memory ||
            typeof memory.getLearningContext !==
                "function"
        ){

            return null;

        }


        try{

            const result =
                memory.getLearningContext(
                    text,
                    context
                );


            this.lastLearning =
                this.clone(
                    result
                );


            return result;

        } catch(error){

            console.warn(
                "Brain learning context could not be retrieved:",
                error
            );


            return null;

        }

    },


    attachLearningContext(
        context,
        learning
    ){

        if(
            !learning ||
            typeof learning !==
                "object"
        ){

            return context;

        }


        return {

            ...context,

            learningContext:
                this.clone(
                    learning
                )

        };

    },


    /* =====================================================
       RESPONSE NORMALIZATION
    ===================================================== */

    normalizeResponse(response){

        if(
            typeof response ===
                "string"
        ){

            return {

                reply:
                    response,

                executed:
                    false,

                blocked:
                    false,

                error:
                    false

            };

        }


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
                "",

            executed:
                false,

            blocked:
                false,

            error:
                true,

            intelligenceError:
                "invalid-brain-response"

        };

    },


    getReplyText(response){

        const reply =
            response?.reply ||
            response?.message ||
            response?.text ||
            response
                ?.actionResult
                ?.message ||
            (
                response?.executed ===
                    true
                    ? "İşlem tamamlandı."
                    : ""
            );


        return this.normalizeText(
            reply,
            30000
        );

    },


    getIntent(response){

        return (
            response?.intent ||
            response
                ?.analysis
                ?.intent ||
            response
                ?.route
                ?.intent ||
            response
                ?.decision
                ?.intent ||
            null
        );

    },


    getActionType(response){

        return (
            response
                ?.policy
                ?.actionType ||
            response?.actionType ||
            response
                ?.action
                ?.type ||
            response
                ?.route
                ?.actionType ||
            null
        );

    },


    getConfidence(response){

        const value =
            this.number(
                response?.confidence ??
                response
                    ?.analysis
                    ?.confidence ??
                response
                    ?.decision
                    ?.confidence
            );


        if(value === null){

            return null;

        }


        return Math.max(
            0,
            Math.min(
                1,
                value
            )
        );

    },


    /* =====================================================
       OUTCOME ANALYSIS
    ===================================================== */

    evaluateOutcome(response){

        const error =
            response?.error ===
                true;

        const blocked =
            response?.blocked ===
                true;

        const executed =
            response?.executed ===
                true;

        const confirmed =
            response?.confirmationApproved ===
                true;

        const requiresConfirmation =
            response?.requiresConfirmation ===
                true;


        let status =
            "responded";


        if(error){

            status =
                "failed";

        }

        else if(blocked){

            status =
                "blocked";

        }

        else if(
            requiresConfirmation &&
            !confirmed
        ){

            status =
                "waiting-confirmation";

        }

        else if(executed){

            status =
                "executed";

        }


        const successful =
            (
                executed ||
                confirmed
            ) &&
            !error &&
            !blocked;


        return {

            successful,

            status,

            executed,

            blocked,

            error,

            requiresConfirmation,

            confirmed

        };

    },


    /* =====================================================
       MEMORY LEARNING
    ===================================================== */

    recordLearning(
        memory,
        {
            request,
            text,
            context,
            response,
            outcome
        }
    ){

        if(!memory){

            return null;

        }


        let record =
            null;


        const intent =
            this.getIntent(
                response
            );

        const actionType =
            this.getActionType(
                response
            );

        const confidence =
            this.getConfidence(
                response
            );


        try{

            if(
                typeof memory.recordCommand ===
                    "function"
            ){

                record =
                    memory.recordCommand({

                        command:
                            text,

                        prompt:
                            text,

                        requestId:
                            request?.id ||
                            null,

                        intent,

                        actionType,

                        confidence,

                        success:
                            outcome.successful,

                        status:
                            outcome.status,

                        executed:
                            outcome.executed,

                        blocked:
                            outcome.blocked,

                        error:
                            outcome.error,

                        context,

                        createdAt:
                            request?.startedAt ||
                            Date.now()

                    });

            }

        } catch(error){

            console.warn(
                "Brain command memory could not be recorded:",
                error
            );

        }


        const memoryId =
            record?.id ||
            record?.commandId ||
            null;


        if(
            memoryId &&
            typeof memory.recordOutcome ===
                "function"
        ){

            try{

                memory.recordOutcome(
                    memoryId,
                    {

                        success:
                            outcome.successful,

                        status:
                            outcome.status,

                        executed:
                            outcome.executed,

                        blocked:
                            outcome.blocked,

                        error:
                            outcome.error,

                        requestId:
                            request?.id ||
                            null,

                        actionType,

                        intent,

                        confidence,

                        completedAt:
                            Date.now()

                    }
                );

            } catch(error){

                console.warn(
                    "Brain outcome memory could not be recorded:",
                    error
                );

            }

        }


        return record;

    },


    /* =====================================================
       DECISION TRACE

       User-safe operational explanation only.
       Never hidden reasoning / chain-of-thought.
    ===================================================== */

    createDecisionTrace(
        memory,
        {
            request,
            text,
            response,
            outcome
        }
    ){

        let trace =
            null;


        if(
            memory &&
            typeof memory.createDecisionTrace ===
                "function"
        ){

            try{

                trace =
                    memory.createDecisionTrace({

                        requestId:
                            request?.id ||
                            null,

                        command:
                            text,

                        intent:
                            this.getIntent(
                                response
                            ),

                        actionType:
                            this.getActionType(
                                response
                            ),

                        confidence:
                            this.getConfidence(
                                response
                            ),

                        status:
                            outcome.status,

                        executed:
                            outcome.executed,

                        blocked:
                            outcome.blocked,

                        error:
                            outcome.error

                    });

            } catch(error){

                trace =
                    null;

            }

        }


        if(!trace){

            trace = {

                requestId:
                    request?.id ||
                    null,

                intent:
                    this.getIntent(
                        response
                    ),

                actionType:
                    this.getActionType(
                        response
                    ),

                confidence:
                    this.getConfidence(
                        response
                    ),

                status:
                    outcome.status,

                createdAt:
                    Date.now()

            };

        }


        this.lastDecisionTrace =
            this.clone(
                trace
            );


        return trace;

    },


    /* =====================================================
       CONVERSATION SESSION
    ===================================================== */

    getSession(
        actions,
        brain
    ){

        if(
            !Array.isArray(
                brain.sessions
            )
        ){

            brain.sessions =
                [];

        }


        return (
            actions
                .getTodayBrainConversationSession(
                    brain
                ) ||
            actions
                .createTodayBrainConversation(
                    brain
                )
        );

    },


    pushUserMessage(
        actions,
        session,
        text,
        context,
        request
    ){

        if(
            !Array.isArray(
                session.actions
            )
        ){

            session.actions =
                [];

        }


        session.actions.push({

            id:
                actions.createId(
                    "brain-action"
                ),

            requestId:
                request.id,

            role:
                "user",

            type:
                "message",

            content:
                text,

            createdAt:
                Date.now(),

            context:{

                app:
                    context?.app ||
                    null,

                screen:
                    context?.screen ||
                    null,

                page:
                    context?.page ||
                    null,

                entityId:
                    context
                        ?.entity
                        ?.id ||
                    context?.entityId ||
                    null,

                worldId:
                    context
                        ?.world
                        ?.id ||
                    context?.worldId ||
                    null

            },

            appLinks:
                typeof actions.extractBrainAppMentions ===
                    "function"
                    ? actions.extractBrainAppMentions(
                        text
                    )
                    : []

        });


        session.updatedAt =
            Date.now();


        actions.updateBrainConversationSummary(
            session
        );


        actions.saveBrainState();

    },


    pushBrainResponse(
        actions,
        session,
        response,
        replyText,
        context,
        request,
        decisionTrace
    ){

        if(
            response?.confirmation &&
            response.confirmation.id
        ){

            session.pendingConfirmation = {

                ...response.confirmation,

                prompt:
                    request.text,

                context:
                    context &&
                    typeof context ===
                        "object"
                        ? {
                            ...context
                        }
                        : {},

                actionType:
                    this.getActionType(
                        response
                    ),

                receivedAt:
                    Date.now()

            };

        }

        else if(
            response?.confirmationApproved ===
                true ||
            response?.executed ===
                true ||
            response?.blocked ===
                true
        ){

            session.pendingConfirmation =
                null;

        }


        if(replyText){

            session.actions.push({

                id:
                    actions.createId(
                        "brain-action"
                    ),

                requestId:
                    request.id,

                role:
                    "brain",

                type:
                    (
                        response?.requiresConfirmation &&
                        !response?.confirmationApproved
                    )
                        ? "confirmation-required"
                        : "reply",

                content:
                    replyText,

                createdAt:
                    Date.now(),

                confirmationId:
                    response
                        ?.confirmation
                        ?.id ||
                    null,

                requiresConfirmation:
                    Boolean(
                        response
                            ?.requiresConfirmation
                    ),

                blocked:
                    Boolean(
                        response?.blocked
                    ),

                executed:
                    Boolean(
                        response?.executed
                    ),

                actionType:
                    this.getActionType(
                        response
                    ),

                intent:
                    this.getIntent(
                        response
                    ),

                confidence:
                    this.getConfidence(
                        response
                    ),

                decisionTrace:
                    decisionTrace ||
                    null,

                context:{

                    app:
                        context?.app ||
                        null,

                    screen:
                        context?.screen ||
                        null,

                    page:
                        context?.page ||
                        null

                },

                appLinks:
                    typeof actions.extractBrainAppMentions ===
                        "function"
                        ? actions.extractBrainAppMentions(
                            replyText
                        )
                        : []

            });

        }


        session.updatedAt =
            Date.now();


        actions.updateBrainConversationSummary(
            session
        );


        actions.saveBrainState();

    },


    /* =====================================================
       UI CONTINUITY

       Navigation may replace Brain DOM while an action
       is running. Re-open Brain so the produced answer
       stays visible.
    ===================================================== */

    restoreBrainSurface(actions){

        try{

            if(
                !document.getElementById(
                    "brainHistory"
                )
            ){

                document
                    .getElementById(
                        "brainPanel"
                    )
                    ?.remove();


                if(
                    typeof actions.openBrain ===
                        "function"
                ){

                    actions.openBrain();

                }

            }


            if(
                typeof actions.renderBrainHistory ===
                    "function"
            ){

                actions.renderBrainHistory();

            }

        } catch(error){

            console.warn(
                "Brain surface could not be restored:",
                error
            );

        }

    },


    refreshBrainApp(
        session
    ){

        try{

            window.BrainApp
                ?.refreshConfirmation?.(
                    session
                        ?.pendingConfirmation ||
                    null
                );


            window.BrainApp
                ?.refreshStatus?.();


            window.BrainApp
                ?.focusInput?.();

        } catch(error){

            /* non-fatal */

        }

    },


    setBusy(
        state,
        label = null
    ){

        try{

            window.BrainApp
                ?.setBusy?.(
                    Boolean(
                        state
                    ),
                    label ||
                    undefined
                );

        } catch(error){

            /* non-fatal */

        }

    },


    /* =====================================================
       GATEWAY EXECUTION
    ===================================================== */

    async executeGateway(
        gateway,
        brain,
        text,
        context,
        request
    ){

        if(
            gateway &&
            typeof gateway.ask ===
                "function"
        ){

            return await Promise.resolve(

                gateway.ask(
                    text,
                    {

                        context,

                        compactContext:
                            false,

                        intelligence:{

                            requestId:
                                request.id,

                            learningEnabled:
                                true,

                            outcomeFeedback:
                                true

                        }

                    }
                )

            );

        }


        if(
            brain &&
            typeof brain.ask ===
                "function"
        ){

            return await Promise.resolve(

                brain.ask(
                    text,
                    {

                        context,

                        requestId:
                            request.id

                    }
                )

            );

        }


        if(
            brain &&
            typeof brain.receive ===
                "function"
        ){

            return await Promise.resolve(

                brain.receive(
                    text,
                    context
                )

            );

        }


        return {

            reply:
                "Brain servis bağlantısı hazır değil.",

            error:
                true,

            intelligenceError:
                "brain-gateway-unavailable"

        };

    },


    /* =====================================================
       MAIN BRAIN PIPELINE
    ===================================================== */

    async sendMessage(actions){

        if(
            !actions ||
            typeof actions !==
                "object"
        ){

            return false;

        }


        if(
            actions.brainSending
        ){

            return false;

        }


        const input =
            document.getElementById(
                "brainInput"
            );


        if(!input){

            return false;

        }


        const text =
            this.normalizeText(
                input.value,
                12000
            );


        if(!text){

            return false;

        }


        const brain =
            typeof actions.getService ===
                "function"
                ? actions.getService(
                    "brain"
                )
                : null;


        if(!brain){

            return false;

        }


        const gateway =
            this.getGateway(
                actions
            );

        const memory =
            this.getMemory(
                actions
            );
       const intelligence =
    this.getIntelligence();


        let context =
            this.buildContext(
                actions,
                text
            );


        const learning =
            this.getLearningContext(
                memory,
                text,
                context
            );


        context =
            this.attachLearningContext(
                context,
                learning
            );


        const request =
            this.createRequest(
                text,
                context
            );
       let intelligenceDecision =
    null;


if(
    intelligence &&
    typeof intelligence.decide ===
        "function"
){

    try{

        intelligenceDecision =
            await intelligence.decide({

                text,

                context,

                metadata:{

                    requestId:
                        request.id,

                    source:
                        "actions-brain"

                }

            });

    } catch(error){

        console.warn(
            "Brain Intelligence decision failed:",
            error
        );

    }

}

       if(
    intelligenceDecision
){

    const intelligenceTrace =
        typeof intelligence
            ?.toDecisionTrace ===
            "function"
            ? intelligence.toDecisionTrace(
                intelligenceDecision
            )
            : {
                decisionId:
                    intelligenceDecision.id,

                mode:
                    intelligenceDecision.mode,

                reason:
                    intelligenceDecision.reason,

                confidence:
                    intelligenceDecision.confidence
            };


    context = {
        ...context,

        intelligence:
            intelligenceTrace
    };

}


        const session =
            this.getSession(
                actions,
                brain
            );


        if(!session){

            this.finishRequest(
                request,
                "session-failed"
            );


            return false;

        }


        this.pushUserMessage(
            actions,
            session,
            text,
            context,
            request
        );


        input.value =
            "";


        actions.brainSending =
            true;


        this.setBusy(
            true,
            learning
                ? "Brain düşünüyor ve hafızasını kullanıyor..."
                : "Brain düşünüyor..."
        );


        if(
            typeof actions.renderBrainHistory ===
                "function"
        ){

            actions.renderBrainHistory();

        }


        let rawResponse =
            null;


        try{

            rawResponse =
                await this.executeGateway(
                    gateway,
                    brain,
                    text,
                    context,
                    request
                );

        } catch(error){

            console.error(
                "ActionsBrain request failed:",
                error
            );


            rawResponse = {

                reply:
                    "Brain isteği şu anda tamamlanamadı.",

                error:
                    true,

                intelligenceError:
                    error?.message ||
                    String(
                        error
                    )

            };

        }


        const response =
            this.normalizeResponse(
                rawResponse
            );


        this.lastResponse =
            this.clone(
                response
            );


        const outcome =
            this.evaluateOutcome(
                response
            );


        this.recordLearning(
            memory,
            {

                request,
                text,
                context,
                response,
                outcome

            }
        );


        const decisionTrace =
            this.createDecisionTrace(
                memory,
                {

                    request,
                    text,
                    response,
                    outcome

                }
            );


        const replyText =
            this.getReplyText(
                response
            );


        this.pushBrainResponse(
            actions,
            session,
            response,
            replyText,
            context,
            request,
            decisionTrace
        );


        this.finishRequest(
            request,
            outcome.error
                ? "failed"
                : outcome.status
        );


        actions.brainSending =
            false;


        this.setBusy(
            false
        );


        this.restoreBrainSurface(
            actions
        );


        this.refreshBrainApp(
            session
        );


        this.emit(
            "brain:intelligence:completed",
            {

                requestId:
                    request.id,

                status:
                    outcome.status,

                successful:
                    outcome.successful,

                executed:
                    outcome.executed,

                blocked:
                    outcome.blocked,

                error:
                    outcome.error,

                intent:
                    this.getIntent(
                        response
                    ),

                actionType:
                    this.getActionType(
                        response
                    ),

                confidence:
                    this.getConfidence(
                        response
                    ),

                duration:
                    request.duration,

                learned:
                    Boolean(
                        memory
                    ),

                time:
                    Date.now()

            }
        );


        return response;

    },


    /* =====================================================
       USER CORRECTION

       This will later be exposed directly through Brain UI.
    ===================================================== */

    correct(
        originalCommand,
        correction,
        metadata = {}
    ){

        const memory =
            this.getMemory();


        if(
            !memory ||
            typeof memory.recordCorrection !==
                "function"
        ){

            return false;

        }


        try{

            return memory.recordCorrection({

                originalCommand:
                    this.normalizeText(
                        originalCommand
                    ),

                correction:
                    this.normalizeText(
                        correction
                    ),

                authority:
                    "user",

                metadata:
                    this.clone(
                        metadata
                    ) ||
                    {},

                createdAt:
                    Date.now()

            });

        } catch(error){

            console.warn(
                "Brain correction could not be recorded:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       LEARNING HEALTH
    ===================================================== */

    learningHealth(){

        const memory =
            this.getMemory();


        if(
            !memory ||
            typeof memory.learningHealth !==
                "function"
        ){

            return {

                available:
                    false,

                reason:
                    "brain-memory-unavailable"

            };

        }


        try{

            return {

                available:
                    true,

                ...(
                    memory.learningHealth() ||
                    {}
                )

            };

        } catch(error){

            return {

                available:
                    false,

                reason:
                    "learning-health-failed"

            };

        }

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            version:
                this.version,

            initialized:
                this.initialized,

            initializedAt:
                this.initializedAt,

            activeRequests:
                this.activeRequests.size,

            lastRequest:
                this.lastRequest
                    ? {

                        id:
                            this.lastRequest.id,

                        status:
                            this.lastRequest.status,

                        startedAt:
                            this.lastRequest.startedAt,

                        completedAt:
                            this.lastRequest.completedAt,

                        duration:
                            this.lastRequest.duration

                    }
                    : null,

            lastResponse:{

                intent:
                    this.getIntent(
                        this.lastResponse
                    ),

                actionType:
                    this.getActionType(
                        this.lastResponse
                    ),

                confidence:
                    this.getConfidence(
                        this.lastResponse
                    ),

                executed:
                    this.lastResponse
                        ?.executed ===
                        true,

                blocked:
                    this.lastResponse
                        ?.blocked ===
                        true,

                error:
                    this.lastResponse
                        ?.error ===
                        true

            },

            learningHealth:
                this.learningHealth(),

            time:
                Date.now()

        };

    },


    /* =====================================================
       INIT
    ===================================================== */

    init(){

        if(
            this.initialized
        ){

            return this;

        }


        this.initialized =
            true;

        this.initializedAt =
            Date.now();


        this.emit(
            "brain:intelligence:ready",
            {

                version:
                    this.version,

                time:
                    this.initializedAt

            }
        );


        return this;

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
            "actionsBrain",
            ActionsBrain
        );

    }

} catch(error){

    console.warn(
        "ActionsBrain could not be registered:",
        error
    );

}


window.ActionsBrain =
    ActionsBrain;


ActionsBrain.init();
