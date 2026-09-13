/* =========================================================
   VAERO BRAIN INTELLIGENCE
   Decision / Confidence / Risk / Memory / Autonomy Layer

   Intent
   → Context
   → Memory
   → Decision
   → Action Policy
   → Outcome
   → Feedback
========================================================= */

const BrainIntelligence = {

    version:
        "1.0.0",

    initialized:
        false,

    initializedAt:
        null,

    minimumActConfidence:
        0.72,

    minimumAskConfidence:
        0.42,

    minimumMemoryInfluence:
        0.20,

    highRiskThreshold:
        0.70,

    criticalRiskThreshold:
        0.90,

    maxDecisionHistory:
        300,

    decisions:
        [],

    metrics:{

        decisions:
            0,

        act:
            0,

        ask:
            0,

        confirm:
            0,

        blocked:
            0,

        memoryInfluenced:
            0,

        corrections:
            0,

        successful:
            0,

        failed:
            0,

        lastDecisionAt:
            null

    },


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

            /* optional service */

        }


        return null;

    },


    getMemory(){

        return (
            this.getService(
                "brainMemory"
            ) ||
            window.BrainMemory ||
            null
        );

    },


    getContextService(){

        return (
            this.getService(
                "brainContext"
            ) ||
            window.BrainContext ||
            null
        );

    },


    getIntentService(){

        return (
            this.getService(
                "brainIntent"
            ) ||
            window.BrainIntent ||
            null
        );

    },


    getActionPolicy(){

        return (
            this.getService(
                "brainActionPolicy"
            ) ||
            window.BrainActionPolicy ||
            null
        );

    },


    getEngineSession(){

        return (
            this.getService(
                "engineSession"
            ) ||
            window.EngineSession ||
            null
        );

    },


    getInteraction(){

        return (
            this.getService(
                "interaction"
            ) ||
            window.InteractionCore ||
            null
        );

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

            /* fallback */

        }


        return (
            window.Engine ||
            null
        );

    },


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    createId(
        prefix =
            "brain-decision"
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


        return (
            prefix +
            "-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 10)
        );

    },


    number(
        value,
        fallback = 0
    ){

        const numeric =
            Number(
                value
            );


        return Number.isFinite(
            numeric
        )
            ? numeric
            : fallback;

    },


    clamp(
        value,
        minimum = 0,
        maximum = 1
    ){

        return Math.max(
            minimum,
            Math.min(
                maximum,
                this.number(
                    value,
                    minimum
                )
            )
        );

    },


    normalizeText(
        value,
        maxLength = 12000
    ){

        return String(
            value ||
            ""
        )
            .trim()
            .slice(
                0,
                maxLength
            );

    },


    clone(value){

        if(
            value ===
            undefined
        ){

            return undefined;

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


    safeObject(value){

        return (
            value &&
            typeof value ===
                "object" &&
            !Array.isArray(
                value
            )
        )
            ? value
            : {};

    },


    unique(values){

        return Array.from(
            new Set(
                (
                    Array.isArray(
                        values
                    )
                        ? values
                        : []
                )
                    .filter(
                        Boolean
                    )
                    .map(
                        value =>
                            String(
                                value
                            )
                                .trim()
                    )
                    .filter(
                        Boolean
                    )
            )
        );

    },


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

        } catch(error){

            /* non-fatal */

        }


        try{

            window.dispatchEvent(
                new CustomEvent(
                    eventName,
                    {
                        detail:
                            payload
                    }
                )
            );

            return true;

        } catch(error){

            return false;

        }

    },


    /* =====================================================
       CONTEXT NORMALIZATION
    ===================================================== */

    normalizeApplicationContext(
        applicationContext
    ){

        const source =
            this.safeObject(
                applicationContext
            );


        const safe = {
            ...source
        };


        delete safe.accessToken;
        delete safe.token;
        delete safe.masterToken;
        delete safe.sessionToken;
        delete safe.authorization;


        return safe;

    },


    buildFallbackContext(){

        const engine =
            this.getEngine();


        return {

            page:
                engine?.currentPage ||
                engine?.page ||
                null,

            view:
                engine?.currentView ||
                engine?.view ||
                null,

            world:
                engine?.currentWorld ||
                null,

            entityId:
                engine
                    ?.currentOpenedEntity
                    ?.id ||
                engine
                    ?.currentEntity
                    ?.id ||
                null,

            applicationContext:
                this
                    .normalizeApplicationContext(
                        engine
                            ?.currentApplicationContext
                    )

        };

    },


    async resolveContext(
        text,
        suppliedContext = {}
    ){

        const contextService =
            this.getContextService();


        const base = {
            ...this.buildFallbackContext(),
            ...this.safeObject(
                suppliedContext
            )
        };


        base.applicationContext =
            this
                .normalizeApplicationContext(
                    base.applicationContext
                );


        if(
            !contextService
        ){

            return base;

        }


        const candidates = [

            "build",

            "resolve",

            "create",

            "getContext",

            "buildContext"

        ];


        for(
            const method of
            candidates
        ){

            if(
                typeof contextService[
                    method
                ] !==
                    "function"
            ){

                continue;

            }


            try{

                const resolved =
                    await Promise.resolve(
                        contextService[
                            method
                        ](
                            text,
                            base
                        )
                    );


                if(
                    resolved &&
                    typeof resolved ===
                        "object"
                ){

                    return {
                        ...base,
                        ...resolved,

                        applicationContext:
                            this
                                .normalizeApplicationContext(
                                    resolved
                                        .applicationContext ||
                                    base
                                        .applicationContext
                                )
                    };

                }

            } catch(error){

                /* try next resolver */

            }

        }


        return base;

    },


    /* =====================================================
       INTENT NORMALIZATION
    ===================================================== */

    normalizeIntent(
        rawIntent,
        fallbackText =
            ""
    ){

        if(
            typeof rawIntent ===
                "string"
        ){

            return {

                name:
                    rawIntent,

                confidence:
                    0.50,

                source:
                    "string"

            };

        }


        const source =
            this.safeObject(
                rawIntent
            );


        const name =
            this.normalizeText(
                source.intent ||
                source.name ||
                source.type ||
                source.action ||
                source.actionType ||
                fallbackText ||
                "unknown",
                180
            );


        return {

            ...source,

            name:
                name ||
                "unknown",

            confidence:
                this.clamp(
                    source.confidence ??
                    source.score ??
                    source.probability ??
                    0.50
                ),

            actionType:
                this.normalizeText(
                    source.actionType ||
                    source.action ||
                    "",
                    180
                ) ||
                null,

            target:
                source.target ||
                source.entity ||
                source.app ||
                null

        };

    },


    async resolveIntent(
        text,
        suppliedIntent = null,
        context = {}
    ){

        if(
            suppliedIntent
        ){

            return this.normalizeIntent(
                suppliedIntent,
                text
            );

        }


        const intentService =
            this.getIntentService();


        if(
            !intentService
        ){

            return this.normalizeIntent(
                {
                    name:
                        "unknown",

                    confidence:
                        0.35
                },
                text
            );

        }


        const candidates = [

            "detect",

            "resolve",

            "parse",

            "classify",

            "understand"

        ];


        for(
            const method of
            candidates
        ){

            if(
                typeof intentService[
                    method
                ] !==
                    "function"
            ){

                continue;

            }


            try{

                const result =
                    await Promise.resolve(
                        intentService[
                            method
                        ](
                            text,
                            context
                        )
                    );


                if(result){

                    return this
                        .normalizeIntent(
                            result,
                            text
                        );

                }

            } catch(error){

                /* try next */

            }

        }


        return this.normalizeIntent(
            {
                name:
                    "unknown",

                confidence:
                    0.35
            },
            text
        );

    },


    /* =====================================================
       MEMORY RETRIEVAL
    ===================================================== */

    async retrieveMemory(
        text,
        context = {},
        intent = null
    ){

        const memory =
            this.getMemory();


        if(!memory){

            return {

                available:
                    false,

                items:
                    [],

                confidence:
                    0,

                influence:
                    0

            };

        }


        let learningContext =
            null;


        if(
            typeof memory
                .getLearningContext ===
                "function"
        ){

            try{

                learningContext =
                    await Promise.resolve(
                        memory
                            .getLearningContext(
                                text,
                                {
                                    context:
                                        this.clone(
                                            context
                                        ),

                                    intent:
                                        this.clone(
                                            intent
                                        )
                                }
                            )
                    );

            } catch(error){

                learningContext =
                    null;

            }

        }


        if(
            !learningContext &&
            typeof memory.retrieve ===
                "function"
        ){

            try{

                learningContext =
                    await Promise.resolve(
                        memory.retrieve(
                            text,
                            {
                                context,
                                intent
                            }
                        )
                    );

            } catch(error){

                learningContext =
                    null;

            }

        }


        const source =
            this.safeObject(
                learningContext
            );


        const items =
            Array.isArray(
                source.items
            )
                ? source.items
                : Array.isArray(
                    source.memories
                )
                    ? source.memories
                    : Array.isArray(
                        learningContext
                    )
                        ? learningContext
                        : [];


        const confidence =
            this.clamp(
                source.confidence ??
                source.score ??
                (
                    items.length
                        ? 0.55
                        : 0
                )
            );


        const influence =
            this.calculateMemoryInfluence(
                items,
                confidence
            );


        return {

            available:
                true,

            raw:
                learningContext,

            items:
                this.clone(
                    items
                ) ||
                [],

            confidence,

            influence

        };

    },


    calculateMemoryInfluence(
        items,
        confidence
    ){

        if(
            !Array.isArray(
                items
            ) ||
            !items.length
        ){

            return 0;

        }


        const relevanceValues =
            items
                .map(
                    item =>
                        this.clamp(
                            item?.relevance ??
                            item?.score ??
                            item?.confidence ??
                            0.50
                        )
                );


        const relevance =
            relevanceValues.reduce(
                (
                    total,
                    value
                ) =>
                    total +
                    value,
                0
            ) /
            relevanceValues.length;


        return this.clamp(
            (
                relevance *
                0.65
            ) +
            (
                this.clamp(
                    confidence
                ) *
                0.35
            )
        );

    },


    /* =====================================================
       RISK MODEL
    ===================================================== */

    getRiskWords(){

        return {

            destructive:[

                "delete",
                "remove",
                "erase",
                "destroy",
                "sil",
                "kaldır",
                "yok et",
                "temizle"

            ],

            financial:[

                "pay",
                "payment",
                "purchase",
                "buy",
                "checkout",
                "refund",
                "ödeme",
                "öde",
                "satın al",
                "iade"

            ],

            identity:[

                "identity",
                "profile",
                "account",
                "password",
                "login",
                "kimlik",
                "hesap",
                "şifre",
                "oturum"

            ],

            permission:[

                "permission",
                "grant",
                "authorize",
                "revoke",
                "izin",
                "yetki",
                "erişim"

            ],

            publish:[

                "publish",
                "post",
                "send",
                "message",
                "share",
                "yayınla",
                "gönder",
                "paylaş"

            ]

        };

    },


    detectRiskSignals(
        text,
        intent = {},
        context = {}
    ){

        const normalized =
            this.normalizeText(
                text
            )
                .toLocaleLowerCase(
                    "tr-TR"
                );


        const groups =
            this.getRiskWords();


        const signals =
            [];


        Object.entries(
            groups
        )
            .forEach(
                ([
                    category,
                    words
                ]) => {

                    const matched =
                        words.some(
                            word =>
                                normalized.includes(
                                    String(
                                        word
                                    )
                                        .toLocaleLowerCase(
                                            "tr-TR"
                                        )
                                )
                        );


                    if(matched){

                        signals.push(
                            category
                        );

                    }

                }
            );


        const actionType =
            String(
                intent?.actionType ||
                intent?.name ||
                ""
            )
                .toLowerCase();


        if(
            actionType.includes(
                "delete"
            ) ||
            actionType.includes(
                "remove"
            )
        ){

            signals.push(
                "destructive"
            );

        }


        if(
            context?.sensitive ===
                true
        ){

            signals.push(
                "sensitive-context"
            );

        }


        return this.unique(
            signals
        );

    },


    calculateRisk(
        text,
        intent = {},
        context = {}
    ){

        const signals =
            this.detectRiskSignals(
                text,
                intent,
                context
            );


        let score =
            0.08;


        const weights = {

            destructive:
                0.62,

            financial:
                0.78,

            identity:
                0.58,

            permission:
                0.66,

            publish:
                0.42,

            "sensitive-context":
                0.35

        };


        signals.forEach(
            signal => {

                score +=
                    weights[
                        signal
                    ] ||
                    0.10;

            }
        );


        if(
            signals.length >
                1
        ){

            score +=
                0.08 *
                (
                    signals.length -
                    1
                );

        }


        return {

            score:
                this.clamp(
                    score
                ),

            signals,

            level:
                score >=
                    this
                        .criticalRiskThreshold
                    ? "critical"
                    : score >=
                        this
                            .highRiskThreshold
                        ? "high"
                        : score >=
                            0.40
                            ? "medium"
                            : "low"

        };

    },


    /* =====================================================
       TRUST / SESSION
    ===================================================== */

    resolveTrust(
        context = {},
        intent = {}
    ){

        const session =
            this.getEngineSession();


        const result = {

            available:
                Boolean(
                    session
                ),

            trusted:
                true,

            requiresStepUp:
                false,

            score:
                0.50,

            reason:
                null

        };


        if(!session){

            return result;

        }


        try{

            if(
                typeof session
                    .getTrustLevel ===
                    "function"
            ){

                const level =
                    session
                        .getTrustLevel(
                            context
                        );


                if(
                    typeof level ===
                        "number"
                ){

                    result.score =
                        this.clamp(
                            level
                        );

                } else if(
                    level &&
                    typeof level ===
                        "object"
                ){

                    result.score =
                        this.clamp(
                            level.score ??
                            level.trust ??
                            0.50
                        );

                    result.trusted =
                        level.trusted !==
                            false;

                }

            }

        } catch(error){

            /* optional */

        }


        try{

            if(
                typeof session
                    .requiresStepUp ===
                    "function"
            ){

                result.requiresStepUp =
                    session
                        .requiresStepUp(
                            intent
                                .actionType ||
                            intent.name,
                            context
                        ) ===
                        true;

            }

        } catch(error){

            /* optional */

        }


        return result;

    },


    /* =====================================================
       CONFIDENCE MODEL
    ===================================================== */

    calculateConfidence({
        intent,
        memory,
        context,
        trust,
        ambiguity = 0
    }){

        const intentConfidence =
            this.clamp(
                intent?.confidence ??
                0.35
            );


        const memoryConfidence =
            this.clamp(
                memory?.confidence ??
                0
            );


        const trustScore =
            this.clamp(
                trust?.score ??
                0.50
            );


        const contextScore =
            context &&
            Object.keys(
                context
            ).length
                ? 0.70
                : 0.35;


        const ambiguityPenalty =
            this.clamp(
                ambiguity
            ) *
            0.30;


        let score =

            (
                intentConfidence *
                0.55
            ) +

            (
                memoryConfidence *
                0.18
            ) +

            (
                trustScore *
                0.12
            ) +

            (
                contextScore *
                0.15
            );


        score -=
            ambiguityPenalty;


        return this.clamp(
            score
        );

    },


    detectAmbiguity(
        text,
        intent = {}
    ){

        const normalized =
            this.normalizeText(
                text
            );


        if(!normalized){

            return 1;

        }


        let ambiguity =
            0;


        if(
            normalized.length <
                4
        ){

            ambiguity +=
                0.35;

        }


        if(
            (
                intent?.name ===
                    "unknown" ||
                !intent?.name
            )
        ){

            ambiguity +=
                0.40;

        }


        if(
            this.number(
                intent?.confidence,
                0
            ) <
                0.40
        ){

            ambiguity +=
                0.30;

        }


        const vagueWords = [

            "şunu",
            "bunu",
            "onu",
            "orada",
            "öyle",
            "thing",
            "that",
            "it"

        ];


        const lower =
            normalized
                .toLocaleLowerCase(
                    "tr-TR"
                );


        if(
            vagueWords.some(
                word =>
                    lower ===
                        word ||
                    lower.startsWith(
                        word +
                        " "
                    )
            )
        ){

            ambiguity +=
                0.25;

        }


        return this.clamp(
            ambiguity
        );

    },


    /* =====================================================
       ACTION POLICY BRIDGE
    ===================================================== */

    async inspectActionPolicy(
        request
    ){

        const policy =
            this.getActionPolicy();


        if(!policy){

            return {

                available:
                    false,

                allowed:
                    true,

                requiresConfirmation:
                    false,

                reason:
                    null

            };

        }


        const candidates = [

            "evaluate",

            "check",

            "resolve",

            "authorize",

            "inspect"

        ];


        for(
            const method of
            candidates
        ){

            if(
                typeof policy[
                    method
                ] !==
                    "function"
            ){

                continue;

            }


            try{

                const response =
                    await Promise.resolve(
                        policy[
                            method
                        ](
                            request
                        )
                    );


                if(
                    typeof response ===
                        "boolean"
                ){

                    return {

                        available:
                            true,

                        allowed:
                            response,

                        requiresConfirmation:
                            false,

                        reason:
                            response
                                ? null
                                : "policy-blocked",

                        raw:
                            response

                    };

                }


                if(
                    response &&
                    typeof response ===
                        "object"
                ){

                    return {

                        available:
                            true,

                        allowed:
                            response.allowed !==
                                false &&
                            response.blocked !==
                                true,

                        requiresConfirmation:
                            response
                                .requiresConfirmation ===
                                    true ||
                            response
                                .confirm ===
                                    true,

                        requiresStepUp:
                            response
                                .requiresStepUp ===
                                    true,

                        reason:
                            response.reason ||
                            null,

                        raw:
                            response

                    };

                }

            } catch(error){

                /* try next */

            }

        }


        return {

            available:
                true,

            allowed:
                true,

            requiresConfirmation:
                false,

            reason:
                null

        };

    },


    /* =====================================================
       DECISION ENGINE
    ===================================================== */

    chooseMode({
        confidence,
        risk,
        trust,
        policy,
        ambiguity
    }){

        if(
            policy?.allowed ===
                false
        ){

            return {

                mode:
                    "blocked",

                reason:
                    policy.reason ||
                    "policy-blocked"

            };

        }


        if(
            trust?.requiresStepUp ===
                true ||
            policy?.requiresStepUp ===
                true
        ){

            return {

                mode:
                    "confirm",

                reason:
                    "step-up-required"

            };

        }


        if(
            policy
                ?.requiresConfirmation ===
                true
        ){

            return {

                mode:
                    "confirm",

                reason:
                    "policy-confirmation"

            };

        }


        if(
            risk?.score >=
                this
                    .highRiskThreshold
        ){

            return {

                mode:
                    "confirm",

                reason:
                    "high-risk-action"

            };

        }


        if(
            ambiguity >=
                0.60
        ){

            return {

                mode:
                    "ask",

                reason:
                    "ambiguous-request"

            };

        }


        if(
            confidence >=
                this
                    .minimumActConfidence &&
            risk?.score <
                this
                    .highRiskThreshold
        ){

            return {

                mode:
                    "act",

                reason:
                    "confidence-sufficient"

            };

        }


        if(
            confidence >=
                this
                    .minimumAskConfidence
        ){

            return {

                mode:
                    "ask",

                reason:
                    "clarification-recommended"

            };

        }


        return {

            mode:
                "ask",

            reason:
                "confidence-low"

        };

    },


    buildClarificationQuestion(
        text,
        intent,
        context,
        reason
    ){

        const target =
            intent?.target ||
            context?.entityId ||
            context
                ?.applicationContext
                ?.appId ||
            null;


        if(
            reason ===
                "ambiguous-request"
        ){

            return target
                ? (
                    "Bu işlemi " +
                    target +
                    " üzerinde mi yapmamı istiyorsun?"
                )
                : "Tam olarak hangi işlemle devam etmemi istiyorsun?";

        }


        if(
            reason ===
                "confidence-low"
        ){

            return "Ne yapmamı istediğini biraz daha net yazar mısın?";

        }


        return "Devam etmeden önce ne yapmak istediğini netleştirebilir misin?";

    },


    buildConfirmation(
        decision
    ){

        const intent =
            decision.intent ||
            {};


        const action =
            intent.actionType ||
            intent.name ||
            "işlem";


        const riskSignals =
            decision.risk
                ?.signals ||
            [];


        let message =
            `"${action}" işlemini uygulamam için onay gerekiyor.`;


        if(
            riskSignals.includes(
                "financial"
            )
        ){

            message =
                "Bu işlem ödeme veya satın alma etkisi oluşturabilir. Devam edeyim mi?";

        } else if(
            riskSignals.includes(
                "destructive"
            )
        ){

            message =
                "Bu işlem veri veya içerik kaldırabilir. Devam edeyim mi?";

        } else if(
            riskSignals.includes(
                "permission"
            )
        ){

            message =
                "Bu işlem izin veya yetki değişikliği yapabilir. Devam edeyim mi?";

        } else if(
            riskSignals.includes(
                "publish"
            )
        ){

            message =
                "Bu işlem dışarıya içerik gönderebilir veya yayınlayabilir. Devam edeyim mi?";

        }


        return {

            required:
                true,

            message,

            actionType:
                action,

            risk:
                decision.risk,

            decisionId:
                decision.id

        };

    },


    /* =====================================================
       MAIN DECISION PIPELINE
    ===================================================== */

    async decide({
        text = "",
        intent = null,
        context = {},
        metadata = {}
    } = {}){

        const startedAt =
            Date.now();


        const command =
            this.normalizeText(
                text
            );


        const requestId =
            this.createId(
                "brain-request"
            );


        const decisionId =
            this.createId(
                "brain-decision"
            );


        const resolvedContext =
            await this
                .resolveContext(
                    command,
                    context
                );


        const resolvedIntent =
            await this
                .resolveIntent(
                    command,
                    intent,
                    resolvedContext
                );


        const memory =
            await this
                .retrieveMemory(
                    command,
                    resolvedContext,
                    resolvedIntent
                );


        const ambiguity =
            this.detectAmbiguity(
                command,
                resolvedIntent
            );


        const risk =
            this.calculateRisk(
                command,
                resolvedIntent,
                resolvedContext
            );


        const trust =
            this.resolveTrust(
                resolvedContext,
                resolvedIntent
            );


        const confidence =
            this.calculateConfidence({

                intent:
                    resolvedIntent,

                memory,

                context:
                    resolvedContext,

                trust,

                ambiguity

            });


        const policy =
            await this
                .inspectActionPolicy({

                    requestId,

                    decisionId,

                    text:
                        command,

                    intent:
                        resolvedIntent,

                    context:
                        resolvedContext,

                    confidence,

                    risk,

                    trust,

                    metadata:
                        this.safeObject(
                            metadata
                        )

                });


        const selection =
            this.chooseMode({

                confidence,

                risk,

                trust,

                policy,

                ambiguity

            });


        const decision = {

            id:
                decisionId,

            requestId,

            mode:
                selection.mode,

            reason:
                selection.reason,

            text:
                command,

            intent:
                resolvedIntent,

            context:
                resolvedContext,

            memory,

            ambiguity,

            risk,

            trust,

            policy,

            confidence,

            createdAt:
                Date.now(),

            durationMs:
                Date.now() -
                startedAt,

            metadata:
                this.safeObject(
                    metadata
                )

        };


        if(
            decision.mode ===
                "ask"
        ){

            decision.question =
                this
                    .buildClarificationQuestion(
                        command,
                        resolvedIntent,
                        resolvedContext,
                        decision.reason
                    );

        }


        if(
            decision.mode ===
                "confirm"
        ){

            decision.confirmation =
                this.buildConfirmation(
                    decision
                );

        }


        this.storeDecision(
            decision
        );


        this.emit(
            "brain:intelligence:decision",
            this.toDecisionTrace(
                decision
            )
        );


        return decision;

    },


    /* =====================================================
       DECISION STORAGE
    ===================================================== */

    storeDecision(
        decision
    ){

        const safe =
            this.clone(
                decision
            );


        if(!safe){

            return false;

        }


        this.decisions.push(
            safe
        );


        if(
            this.decisions.length >
                this.maxDecisionHistory
        ){

            this.decisions =
                this.decisions.slice(
                    -this
                        .maxDecisionHistory
                );

        }


        this.metrics.decisions +=
            1;


        if(
            safe.mode &&
            Object.prototype
                .hasOwnProperty
                .call(
                    this.metrics,
                    safe.mode
                )
        ){

            this.metrics[
                safe.mode
            ] +=
                1;

        }


        if(
            safe.memory
                ?.influence >=
                this
                    .minimumMemoryInfluence
        ){

            this.metrics
                .memoryInfluenced +=
                1;

        }


        this.metrics.lastDecisionAt =
            Date.now();


        return true;

    },


    getDecision(
        decisionId
    ){

        const id =
            String(
                decisionId ||
                ""
            );


        if(!id){

            return null;

        }


        const result =
            this.decisions.find(
                item =>
                    String(
                        item.id
                    ) ===
                    id
            );


        return result
            ? this.clone(
                result
            )
            : null;

    },


    getRecentDecisions(
        limit = 20
    ){

        const safeLimit =
            Math.max(
                1,
                Math.min(
                    100,
                    Number(
                        limit
                    ) ||
                    20
                )
            );


        return this.clone(
            this.decisions
                .slice(
                    -safeLimit
                )
                .reverse()
        ) || [];

    },


    /* =====================================================
       OUTCOME FEEDBACK
    ===================================================== */

    async recordOutcome(
        decisionId,
        outcome = {}
    ){

        const decision =
            this.getDecision(
                decisionId
            );


        if(!decision){

            return false;

        }


        const source =
            this.safeObject(
                outcome
            );


        const success =
            source.success ===
                true ||
            source.executed ===
                true ||
            source.completed ===
                true ||
            source.status ===
                "completed" ||
            source.status ===
                "success";


        if(success){

            this.metrics.successful +=
                1;

        } else {

            this.metrics.failed +=
                1;

        }


        const memory =
            this.getMemory();


        if(
            memory &&
            typeof memory.recordOutcome ===
                "function"
        ){

            try{

                await Promise.resolve(
                    memory.recordOutcome(
                        decision.id,
                        {
                            ...source,

                            command:
                                decision.text,

                            intent:
                                decision.intent,

                            decisionMode:
                                decision.mode,

                            decisionConfidence:
                                decision.confidence,

                            success
                        }
                    )
                );

            } catch(error){

                /* non-fatal */

            }

        }


        this.emit(
            "brain:intelligence:outcome",
            {

                decisionId:
                    decision.id,

                success,

                status:
                    source.status ||
                    null

            }
        );


        return true;

    },


    /* =====================================================
       CORRECTION AUTHORITY
    ===================================================== */

    async correct({
        decisionId = null,
        originalCommand = "",
        correction = "",
        metadata = {}
    } = {}){

        const corrected =
            this.normalizeText(
                correction
            );


        if(!corrected){

            return false;

        }


        let original =
            this.normalizeText(
                originalCommand
            );


        if(
            decisionId &&
            !original
        ){

            original =
                this.getDecision(
                    decisionId
                )?.text ||
                "";

        }


        const memory =
            this.getMemory();


        let recorded =
            false;


        if(
            memory &&
            typeof memory
                .recordCorrection ===
                "function"
        ){

            try{

                const result =
                    await Promise.resolve(
                        memory
                            .recordCorrection(
                                original,
                                corrected,
                                {
                                    decisionId,

                                    metadata:
                                        this.safeObject(
                                            metadata
                                        )
                                }
                            )
                    );


                recorded =
                    result !==
                        false;

            } catch(error){

                recorded =
                    false;

            }

        }


        if(recorded){

            this.metrics.corrections +=
                1;

        }


        this.emit(
            "brain:intelligence:correction",
            {

                decisionId,

                recorded,

                originalCommand:
                    original,

                correction:
                    corrected

            }
        );


        return recorded;

    },


    /* =====================================================
       USER-SAFE DECISION TRACE
       This is an operational explanation.
       It is not hidden chain-of-thought.
    ===================================================== */

    toDecisionTrace(
        decision
    ){

        if(!decision){

            return null;

        }


        return {

            decisionId:
                decision.id,

            requestId:
                decision.requestId,

            mode:
                decision.mode,

            reason:
                decision.reason,

            confidence:
                Number(
                    this
                        .clamp(
                            decision
                                .confidence
                        )
                        .toFixed(
                            3
                        )
                ),

            intent:{

                name:
                    decision
                        .intent
                        ?.name ||
                    null,

                actionType:
                    decision
                        .intent
                        ?.actionType ||
                    null,

                confidence:
                    Number(
                        this
                            .clamp(
                                decision
                                    .intent
                                    ?.confidence ||
                                0
                            )
                            .toFixed(
                                3
                            )
                    )

            },

            risk:{

                level:
                    decision
                        .risk
                        ?.level ||
                    "unknown",

                score:
                    Number(
                        this
                            .clamp(
                                decision
                                    .risk
                                    ?.score ||
                                0
                            )
                            .toFixed(
                                3
                            )
                    ),

                signals:
                    this.clone(
                        decision
                            .risk
                            ?.signals ||
                        []
                    )

            },

            memory:{

                used:
                    Boolean(
                        decision
                            .memory
                            ?.influence >=
                            this
                                .minimumMemoryInfluence
                    ),

                influence:
                    Number(
                        this
                            .clamp(
                                decision
                                    .memory
                                    ?.influence ||
                                0
                            )
                            .toFixed(
                                3
                            )
                    ),

                matches:
                    Array.isArray(
                        decision
                            .memory
                            ?.items
                    )
                        ? decision
                            .memory
                            .items
                            .length
                        : 0

            },

            requiresConfirmation:
                decision.mode ===
                    "confirm",

            requiresClarification:
                decision.mode ===
                    "ask",

            blocked:
                decision.mode ===
                    "blocked",

            durationMs:
                decision.durationMs,

            createdAt:
                decision.createdAt

        };

    },


    explain(
        decisionId
    ){

        const decision =
            this.getDecision(
                decisionId
            );


        return this
            .toDecisionTrace(
                decision
            );

    },


    /* =====================================================
       AUTONOMY BUDGET
    ===================================================== */

    getAutonomyBudget(
        decision
    ){

        if(!decision){

            return {

                level:
                    "none",

                canAct:
                    false

            };

        }


        if(
            decision.mode ===
                "blocked"
        ){

            return {

                level:
                    "none",

                canAct:
                    false,

                reason:
                    decision.reason

            };

        }


        if(
            decision.mode ===
                "confirm"
        ){

            return {

                level:
                    "confirm",

                canAct:
                    false,

                reason:
                    decision.reason

            };

        }


        if(
            decision.mode ===
                "ask"
        ){

            return {

                level:
                    "clarify",

                canAct:
                    false,

                reason:
                    decision.reason

            };

        }


        const risk =
            decision.risk
                ?.score ||
            0;


        if(
            risk <
                0.25 &&
            decision.confidence >=
                0.85
        ){

            return {

                level:
                    "high",

                canAct:
                    true

            };

        }


        return {

            level:
                "standard",

            canAct:
                true

        };

    },


    /* =====================================================
       HEALTH
    ===================================================== */

    health(){

        const total =
            Math.max(
                1,
                this.metrics
                    .decisions
            );


        const successTotal =
            this.metrics
                .successful +
            this.metrics
                .failed;


        return {

            initialized:
                this.initialized,

            version:
                this.version,

            decisions:
                this.metrics
                    .decisions,

            modes:{

                act:
                    this.metrics.act,

                ask:
                    this.metrics.ask,

                confirm:
                    this.metrics
                        .confirm,

                blocked:
                    this.metrics
                        .blocked

            },

            actRate:
                this.metrics.act /
                total,

            clarificationRate:
                this.metrics.ask /
                total,

            confirmationRate:
                this.metrics
                    .confirm /
                total,

            memoryInfluenceRate:
                this.metrics
                    .memoryInfluenced /
                total,

            outcomeSuccessRate:
                successTotal
                    ? (
                        this.metrics
                            .successful /
                        successTotal
                    )
                    : null,

            corrections:
                this.metrics
                    .corrections,

            lastDecisionAt:
                this.metrics
                    .lastDecisionAt

        };

    },


    report(){

        return {

            service:
                "brainIntelligence",

            version:
                this.version,

            initialized:
                this.initialized,

            initializedAt:
                this.initializedAt,

            configuration:{

                minimumActConfidence:
                    this
                        .minimumActConfidence,

                minimumAskConfidence:
                    this
                        .minimumAskConfidence,

                minimumMemoryInfluence:
                    this
                        .minimumMemoryInfluence,

                highRiskThreshold:
                    this
                        .highRiskThreshold,

                criticalRiskThreshold:
                    this
                        .criticalRiskThreshold

            },

            health:
                this.health(),

            recentDecisions:
                this.getRecentDecisions(
                    10
                )

        };

    },


    /* =====================================================
       RESET RUNTIME DECISIONS
    ===================================================== */

    resetRuntime(){

        this.decisions =
            [];


        this.metrics = {

            decisions:
                0,

            act:
                0,

            ask:
                0,

            confirm:
                0,

            blocked:
                0,

            memoryInfluenced:
                0,

            corrections:
                0,

            successful:
                0,

            failed:
                0,

            lastDecisionAt:
                null

        };


        this.emit(
            "brain:intelligence:reset",
            {
                at:
                    Date.now()
            }
        );


        return true;

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

                initializedAt:
                    this.initializedAt

            }
        );


        return this;

    }

};


/* =========================================================
   SERVICE REGISTRATION
========================================================= */

if(
    typeof VAERO !==
        "undefined" &&
    typeof VAERO.register ===
        "function"
){

    VAERO.register(
        "brainIntelligence",
        BrainIntelligence
    );

}


window.BrainIntelligence =
    BrainIntelligence;


BrainIntelligence.init();
