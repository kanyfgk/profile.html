/* =========================================================
   VAERO BRAIN MEMORY
   Command Memory / Correction Authority / Preferences
   Pattern Learning / Retrieval / Learning Health
========================================================= */

const BrainMemory = {

    version: "1.0.0",
    storageKey: "vaero:brain-memory:v1",

    maxCommandMemories: 1200,
    maxCorrectionMemories: 400,
    maxPreferenceMemories: 400,
    maxPatternMemories: 500,

    minimumLearningConfidence: 0.55,
    minimumRetrievalScore: 0.20,
    autoPromoteThreshold: 3,

    initialized: false,
    initializedAt: null,
    lastRetrievedAt: null,

    state: {
        commands: [],
        corrections: [],
        preferences: [],
        patterns: [],

        metrics: {
            commandsRecorded: 0,
            successfulCommands: 0,
            failedCommands: 0,
            correctionsRecorded: 0,
            preferencesRecorded: 0,
            patternsPromoted: 0,
            retrievals: 0,
            retrievalHits: 0,
            lastLearningAt: null,
            lastCorrectionAt: null,
            lastRetrievalAt: null
        }
    },


    /* =====================================================
       ACCESS
    ===================================================== */

    getService(name) {

        if (!name) return null;

        try {

            if (
                typeof VAERO !== "undefined" &&
                typeof VAERO.get === "function"
            ) {
                return VAERO.get(name) || null;
            }

        } catch (_) {}

        return null;
    },


    getEngine() {

        try {

            if (
                typeof VAERO !== "undefined" &&
                VAERO.engine
            ) {
                return VAERO.engine;
            }

        } catch (_) {}

        return (
            typeof window !== "undefined"
                ? window.Engine || null
                : null
        );
    },


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    createId(prefix = "brain-memory") {

        try {

            if (
                typeof crypto !== "undefined" &&
                typeof crypto.randomUUID === "function"
            ) {
                return crypto.randomUUID();
            }

        } catch (_) {}

        return (
            `${prefix}_${Date.now()}_` +
            Math.random().toString(36).slice(2, 10)
        );
    },


    clone(value) {

        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_) {
            return null;
        }
    },


    normalizeNumber(value, fallback = 0) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    },


    clamp(value, min = 0, max = 1) {

        return Math.max(
            min,
            Math.min(
                max,
                this.normalizeNumber(value, min)
            )
        );
    },


    normalizeText(value, maxLength = 12000) {

        return String(value ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, maxLength);
    },


    normalizeKey(value) {

        return this
            .normalizeText(value, 300)
            .toLocaleLowerCase("tr-TR")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9çğıöşü\s:_-]/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
    },


    /* =====================================================
       SECURITY
    ===================================================== */

    redactSensitiveString(value) {

        let text = String(value ?? "");

        const patterns = [

            /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi,

            /\b(?:access[_-]?token|refresh[_-]?token|auth[_-]?token|session[_-]?token|api[_-]?key|password|secret|private[_-]?key)\s*[:=]\s*["']?[^\s"',;]+/gi,

            /\bsk-[A-Za-z0-9_-]{16,}\b/g,

            /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,

            /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g
        ];

        patterns.forEach(pattern => {

            text = text.replace(
                pattern,
                "[REDACTED]"
            );
        });

        return text.slice(0, 30000);
    },


    isBlockedKey(key) {

        const normalized = String(key || "")
            .toLowerCase()
            .replace(/[-_\s]/g, "");

        return new Set([
            "accesstoken",
            "token",
            "refreshtoken",
            "password",
            "secret",
            "authorization",
            "authtoken",
            "apikey",
            "privatekey",
            "sessiontoken",
            "cookie",
            "setcookie"
        ]).has(normalized);
    },


    sanitizeValue(value, depth = 0) {

        if (depth > 8) return null;

        if (
            value === null ||
            value === undefined
        ) {
            return value;
        }

        if (typeof value === "string") {

            return this.redactSensitiveString(value);
        }

        if (
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            return value;
        }

        if (Array.isArray(value)) {

            return value
                .slice(0, 100)
                .map(item =>
                    this.sanitizeValue(
                        item,
                        depth + 1
                    )
                );
        }

        if (typeof value === "object") {

            const output = {};

            Object
                .entries(value)
                .slice(0, 100)
                .forEach(([key, item]) => {

                    if (this.isBlockedKey(key)) {
                        return;
                    }

                    output[key] =
                        this.sanitizeValue(
                            item,
                            depth + 1
                        );
                });

            return output;
        }

        return null;
    },


    sanitizeContext(context = {}) {

        const engine = this.getEngine();

        const source =
            context &&
            typeof context === "object" &&
            !Array.isArray(context)
                ? context
                : {};

        return this.sanitizeValue({

            app:
                source.app ||
                engine
                    ?.currentApplicationContext
                    ?.appId ||
                null,

            screen:
                source.screen ||
                engine?.currentView ||
                null,

            page:
                source.page ||
                engine?.currentEntityPage ||
                null,

            entityId:
                source.entityId ||
                source.entity?.id ||
                engine
                    ?.currentOpenedEntity
                    ?.id ||
                engine
                    ?.currentEntity
                    ?.id ||
                null,

            worldId:
                source.worldId ||
                source.world?.id ||
                engine
                    ?.currentWorld
                    ?.id ||
                null,

            contextRef:
                source.contextRef &&
                typeof source.contextRef === "object"
                    ? source.contextRef
                    : null
        });
    },


    /* =====================================================
       STORAGE
    ===================================================== */

    defaultMetrics() {

        return {
            commandsRecorded: 0,
            successfulCommands: 0,
            failedCommands: 0,
            correctionsRecorded: 0,
            preferencesRecorded: 0,
            patternsPromoted: 0,
            retrievals: 0,
            retrievalHits: 0,
            lastLearningAt: null,
            lastCorrectionAt: null,
            lastRetrievalAt: null
        };
    },


    normalizeState(state = {}) {

        const source =
            state &&
            typeof state === "object"
                ? state
                : {};

        return {

            commands:
                Array.isArray(source.commands)
                    ? source.commands.filter(Boolean)
                    : [],

            corrections:
                Array.isArray(source.corrections)
                    ? source.corrections.filter(Boolean)
                    : [],

            preferences:
                Array.isArray(source.preferences)
                    ? source.preferences.filter(Boolean)
                    : [],

            patterns:
                Array.isArray(source.patterns)
                    ? source.patterns.filter(Boolean)
                    : [],

            metrics: {
                ...this.defaultMetrics(),
                ...(
                    source.metrics &&
                    typeof source.metrics === "object"
                        ? source.metrics
                        : {}
                )
            }
        };
    },


    save() {

        try {

            if (
                typeof localStorage === "undefined"
            ) {
                return false;
            }

            this.prune();

            localStorage.setItem(
                this.storageKey,
                JSON.stringify({
                    version: this.version,
                    state: this.state,
                    savedAt: Date.now()
                })
            );

            return true;

        } catch (error) {

            console.warn(
                "Brain Memory kaydedilemedi:",
                error
            );

            return false;
        }
    },


    load() {

        try {

            if (
                typeof localStorage === "undefined"
            ) {
                return false;
            }

            const raw =
                localStorage.getItem(
                    this.storageKey
                );

            if (!raw) {
                return false;
            }

            const parsed = JSON.parse(raw);

            const source =
                parsed?.state || parsed;

            this.state =
                this.normalizeState(source);

            return true;

        } catch (error) {

            console.warn(
                "Brain Memory okunamadı:",
                error
            );

            return false;
        }
    },


    /* =====================================================
       TOKENIZATION / SIMILARITY
    ===================================================== */

    tokenize(text) {

        const normalized =
            this.normalizeKey(text);

        if (!normalized) return [];

        const stopWords = new Set([
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
            .split(" ")
            .filter(word =>
                word.length > 1 &&
                !stopWords.has(word)
            );
    },


    similarity(first, second) {

        const a = this.normalizeKey(first);
        const b = this.normalizeKey(second);

        if (!a || !b) return 0;
        if (a === b) return 1;

        const aTokens =
            new Set(this.tokenize(a));

        const bTokens =
            new Set(this.tokenize(b));

        if (
            !aTokens.size ||
            !bTokens.size
        ) {
            return 0;
        }

        let intersection = 0;

        aTokens.forEach(token => {

            if (bTokens.has(token)) {
                intersection += 1;
            }
        });

        const union =
            new Set([
                ...aTokens,
                ...bTokens
            ]).size;

        const jaccard =
            union
                ? intersection / union
                : 0;

        const contains =
            a.includes(b) ||
            b.includes(a)
                ? 0.15
                : 0;

        return this.clamp(
            jaccard + contains
        );
    },


    recencyScore(timestamp) {

        const time = Number(timestamp);

        if (!time) return 0;

        const age =
            Math.max(
                0,
                Date.now() - time
            );

        const day =
            24 * 60 * 60 * 1000;

        if (age < day) return 1;
        if (age < day * 7) return 0.9;
        if (age < day * 30) return 0.75;
        if (age < day * 90) return 0.55;
        if (age < day * 365) return 0.35;

        return 0.15;
    },


    /* =====================================================
       COMMAND MEMORY
    ===================================================== */

    intentKey(intent) {

        if (!intent) return "";

        if (typeof intent === "string") {
            return this.normalizeKey(intent);
        }

        return this.normalizeKey(
            intent.name ||
            intent.type ||
            intent.intent ||
            ""
        );
    },


    calculateCommandConfidence(record) {

        if (!record) return 0;

        const success =
            this.normalizeNumber(
                record.successCount
            );

        const failure =
            this.normalizeNumber(
                record.failureCount
            );

        const total =
            success + failure;

        if (!total) {

            return this.clamp(
                record.confidence ?? 0.5
            );
        }

        const reliability =
            success / total;

        const repetition =
            Math.min(
                1,
                total / 5
            );

        return this.clamp(
            reliability * 0.8 +
            repetition * 0.2
        );
    },


    recordCommand({
        command,
        intent = null,
        action = null,
        success = null,
        confidence = null,
        context = {},
        outcome = null,
        source = "brain"
    } = {}) {

        const cleanCommand =
            this.redactSensitiveString(
                this.normalizeText(
                    command,
                    12000
                )
            );

        if (!cleanCommand) return null;

        const normalized =
            this.normalizeKey(cleanCommand);

        const intentName =
            this.intentKey(intent);

        const actionName =
            this.normalizeKey(
                typeof action === "string"
                    ? action
                    : (
                        action?.type ||
                        action?.action ||
                        action?.name ||
                        ""
                    )
            );

        const existing =
            this.state.commands.find(item =>
                item.normalizedCommand ===
                    normalized &&
                item.intentKey ===
                    intentName &&
                item.actionKey ===
                    actionName
            );

        const now = Date.now();

        if (existing) {

            existing.lastUsedAt = now;
            existing.uses =
                this.normalizeNumber(
                    existing.uses
                ) + 1;

            if (success === true) {
                existing.successCount =
                    this.normalizeNumber(
                        existing.successCount
                    ) + 1;
            }

            if (success === false) {
                existing.failureCount =
                    this.normalizeNumber(
                        existing.failureCount
                    ) + 1;
            }

            existing.context =
                this.sanitizeContext(context);

            if (outcome) {
                existing.lastOutcome =
                    this.sanitizeValue(outcome);
            }

            existing.confidence =
                this.calculateCommandConfidence(
                    existing
                );

            this.bumpCommandMetrics(success);

            if (
                existing.successCount >=
                this.autoPromoteThreshold
            ) {
                this.learnPatternFromCommand(
                    existing
                );
            }

            this.save();

            return this.clone(existing);
        }

        const record = {

            id:
                this.createId("command"),

            command:
                cleanCommand,

            normalizedCommand:
                normalized,

            intent:
                this.sanitizeValue(intent),

            intentKey:
                intentName,

            action:
                this.sanitizeValue(action),

            actionKey:
                actionName,

            successCount:
                success === true ? 1 : 0,

            failureCount:
                success === false ? 1 : 0,

            uses: 1,

            confidence:
                this.clamp(
                    confidence ??
                    (
                        success === true
                            ? 0.65
                            : 0.5
                    )
                ),

            context:
                this.sanitizeContext(context),

            lastOutcome:
                outcome
                    ? this.sanitizeValue(outcome)
                    : null,

            source:
                this.normalizeText(
                    source,
                    100
                ),

            createdAt:
                now,

            lastUsedAt:
                now,

            corrected:
                false,

            disabled:
                false
        };

        record.confidence =
            this.calculateCommandConfidence(
                record
            );

        this.state.commands.unshift(record);

        this.bumpCommandMetrics(success);

        this.save();

        return this.clone(record);
    },


    bumpCommandMetrics(success) {

        const metrics =
            this.state.metrics;

        metrics.commandsRecorded += 1;
        metrics.lastLearningAt = Date.now();

        if (success === true) {
            metrics.successfulCommands += 1;
        }

        if (success === false) {
            metrics.failedCommands += 1;
        }
    },


    recordOutcome(
        commandId,
        {
            success,
            outcome = null,
            verified = false
        } = {}
    ) {

        const record =
            this.state.commands.find(
                item => item.id === commandId
            );

        if (!record) return false;

        if (success === true) {
            record.successCount += 1;
            this.state.metrics
                .successfulCommands += 1;
        }

        if (success === false) {
            record.failureCount += 1;
            this.state.metrics
                .failedCommands += 1;
        }

        record.lastOutcome =
            this.sanitizeValue(outcome);

        record.lastOutcomeVerified =
            Boolean(verified);

        record.lastUsedAt =
            Date.now();

        record.confidence =
            this.calculateCommandConfidence(
                record
            );

        if (
            verified &&
            success === true &&
            record.successCount >=
                this.autoPromoteThreshold
        ) {
            this.learnPatternFromCommand(
                record
            );
        }

        this.save();

        return true;
    },


    /* =====================================================
       CORRECTION AUTHORITY
    ===================================================== */

    recordCorrection({
        command,
        previousIntent = null,
        correctedIntent = null,
        previousAction = null,
        correctedAction = null,
        context = {},
        reason = null
    } = {}) {

        const cleanCommand =
            this.redactSensitiveString(
                this.normalizeText(
                    command,
                    12000
                )
            );

        if (!cleanCommand) return null;

        const now = Date.now();

        const correction = {

            id:
                this.createId(
                    "correction"
                ),

            command:
                cleanCommand,

            normalizedCommand:
                this.normalizeKey(
                    cleanCommand
                ),

            previousIntent:
                this.sanitizeValue(
                    previousIntent
                ),

            correctedIntent:
                this.sanitizeValue(
                    correctedIntent
                ),

            previousAction:
                this.sanitizeValue(
                    previousAction
                ),

            correctedAction:
                this.sanitizeValue(
                    correctedAction
                ),

            correctedIntentKey:
                this.intentKey(
                    correctedIntent
                ),

            correctedActionKey:
                this.normalizeKey(
                    typeof correctedAction ===
                        "string"
                        ? correctedAction
                        : (
                            correctedAction
                                ?.type ||
                            correctedAction
                                ?.action ||
                            correctedAction
                                ?.name ||
                            ""
                        )
                ),

            context:
                this.sanitizeContext(
                    context
                ),

            reason:
                this.redactSensitiveString(
                    this.normalizeText(
                        reason,
                        2000
                    )
                ),

            authority:
                1,

            uses:
                0,

            createdAt:
                now,

            lastUsedAt:
                null
        };

        this.state
            .corrections
            .unshift(correction);

        this.state.metrics
            .correctionsRecorded += 1;

        this.state.metrics
            .lastCorrectionAt = now;

        this.state.commands
            .forEach(record => {

                const similarity =
                    this.similarity(
                        cleanCommand,
                        record.command
                    );

                if (similarity < 0.75) {
                    return;
                }

                const conflicts =
                    (
                        correction
                            .correctedIntentKey &&
                        record.intentKey &&
                        correction
                            .correctedIntentKey !==
                            record.intentKey
                    ) ||
                    (
                        correction
                            .correctedActionKey &&
                        record.actionKey &&
                        correction
                            .correctedActionKey !==
                            record.actionKey
                    );

                if (!conflicts) return;

                record.corrected = true;

                record.confidence =
                    this.clamp(
                        record.confidence * 0.4
                    );

                record.failureCount =
                    this.normalizeNumber(
                        record.failureCount
                    ) + 1;
            });

        this.save();

        return this.clone(correction);
    },


    /* =====================================================
       PREFERENCE MEMORY
    ===================================================== */

    rememberPreference(
        key,
        value,
        {
            confidence = 0.75,
            source = "user",
            context = {}
        } = {}
    ) {

        const normalizedKey =
            this.normalizeKey(key);

        if (!normalizedKey) {
            return null;
        }

        const now = Date.now();

        let record =
            this.state.preferences.find(
                item =>
                    item.key ===
                    normalizedKey
            );

        if (!record) {

            record = {

                id:
                    this.createId(
                        "preference"
                    ),

                key:
                    normalizedKey,

                value:
                    this.sanitizeValue(
                        value
                    ),

                confidence:
                    this.clamp(
                        confidence
                    ),

                source:
                    this.normalizeText(
                        source,
                        100
                    ),

                context:
                    this.sanitizeContext(
                        context
                    ),

                createdAt:
                    now,

                updatedAt:
                    now,

                uses:
                    0
            };

            this.state.preferences
                .unshift(record);

        } else {

            record.value =
                this.sanitizeValue(value);

            record.confidence =
                this.clamp(confidence);

            record.source =
                this.normalizeText(
                    source,
                    100
                );

            record.context =
                this.sanitizeContext(
                    context
                );

            record.updatedAt =
                now;
        }

        this.state.metrics
            .preferencesRecorded += 1;

        this.state.metrics
            .lastLearningAt = now;

        this.save();

        return this.clone(record);
    },


    getPreference(key) {

        const normalizedKey =
            this.normalizeKey(key);

        const record =
            this.state.preferences.find(
                item =>
                    item.key ===
                    normalizedKey
            );

        if (!record) return null;

        record.uses =
            this.normalizeNumber(
                record.uses
            ) + 1;

        return this.clone(record);
    },


    /* =====================================================
       PATTERN LEARNING
    ===================================================== */

    learnPatternFromCommand(command) {

        if (!command) return null;

        const confidence =
            this.calculateCommandConfidence(
                command
            );

        if (
            confidence <
            this.minimumLearningConfidence
        ) {
            return null;
        }

        if (
            !command.intentKey &&
            !command.actionKey
        ) {
            return null;
        }

        const key =
            [
                command.normalizedCommand,
                command.intentKey,
                command.actionKey
            ].join("|");

        let pattern =
            this.state.patterns.find(
                item => item.key === key
            );

        const now = Date.now();

        if (!pattern) {

            pattern = {

                id:
                    this.createId(
                        "pattern"
                    ),

                key,

                phrase:
                    command.command,

                normalizedPhrase:
                    command.normalizedCommand,

                intent:
                    this.sanitizeValue(
                        command.intent
                    ),

                intentKey:
                    command.intentKey,

                action:
                    this.sanitizeValue(
                        command.action
                    ),

                actionKey:
                    command.actionKey,

                confidence,

                evidenceCount:
                    command.successCount,

                sourceCommandId:
                    command.id,

                createdAt:
                    now,

                updatedAt:
                    now,

                uses:
                    0
            };

            this.state.patterns
                .unshift(pattern);

            this.state.metrics
                .patternsPromoted += 1;

        } else {

            pattern.confidence =
                Math.max(
                    pattern.confidence,
                    confidence
                );

            pattern.evidenceCount =
                Math.max(
                    this.normalizeNumber(
                        pattern.evidenceCount
                    ),
                    this.normalizeNumber(
                        command.successCount
                    )
                );

            pattern.updatedAt =
                now;
        }

        return this.clone(pattern);
    },

  /* =====================================================
       RETRIEVAL
    ===================================================== */

    retrieve(
        query,
        {
            limit = 8,
            context = {},
            includePreferences = true,
            track = true
        } = {}
    ) {

        const cleanQuery =
            this.redactSensitiveString(
                this.normalizeText(
                    query,
                    12000
                )
            );

        if (!cleanQuery) {
            return [];
        }

        const safeContext =
            this.sanitizeContext(
                context
            );

        const results = [];

        const addResult = (
            type,
            record,
            similarityScore,
            authority = 0,
            confidence = 0
        ) => {

            if (!record) return;

            const recency =
                this.recencyScore(
                    record.lastUsedAt ||
                    record.updatedAt ||
                    record.createdAt
                );

            const contextScore =
                this.contextSimilarity(
                    safeContext,
                    record.context
                );

            const score =
                this.clamp(
                    (
                        similarityScore * 0.55
                    ) +
                    (
                        confidence * 0.20
                    ) +
                    (
                        authority * 0.15
                    ) +
                    (
                        contextScore * 0.07
                    ) +
                    (
                        recency * 0.03
                    )
                );

            if (
                score <
                this.minimumRetrievalScore
            ) {
                return;
            }

            results.push({
                type,
                score,
                similarity:
                    similarityScore,
                authority,
                confidence,
                record
            });
        };


        /*
         * Corrections are explicit user authority.
         * They receive the strongest authority signal,
         * but still require meaningful phrase similarity.
         */

        this.state.corrections
            .forEach(record => {

                const similarity =
                    this.similarity(
                        cleanQuery,
                        record.command
                    );

                if (
                    similarity < 0.30
                ) {
                    return;
                }

                addResult(
                    "correction",
                    record,
                    similarity,
                    this.clamp(
                        record.authority ?? 1
                    ),
                    1
                );
            });


        /*
         * Validated command memories.
         */

        this.state.commands
            .forEach(record => {

                if (
                    !record ||
                    record.disabled
                ) {
                    return;
                }

                const similarity =
                    this.similarity(
                        cleanQuery,
                        record.command
                    );

                if (
                    similarity <
                    this.minimumRetrievalScore
                ) {
                    return;
                }

                const confidence =
                    this.calculateCommandConfidence(
                        record
                    );

                addResult(
                    "command",
                    record,
                    similarity,
                    0.35,
                    confidence
                );
            });


        /*
         * Promoted patterns.
         */

        this.state.patterns
            .forEach(record => {

                if (!record) return;

                const similarity =
                    this.similarity(
                        cleanQuery,
                        record.phrase
                    );

                if (
                    similarity <
                    this.minimumRetrievalScore
                ) {
                    return;
                }

                addResult(
                    "pattern",
                    record,
                    similarity,
                    0.45,
                    this.clamp(
                        record.confidence
                    )
                );
            });


        /*
         * Preferences are supporting context,
         * never direct action authority.
         */

        if (includePreferences) {

            this.state.preferences
                .forEach(record => {

                    if (!record) return;

                    const similarity =
                        Math.max(
                            this.similarity(
                                cleanQuery,
                                record.key
                            ),
                            typeof record.value ===
                                "string"
                                ? this.similarity(
                                    cleanQuery,
                                    record.value
                                )
                                : 0
                        );

                    if (
                        similarity < 0.35
                    ) {
                        return;
                    }

                    addResult(
                        "preference",
                        record,
                        similarity,
                        0.10,
                        this.clamp(
                            record.confidence
                        )
                    );
                });
        }


        const typePriority = {
            correction: 4,
            pattern: 3,
            command: 2,
            preference: 1
        };


        results.sort(
            (a, b) => {

                const scoreDifference =
                    b.score -
                    a.score;

                if (
                    Math.abs(
                        scoreDifference
                    ) > 0.05
                ) {
                    return scoreDifference;
                }

                return (
                    (
                        typePriority[b.type] ||
                        0
                    ) -
                    (
                        typePriority[a.type] ||
                        0
                    )
                );
            }
        );


        const selected =
            results.slice(
                0,
                Math.max(
                    1,
                    Math.min(
                        Number(limit) || 8,
                        30
                    )
                )
            );


        if (track) {

            this.state.metrics
                .retrievals += 1;

            this.state.metrics
                .lastRetrievalAt =
                Date.now();

            this.lastRetrievedAt =
                Date.now();

            if (selected.length) {

                this.state.metrics
                    .retrievalHits += 1;
            }

            selected.forEach(result => {

                if (!result.record) {
                    return;
                }

                result.record.uses =
                    this.normalizeNumber(
                        result.record.uses
                    ) + 1;

                result.record.lastUsedAt =
                    Date.now();
            });

            this.save();
        }


        return selected.map(
            result => ({
                type:
                    result.type,

                score:
                    Number(
                        result.score
                            .toFixed(4)
                    ),

                similarity:
                    Number(
                        result.similarity
                            .toFixed(4)
                    ),

                authority:
                    Number(
                        result.authority
                            .toFixed(4)
                    ),

                confidence:
                    Number(
                        result.confidence
                            .toFixed(4)
                    ),

                record:
                    this.clone(
                        result.record
                    )
            })
        );
    },


    contextSimilarity(
        first = {},
        second = {}
    ) {

        if (
            !first ||
            !second ||
            typeof first !== "object" ||
            typeof second !== "object"
        ) {
            return 0;
        }

        const keys = [
            "app",
            "screen",
            "page",
            "entityId",
            "worldId"
        ];

        let comparable = 0;
        let matches = 0;

        keys.forEach(key => {

            if (
                first[key] == null ||
                second[key] == null
            ) {
                return;
            }

            comparable += 1;

            if (
                String(first[key]) ===
                String(second[key])
            ) {
                matches += 1;
            }
        });

        if (!comparable) {
            return 0;
        }

        return this.clamp(
            matches / comparable
        );
    },


    /* =====================================================
       INTENT SUGGESTION
    ===================================================== */

    suggestIntent(
        command,
        {
            context = {},
            retrievalResults = null
        } = {}
    ) {

        const results =
            Array.isArray(
                retrievalResults
            )
                ? retrievalResults
                : this.retrieve(
                    command,
                    {
                        limit: 8,
                        context,
                        includePreferences: false,
                        track: false
                    }
                );

        if (!results.length) {
            return null;
        }

        /*
         * Explicit corrections win when the
         * correction is sufficiently similar.
         */

        const correction =
            results.find(
                result =>
                    result.type ===
                        "correction" &&
                    result.similarity >=
                        0.45 &&
                    (
                        result.record
                            ?.correctedIntent ||
                        result.record
                            ?.correctedAction
                    )
            );

        if (correction) {

            return {
                source:
                    "correction",

                confidence:
                    this.clamp(
                        Math.max(
                            0.85,
                            correction.score
                        )
                    ),

                intent:
                    this.clone(
                        correction.record
                            .correctedIntent
                    ),

                action:
                    this.clone(
                        correction.record
                            .correctedAction
                    ),

                memoryId:
                    correction.record.id,

                score:
                    correction.score
            };
        }


        const candidate =
            results.find(
                result =>
                    (
                        result.type ===
                            "pattern" ||
                        result.type ===
                            "command"
                    ) &&
                    result.confidence >=
                        this
                            .minimumLearningConfidence
            );

        if (!candidate) {
            return null;
        }


        return {
            source:
                candidate.type,

            confidence:
                this.clamp(
                    (
                        candidate.score +
                        candidate.confidence
                    ) / 2
                ),

            intent:
                this.clone(
                    candidate.record.intent
                ),

            action:
                this.clone(
                    candidate.record.action
                ),

            memoryId:
                candidate.record.id,

            score:
                candidate.score
        };
    },


    /* =====================================================
       LEARNING CONTEXT
    ===================================================== */

    getLearningContext(
        command,
        {
            context = {},
            limit = 6
        } = {}
    ) {

        /*
         * Retrieve only once.
         * The old implementation could retrieve twice
         * through suggestIntent(), unnecessarily updating
         * metrics/storage twice.
         */

        const memories =
            this.retrieve(
                command,
                {
                    limit,
                    context,
                    includePreferences: true,
                    track: true
                }
            );

        const suggestion =
            this.suggestIntent(
                command,
                {
                    context,
                    retrievalResults:
                        memories
                }
            );


        const corrections =
            memories
                .filter(
                    item =>
                        item.type ===
                        "correction"
                )
                .slice(0, 3)
                .map(item => ({
                    command:
                        item.record.command,

                    correctedIntent:
                        item.record
                            .correctedIntent,

                    correctedAction:
                        item.record
                            .correctedAction,

                    confidence:
                        item.confidence,

                    score:
                        item.score
                }));


        const examples =
            memories
                .filter(
                    item =>
                        item.type ===
                            "command" ||
                        item.type ===
                            "pattern"
                )
                .slice(0, 4)
                .map(item => ({
                    phrase:
                        item.record.command ||
                        item.record.phrase,

                    intent:
                        item.record.intent,

                    action:
                        item.record.action,

                    confidence:
                        item.confidence,

                    score:
                        item.score
                }));


        const preferences =
            memories
                .filter(
                    item =>
                        item.type ===
                            "preference"
                )
                .slice(0, 4)
                .map(item => ({
                    key:
                        item.record.key,

                    value:
                        item.record.value,

                    confidence:
                        item.record
                            .confidence
                }));


        return this.sanitizeValue({

            suggestion,

            corrections,

            examples,

            preferences,

            generatedAt:
                Date.now()
        });
    },


    /* =====================================================
       FEEDBACK
    ===================================================== */

    markUseful(memoryId) {

        const result =
            this.findById(
                memoryId
            );

        if (!result) {
            return false;
        }

        const record =
            result.record;

        record.uses =
            this.normalizeNumber(
                record.uses
            ) + 1;

        record.lastUsedAt =
            Date.now();


        if (
            result.type ===
                "command"
        ) {

            record.successCount =
                this.normalizeNumber(
                    record.successCount
                ) + 1;

            record.confidence =
                this.calculateCommandConfidence(
                    record
                );

            if (
                record.successCount >=
                this.autoPromoteThreshold
            ) {
                this.learnPatternFromCommand(
                    record
                );
            }
        }


        if (
            result.type ===
                "pattern"
        ) {

            record.confidence =
                this.clamp(
                    this.normalizeNumber(
                        record.confidence,
                        0.5
                    ) + 0.05
                );
        }


        this.save();

        return true;
    },


    markWrong(memoryId) {

        const result =
            this.findById(
                memoryId
            );

        if (!result) {
            return false;
        }

        const record =
            result.record;


        if (
            result.type ===
                "command"
        ) {

            record.failureCount =
                this.normalizeNumber(
                    record.failureCount
                ) + 1;

            record.confidence =
                this.calculateCommandConfidence(
                    record
                );
        }


        if (
            result.type ===
                "pattern"
        ) {

            record.confidence =
                this.clamp(
                    this.normalizeNumber(
                        record.confidence,
                        0.5
                    ) - 0.15
                );

            if (
                record.confidence <
                this.minimumLearningConfidence
            ) {
                record.disabled = true;
            }
        }


        if (
            result.type ===
                "preference"
        ) {

            record.confidence =
                this.clamp(
                    this.normalizeNumber(
                        record.confidence,
                        0.5
                    ) - 0.20
                );
        }


        this.save();

        return true;
    },


    /* =====================================================
       LOOKUP
    ===================================================== */

    findById(id) {

        const memoryId =
            String(id || "");

        if (!memoryId) {
            return null;
        }

        const collections = [
            [
                "command",
                this.state.commands
            ],
            [
                "correction",
                this.state.corrections
            ],
            [
                "preference",
                this.state.preferences
            ],
            [
                "pattern",
                this.state.patterns
            ]
        ];

        for (
            const [
                type,
                collection
            ] of collections
        ) {

            const record =
                collection.find(
                    item =>
                        item?.id ===
                        memoryId
                );

            if (record) {

                return {
                    type,
                    record
                };
            }
        }

        return null;
    },


    /* =====================================================
       FORGET / USER CONTROL
    ===================================================== */

    forget(memoryId) {

        const id =
            String(
                memoryId || ""
            );

        if (!id) {
            return false;
        }

        let removed = false;

        [
            "commands",
            "corrections",
            "preferences",
            "patterns"
        ].forEach(key => {

            const before =
                this.state[key].length;

            this.state[key] =
                this.state[key]
                    .filter(
                        item =>
                            item?.id !== id
                    );

            if (
                this.state[key].length !==
                before
            ) {
                removed = true;
            }
        });

        if (removed) {
            this.save();
        }

        return removed;
    },


    forgetCommand(command) {

        const normalized =
            this.normalizeKey(
                command
            );

        if (!normalized) {
            return 0;
        }

        let removed = 0;

        this.state.commands =
            this.state.commands.filter(
                record => {

                    if (
                        record
                            .normalizedCommand ===
                        normalized
                    ) {

                        removed += 1;
                        return false;
                    }

                    return true;
                }
            );


        this.state.patterns =
            this.state.patterns.filter(
                record => {

                    if (
                        record
                            .normalizedPhrase ===
                        normalized
                    ) {

                        removed += 1;
                        return false;
                    }

                    return true;
                }
            );


        this.state.corrections =
            this.state.corrections.filter(
                record => {

                    if (
                        record
                            .normalizedCommand ===
                        normalized
                    ) {

                        removed += 1;
                        return false;
                    }

                    return true;
                }
            );


        if (removed) {
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
    ) {

        if (
            !Array.isArray(
                collection
            )
        ) {
            return [];
        }

        if (
            collection.length <=
            limit
        ) {
            return collection;
        }

        return collection
            .slice()
            .sort(
                (a, b) => {

                    const aTime =
                        Number(
                            a.lastUsedAt ||
                            a.updatedAt ||
                            a.createdAt ||
                            0
                        );

                    const bTime =
                        Number(
                            b.lastUsedAt ||
                            b.updatedAt ||
                            b.createdAt ||
                            0
                        );

                    return (
                        bTime -
                        aTime
                    );
                }
            )
            .slice(
                0,
                limit
            );
    },


    prune() {

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
    },


    /* =====================================================
       LEARNING HEALTH
    ===================================================== */

    learningHealth() {

        const metrics =
            this.state.metrics;

        const successful =
            this.normalizeNumber(
                metrics.successfulCommands
            );

        const failed =
            this.normalizeNumber(
                metrics.failedCommands
            );

        const totalOutcomes =
            successful + failed;

        const successRate =
            totalOutcomes
                ? successful /
                    totalOutcomes
                : null;

        const retrievals =
            this.normalizeNumber(
                metrics.retrievals
            );

        const retrievalHits =
            this.normalizeNumber(
                metrics.retrievalHits
            );

        const retrievalHitRate =
            retrievals
                ? retrievalHits /
                    retrievals
                : null;


        const uncertainCommands =
            this.state.commands
                .filter(
                    record =>
                        this
                            .calculateCommandConfidence(
                                record
                            ) <
                        this
                            .minimumLearningConfidence
                )
                .length;


        const correctedCommands =
            this.state.commands
                .filter(
                    record =>
                        record.corrected
                )
                .length;


        let score = 0.5;

        if (
            successRate !== null
        ) {
            score +=
                (
                    successRate -
                    0.5
                ) * 0.5;
        }

        if (
            retrievalHitRate !== null
        ) {
            score +=
                (
                    retrievalHitRate -
                    0.5
                ) * 0.2;
        }

        const correctionPenalty =
            Math.min(
                0.2,
                correctedCommands /
                Math.max(
                    1,
                    this.state
                        .commands
                        .length
                ) *
                0.2
            );

        score -= correctionPenalty;


        return {

            score:
                Number(
                    this
                        .clamp(score)
                        .toFixed(3)
                ),

            successRate:
                successRate === null
                    ? null
                    : Number(
                        successRate
                            .toFixed(3)
                    ),

            retrievalHitRate:
                retrievalHitRate === null
                    ? null
                    : Number(
                        retrievalHitRate
                            .toFixed(3)
                    ),

            commands:
                this.state
                    .commands
                    .length,

            patterns:
                this.state
                    .patterns
                    .length,

            corrections:
                this.state
                    .corrections
                    .length,

            preferences:
                this.state
                    .preferences
                    .length,

            uncertainCommands,

            correctedCommands,

            lastLearningAt:
                metrics
                    .lastLearningAt,

            lastCorrectionAt:
                metrics
                    .lastCorrectionAt,

            lastRetrievalAt:
                metrics
                    .lastRetrievalAt
        };
    },


    /* =====================================================
       DECISION TRACE
       User-safe operational explanation.
       Never stores hidden reasoning / chain-of-thought.
    ===================================================== */

    createDecisionTrace({
        command = null,
        selectedIntent = null,
        selectedAction = null,
        memory = null,
        confidence = null,
        reason = null,
        context = {}
    } = {}) {

        return this.sanitizeValue({

            id:
                this.createId(
                    "decision-trace"
                ),

            command:
                command
                    ? this.redactSensitiveString(
                        this.normalizeText(
                            command,
                            4000
                        )
                    )
                    : null,

            selectedIntent:
                this.sanitizeValue(
                    selectedIntent
                ),

            selectedAction:
                this.sanitizeValue(
                    selectedAction
                ),

            memorySource:
                memory
                    ? {
                        type:
                            memory.type ||
                            memory.source ||
                            null,

                        id:
                            memory.id ||
                            memory.memoryId ||
                            null,

                        score:
                            memory.score ??
                            null
                    }
                    : null,

            confidence:
                confidence == null
                    ? null
                    : this.clamp(
                        confidence
                    ),

            reason:
                reason
                    ? this.redactSensitiveString(
                        this.normalizeText(
                            reason,
                            1000
                        )
                    )
                    : null,

            context:
                this.sanitizeContext(
                    context
                ),

            createdAt:
                Date.now()
        });
    },


    /* =====================================================
       REPORT
    ===================================================== */

    all() {

        return this.clone(
            this.state
        );
    },


    report() {

        return {

            version:
                this.version,

            initialized:
                this.initialized,

            initializedAt:
                this.initializedAt,

            counts: {
                commands:
                    this.state
                        .commands
                        .length,

                corrections:
                    this.state
                        .corrections
                        .length,

                preferences:
                    this.state
                        .preferences
                        .length,

                patterns:
                    this.state
                        .patterns
                        .length
            },

            metrics:
                this.clone(
                    this.state.metrics
                ),

            learningHealth:
                this.learningHealth()
        };
    },


    /* =====================================================
       RESET
    ===================================================== */

    reset({
        confirm = false
    } = {}) {

        if (!confirm) {
            return false;
        }

        this.state = {
            commands: [],
            corrections: [],
            preferences: [],
            patterns: [],
            metrics:
                this.defaultMetrics()
        };

        try {

            if (
                typeof localStorage !==
                    "undefined"
            ) {

                localStorage.removeItem(
                    this.storageKey
                );
            }

        } catch (_) {}

        return true;
    },


    /* =====================================================
       EVENTS
    ===================================================== */

    emit(
        eventName,
        payload = {}
    ) {

        const safePayload =
            this.sanitizeValue(
                payload
            );

        try {

            if (
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ) {

                VAERO.emit(
                    eventName,
                    safePayload
                );
            }

        } catch (_) {}


        try {

            if (
                typeof window !==
                    "undefined" &&
                typeof window
                    .dispatchEvent ===
                    "function" &&
                typeof CustomEvent !==
                    "undefined"
            ) {

                window.dispatchEvent(
                    new CustomEvent(
                        eventName,
                        {
                            detail:
                                safePayload
                        }
                    )
                );
            }

        } catch (_) {}
    },


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    init() {

        if (
            this.initialized
        ) {
            return this;
        }

        this.load();
        this.prune();

        this.initialized = true;
        this.initializedAt =
            Date.now();

        this.emit(
            "brain:memory:ready",
            {
                version:
                    this.version,

                counts: {
                    commands:
                        this.state
                            .commands
                            .length,

                    corrections:
                        this.state
                            .corrections
                            .length,

                    preferences:
                        this.state
                            .preferences
                            .length,

                    patterns:
                        this.state
                            .patterns
                            .length
                }
            }
        );

        return this;
    }

};


/* =========================================================
   VAERO REGISTRATION
========================================================= */

if (
    typeof VAERO !== "undefined" &&
    typeof VAERO.register === "function"
) {

    VAERO.register(
        "brainMemory",
        BrainMemory
    );
}


if (
    typeof window !== "undefined"
) {

    window.BrainMemory =
        BrainMemory;
}


BrainMemory.init();
