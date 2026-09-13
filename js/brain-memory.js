/* =========================================================
   VAERO BRAIN MEMORY
   Adaptive Learning / Command Memory / Correction Authority
   Preference Memory / Pattern Memory / Retrieval
========================================================= */

const BrainMemory = {

    version:
        "1.0.0",

    storageKey:
        "vaero:brain-memory:v1",

    legacyKeys:[
    "vaero:brain-memory:v4",
    "vaero:brain-memory:v3",
    "vaero:brain-memory:v2"
],

    maxRecords:
        2500,

    maxCommandMemories:
        1200,

    maxCorrectionMemories:
        400,

    maxPreferenceMemories:
        400,

    maxPatternMemories:
        500,

    minimumLearningConfidence:
        0.55,

    minimumRetrievalScore:
        0.20,

    autoPromoteThreshold:
        3,

    initialized:
        false,

    initializedAt:
        null,

    lastRetrievedAt:
        null,

    state:{

        commands:[],

        corrections:[],

        preferences:[],

        patterns:[],

        metrics:{

            commandsRecorded:
                0,

            successfulCommands:
                0,

            failedCommands:
                0,

            correctionsRecorded:
                0,

            preferencesRecorded:
                0,

            patternsPromoted:
                0,

            retrievals:
                0,

            retrievalHits:
                0,

            lastLearningAt:
                null,

            lastCorrectionAt:
                null,

            lastRetrievalAt:
                null

        }

    },


    /* =====================================================
       SAFE ACCESS
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

            /* optional */

        }


        return null;

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

    createId(
        prefix =
            "brain-memory"
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


        const safePrefix =
            String(
                prefix ||
                "brain-memory"
            )
                .trim()
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    "-"
                )
                .slice(
                    0,
                    40
                ) ||
            "brain-memory";


        return `${safePrefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       BASIC NORMALIZATION
    ===================================================== */

    normalizeText(
        value,
        maxLength =
            12000
    ){

        return String(
            value ??
            ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim()
            .slice(
                0,
                maxLength
            );

    },


    normalizeKey(value){

        return this
            .normalizeText(
                value,
                300
            )
            .toLocaleLowerCase(
                "tr-TR"
            )
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[^a-z0-9çğıöşü\s:_-]/gi,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    },


    normalizeNumber(
        value,
        fallback =
            0
    ){

        const number =
            Number(
                value
            );


        return Number.isFinite(
            number
        )
            ? number
            : fallback;

    },


    clamp(
        value,
        min =
            0,
        max =
            1
    ){

        return Math.max(
            min,
            Math.min(
                max,
                this.normalizeNumber(
                    value,
                    min
                )
            )
        );

    },


    clone(value){

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
       SECURITY FILTER
    ===================================================== */

    sanitizeValue(
        value,
        depth =
            0
    ){

        if(
            depth >
                8
        ){

            return null;

        }


        if(
            value ===
                null ||
            value ===
                undefined
        ){

            return value;

        }


        if(
            typeof value ===
                "string"
        ){

            return value
                .slice(
                    0,
                    30000
                );

        }


        if(
            typeof value ===
                "number" ||
            typeof value ===
                "boolean"
        ){

            return value;

        }


        if(
            Array.isArray(
                value
            )
        ){

            return value
                .slice(
                    0,
                    100
                )
                .map(
                    item =>
                        this.sanitizeValue(
                            item,
                            depth +
                                1
                        )
                );

        }


        if(
            typeof value ===
                "object"
        ){

            const blockedKeys =
                new Set([
                    "accessToken",
                    "token",
                    "refreshToken",
                    "password",
                    "secret",
                    "authorization",
                    "authToken",
                    "apiKey",
                    "privateKey",
                    "sessionToken",
                    "cookie",
                    "set-cookie"
                ]);


            const output =
                {};


            Object
                .entries(
                    value
                )
                .slice(
                    0,
                    100
                )
                .forEach(
                    ([
                        key,
                        item
                    ]) => {

                        const cleanKey =
                            String(
                                key
                            );


                        if(
                            blockedKeys.has(
                                cleanKey
                            )
                        ){

                            return;

                        }


                        output[
                            cleanKey
                        ] =
                            this.sanitizeValue(
                                item,
                                depth +
                                    1
                            );

                    }
                );


            return output;

        }


        return null;

    },


    sanitizeContext(
        context =
            {}
    ){

        const engine =
            this.getEngine();


        const safeContext =
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
            )
                ? context
                : {};


        return this.sanitizeValue({

            app:
                safeContext.app ||
                engine
                    ?.currentApplicationContext
                    ?.appId ||
                null,

            screen:
                safeContext.screen ||
                engine?.currentView ||
                null,

            page:
                safeContext.page ||
                engine?.currentEntityPage ||
                null,

            entityId:
                safeContext.entityId ||
                safeContext.entity
                    ?.id ||
                engine
                    ?.currentOpenedEntity
                    ?.id ||
                engine
                    ?.currentEntity
                    ?.id ||
                null,

            worldId:
                safeContext.worldId ||
                safeContext.world
                    ?.id ||
                engine
                    ?.currentWorld
                    ?.id ||
                null,

            contextRef:
                safeContext.contextRef &&
                typeof safeContext
                    .contextRef ===
                    "object"
                    ? safeContext
                        .contextRef
                    : null

        });

    },


    /* =====================================================
       STORAGE
    ===================================================== */

    save(){

        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){

                return false;

            }


            this.prune();


            localStorage.setItem(
                this.storageKey,
                JSON.stringify({

                    version:
                        this.version,

                    state:
                        this.state,

                    savedAt:
                        Date.now()

                })
            );


            return true;

        } catch(error){

            console.warn(
                "Brain Memory kaydedilemedi:",
                error
            );


            return false;

        }

    },


    load(){

        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){

                return false;

            }


            const raw =
                localStorage.getItem(
                    this.storageKey
                );


            if(!raw){

                return this
                    .migrateLegacy();

            }


            const parsed =
                JSON.parse(
                    raw
                );


            if(
                !parsed ||
                typeof parsed !==
                    "object"
            ){

                return false;

            }


            const source =
                parsed.state &&
                typeof parsed.state ===
                    "object"
                    ? parsed.state
                    : parsed;


            this.state =
                this.normalizeState(
                    source
                );


            return true;

        } catch(error){

            console.warn(
                "Brain Memory okunamadı:",
                error
            );


            return false;

        }

    },


    migrateLegacy(){

        if(
            typeof localStorage ===
                "undefined"
        ){

            return false;

        }


        for(
            const key
            of this.legacyKeys
        ){

            try{

                const raw =
                    localStorage
                        .getItem(
                            key
                        );


                if(!raw){

                    continue;

                }


                const parsed =
                    JSON.parse(
                        raw
                    );


                const source =
                    parsed?.state ||
                    parsed;


                if(
                    source &&
                    typeof source ===
                        "object"
                ){

                    this.state =
                        this.normalizeState(
                            source
                        );


                    this.save();


                    return true;

                }

            } catch(error){

                /* try next */

            }

        }


        return false;

    },


    normalizeState(
        state =
            {}
    ){

        const source =
            state &&
            typeof state ===
                "object" &&
            !Array.isArray(
                state
            )
                ? state
                : {};


        return {

            commands:
                Array.isArray(
                    source.commands
                )
                    ? source.commands
                        .filter(
                            Boolean
                        )
                    : [],

            corrections:
                Array.isArray(
                    source.corrections
                )
                    ? source.corrections
                        .filter(
                            Boolean
                        )
                    : [],

            preferences:
                Array.isArray(
                    source.preferences
                )
                    ? source.preferences
                        .filter(
                            Boolean
                        )
                    : [],

            patterns:
                Array.isArray(
                    source.patterns
                )
                    ? source.patterns
                        .filter(
                            Boolean
                        )
                    : [],

            metrics:{

                commandsRecorded:
                    this.normalizeNumber(
                        source.metrics
                            ?.commandsRecorded
                    ),

                successfulCommands:
                    this.normalizeNumber(
                        source.metrics
                            ?.successfulCommands
                    ),

                failedCommands:
                    this.normalizeNumber(
                        source.metrics
                            ?.failedCommands
                    ),

                correctionsRecorded:
                    this.normalizeNumber(
                        source.metrics
                            ?.correctionsRecorded
                    ),

                preferencesRecorded:
                    this.normalizeNumber(
                        source.metrics
                            ?.preferencesRecorded
                    ),

                patternsPromoted:
                    this.normalizeNumber(
                        source.metrics
                            ?.patternsPromoted
                    ),

                retrievals:
                    this.normalizeNumber(
                        source.metrics
                            ?.retrievals
                    ),

                retrievalHits:
                    this.normalizeNumber(
                        source.metrics
                            ?.retrievalHits
                    ),

                lastLearningAt:
                    source.metrics
                        ?.lastLearningAt ||
                    null,

                lastCorrectionAt:
                    source.metrics
                        ?.lastCorrectionAt ||
                    null,

                lastRetrievalAt:
                    source.metrics
                        ?.lastRetrievalAt ||
                    null

            }

        };

    },


    /* =====================================================
       TOKENIZATION / SIMILARITY
    ===================================================== */

    tokenize(text){

        const normalized =
            this.normalizeKey(
                text
            );


        if(!normalized){

            return [];

        }


        const stopWords =
            new Set([
                "bir",
                "bu",
                "şu",
                "su",
                "ve",
                "ile",
                "de",
                "da",
                "mi",
                "mı",
                "mu",
                "mü",
                "the",
                "a",
                "an",
                "to",
                "and",
                "of",
                "in",
                "on"
            ]);


        return normalized
            .split(
                " "
            )
            .map(
                item =>
                    item.trim()
            )
            .filter(
                item =>
                    item.length >
                        1 &&
                    !stopWords.has(
                        item
                    )
            );

    },


    similarity(
        first,
        second
    ){

        const a =
            this.normalizeKey(
                first
            );

        const b =
            this.normalizeKey(
                second
            );


        if(
            !a ||
            !b
        ){

            return 0;

        }


        if(
            a ===
            b
        ){

            return 1;

        }


        if(
            a.includes(
                b
            ) ||
            b.includes(
                a
            )
        ){

            return 0.82;

        }


        const tokensA =
            new Set(
                this.tokenize(
                    a
                )
            );


        const tokensB =
            new Set(
                this.tokenize(
                    b
                )
            );


        if(
            tokensA.size ===
                0 ||
            tokensB.size ===
                0
        ){

            return 0;

        }


        let intersection =
            0;


        tokensA.forEach(
            token => {

                if(
                    tokensB.has(
                        token
                    )
                ){

                    intersection +=
                        1;

                }

            }
        );


        const union =
            new Set([
                ...tokensA,
                ...tokensB
            ]).size;


        return union
            ? intersection /
                union
            : 0;

    },


    /* =====================================================
       COMMAND MEMORY
    ===================================================== */

    recordCommand(
        data =
            {}
    ){

        const command =
            this.normalizeText(
                data.command ||
                data.prompt ||
                data.message,
                12000
            );


        if(!command){

            return null;

        }


        const intent =
            this.sanitizeValue(
                data.intent ||
                null
            );


        const action =
            this.sanitizeValue(
                data.action ||
                data.actionType ||
                null
            );


        const outcome =
            this.sanitizeValue(
                data.outcome ||
                data.result ||
                null
            );


        const success =
            data.success ===
                true ||
            data.executed ===
                true;


        const failed =
            data.failed ===
                true ||
            data.error ===
                true ||
            data.blocked ===
                true;


        const confidence =
            this.clamp(
                data.confidence ??
                intent?.confidence ??
                (
                    success
                        ? 0.75
                        : 0.45
                )
            );


        const normalizedCommand =
            this.normalizeKey(
                command
            );


        const now =
            Date.now();


        const existing =
            this.state.commands
                .find(
                    item =>
                        item &&
                        item.normalizedCommand ===
                            normalizedCommand &&
                        this.intentKey(
                            item.intent
                        ) ===
                            this.intentKey(
                                intent
                            )
                );


        if(existing){

            existing.uses =
                this.normalizeNumber(
                    existing.uses
                ) +
                1;

            existing.successes =
                this.normalizeNumber(
                    existing.successes
                ) +
                (
                    success
                        ? 1
                        : 0
                );

            existing.failures =
                this.normalizeNumber(
                    existing.failures
                ) +
                (
                    failed
                        ? 1
                        : 0
                );

            existing.confidence =
                this.calculateCommandConfidence(
                    existing
                );

            existing.lastUsedAt =
                now;

            existing.context =
                this.sanitizeContext(
                    data.context
                );

            existing.action =
                action ||
                existing.action;

            existing.outcome =
                outcome ||
                existing.outcome;

            existing.verified =
                existing.verified ===
                    true ||
                data.verified ===
                    true;


            this.bumpCommandMetrics(
                success,
                failed
            );


            this.learnPatternFromCommand(
                existing
            );


            this.save();


            return this.clone(
                existing
            );

        }


        const record = {

            id:
                this.createId(
                    "brain-command"
                ),

            type:
                "command",

            command,

            normalizedCommand,

            intent,

            action,

            outcome,

            context:
                this.sanitizeContext(
                    data.context
                ),

            confidence,

            uses:
                1,

            successes:
                success
                    ? 1
                    : 0,

            failures:
                failed
                    ? 1
                    : 0,

            verified:
                data.verified ===
                    true,

            source:
                this.normalizeText(
                    data.source ||
                    "brain",
                    120
                ),

            createdAt:
                now,

            lastUsedAt:
                now,

            lastOutcomeAt:
                outcome
                    ? now
                    : null

        };


        this.state.commands
            .push(
                record
            );


        this.bumpCommandMetrics(
            success,
            failed
        );


        this.learnPatternFromCommand(
            record
        );


        this.save();


        return this.clone(
            record
        );

    },


    bumpCommandMetrics(
        success,
        failed
    ){

        const metrics =
            this.state.metrics;


        metrics.commandsRecorded +=
            1;


        if(success){

            metrics.successfulCommands +=
                1;

        }


        if(failed){

            metrics.failedCommands +=
                1;

        }


        metrics.lastLearningAt =
            Date.now();

    },


    calculateCommandConfidence(
        record
    ){

        const uses =
            Math.max(
                1,
                this.normalizeNumber(
                    record?.uses,
                    1
                )
            );


        const successes =
            this.normalizeNumber(
                record?.successes
            );


        const failures =
            this.normalizeNumber(
                record?.failures
            );


        const verifiedBonus =
            record?.verified ===
                true
                ? 0.12
                : 0;


        const successRate =
            successes /
            Math.max(
                1,
                successes +
                failures
            );


        const experienceBonus =
            Math.min(
                0.15,
                uses *
                    0.015
            );


        return this.clamp(
            (
                successRate *
                    0.73
            ) +
            experienceBonus +
            verifiedBonus
        );

    },


    intentKey(intent){

        if(
            !intent ||
            typeof intent !==
                "object"
        ){

            return String(
                intent ||
                ""
            );

        }


        return [
            intent.type ||
                "",
            intent.target ||
                "",
            intent.operation ||
                "",
            intent.actionType ||
                ""
        ]
            .map(
                item =>
                    this.normalizeKey(
                        item
                    )
            )
            .join(
                "::"
            );

    },


    /* =====================================================
       OUTCOME FEEDBACK
    ===================================================== */

    recordOutcome(
        commandId,
        data =
            {}
    ){

        const id =
            this.normalizeText(
                commandId,
                200
            );


        if(!id){

            return false;

        }


        const record =
            this.state.commands
                .find(
                    item =>
                        item?.id ===
                            id
                );


        if(!record){

            return false;

        }


        const success =
            data.success ===
                true ||
            data.executed ===
                true ||
            data.completed ===
                true;


        const failed =
            data.failed ===
                true ||
            data.error ===
                true ||
            data.blocked ===
                true;


        if(success){

            record.successes =
                this.normalizeNumber(
                    record.successes
                ) +
                1;

            this.state.metrics
                .successfulCommands +=
                1;

        }


        if(failed){

            record.failures =
                this.normalizeNumber(
                    record.failures
                ) +
                1;

            this.state.metrics
                .failedCommands +=
                1;

        }


        record.outcome =
            this.sanitizeValue(
                data.outcome ||
                data.result ||
                data
            );


        record.lastOutcomeAt =
            Date.now();


        record.confidence =
            this.calculateCommandConfidence(
                record
            );


        if(
            data.verified ===
                true
        ){

            record.verified =
                true;

        }


        this.learnPatternFromCommand(
            record
        );


        this.save();


        return true;

    },


    /* =====================================================
       CORRECTION AUTHORITY
    ===================================================== */

    recordCorrection(
        data =
            {}
    ){

        const original =
            this.normalizeText(
                data.original ||
                data.command ||
                data.prompt,
                12000
            );


        if(!original){

            return null;

        }


        const correctedIntent =
            this.sanitizeValue(
                data.correctedIntent ||
                data.intent ||
                null
            );


        const correctedAction =
            this.sanitizeValue(
                data.correctedAction ||
                data.action ||
                null
            );


        if(
            !correctedIntent &&
            !correctedAction
        ){

            return null;

        }


        const normalizedOriginal =
            this.normalizeKey(
                original
            );


        const now =
            Date.now();


        let record =
            this.state.corrections
                .find(
                    item =>
                        item
                            ?.normalizedOriginal ===
                            normalizedOriginal
                );


        if(record){

            record.correctedIntent =
                correctedIntent ||
                record.correctedIntent;

            record.correctedAction =
                correctedAction ||
                record.correctedAction;

            record.reason =
                this.normalizeText(
                    data.reason ||
                    record.reason,
                    1000
                );

            record.timesConfirmed =
                this.normalizeNumber(
                    record.timesConfirmed,
                    1
                ) +
                1;

            record.lastConfirmedAt =
                now;

            record.confidence =
                this.clamp(
                    0.85 +
                    Math.min(
                        0.14,
                        record.timesConfirmed *
                            0.025
                    )
                );

        }

        else {

            record = {

                id:
                    this.createId(
                        "brain-correction"
                    ),

                type:
                    "correction",

                original,

                normalizedOriginal,

                wrongIntent:
                    this.sanitizeValue(
                        data.wrongIntent ||
                        null
                    ),

                correctedIntent,

                correctedAction,

                reason:
                    this.normalizeText(
                        data.reason ||
                        "user-correction",
                        1000
                    ),

                context:
                    this.sanitizeContext(
                        data.context
                    ),

                authority:
                    "user-correction",

                confidence:
                    0.90,

                timesConfirmed:
                    1,

                createdAt:
                    now,

                lastConfirmedAt:
                    now

            };


            this.state.corrections
                .push(
                    record
                );

        }


        this.state.metrics
            .correctionsRecorded +=
                1;


        this.state.metrics
            .lastCorrectionAt =
                now;


        this.state.commands
            .forEach(
                command => {

                    const similarity =
                        this.similarity(
                            command.command,
                            original
                        );


                    if(
                        similarity <
                            0.75
                    ){

                        return;

                    }


                    const oldIntentKey =
                        this.intentKey(
                            command.intent
                        );


                    const correctedKey =
                        this.intentKey(
                            correctedIntent
                        );


                    if(
                        oldIntentKey &&
                        correctedKey &&
                        oldIntentKey !==
                            correctedKey
                    ){

                        command.failures =
                            this.normalizeNumber(
                                command.failures
                            ) +
                            1;

                        command.confidence =
                            this.calculateCommandConfidence(
                                command
                            );

                    }

                }
            );


        this.save();


        return this.clone(
            record
        );

    },


    /* =====================================================
       PREFERENCE MEMORY
    ===================================================== */

    rememberPreference(
        data =
            {}
    ){

        const key =
            this.normalizeKey(
                data.key ||
                data.name ||
                data.preference
            );


        if(!key){

            return null;

        }


        const value =
            this.sanitizeValue(
                data.value
            );


        const now =
            Date.now();


        let record =
            this.state.preferences
                .find(
                    item =>
                        item?.key ===
                            key
                );


        if(record){

            record.value =
                value;

            record.confidence =
                this.clamp(
                    data.confidence ??
                    Math.max(
                        record.confidence ||
                            0,
                        0.75
                    )
                );

            record.source =
                this.normalizeText(
                    data.source ||
                    record.source ||
                    "user",
                    120
                );

            record.updatedAt =
                now;

            record.uses =
                this.normalizeNumber(
                    record.uses
                ) +
                1;

        }

        else {

            record = {

                id:
                    this.createId(
                        "brain-preference"
                    ),

                type:
                    "preference",

                key,

                value,

                label:
                    this.normalizeText(
                        data.label ||
                        data.name ||
                        key,
                        300
                    ),

                confidence:
                    this.clamp(
                        data.confidence ??
                        0.80
                    ),

                source:
                    this.normalizeText(
                        data.source ||
                        "user",
                        120
                    ),

                context:
                    this.sanitizeContext(
                        data.context
                    ),

                uses:
                    1,

                createdAt:
                    now,

                updatedAt:
                    now

            };


            this.state.preferences
                .push(
                    record
                );

        }


        this.state.metrics
            .preferencesRecorded +=
                1;


        this.state.metrics
            .lastLearningAt =
                now;


        this.save();


        return this.clone(
            record
        );

    },


    getPreference(key){

        const normalizedKey =
            this.normalizeKey(
                key
            );


        if(!normalizedKey){

            return null;

        }


        const record =
            this.state.preferences
                .find(
                    item =>
                        item?.key ===
                            normalizedKey
                );


        return record
            ? this.clone(
                record
            )
            : null;

    },


    /* =====================================================
       PATTERN MEMORY
    ===================================================== */

    learnPatternFromCommand(
        command
    ){

        if(
            !command ||
            typeof command !==
                "object"
        ){

            return false;

        }


        const successes =
            this.normalizeNumber(
                command.successes
            );


        const confidence =
            this.normalizeNumber(
                command.confidence
            );


        if(
            successes <
                this.autoPromoteThreshold ||
            confidence <
                this.minimumLearningConfidence
        ){

            return false;

        }


        const intentKey =
            this.intentKey(
                command.intent
            );


        if(!intentKey){

            return false;

        }


        const phrase =
            this.normalizeKey(
                command.command
            );


        if(!phrase){

            return false;

        }


        let pattern =
            this.state.patterns
                .find(
                    item =>
                        item?.intentKey ===
                            intentKey &&
                        item?.phrase ===
                            phrase
                );


        const now =
            Date.now();


        if(pattern){

            pattern.uses =
                this.normalizeNumber(
                    pattern.uses
                ) +
                1;

            pattern.confidence =
                Math.max(
                    pattern.confidence ||
                        0,
                    confidence
                );

            pattern.lastObservedAt =
                now;

        }

        else {

            pattern = {

                id:
                    this.createId(
                        "brain-pattern"
                    ),

                type:
                    "pattern",

                phrase,

                intentKey,

                intent:
                    this.sanitizeValue(
                        command.intent
                    ),

                action:
                    this.sanitizeValue(
                        command.action
                    ),

                confidence,

                uses:
                    1,

                sourceCommandId:
                    command.id,

                createdAt:
                    now,

                lastObservedAt:
                    now

            };


            this.state.patterns
                .push(
                    pattern
                );


            this.state.metrics
                .patternsPromoted +=
                    1;

        }


        return true;

    },

  /* =====================================================
       RECENCY
    ===================================================== */

    recencyScore(timestamp){

        const time =
            this.normalizeNumber(
                timestamp
            );


        if(!time){

            return 0.25;

        }


        const age =
            Math.max(
                0,
                Date.now() -
                    time
            );


        const day =
            86400000;


        if(
            age <
                day
        ){

            return 1;

        }


        if(
            age <
                day *
                7
        ){

            return 0.90;

        }


        if(
            age <
                day *
                30
        ){

            return 0.72;

        }


        if(
            age <
                day *
                90
        ){

            return 0.55;

        }


        if(
            age <
                day *
                365
        ){

            return 0.35;

        }


        return 0.20;

    },


    /* =====================================================
       RETRIEVAL
    ===================================================== */

    retrieve(
        query,
        options =
            {}
    ){

        const text =
            this.normalizeText(
                query,
                12000
            );


        if(!text){

            return [];

        }


        const limit =
            Math.max(
                1,
                Math.min(
                    20,
                    this.normalizeNumber(
                        options.limit,
                        6
                    )
                )
            );


        const context =
            this.sanitizeContext(
                options.context
            );


        const types =
            Array.isArray(
                options.types
            )
                ? new Set(
                    options.types
                )
                : null;


        const results =
            [];


        if(
            !types ||
            types.has(
                "correction"
            )
        ){

            this.state.corrections
                .forEach(
                    item => {

                        const similarity =
                            this.similarity(
                                text,
                                item.original
                            );


                        if(
                            similarity <
                                this.minimumRetrievalScore
                        ){

                            return;

                        }


                        const score =
                            this.clamp(
                                (
                                    similarity *
                                        0.70
                                ) +
                                (
                                    this.clamp(
                                        item.confidence
                                    ) *
                                        0.25
                                ) +
                                0.05
                            );


                        results.push({

                            type:
                                "correction",

                            authority:
                                100,

                            score,

                            record:
                                item

                        });

                    }
                );

        }


        if(
            !types ||
            types.has(
                "command"
            )
        ){

            this.state.commands
                .forEach(
                    item => {

                        const similarity =
                            this.similarity(
                                text,
                                item.command
                            );


                        if(
                            similarity <
                                this.minimumRetrievalScore
                        ){

                            return;

                        }


                        const confidence =
                            this.clamp(
                                item.confidence
                            );


                        const recency =
                            this.recencyScore(
                                item.lastUsedAt ||
                                item.createdAt
                            );


                        const score =
                            this.clamp(
                                (
                                    similarity *
                                        0.58
                                ) +
                                (
                                    confidence *
                                        0.30
                                ) +
                                (
                                    recency *
                                        0.12
                                )
                            );


                        results.push({

                            type:
                                "command",

                            authority:
                                70,

                            score,

                            record:
                                item

                        });

                    }
                );

        }


        if(
            !types ||
            types.has(
                "pattern"
            )
        ){

            this.state.patterns
                .forEach(
                    item => {

                        const similarity =
                            this.similarity(
                                text,
                                item.phrase
                            );


                        if(
                            similarity <
                                this.minimumRetrievalScore
                        ){

                            return;

                        }


                        const score =
                            this.clamp(
                                (
                                    similarity *
                                        0.62
                                ) +
                                (
                                    this.clamp(
                                        item.confidence
                                    ) *
                                        0.30
                                ) +
                                (
                                    this.recencyScore(
                                        item.lastObservedAt
                                    ) *
                                        0.08
                                )
                            );


                        results.push({

                            type:
                                "pattern",

                            authority:
                                60,

                            score,

                            record:
                                item

                        });

                    }
                );

        }


        if(
            options.includePreferences ===
                true &&
            (
                !types ||
                types.has(
                    "preference"
                )
            )
        ){

            this.state.preferences
                .forEach(
                    item => {

                        const searchText =
                            `${item.key} ${item.label || ""} ${JSON.stringify(item.value || "")}`;


                        const similarity =
                            this.similarity(
                                text,
                                searchText
                            );


                        if(
                            similarity <
                                this.minimumRetrievalScore
                        ){

                            return;

                        }


                        results.push({

                            type:
                                "preference",

                            authority:
                                30,

                            score:
                                this.clamp(
                                    (
                                        similarity *
                                            0.75
                                    ) +
                                    (
                                        this.clamp(
                                            item.confidence
                                        ) *
                                            0.25
                                    )
                                ),

                            record:
                                item

                        });

                    }
                );

        }


        const sorted =
            results
                .sort(
                    (
                        a,
                        b
                    ) => {

                        if(
                            b.authority !==
                                a.authority
                        ){

                            return (
                                b.authority -
                                a.authority
                            );

                        }


                        return (
                            b.score -
                            a.score
                        );

                    }
                )
                .slice(
                    0,
                    limit
                )
                .map(
                    item => ({
                        type:
                            item.type,

                        authority:
                            item.authority,

                        score:
                            Number(
                                item.score
                                    .toFixed(
                                        4
                                    )
                            ),

                        record:
                            this.clone(
                                item.record
                            ),

                        context
                    })
                );


        this.state.metrics
            .retrievals +=
                1;


        if(
            sorted.length >
                0
        ){

            this.state.metrics
                .retrievalHits +=
                    1;

        }


        const now =
            Date.now();


        this.state.metrics
            .lastRetrievalAt =
                now;


        this.lastRetrievedAt =
            now;


        this.save();


        return sorted;

    },


    /* =====================================================
       INTENT SUGGESTION
    ===================================================== */

    suggestIntent(
        command,
        context =
            {}
    ){

        const matches =
            this.retrieve(
                command,
                {
                    limit:
                        5,

                    context,

                    types:[
                        "correction",
                        "command",
                        "pattern"
                    ]
                }
            );


        if(
            matches.length ===
                0
        ){

            return null;

        }


        const best =
            matches[
                0
            ];


        let intent =
            null;


        let action =
            null;


        if(
            best.type ===
                "correction"
        ){

            intent =
                best.record
                    ?.correctedIntent ||
                null;

            action =
                best.record
                    ?.correctedAction ||
                null;

        }

        else {

            intent =
                best.record
                    ?.intent ||
                null;

            action =
                best.record
                    ?.action ||
                null;

        }


        if(!intent){

            return null;

        }


        return {

            source:
                "brain-memory",

            memoryType:
                best.type,

            memoryId:
                best.record
                    ?.id ||
                null,

            authority:
                best.authority,

            score:
                best.score,

            intent:
                this.clone(
                    intent
                ),

            action:
                this.clone(
                    action
                ),

            trusted:
                (
                    best.type ===
                        "correction" &&
                    best.score >=
                        0.65
                ) ||
                (
                    best.score >=
                        0.78
                )

        };

    },


    /* =====================================================
       LEARNING CONTEXT
    ===================================================== */

    getLearningContext(
        command,
        context =
            {}
    ){

        const memories =
            this.retrieve(
                command,
                {
                    limit:
                        8,

                    context,

                    includePreferences:
                        true
                }
            );


        const corrections =
            memories
                .filter(
                    item =>
                        item.type ===
                            "correction"
                )
                .slice(
                    0,
                    3
                );


        const successfulCommands =
            memories
                .filter(
                    item =>
                        item.type ===
                            "command" &&
                        item.record
                            ?.successes >
                            item.record
                                ?.failures
                )
                .slice(
                    0,
                    4
                );


        const patterns =
            memories
                .filter(
                    item =>
                        item.type ===
                            "pattern"
                )
                .slice(
                    0,
                    4
                );


        const preferences =
            memories
                .filter(
                    item =>
                        item.type ===
                            "preference"
                )
                .slice(
                    0,
                    4
                );


        return {

            source:
                "brain-memory-v4",

            corrections,

            successfulCommands,

            patterns,

            preferences,

            suggestedIntent:
                this.suggestIntent(
                    command,
                    context
                ),

            generatedAt:
                Date.now()

        };

    },


    /* =====================================================
       FEEDBACK
    ===================================================== */

    markUseful(
        memoryId
    ){

        const record =
            this.findById(
                memoryId
            );


        if(!record){

            return false;

        }


        record.uses =
            this.normalizeNumber(
                record.uses
            ) +
                1;


        record.lastUsefulAt =
            Date.now();


        if(
            typeof record.confidence ===
                "number"
        ){

            record.confidence =
                this.clamp(
                    record.confidence +
                        0.03
                );

        }


        this.save();


        return true;

    },


    markWrong(
        memoryId
    ){

        const record =
            this.findById(
                memoryId
            );


        if(!record){

            return false;

        }


        record.failures =
            this.normalizeNumber(
                record.failures
            ) +
                1;


        if(
            typeof record.confidence ===
                "number"
        ){

            record.confidence =
                this.clamp(
                    record.confidence -
                        0.15
                );

        }


        record.lastFailureAt =
            Date.now();


        this.save();


        return true;

    },


    /* =====================================================
       FIND
    ===================================================== */

    findById(id){

        const memoryId =
            this.normalizeText(
                id,
                200
            );


        if(!memoryId){

            return null;

        }


        const collections = [
            this.state.commands,
            this.state.corrections,
            this.state.preferences,
            this.state.patterns
        ];


        for(
            const collection
            of collections
        ){

            const record =
                collection.find(
                    item =>
                        item?.id ===
                            memoryId
                );


            if(record){

                return record;

            }

        }


        return null;

    },


    /* =====================================================
       FORGET
    ===================================================== */

    forget(memoryId){

        const id =
            this.normalizeText(
                memoryId,
                200
            );


        if(!id){

            return false;

        }


        let removed =
            false;


        [
            "commands",
            "corrections",
            "preferences",
            "patterns"
        ].forEach(
            key => {

                const before =
                    this.state[
                        key
                    ].length;


                this.state[
                    key
                ] =
                    this.state[
                        key
                    ].filter(
                        item =>
                            item?.id !==
                                id
                    );


                if(
                    this.state[
                        key
                    ].length <
                        before
                ){

                    removed =
                        true;

                }

            }
        );


        if(removed){

            this.save();

        }


        return removed;

    },


    forgetCommand(command){

        const normalized =
            this.normalizeKey(
                command
            );


        if(!normalized){

            return 0;

        }


        const before =
            this.state.commands
                .length;


        this.state.commands =
            this.state.commands
                .filter(
                    item =>
                        item
                            ?.normalizedCommand !==
                            normalized
                );


        const removed =
            before -
            this.state.commands
                .length;


        if(removed){

            this.save();

        }


        return removed;

    },


    /* =====================================================
       PRUNING
    ===================================================== */

    pruneCollection(
        collection,
        limit
    ){

        if(
            !Array.isArray(
                collection
            )
        ){

            return [];

        }


        if(
            collection.length <=
                limit
        ){

            return collection;

        }


        return [
            ...collection
        ]
            .sort(
                (
                    a,
                    b
                ) => {

                    const aConfidence =
                        this.normalizeNumber(
                            a?.confidence
                        );


                    const bConfidence =
                        this.normalizeNumber(
                            b?.confidence
                        );


                    const aUses =
                        this.normalizeNumber(
                            a?.uses ||
                            a?.timesConfirmed
                        );


                    const bUses =
                        this.normalizeNumber(
                            b?.uses ||
                            b?.timesConfirmed
                        );


                    const aTime =
                        this.normalizeNumber(
                            a?.lastUsedAt ||
                            a?.lastConfirmedAt ||
                            a?.updatedAt ||
                            a?.createdAt
                        );


                    const bTime =
                        this.normalizeNumber(
                            b?.lastUsedAt ||
                            b?.lastConfirmedAt ||
                            b?.updatedAt ||
                            b?.createdAt
                        );


                    const aScore =
                        (
                            aConfidence *
                                100
                        ) +
                        Math.min(
                            25,
                            aUses
                        ) +
                        (
                            this.recencyScore(
                                aTime
                            ) *
                                20
                        );


                    const bScore =
                        (
                            bConfidence *
                                100
                        ) +
                        Math.min(
                            25,
                            bUses
                        ) +
                        (
                            this.recencyScore(
                                bTime
                            ) *
                                20
                        );


                    return (
                        bScore -
                        aScore
                    );

                }
            )
            .slice(
                0,
                limit
            );

    },


    prune(){

        this.state.commands =
            this.pruneCollection(
                this.state.commands,
                this.maxCommandMemories
            );


        this.state.corrections =
            this.pruneCollection(
                this.state.corrections,
                this.maxCorrectionMemories
            );


        this.state.preferences =
            this.pruneCollection(
                this.state.preferences,
                this.maxPreferenceMemories
            );


        this.state.patterns =
            this.pruneCollection(
                this.state.patterns,
                this.maxPatternMemories
            );


        return true;

    },


    /* =====================================================
       LEARNING HEALTH
    ===================================================== */

    learningHealth(){

        const commands =
            this.state.commands;


        const total =
            commands.length;


        const successful =
            commands.filter(
                item =>
                    this.normalizeNumber(
                        item.successes
                    ) >
                    this.normalizeNumber(
                        item.failures
                    )
            ).length;


        const weak =
            commands.filter(
                item =>
                    this.normalizeNumber(
                        item.confidence
                    ) <
                    0.45
            ).length;


        const corrections =
            this.state.corrections
                .length;


        const patterns =
            this.state.patterns
                .length;


        const successRate =
            total
                ? successful /
                    total
                : 0;


        let status =
            "learning";


        if(
            total ===
                0
        ){

            status =
                "empty";

        }

        else if(
            successRate >=
                0.80 &&
            weak /
                total <
                0.10
        ){

            status =
                "strong";

        }

        else if(
            successRate <
                0.45
        ){

            status =
                "weak";

        }


        return {

            status,

            commands:
                total,

            successfulMappings:
                successful,

            weakMappings:
                weak,

            corrections,

            patterns,

            preferences:
                this.state.preferences
                    .length,

            successRate:
                Number(
                    successRate
                        .toFixed(
                            4
                        )
                ),

            correctionDensity:
                Number(
                    (
                        corrections /
                        Math.max(
                            1,
                            total
                        )
                    )
                        .toFixed(
                            4
                        )
                )

        };

    },


    /* =====================================================
       DECISION TRACE
    ===================================================== */

    createDecisionTrace(
        data =
            {}
    ){

        return {

            source:
                "brain-memory-v4",

            selectedMemoryId:
                data.memoryId ||
                null,

            selectedMemoryType:
                data.memoryType ||
                null,

            confidence:
                this.clamp(
                    data.confidence ||
                    0
                ),

            authority:
                this.normalizeNumber(
                    data.authority
                ),

            reason:
                this.normalizeText(
                    data.reason ||
                    "Relevant learned memory matched.",
                    500
                ),

            context:
                this.sanitizeContext(
                    data.context
                ),

            createdAt:
                Date.now()

        };

    },


    /* =====================================================
       ALL / REPORT
    ===================================================== */

    all(
        type =
            null
    ){

        const normalizedType =
            this.normalizeKey(
                type
            );


        if(
            normalizedType ===
                "command"
        ){

            return this.clone(
                this.state.commands
            ) || [];

        }


        if(
            normalizedType ===
                "correction"
        ){

            return this.clone(
                this.state.corrections
            ) || [];

        }


        if(
            normalizedType ===
                "preference"
        ){

            return this.clone(
                this.state.preferences
            ) || [];

        }


        if(
            normalizedType ===
                "pattern"
        ){

            return this.clone(
                this.state.patterns
            ) || [];

        }


        return this.clone({
            commands:
                this.state.commands,

            corrections:
                this.state.corrections,

            preferences:
                this.state.preferences,

            patterns:
                this.state.patterns
        });

    },


    report(){

        const health =
            this.learningHealth();


        return {

            version:
                this.version,

            initialized:
                this.initialized,

            initializedAt:
                this.initializedAt,

            records:{

                commands:
                    this.state.commands
                        .length,

                corrections:
                    this.state.corrections
                        .length,

                preferences:
                    this.state.preferences
                        .length,

                patterns:
                    this.state.patterns
                        .length,

                total:
                    this.state.commands
                        .length +
                    this.state.corrections
                        .length +
                    this.state.preferences
                        .length +
                    this.state.patterns
                        .length

            },

            learningHealth:
                health,

            metrics:
                this.clone(
                    this.state.metrics
                ),

            lastRetrievedAt:
                this.lastRetrievedAt,

            storageKey:
                this.storageKey

        };

    },


    /* =====================================================
       RESET
    ===================================================== */

    reset(){

        this.state =
            this.normalizeState(
                {}
            );


        try{

            if(
                typeof localStorage !==
                    "undefined"
            ){

                localStorage.removeItem(
                    this.storageKey
                );

            }

        } catch(error){

            /* optional */

        }


        return true;

    },


    /* =====================================================
       INIT
    ===================================================== */

    init(){

        if(
            this.initialized
        ){

            return this.report();

        }


        this.load();


        this.prune();


        this.initialized =
            true;


        this.initializedAt =
            Date.now();


        this.save();


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    "brain-memory:ready",
                    {
                        version:
                            this.version,

                        records:
                            this.report()
                                .records,

                        time:
                            Date.now()
                    }
                );

            }

        } catch(error){

            /* optional */

        }


        return this.report();

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
            "brainMemory",
            BrainMemory
        );

    }

} catch(error){

    console.error(
        "Brain Memory register edilemedi:",
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

    window.BrainMemory =
        BrainMemory;

}


/* =========================================================
   BOOT
========================================================= */

try{

    BrainMemory.init();

} catch(error){

    console.error(
        "Brain Memory başlatılamadı:",
        error
    );

}
