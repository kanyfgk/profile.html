/* =========================================================
   VAERO EVOLUTION CORE
   Central Life / Progress / Decision / Goal System
========================================================= */

const Evolution = {

    history:
        [],

    booted:
        false,

    storageKey:
        "vaero:evolution:events:v2",

    legacyStorageKey:
        "vaero:evolution:events",


    /* =====================================================
       DEFINITIONS
    ===================================================== */

    eventTypes: [

        "achievement",
        "decision",
        "failure",
        "relationship",
        "work",
        "health",
        "finance",
        "location",
        "goal",
        "milestone",
        "engine:start",
        "life-event",
        "general"

    ],


    eventStatuses: [

        "planned",
        "progress",
        "active",
        "completed",
        "paused",
        "cancelled"

    ],


    importanceLevels: [

        "low",
        "medium",
        "high",
        "critical"

    ],


    /* =====================================================
       SAFE ACCESS
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
                `Evolution service okunamadı: ${serviceName}`,
                error
            );


            return null;

        }

    },


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


        const safePayload =
            payload &&
            typeof payload ===
                "object" &&
            !Array.isArray(
                payload
            )
                ? payload
                : {};


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    name,
                    safePayload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `Evolution event gönderilemedi: ${name}`,
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
                    safePayload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `Evolution event fallback gönderilemedi: ${name}`,
                error
            );

        }


        return false;

    },


    emitLifeEvent(
        eventName,
        event
    ){

        if(!event){

            return false;

        }


        const events =
            this.getService(
                "events"
            );


        if(
            !events ||
            typeof events.emit !==
                "function"
        ){

            /*
             * VAERO emit fallback is useful when Events
             * service is temporarily unavailable.
             */

            return this.emit(
                eventName,
                event
            );

        }


        try{

            events.emit(
                eventName,
                event
            );


            return true;

        } catch(error){

            console.warn(
                `Evolution Life Event yayınlanamadı: ${eventName}`,
                error
            );


            return false;

        }

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(){

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

            /* fallback below */

        }


        return `evolution_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       TEXT
    ===================================================== */

    normalizeText(value){

        return String(
            value ??
            ""
        )
            .toLowerCase()
            .trim()
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
                /[?.!,;:]/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            );

    },


    normalizeDisplayText(
        value,
        maxLength = 30000
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


    normalizeId(value){

        const id =
            String(
                value ??
                ""
            )
                .trim()
                .slice(
                    0,
                    200
                );


        return (
            id ||
            null
        );

    },


    normalizeTimestamp(
        value,
        fallback = Date.now()
    ){

        const timestamp =
            Number(
                value
            );


        return Number.isFinite(
            timestamp
        )
            ? timestamp
            : fallback;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeType(type){

        const normalized =
            String(
                type ??
                ""
            )
                .toLowerCase()
                .trim();


        if(
            this.eventTypes.includes(
                normalized
            )
        ){

            return normalized;

        }


        return "general";

    },


    normalizeStatus(status){

        const normalized =
            String(
                status ??
                ""
            )
                .toLowerCase()
                .trim();


        /*
         * Legacy "active" events are represented as
         * "progress" in the current Evolution model.
         */

        if(
            normalized ===
                "active"
        ){

            return "progress";

        }


        if(
            [
                "planned",
                "progress",
                "completed",
                "paused",
                "cancelled"
            ].includes(
                normalized
            )
        ){

            return normalized;

        }


        return "completed";

    },


    normalizeImportance(
        importance
    ){

        const normalized =
            String(
                importance ??
                ""
            )
                .toLowerCase()
                .trim();


        if(
            this.importanceLevels.includes(
                normalized
            )
        ){

            return normalized;

        }


        return "medium";

    },


    normalizeTags(tags){

        if(
            !Array.isArray(
                tags
            ) &&
            !(tags instanceof Set)
        ){

            return [];

        }


        const source =
            Array.isArray(
                tags
            )
                ? tags
                : [
                    ...tags
                ];


        const seen =
            new Set();


        return source
            .map(
                tag =>
                    String(
                        tag ??
                        ""
                    )
                        .trim()
                        .slice(
                            0,
                            80
                        )
            )
            .filter(
                tag => {

                    if(!tag){

                        return false;

                    }


                    const key =
                        tag.toLocaleLowerCase(
                            "tr-TR"
                        );


                    if(
                        seen.has(
                            key
                        )
                    ){

                        return false;

                    }


                    seen.add(
                        key
                    );


                    return true;

                }
            )
            .slice(
                0,
                40
            );

    },


    normalizeEffects(effects){

        if(
            !effects ||
            typeof effects !==
                "object" ||
            Array.isArray(
                effects
            )
        ){

            return {};

        }


        const normalized =
            {};


        Object.entries(
            effects
        )
            .forEach(
                (
                    [
                        key,
                        value
                    ]
                ) => {

                    const effectName =
                        String(
                            key ??
                            ""
                        )
                            .trim()
                            .slice(
                                0,
                                120
                            );


                    const effectValue =
                        Number(
                            value
                        );


                    if(
                        effectName &&
                        Number.isFinite(
                            effectValue
                        )
                    ){

                        normalized[
                            effectName
                        ] =
                            effectValue;

                    }

                }
            );


        return normalized;

    },


    normalizeList(
        value,
        lowerCase = false
    ){

        if(
            !Array.isArray(
                value
            ) &&
            !(value instanceof Set)
        ){

            return [];

        }


        const source =
            Array.isArray(
                value
            )
                ? value
                : [
                    ...value
                ];


        const seen =
            new Set();


        return source
            .map(
                item => {

                    let result =
                        String(
                            item ??
                            ""
                        )
                            .trim()
                            .slice(
                                0,
                                160
                            );


                    if(lowerCase){

                        result =
                            result.toLowerCase();

                    }


                    return result;

                }
            )
            .filter(
                item => {

                    if(!item){

                        return false;

                    }


                    const key =
                        item.toLocaleLowerCase(
                            "tr-TR"
                        );


                    if(
                        seen.has(
                            key
                        )
                    ){

                        return false;

                    }


                    seen.add(
                        key
                    );


                    return true;

                }
            );

    },


    normalizeProgress(value){

        const number =
            Number(
                value
            );


        if(
            !Number.isFinite(
                number
            )
        ){

            return 0;

        }


        return Math.min(
            100,
            Math.max(
                0,
                Math.round(
                    number
                )
            )
        );

    },


    normalizePayload(value){

        if(
            !value ||
            typeof value !==
                "object" ||
            Array.isArray(
                value
            )
        ){

            return {};

        }


        return {
            ...value
        };

    },


    normalizeEvent(
        event = {}
    ){

        const sourceEvent =
            event &&
            typeof event ===
                "object" &&
            !Array.isArray(
                event
            )
                ? event
                : {};


        const now =
            Date.now();


        const payload =
            this.normalizePayload(
                sourceEvent.payload
            );


        const type =
            this.normalizeType(
                sourceEvent.type ||
                payload.type
            );


        const status =
            this.normalizeStatus(
                sourceEvent.status ||
                payload.status
            );


        let progress =
            this.normalizeProgress(
                sourceEvent.progress ??
                payload.progress
            );


        if(
            type ===
                "goal" &&
            status ===
                "completed"
        ){

            progress =
                100;

        }


        if(
            type !==
                "goal"
        ){

            progress =
                0;

        }


        const createdAt =
            this.normalizeTimestamp(
                sourceEvent.createdAt,
                now
            );


        const updatedAt =
            this.normalizeTimestamp(
                sourceEvent.updatedAt,
                createdAt
            );


        const occurredAt =
            this.normalizeTimestamp(
                sourceEvent.occurredAt ??
                payload.occurredAt,
                createdAt
            );


        const archived =
            sourceEvent.archived ===
                true;


        return {

            id:
                this.normalizeId(
                    sourceEvent.id
                ) ||
                this.createId(),

            type,

            title:
                this.normalizeDisplayText(
                    sourceEvent.title ||
                    payload.title ||
                    sourceEvent.description ||
                    "Yaşam olayı",
                    240
                ) ||
                "Yaşam olayı",

            description:
                this.normalizeDisplayText(
                    sourceEvent.description ||
                    payload.description ||
                    "",
                    30000
                ),

            status,

            importance:
                this.normalizeImportance(
                    sourceEvent.importance ||
                    payload.importance
                ),

            source:
                this.normalizeDisplayText(
                    sourceEvent.source ||
                    payload.source ||
                    "user",
                    120
                ) ||
                "user",

            tags:
                this.normalizeTags(
                    sourceEvent.tags ||
                    payload.tags
                ),

            relatedEntityId:
                this.normalizeId(
                    sourceEvent.relatedEntityId ||
                    sourceEvent.entityId ||
                    payload.relatedEntityId ||
                    payload.entityId
                ),

            relatedWorldId:
                this.normalizeId(
                    sourceEvent.relatedWorldId ||
                    sourceEvent.worldId ||
                    payload.relatedWorldId ||
                    payload.worldId
                ),

            effects:
                this.normalizeEffects(
                    sourceEvent.effects ||
                    payload.effects
                ),

            xp:
                Math.max(
                    0,
                    Number(
                        sourceEvent.xp ??
                        payload.xp
                    ) ||
                    0
                ),

            progress,

            organs:
                this.normalizeList(
                    sourceEvent.organs ||
                    payload.organs,
                    true
                ),

            identities:
                this.normalizeList(
                    sourceEvent.identities ||
                    payload.identities
                ),

            archived,

            archivedAt:
                archived
                    ? this.normalizeTimestamp(
                        sourceEvent.archivedAt,
                        updatedAt
                    )
                    : null,

            occurredAt,

            createdAt,

            updatedAt:
                Math.max(
                    createdAt,
                    updatedAt
                ),

            payload

        };

    },


    /* =====================================================
       INIT
    ===================================================== */

    init(){

        if(
            this.booted
        ){

            return this;

        }


        this.load();


        this.cleanupLegacyEngineStarts();


        this.migrateLegacyEvents();


        this.sort();


        this.booted =
            true;


        this.emit(
            "evolution:ready",
            {
                count:
                    this.history.length,

                time:
                    Date.now()
            }
        );


        return this;

    },


    /* =====================================================
       LEGACY CLEANUP
    ===================================================== */

    cleanupLegacyEngineStarts(){

        const before =
            this.history.length;


        this.history =
            this.history.filter(
                event =>
                    !(
                        event.type ===
                            "general" &&
                        event.title ===
                            "VAERO Engine started with root entity"
                    )
            );


        const removed =
            before -
            this.history.length;


        if(
            removed >
                0
        ){

            this.save();

        }


        return removed;

    },


    migrateLegacyEvents(){

        let changed =
            false;


        const byId =
            new Map();


        this.history
            .filter(Boolean)
            .forEach(
                event => {

                    const normalized =
                        this.normalizeEvent(
                            event
                        );


                    if(
                        JSON.stringify(
                            normalized
                        ) !==
                        JSON.stringify(
                            event
                        )
                    ){

                        changed =
                            true;

                    }


                    const existing =
                        byId.get(
                            normalized.id
                        );


                    if(
                        !existing ||
                        Number(
                            normalized.updatedAt
                        ) >
                        Number(
                            existing.updatedAt
                        )
                    ){

                        byId.set(
                            normalized.id,
                            normalized
                        );

                    }

                }
            );


        this.history =
            [
                ...byId.values()
            ];


        this.sort();


        if(changed){

            this.save();

        }


        return changed;

    },


    /* =====================================================
       LIFE EVENT ANALYSIS
    ===================================================== */

    analyzeLifeEvent(
        data = {}
    ){

        const text =
            this.normalizeText(
                `${data.title || ""} ${data.description || ""}`
            );


        let type =
            "general";


        let importance =
            "medium";


        const tags =
            [];


        let effects =
            {};


        if(
            text.includes(
                "ilk satis"
            ) ||
            text.includes(
                "basari"
            ) ||
            text.includes(
                "kazandi"
            ) ||
            text.includes(
                "tamamlandi"
            )
        ){

            type =
                "achievement";


            importance =
                "high";


            tags.push(
                "başarı"
            );


            effects = {

                experience:
                    10,

                confidence:
                    5,

                reputation:
                    3

            };

        }

        else if(
            text.includes(
                "basarisiz"
            ) ||
            text.includes(
                "kaybetti"
            ) ||
            text.includes(
                "olmadi"
            ) ||
            text.includes(
                "hata"
            )
        ){

            type =
                "failure";


            importance =
                "high";


            tags.push(
                "deneyim"
            );


            effects = {

                experience:
                    8,

                confidence:
                    -3

            };

        }

        else if(
            text.includes(
                "karar verdi"
            ) ||
            text.includes(
                "karar aldi"
            ) ||
            text.includes(
                "vazgecti"
            )
        ){

            type =
                "decision";


            tags.push(
                "karar"
            );


            effects = {

                awareness:
                    4

            };

        }

        else if(
            text.includes(
                "hedef"
            ) ||
            text.includes(
                "planliyor"
            ) ||
            text.includes(
                "yapacak"
            )
        ){

            type =
                "goal";


            tags.push(
                "hedef"
            );


            effects = {

                motivation:
                    3

            };

        }

        else if(
            text.includes(
                "ise basladi"
            ) ||
            text.includes(
                "is kurdu"
            ) ||
            text.includes(
                "sirket"
            )
        ){

            type =
                "work";


            importance =
                "high";


            tags.push(
                "iş"
            );


            effects = {

                experience:
                    7,

                responsibility:
                    5

            };

        }

        else if(
            text.includes(
                "para"
            ) ||
            text.includes(
                "gelir"
            ) ||
            text.includes(
                "borc"
            ) ||
            text.includes(
                "odeme"
            )
        ){

            type =
                "finance";


            tags.push(
                "finans"
            );


            effects = {

                financialExperience:
                    5

            };

        }


        return {

            type,

            importance,

            tags:
                this.normalizeTags(
                    tags
                ),

            effects:
                this.normalizeEffects(
                    effects
                )

        };

    },


    /* =====================================================
       ORGAN INFERENCE
    ===================================================== */

    inferAffectedOrgans(
        data = {},
        analysis = {}
    ){

        const organs =
            new Set(
                this.normalizeList(
                    data.organs,
                    true
                )
            );


        const analysisType =
            String(
                analysis.type ||
                ""
            )
                .trim()
                .toLowerCase();


        const importance =
            this.normalizeImportance(
                data.importance ||
                analysis.importance
            );


        const text =
            this.normalizeText(
                [
                    data.type,
                    analysisType,
                    data.title,
                    data.description,
                    data.source
                ]
                    .filter(Boolean)
                    .join(" ")
            );


        /*
         * Every Evolution event becomes part of living
         * chronology and memory.
         */

        organs.add(
            "timeline"
        );


        organs.add(
            "memory"
        );


        if(
            text.includes(
                "kimlik"
            ) ||
            text.includes(
                "identity"
            ) ||
            text.includes(
                "dogrulama"
            )
        ){

            organs.add(
                "identity"
            );

        }


        if(
            text.includes(
                "profil"
            ) ||
            text.includes(
                "profile"
            )
        ){

            organs.add(
                "profile"
            );

        }


        if(
            text.includes(
                "bridge"
            ) ||
            text.includes(
                "kopru"
            ) ||
            text.includes(
                "baglanti"
            ) ||
            analysisType ===
                "relationship"
        ){

            organs.add(
                "bridge"
            );

        }


        if(
            analysisType ===
                "achievement" ||
            analysisType ===
                "decision" ||
            importance ===
                "high" ||
            importance ===
                "critical"
        ){

            organs.add(
                "brain"
            );

        }


        return [
            ...organs
        ];

    },


    /* =====================================================
       VALIDATION
    ===================================================== */

    validateLifeEvent(
        data = {}
    ){

        const title =
            this.normalizeDisplayText(
                data.title,
                240
            );


        const description =
            this.normalizeDisplayText(
                data.description,
                30000
            );


        if(
            !title &&
            !description
        ){

            return {

                valid:
                    false,

                reason:
                    "Yaşam olayının başlığı veya açıklaması olmalı."

            };

        }


        return {

            valid:
                true,

            reason:
                null

        };

    },


    /* =====================================================
       XP
    ===================================================== */

    calculateDefaultXP(
        importance
    ){

        const values = {

            low:
                5,

            medium:
                10,

            high:
                25,

            critical:
                50

        };


        return (
            values[
                this.normalizeImportance(
                    importance
                )
            ] ||
            10
        );

    },


    /* =====================================================
       RECORD
       Main creation API.
    ===================================================== */

    record(
        type,
        description,
        payload = {}
    ){

        const safePayload =
            this.normalizePayload(
                payload
            );


        const now =
            Date.now();


        const normalizedType =
            this.normalizeType(
                type
            );


        const importance =
            this.normalizeImportance(
                safePayload.importance
            );


        const status =
            this.normalizeStatus(
                safePayload.status
            );


        const progress =
            normalizedType ===
                "goal"
                ? (
                    status ===
                        "completed"
                        ? 100
                        : this.normalizeProgress(
                            safePayload.progress
                        )
                )
                : 0;


        const requestedXP =
            Number(
                safePayload.xp
            );


        const event =
            this.normalizeEvent({

                id:
                    this.createId(),

                type:
                    normalizedType,

                title:
                    this.normalizeDisplayText(
                        safePayload.title ||
                        description ||
                        "Yaşam olayı",
                        240
                    ),

                description:
                    this.normalizeDisplayText(
                        safePayload.description ||
                        description ||
                        "",
                        30000
                    ),

                status,

                importance,

                source:
                    this.normalizeDisplayText(
                        safePayload.source ||
                        "user",
                        120
                    ) ||
                    "user",

                tags:
                    safePayload.tags,

                relatedEntityId:
                    safePayload.relatedEntityId ||
                    safePayload.entityId ||
                    null,

                relatedWorldId:
                    safePayload.relatedWorldId ||
                    safePayload.worldId ||
                    null,

                effects:
                    safePayload.effects,

                xp:
                    Number.isFinite(
                        requestedXP
                    ) &&
                    requestedXP >
                        0
                        ? requestedXP
                        : this.calculateDefaultXP(
                            importance
                        ),

                progress,

                organs:
                    safePayload.organs,

                identities:
                    safePayload.identities,

                occurredAt:
                    safePayload.occurredAt ||
                    now,

                createdAt:
                    now,

                updatedAt:
                    now,

                payload:{
                    ...safePayload,

                    progress
                }

            });


        this.history.push(
            event
        );


        this.sort();


        this.save();


        this.emit(
            "evolution:recorded",
            event
        );


        /*
         * Canonical integration point:
         * Timeline + Memory subscribe to this Life Event.
         */

        this.publishLifeEvent(
            event
        );


        return event;

    },


    /* =====================================================
       CREATE LIFE EVENT
       Higher-level intelligent creation.
    ===================================================== */

    createLifeEvent(
        data = {}
    ){

        const safeData =
            data &&
            typeof data ===
                "object" &&
            !Array.isArray(
                data
            )
                ? data
                : {};


        const validation =
            this.validateLifeEvent(
                safeData
            );


        if(
            !validation.valid
        ){

            console.warn(
                "Life Event oluşturulamadı:",
                validation.reason
            );


            this.emit(
                "life-event:rejected",
                {
                    data:
                        safeData,

                    reason:
                        validation.reason,

                    time:
                        Date.now()
                }
            );


            return null;

        }


        const analysis =
            this.analyzeLifeEvent(
                safeData
            );


        const type =
            safeData.type ||
            analysis.type;


        const importance =
            safeData.importance ||
            analysis.importance;


        const organs =
            this.inferAffectedOrgans(
                {
                    ...safeData,

                    type,

                    importance
                },
                analysis
            );


        return this.record(
            type,
            safeData.description ||
            safeData.title ||
            "",
            {

                title:
                    safeData.title ||
                    safeData.description ||
                    "Yaşam olayı",

                description:
                    safeData.description ||
                    "",

                status:
                    safeData.status ||
                    "completed",

                importance,

                source:
                    safeData.source ||
                    "user",

                tags:
                    this.normalizeTags([
                        ...analysis.tags,

                        ...(
                            Array.isArray(
                                safeData.tags
                            )
                                ? safeData.tags
                                : []
                        )
                    ]),

                relatedEntityId:
                    safeData.relatedEntityId ||
                    safeData.entityId ||
                    null,

                relatedWorldId:
                    safeData.relatedWorldId ||
                    safeData.worldId ||
                    null,

                occurredAt:
                    safeData.occurredAt ||
                    Date.now(),

                effects:{
                    ...analysis.effects,

                    ...(
                        safeData.effects &&
                        typeof safeData.effects ===
                            "object" &&
                        !Array.isArray(
                            safeData.effects
                        )
                            ? safeData.effects
                            : {}
                    )
                },

                xp:
                    safeData.xp,

                progress:
                    safeData.progress,

                organs,

                identities:
                    safeData.identities

            }
        );

    },


    /* =====================================================
       PUBLISH
    ===================================================== */

    publishLifeEvent(event){

        if(!event){

            return false;

        }


        this.emitLifeEvent(
            "life-event:created",
            event
        );


        const importance =
            this.normalizeImportance(
                event.importance
            );


        if(
            importance ===
                "high"
        ){

            this.emitLifeEvent(
                "life-event:important",
                event
            );

        }


        if(
            importance ===
                "critical"
        ){

            this.emitLifeEvent(
                "life-event:critical",
                event
            );

        }


        return true;

    },


    /* =====================================================
       FIND
    ===================================================== */

    find(
        eventId,
        options = {}
    ){

        const id =
            this.normalizeId(
                eventId
            );


        if(!id){

            return null;

        }


        const event =
            this.history.find(
                item =>
                    item?.id ===
                        id
            ) ||
            null;


        if(!event){

            return null;

        }


        if(
            event.archived ===
                true &&
            options?.includeArchived !==
                true
        ){

            return null;

        }


        return event;

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    update(
        eventId,
        changes = {}
    ){

        const event =
            this.find(
                eventId,
                {
                    includeArchived:
                        true
                }
            );


        if(
            !event ||
            !changes ||
            typeof changes !==
                "object" ||
            Array.isArray(
                changes
            )
        ){

            return null;

        }


        const before = {

            ...event,

            tags:[
                ...(event.tags || [])
            ],

            effects:{
                ...(event.effects || {})
            },

            organs:[
                ...(event.organs || [])
            ],

            identities:[
                ...(event.identities || [])
            ],

            payload:{
                ...(event.payload || {})
            }

        };


        if(
            changes.type !==
                undefined
        ){

            event.type =
                this.normalizeType(
                    changes.type
                );

        }


        if(
            changes.title !==
                undefined
        ){

            const title =
                this.normalizeDisplayText(
                    changes.title,
                    240
                );


            if(title){

                event.title =
                    title;

            }

        }


        if(
            changes.description !==
                undefined
        ){

            event.description =
                this.normalizeDisplayText(
                    changes.description,
                    30000
                );

        }


        if(
            changes.status !==
                undefined
        ){

            event.status =
                this.normalizeStatus(
                    changes.status
                );

        }


        if(
            changes.importance !==
                undefined
        ){

            event.importance =
                this.normalizeImportance(
                    changes.importance
                );

        }


        if(
            changes.source !==
                undefined
        ){

            const source =
                this.normalizeDisplayText(
                    changes.source,
                    120
                );


            if(source){

                event.source =
                    source;

            }

        }


        if(
            changes.tags !==
                undefined
        ){

            event.tags =
                this.normalizeTags(
                    changes.tags
                );

        }


        if(
            changes.effects !==
                undefined
        ){

            event.effects =
                this.normalizeEffects(
                    changes.effects
                );

        }


        if(
            changes.xp !==
                undefined
        ){

            event.xp =
                Math.max(
                    0,
                    Number(
                        changes.xp
                    ) ||
                    0
                );

        }


        if(
            changes.organs !==
                undefined
        ){

            event.organs =
                this.normalizeList(
                    changes.organs,
                    true
                );

        }


        if(
            changes.identities !==
                undefined
        ){

            event.identities =
                this.normalizeList(
                    changes.identities
                );

        }


        if(
            changes.relatedEntityId !==
                undefined
        ){

            event.relatedEntityId =
                this.normalizeId(
                    changes.relatedEntityId
                );

        }


        if(
            changes.relatedWorldId !==
                undefined
        ){

            event.relatedWorldId =
                this.normalizeId(
                    changes.relatedWorldId
                );

        }


        if(
            changes.occurredAt !==
                undefined
        ){

            event.occurredAt =
                this.normalizeTimestamp(
                    changes.occurredAt,
                    event.occurredAt
                );

        }


        if(
            changes.progress !==
                undefined
        ){

            event.progress =
                this.normalizeProgress(
                    changes.progress
                );

        }


        /*
         * Goal semantics.
         */

        if(
            event.type ===
                "goal"
        ){

            if(
                event.status ===
                    "completed"
            ){

                event.progress =
                    100;

            }

            else if(
                event.progress >=
                    100
            ){

                event.progress =
                    100;


                event.status =
                    "completed";

            }

        }

        else {

            event.progress =
                0;

        }


        if(
            changes.payload &&
            typeof changes.payload ===
                "object" &&
            !Array.isArray(
                changes.payload
            )
        ){

            event.payload = {

                ...event.payload,

                ...changes.payload

            };

        }


        event.payload = {

            ...event.payload,

            title:
                event.title,

            description:
                event.description,

            status:
                event.status,

            importance:
                event.importance,

            progress:
                event.progress,

            tags:[
                ...event.tags
            ],

            relatedEntityId:
                event.relatedEntityId,

            relatedWorldId:
                event.relatedWorldId

        };


        event.updatedAt =
            Date.now();


        this.sort();


        this.save();


        this.emitLifeEvent(
            "life-event:updated",
            event
        );


        this.emit(
            "evolution:updated",
            {
                event,

                before,

                eventId:
                    event.id,

                time:
                    Date.now()
            }
        );


        return event;

    },

   /* =====================================================
       GOAL PROGRESS
    ===================================================== */

    setProgress(
        eventId,
        progress
    ){

        const event =
            this.find(
                eventId
            );


        if(
            !event ||
            event.type !==
                "goal"
        ){

            return null;

        }


        const value =
            this.normalizeProgress(
                progress
            );


        return this.update(
            event.id,
            {
                progress:
                    value,

                status:
                    value >=
                        100
                        ? "completed"
                        : (
                            value >
                                0
                                ? "progress"
                                : event.status
                        )
            }
        );

    },


    incrementProgress(
        eventId,
        amount = 1
    ){

        const event =
            this.find(
                eventId
            );


        if(
            !event ||
            event.type !==
                "goal"
        ){

            return null;

        }


        const increment =
            Number(
                amount
            );


        return this.setProgress(
            event.id,
            event.progress +
            (
                Number.isFinite(
                    increment
                )
                    ? increment
                    : 0
            )
        );

    },


    completeGoal(eventId){

        const event =
            this.find(
                eventId
            );


        if(
            !event ||
            event.type !==
                "goal"
        ){

            return null;

        }


        return this.update(
            event.id,
            {
                status:
                    "completed",

                progress:
                    100
            }
        );

    },


    /* =====================================================
       ARCHIVE / RESTORE
    ===================================================== */

    archive(eventId){

        const event =
            this.find(
                eventId,
                {
                    includeArchived:
                        true
                }
            );


        if(!event){

            return false;

        }


        if(event.archived){

            return true;

        }


        event.archived =
            true;


        event.archivedAt =
            Date.now();


        event.updatedAt =
            Date.now();


        this.save();


        /*
         * Archived Evolution events leave the active
         * Life Event stream. Timeline / Memory listeners
         * may choose how to represent that transition.
         */

        this.emitLifeEvent(
            "life-event:removed",
            event
        );


        this.emit(
            "evolution:archived",
            {
                event,

                eventId:
                    event.id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    restore(eventId){

        const event =
            this.find(
                eventId,
                {
                    includeArchived:
                        true
                }
            );


        if(!event){

            return false;

        }


        if(!event.archived){

            return true;

        }


        event.archived =
            false;


        event.archivedAt =
            null;


        event.updatedAt =
            Date.now();


        this.save();


        /*
         * Re-publish restored Life Event so dependent
         * systems can recreate or restore their links.
         */

        this.publishLifeEvent(
            event
        );


        this.emit(
            "evolution:restored",
            {
                event,

                eventId:
                    event.id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       HARD REMOVE
    ===================================================== */

    remove(eventId){

        const event =
            this.find(
                eventId,
                {
                    includeArchived:
                        true
                }
            );


        if(!event){

            return false;

        }


        const index =
            this.history.findIndex(
                item =>
                    item?.id ===
                        event.id
            );


        if(
            index <
                0
        ){

            return false;

        }


        const [
            removedEvent
        ] =
            this.history.splice(
                index,
                1
            );


        this.save();


        this.emitLifeEvent(
            "life-event:removed",
            removedEvent
        );


        this.emit(
            "evolution:removed",
            {
                event:
                    removedEvent,

                eventId:
                    removedEvent.id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       ENTITY QUERY
    ===================================================== */

    forEntity(
        entityId,
        options = {}
    ){

        const id =
            this.normalizeId(
                entityId
            );


        if(!id){

            return [];

        }


        let events =
            this.history.filter(
                event =>
                    event.relatedEntityId ===
                        id
            );


        if(
            options.includeArchived !==
                true
        ){

            events =
                events.filter(
                    event =>
                        event.archived !==
                            true
                );

        }


        if(options.type){

            const type =
                this.normalizeType(
                    options.type
                );


            events =
                events.filter(
                    event =>
                        event.type ===
                            type
                );

        }


        if(options.status){

            const status =
                this.normalizeStatus(
                    options.status
                );


            events =
                events.filter(
                    event =>
                        event.status ===
                            status
                );

        }


        if(
            options.important ===
                true
        ){

            events =
                events.filter(
                    event =>
                        event.importance ===
                            "high" ||
                        event.importance ===
                            "critical"
                );

        }


        if(options.source){

            const source =
                String(
                    options.source
                ).trim();


            events =
                events.filter(
                    event =>
                        event.source ===
                            source
                );

        }


        return [
            ...events
        ].sort(
            (
                a,
                b
            ) =>
                this.getTimestamp(
                    b
                ) -
                this.getTimestamp(
                    a
                )
        );

    },


    byEntity(entityId){

        return this.forEntity(
            entityId
        );

    },


    /* =====================================================
       WORLD QUERY
    ===================================================== */

    forWorld(
        worldId,
        options = {}
    ){

        const id =
            this.normalizeId(
                worldId
            );


        if(!id){

            return [];

        }


        let events =
            this.history.filter(
                event =>
                    event.relatedWorldId ===
                        id
            );


        if(
            options.includeArchived !==
                true
        ){

            events =
                events.filter(
                    event =>
                        event.archived !==
                            true
                );

        }


        if(options.type){

            const type =
                this.normalizeType(
                    options.type
                );


            events =
                events.filter(
                    event =>
                        event.type ===
                            type
                );

        }


        if(options.status){

            const status =
                this.normalizeStatus(
                    options.status
                );


            events =
                events.filter(
                    event =>
                        event.status ===
                            status
                );

        }


        return [
            ...events
        ].sort(
            (
                a,
                b
            ) =>
                this.getTimestamp(
                    b
                ) -
                this.getTimestamp(
                    a
                )
        );

    },


    /* =====================================================
       GENERIC QUERY
    ===================================================== */

    all(options = {}){

        let events =
            [
                ...this.history
            ];


        if(
            options.includeArchived !==
                true
        ){

            events =
                events.filter(
                    event =>
                        event.archived !==
                            true
                );

        }


        if(options.entityId){

            const entityId =
                this.normalizeId(
                    options.entityId
                );


            events =
                events.filter(
                    event =>
                        event.relatedEntityId ===
                            entityId
                );

        }


        if(options.worldId){

            const worldId =
                this.normalizeId(
                    options.worldId
                );


            events =
                events.filter(
                    event =>
                        event.relatedWorldId ===
                            worldId
                );

        }


        if(options.type){

            const type =
                this.normalizeType(
                    options.type
                );


            events =
                events.filter(
                    event =>
                        event.type ===
                            type
                );

        }


        if(options.status){

            const status =
                this.normalizeStatus(
                    options.status
                );


            events =
                events.filter(
                    event =>
                        event.status ===
                            status
                );

        }


        if(options.importance){

            const importance =
                this.normalizeImportance(
                    options.importance
                );


            events =
                events.filter(
                    event =>
                        event.importance ===
                            importance
                );

        }


        if(options.source){

            const source =
                String(
                    options.source
                ).trim();


            events =
                events.filter(
                    event =>
                        event.source ===
                            source
                );

        }


        if(
            options.important ===
                true
        ){

            events =
                events.filter(
                    event =>
                        event.importance ===
                            "high" ||
                        event.importance ===
                            "critical"
                );

        }


        return events.sort(
            (
                a,
                b
            ) =>
                this.getTimestamp(
                    b
                ) -
                this.getTimestamp(
                    a
                )
        );

    },


    byType(type){

        return this.all({
            type
        });

    },


    byStatus(status){

        return this.all({
            status
        });

    },


    important(options = {}){

        return this.all({
            ...options,

            important:
                true
        });

    },


    goals(options = {}){

        return this.all({
            ...options,

            type:
                "goal"
        });

    },


    activeGoals(options = {}){

        return this
            .goals(
                options
            )
            .filter(
                event =>
                    event.status !==
                        "completed" &&
                    event.status !==
                        "cancelled"
            );

    },


    /* =====================================================
       SEARCH
    ===================================================== */

    search(
        query,
        options = {}
    ){

        const text =
            String(
                query ??
                ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        const events =
            this.all(
                options
            );


        if(!text){

            return events;

        }


        return events.filter(
            event => {

                const haystack = [

                    event.title,

                    event.description,

                    event.type,

                    event.status,

                    event.importance,

                    event.source,

                    ...(event.tags || []),

                    ...(event.organs || []),

                    ...(event.identities || [])

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLocaleLowerCase(
                        "tr-TR"
                    );


                return haystack.includes(
                    text
                );

            }
        );

    },


    /* =====================================================
       TIMESTAMP
    ===================================================== */

    getTimestamp(event){

        return Number(
            event?.occurredAt ||
            event?.updatedAt ||
            event?.createdAt ||
            0
        ) || 0;

    },


    /* =====================================================
       SORT
    ===================================================== */

    sort(){

        this.history.sort(
            (
                a,
                b
            ) =>
                this.getTimestamp(
                    b
                ) -
                this.getTimestamp(
                    a
                )
        );


        return this.history;

    },


    /* =====================================================
       XP / LEVEL
    ===================================================== */

    totalXP(options = {}){

        return this
            .all(
                options
            )
            .reduce(
                (
                    total,
                    event
                ) =>
                    total +
                    Math.max(
                        0,
                        Number(
                            event.xp
                        ) ||
                        0
                    ),
                0
            );

    },


    getProgress(options = {}){

        const xp =
            this.totalXP(
                options
            );


        const level =
            Math.floor(
                xp /
                100
            ) +
            1;


        const currentLevelXP =
            xp %
            100;


        return {

            level,

            totalXP:
                xp,

            currentLevelXP,

            nextLevelXP:
                100,

            progressPercent:
                currentLevelXP

        };

    },


    /* =====================================================
       STATS
    ===================================================== */

    stats(entityId = null){

        const events =
            entityId
                ? this.forEntity(
                    entityId
                )
                : this.all();


        const xp =
            events.reduce(
                (
                    total,
                    event
                ) =>
                    total +
                    Math.max(
                        0,
                        Number(
                            event.xp
                        ) ||
                        0
                    ),
                0
            );


        return {

            total:
                events.length,

            important:
                events.filter(
                    event =>
                        event.importance ===
                            "high" ||
                        event.importance ===
                            "critical"
                ).length,

            critical:
                events.filter(
                    event =>
                        event.importance ===
                            "critical"
                ).length,

            achievements:
                events.filter(
                    event =>
                        event.type ===
                            "achievement"
                ).length,

            decisions:
                events.filter(
                    event =>
                        event.type ===
                            "decision"
                ).length,

            failures:
                events.filter(
                    event =>
                        event.type ===
                            "failure"
                ).length,

            goals:
                events.filter(
                    event =>
                        event.type ===
                            "goal"
                ).length,

            activeGoals:
                events.filter(
                    event =>
                        event.type ===
                            "goal" &&
                        event.status !==
                            "completed" &&
                        event.status !==
                            "cancelled"
                ).length,

            completedGoals:
                events.filter(
                    event =>
                        event.type ===
                            "goal" &&
                        event.status ===
                            "completed"
                ).length,

            milestones:
                events.filter(
                    event =>
                        event.type ===
                            "milestone"
                ).length,

            xp

        };

    },


    /* =====================================================
       SAVE
    ===================================================== */

    save(){

        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){

                return false;

            }


            localStorage.setItem(
                this.storageKey,
                JSON.stringify(
                    this.history
                )
            );


            return true;

        } catch(error){

            console.error(
                "Evolution kaydedilemedi:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       LOAD / MIGRATION
    ===================================================== */

    load(){

        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){

                this.history =
                    [];


                return this.history;

            }


            let saved =
                localStorage.getItem(
                    this.storageKey
                );


            let migratedFromLegacy =
                false;


            if(!saved){

                saved =
                    localStorage.getItem(
                        this.legacyStorageKey
                    );


                migratedFromLegacy =
                    Boolean(
                        saved
                    );

            }


            if(!saved){

                this.history =
                    [];


                return this.history;

            }


            const parsed =
                JSON.parse(
                    saved
                );


            if(
                !Array.isArray(
                    parsed
                )
            ){

                this.history =
                    [];


                this.save();


                return this.history;

            }


            const byId =
                new Map();


            parsed
                .filter(
                    event =>
                        event &&
                        typeof event ===
                            "object" &&
                        !Array.isArray(
                            event
                        )
                )
                .forEach(
                    event => {

                        const normalized =
                            this.normalizeEvent(
                                event
                            );


                        const existing =
                            byId.get(
                                normalized.id
                            );


                        if(
                            !existing ||
                            Number(
                                normalized.updatedAt
                            ) >=
                            Number(
                                existing.updatedAt
                            )
                        ){

                            byId.set(
                                normalized.id,
                                normalized
                            );

                        }

                    }
                );


            this.history =
                [
                    ...byId.values()
                ];


            this.sort();


            /*
             * Always persist the current canonical form.
             */

            this.save();


            if(
                migratedFromLegacy
            ){

                this.emit(
                    "evolution:migrated",
                    {
                        count:
                            this.history.length,

                        from:
                            this.legacyStorageKey,

                        to:
                            this.storageKey,

                        time:
                            Date.now()
                    }
                );

            }


            return this.history;

        } catch(error){

            console.error(
                "Evolution yüklenemedi:",
                error
            );


            this.history =
                [];


            return this.history;

        }

    },


    /* =====================================================
       CLEAR
    ===================================================== */

    clear(options = {}){

        if(options.entityId){

            const entityId =
                this.normalizeId(
                    options.entityId
                );


            if(!entityId){

                return false;

            }


            const affected =
                this.history.filter(
                    event =>
                        event.relatedEntityId ===
                            entityId
                );


            if(
                affected.length ===
                    0
            ){

                return false;

            }


            affected.forEach(
                event => {

                    this.emitLifeEvent(
                        "life-event:removed",
                        event
                    );

                }
            );


            this.history =
                this.history.filter(
                    event =>
                        event.relatedEntityId !==
                            entityId
                );


            this.save();


            this.emit(
                "evolution:cleared",
                {
                    entityId,

                    count:
                        affected.length,

                    time:
                        Date.now()
                }
            );


            return true;

        }


        const previous =
            [
                ...this.history
            ];


        this.history =
            [];


        this.save();


        previous.forEach(
            event => {

                this.emitLifeEvent(
                    "life-event:removed",
                    event
                );

            }
        );


        this.emit(
            "evolution:cleared",
            {
                count:
                    previous.length,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const active =
            this.all();


        const archived =
            this.history.filter(
                event =>
                    event.archived ===
                        true
            );


        const xp =
            this.totalXP();


        return {

            booted:
                this.booted,

            total:
                this.history.length,

            active:
                active.length,

            archived:
                archived.length,

            achievements:
                active.filter(
                    event =>
                        event.type ===
                            "achievement"
                ).length,

            decisions:
                active.filter(
                    event =>
                        event.type ===
                            "decision"
                ).length,

            failures:
                active.filter(
                    event =>
                        event.type ===
                            "failure"
                ).length,

            goals:
                active.filter(
                    event =>
                        event.type ===
                            "goal"
                ).length,

            activeGoals:
                active.filter(
                    event =>
                        event.type ===
                            "goal" &&
                        event.status !==
                            "completed" &&
                        event.status !==
                            "cancelled"
                ).length,

            completedGoals:
                active.filter(
                    event =>
                        event.type ===
                            "goal" &&
                        event.status ===
                            "completed"
                ).length,

            milestones:
                active.filter(
                    event =>
                        event.type ===
                            "milestone"
                ).length,

            important:
                active.filter(
                    event =>
                        event.importance ===
                            "high" ||
                        event.importance ===
                            "critical"
                ).length,

            critical:
                active.filter(
                    event =>
                        event.importance ===
                            "critical"
                ).length,

            totalXP:
                xp,

            level:
                Math.floor(
                    xp /
                    100
                ) +
                1

        };

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
            "evolution",
            Evolution
        );

    }

} catch(error){

    console.error(
        "Evolution register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.Evolution =
        Evolution;

}


/* =========================================================
   INIT
========================================================= */

Evolution.init();
