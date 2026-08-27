/* =========================================================
   VAERO TIMELINE CORE
   Central Chronological Event System
========================================================= */

const Timeline = {

    events:
        [],

    booted:
        false,

    storageKey:
        "vaero:timeline:events:v2",

    legacyStorageKey:
        "vaero:timeline:events",


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
                `Timeline service okunamadı: ${serviceName}`,
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
                `Timeline VAERO event gönderilemedi: ${name}`,
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
                `Timeline event fallback gönderilemedi: ${name}`,
                error
            );

        }


        return false;

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


        return `timeline_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

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


    normalizeTags(value){

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
                item =>
                    String(
                        item ??
                        ""
                    )
                        .trim()
                        .slice(
                            0,
                            80
                        )
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
            )
            .slice(
                0,
                40
            );

    },


    normalizeImportance(value){

        const importance =
            String(
                value ||
                "medium"
            )
                .trim()
                .toLowerCase();


        return [
            "low",
            "medium",
            "high",
            "critical"
        ].includes(
            importance
        )
            ? importance
            : "medium";

    },


    normalizeText(
        value,
        maxLength = 10000
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


    normalizeRecord(
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
            this.normalizeText(
                sourceEvent.type ||
                "event",
                120
            )
                .toLowerCase() ||
            "event";


        const source =
            this.normalizeText(
                sourceEvent.source ||
                payload.source ||
                (
                    type ===
                        "life-event"
                        ? "evolution"
                        : "timeline"
                ),
                120
            )
                .toLowerCase() ||
            "timeline";


        const createdAt =
            this.normalizeTimestamp(
                sourceEvent.createdAt,
                now
            );


        const occurredAt =
            this.normalizeTimestamp(
                sourceEvent.occurredAt ??
                payload.occurredAt,
                createdAt
            );


        const updatedAt =
            this.normalizeTimestamp(
                sourceEvent.updatedAt,
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
                this.normalizeText(
                    sourceEvent.title ||
                    payload.title ||
                    type ||
                    "Timeline Olayı",
                    240
                ) ||
                "Timeline Olayı",

            description:
                this.normalizeText(
                    sourceEvent.description ||
                    payload.description ||
                    payload.content ||
                    "",
                    30000
                ),

            source,

            category:
                this.normalizeText(
                    sourceEvent.category ||
                    payload.category ||
                    type ||
                    "event",
                    120
                )
                    .toLowerCase() ||
                "event",

            importance:
                this.normalizeImportance(
                    sourceEvent.importance ||
                    payload.importance
                ),

            entityId:
                this.normalizeId(
                    sourceEvent.entityId ||
                    sourceEvent.relatedEntityId ||
                    payload.entityId ||
                    payload.relatedEntityId
                ),

            worldId:
                this.normalizeId(
                    sourceEvent.worldId ||
                    sourceEvent.relatedWorldId ||
                    payload.worldId ||
                    payload.relatedWorldId
                ),

            payload,

            tags:
                this.normalizeTags(
                    sourceEvent.tags ||
                    payload.tags
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
                )

        };

    },


    /* =====================================================
       LOOKUP HELPERS
    ===================================================== */

    findIndex(timelineId){

        const id =
            this.normalizeId(
                timelineId
            );


        if(!id){

            return -1;

        }


        return this.events.findIndex(
            event =>
                event?.id ===
                    id
        );

    },


    findBySourceEventId(sourceEventId){

        const id =
            this.normalizeId(
                sourceEventId
            );


        if(!id){

            return null;

        }


        return (
            this.events.find(
                event =>
                    event?.payload
                        ?.sourceEventId ===
                        id
            ) ||
            null
        );

    },


    findBySourceMemoryId(sourceMemoryId){

        const id =
            this.normalizeId(
                sourceMemoryId
            );


        if(!id){

            return null;

        }


        return (
            this.events.find(
                event =>
                    event?.payload
                        ?.sourceMemoryId ===
                        id
            ) ||
            null
        );

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(
            this.booted
        ){

            return true;

        }


        this.load();


        const events =
            this.getService(
                "events"
            );


        if(!events){

            console.warn(
                "Timeline boot: Events servisi bulunamadı."
            );


            this.booted =
                true;


            this.cleanOrphanLifeEvents();


            return true;

        }


        if(
            typeof events.on ===
                "function"
        ){

            /* =========================
               ENTITY
            ========================= */

            events.on(
                "entity.mounted",
                data => {

                    this.addSystemEvent(
                        "entity",
                        "Entity Mounted",
                        data
                    );

                }
            );


            events.on(
                "entity:mounted",
                data => {

                    this.addSystemEvent(
                        "entity",
                        "Entity Mounted",
                        data
                    );

                }
            );


            /* =========================
               ENGINE
            ========================= */

            events.on(
                "engine.started",
                data => {

                    this.addSystemEvent(
                        "engine",
                        "Engine Started",
                        data
                    );

                }
            );


            events.on(
                "engine:started",
                data => {

                    this.addSystemEvent(
                        "engine",
                        "Engine Started",
                        data
                    );

                }
            );


            /* =========================
               RUNTIME
            ========================= */

            events.on(
                "runtime.started",
                data => {

                    this.addSystemEvent(
                        "runtime",
                        "Runtime Started",
                        data
                    );

                }
            );


            events.on(
                "runtime:started",
                data => {

                    this.addSystemEvent(
                        "runtime",
                        "Runtime Started",
                        data
                    );

                }
            );


            /*
             * Runtime ticks are intentionally excluded.
             * Timeline should remain meaningful instead
             * of becoming a raw runtime log.
             */


            /* =========================
               EVOLUTION
            ========================= */

            events.on(
                "life-event:created",
                lifeEvent => {

                    this.addLifeEventReference(
                        lifeEvent
                    );

                }
            );


            events.on(
                "life-event:updated",
                lifeEvent => {

                    this.updateLifeEventReference(
                        lifeEvent
                    );

                }
            );


            events.on(
                "life-event:removed",
                lifeEvent => {

                    this.removeLifeEventReference(
                        lifeEvent
                    );

                }
            );


            /* =========================
               MEMORY
            ========================= */

            events.on(
                "memory:created",
                data => {

                    const record =
                        data?.record ||
                        data;


                    if(
                        !record ||
                        !record.id
                    ){

                        return;

                    }


                    /*
                     * Evolution memories already have their
                     * own canonical Timeline life-event.
                     */

                    if(
                        record.source ===
                            "evolution" ||
                        record.type ===
                            "life-event" ||
                        record.category ===
                            "life-event"
                    ){

                        return;

                    }


                    this.add(
                        "memory",
                        record.title ||
                        "Memory",
                        {
                            sourceMemoryId:
                                record.id,

                            entityId:
                                record.entityId ||
                                null,

                            worldId:
                                record.worldId ||
                                null,

                            description:
                                record.content ||
                                "",

                            category:
                                record.category ||
                                "memory",

                            importance:
                                record.important ===
                                    true
                                    ? "high"
                                    : "low",

                            tags:
                                record.tags ||
                                [],

                            source:
                                record.source ===
                                    "system"
                                    ? "system"
                                    : "memory",

                            occurredAt:
                                record.updatedAt ||
                                record.createdAt ||
                                Date.now()
                        }
                    );

                }
            );


            events.on(
                "memory:updated",
                data => {

                    const record =
                        data?.record ||
                        data;


                    if(
                        !record ||
                        !record.id
                    ){

                        return;

                    }


                    const linked =
                        this.findBySourceMemoryId(
                            record.id
                        );


                    if(!linked){

                        return;

                    }


                    linked.title =
                        this.normalizeText(
                            record.title ||
                            linked.title,
                            240
                        ) ||
                        linked.title;


                    linked.description =
                        this.normalizeText(
                            record.content ??
                            linked.description,
                            30000
                        );


                    linked.category =
                        this.normalizeText(
                            record.category ||
                            linked.category,
                            120
                        )
                            .toLowerCase() ||
                        linked.category;


                    linked.importance =
                        record.important ===
                            true
                            ? "high"
                            : "low";


                    linked.entityId =
                        this.normalizeId(
                            record.entityId
                        );


                    linked.worldId =
                        this.normalizeId(
                            record.worldId
                        );


                    linked.tags =
                        this.normalizeTags(
                            record.tags ||
                            linked.tags
                        );


                    linked.payload = {

                        ...linked.payload,

                        sourceMemoryId:
                            record.id,

                        entityId:
                            linked.entityId,

                        worldId:
                            linked.worldId

                    };


                    linked.updatedAt =
                        Date.now();


                    linked.occurredAt =
                        this.normalizeTimestamp(
                            record.updatedAt,
                            linked.occurredAt
                        );


                    this.save();


                    this.emit(
                        "timeline:updated",
                        {
                            event:
                                linked,

                            timelineId:
                                linked.id,

                            source:
                                "memory",

                            time:
                                Date.now()
                        }
                    );

                }
            );


            events.on(
                "memory:archived",
                data => {

                    const record =
                        data?.record ||
                        data;


                    if(
                        !record ||
                        !record.id
                    ){

                        return;

                    }


                    const linked =
                        this.findBySourceMemoryId(
                            record.id
                        );


                    if(!linked){

                        return;

                    }


                    linked.archived =
                        true;


                    linked.archivedAt =
                        Date.now();


                    linked.updatedAt =
                        Date.now();


                    this.save();

                }
            );


            events.on(
                "memory:restored",
                data => {

                    const record =
                        data?.record ||
                        data;


                    if(
                        !record ||
                        !record.id
                    ){

                        return;

                    }


                    const linked =
                        this.findBySourceMemoryId(
                            record.id
                        );


                    if(!linked){

                        return;

                    }


                    linked.archived =
                        false;


                    linked.archivedAt =
                        null;


                    linked.updatedAt =
                        Date.now();


                    this.save();

                }
            );


            events.on(
                "memory:removed",
                data => {

                    const record =
                        data?.record ||
                        data;


                    if(
                        !record ||
                        !record.id
                    ){

                        return;

                    }


                    const linked =
                        this.findBySourceMemoryId(
                            record.id
                        );


                    if(!linked){

                        return;

                    }


                    this.remove(
                        linked.id
                    );

                }
            );

        }


        this.cleanOrphanLifeEvents();


        this.booted =
            true;


        this.emit(
            "timeline:ready",
            {
                count:
                    this.events.length,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       ADD
       Backward-compatible API
    ===================================================== */

    add(
        type,
        title,
        payload = {}
    ){

        const data =
            this.normalizePayload(
                payload
            );


        const sourceEventId =
            this.normalizeId(
                data.sourceEventId
            );


        if(sourceEventId){

            const existing =
                this.findBySourceEventId(
                    sourceEventId
                );


            if(existing){

                return existing;

            }

        }


        const sourceMemoryId =
            this.normalizeId(
                data.sourceMemoryId
            );


        if(sourceMemoryId){

            const existing =
                this.findBySourceMemoryId(
                    sourceMemoryId
                );


            if(existing){

                return existing;

            }

        }


        const normalizedType =
            this.normalizeText(
                type ||
                "event",
                120
            )
                .toLowerCase() ||
            "event";


        const event =
            this.normalizeRecord({

                id:
                    this.createId(),

                type:
                    normalizedType,

                title:
                    title ||
                    normalizedType,

                description:
                    data.description ||
                    data.content ||
                    "",

                source:
                    data.source ||
                    (
                        normalizedType ===
                            "life-event"
                            ? "evolution"
                            : "timeline"
                    ),

                category:
                    data.category ||
                    normalizedType,

                importance:
                    data.importance ||
                    "medium",

                entityId:
                    data.entityId ||
                    data.relatedEntityId ||
                    null,

                worldId:
                    data.worldId ||
                    data.relatedWorldId ||
                    null,

                tags:
                    data.tags ||
                    [],

                payload:{
                    ...data,

                    sourceEventId:
                        sourceEventId ||
                        data.sourceEventId ||
                        undefined,

                    sourceMemoryId:
                        sourceMemoryId ||
                        data.sourceMemoryId ||
                        undefined
                },

                occurredAt:
                    data.occurredAt ||
                    Date.now(),

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now()

            });


        this.events.push(
            event
        );


        this.save();


        this.emit(
            "timeline:created",
            {
                event,

                timelineId:
                    event.id,

                time:
                    Date.now()
            }
        );


        return event;

    },


    /* =====================================================
       CREATE STRUCTURED EVENT
    ===================================================== */

    create(data = {}){

        if(
            !data ||
            typeof data !==
                "object" ||
            Array.isArray(
                data
            )
        ){

            return null;

        }


        const requestedId =
            this.normalizeId(
                data.id
            );


        if(requestedId){

            const existing =
                this.find(
                    requestedId,
                    {
                        includeArchived:
                            true
                    }
                );


            if(existing){

                return existing;

            }

        }


        const payload =
            this.normalizePayload(
                data.payload
            );


        const sourceEventId =
            this.normalizeId(
                data.sourceEventId ||
                payload.sourceEventId
            );


        if(sourceEventId){

            const existing =
                this.findBySourceEventId(
                    sourceEventId
                );


            if(existing){

                return existing;

            }

        }


        const sourceMemoryId =
            this.normalizeId(
                data.sourceMemoryId ||
                payload.sourceMemoryId
            );


        if(sourceMemoryId){

            const existing =
                this.findBySourceMemoryId(
                    sourceMemoryId
                );


            if(existing){

                return existing;

            }

        }


        const now =
            Date.now();


        const event =
            this.normalizeRecord({

                ...data,

                payload:{
                    ...payload,

                    sourceEventId:
                        sourceEventId ||
                        payload.sourceEventId,

                    sourceMemoryId:
                        sourceMemoryId ||
                        payload.sourceMemoryId
                },

                id:
                    requestedId ||
                    this.createId(),

                createdAt:
                    this.normalizeTimestamp(
                        data.createdAt,
                        now
                    ),

                updatedAt:
                    this.normalizeTimestamp(
                        data.updatedAt,
                        now
                    )

            });


        this.events.push(
            event
        );


        this.save();


        this.emit(
            "timeline:created",
            {
                event,

                timelineId:
                    event.id,

                time:
                    Date.now()
            }
        );


        return event;

    },


    /* =====================================================
       SYSTEM EVENT
    ===================================================== */

    addSystemEvent(
        type,
        title,
        payload = {}
    ){

        const data =
            this.normalizePayload(
                payload
            );


        const normalizedType =
            this.normalizeText(
                type ||
                "system",
                120
            )
                .toLowerCase() ||
            "system";


        const entityId =
            this.normalizeId(
                data.entityId ||
                data.id
            );


        const worldId =
            this.normalizeId(
                data.worldId ||
                data.relatedWorldId
            );


        const now =
            Date.now();


        /*
         * The Engine currently emits some lifecycle events
         * in both legacy and canonical naming formats.
         */

        const recentDuplicate =
            this.events.find(
                event => {

                    if(
                        event.source !==
                            "system"
                    ){

                        return false;

                    }


                    if(
                        event.type !==
                            normalizedType
                    ){

                        return false;

                    }


                    if(
                        event.entityId !==
                            entityId
                    ){

                        return false;

                    }


                    if(
                        event.worldId !==
                            worldId
                    ){

                        return false;

                    }


                    return (
                        now -
                        Number(
                            event.createdAt
                        )
                    ) <
                        1500;

                }
            );


        if(recentDuplicate){

            return recentDuplicate;

        }


        return this.add(
            normalizedType,
            title,
            {
                ...data,

                entityId,

                worldId,

                source:
                    "system",

                category:
                    "system",

                importance:
                    "low"
            }
        );

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    update(
        timelineId,
        changes = {}
    ){

        const event =
            this.find(
                timelineId,
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

            payload:{
                ...event.payload
            },

            tags:[
                ...event.tags
            ]

        };


        if(
            changes.title !==
                undefined
        ){

            const title =
                this.normalizeText(
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
                this.normalizeText(
                    changes.description,
                    30000
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
            changes.category !==
                undefined
        ){

            const category =
                this.normalizeText(
                    changes.category,
                    120
                )
                    .toLowerCase();


            if(category){

                event.category =
                    category;

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
            changes.entityId !==
                undefined
        ){

            event.entityId =
                this.normalizeId(
                    changes.entityId
                );

        }


        if(
            changes.worldId !==
                undefined
        ){

            event.worldId =
                this.normalizeId(
                    changes.worldId
                );

        }


        if(
            changes.source !==
                undefined
        ){

            const source =
                this.normalizeText(
                    changes.source,
                    120
                )
                    .toLowerCase();


            if(source){

                event.source =
                    source;

            }

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


        event.updatedAt =
            Date.now();


        this.save();


        this.emit(
            "timeline:updated",
            {
                event,

                before,

                timelineId:
                    event.id,

                time:
                    Date.now()
            }
        );


        return event;

    },


    /* =====================================================
       FIND
    ===================================================== */

    find(
        timelineId,
        options = {}
    ){

        const id =
            this.normalizeId(
                timelineId
            );


        if(!id){

            return null;

        }


        const event =
            this.events.find(
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
       LIFE EVENT REFERENCE
    ===================================================== */

    addLifeEventReference(
        lifeEvent
    ){

        if(
            !lifeEvent ||
            !lifeEvent.id
        ){

            return null;

        }


        const sourceEventId =
            this.normalizeId(
                lifeEvent.id
            );


        if(!sourceEventId){

            return null;

        }


        const existing =
            this.findBySourceEventId(
                sourceEventId
            );


        if(existing){

            return existing;

        }


        return this.add(
            "life-event",
            lifeEvent.title ||
            "Yaşam Olayı",
            {
                sourceEventId,

                entityId:
                    lifeEvent.relatedEntityId ||
                    lifeEvent.entityId ||
                    null,

                worldId:
                    lifeEvent.relatedWorldId ||
                    lifeEvent.worldId ||
                    null,

                description:
                    lifeEvent.description ||
                    "",

                importance:
                    lifeEvent.importance ||
                    "medium",

                tags:
                    lifeEvent.tags ||
                    [],

                occurredAt:
                    lifeEvent.occurredAt ||
                    lifeEvent.createdAt ||
                    Date.now(),

                source:
                    "evolution",

                category:
                    "evolution"
            }
        );

    },


    updateLifeEventReference(
        lifeEvent
    ){

        if(
            !lifeEvent ||
            !lifeEvent.id
        ){

            return false;

        }


        const sourceEventId =
            this.normalizeId(
                lifeEvent.id
            );


        if(!sourceEventId){

            return false;

        }


        const linkedEvent =
            this.findBySourceEventId(
                sourceEventId
            );


        if(!linkedEvent){

            return false;

        }


        linkedEvent.title =
            this.normalizeText(
                lifeEvent.title ||
                linkedEvent.title,
                240
            ) ||
            linkedEvent.title;


        linkedEvent.description =
            this.normalizeText(
                lifeEvent.description ??
                linkedEvent.description,
                30000
            );


        linkedEvent.importance =
            this.normalizeImportance(
                lifeEvent.importance ||
                linkedEvent.importance
            );


        linkedEvent.entityId =
            this.normalizeId(
                lifeEvent.relatedEntityId ||
                lifeEvent.entityId ||
                linkedEvent.entityId
            );


        linkedEvent.worldId =
            this.normalizeId(
                lifeEvent.relatedWorldId ||
                lifeEvent.worldId ||
                linkedEvent.worldId
            );


        linkedEvent.tags =
            this.normalizeTags(
                lifeEvent.tags ||
                linkedEvent.tags
            );


        linkedEvent.occurredAt =
            this.normalizeTimestamp(
                lifeEvent.occurredAt ||
                lifeEvent.createdAt,
                linkedEvent.occurredAt
            );


        linkedEvent.payload = {

            ...linkedEvent.payload,

            sourceEventId,

            entityId:
                linkedEvent.entityId,

            worldId:
                linkedEvent.worldId

        };


        linkedEvent.updatedAt =
            Date.now();


        this.save();


        this.emit(
            "timeline:updated",
            {
                event:
                    linkedEvent,

                timelineId:
                    linkedEvent.id,

                source:
                    "evolution",

                time:
                    Date.now()
            }
        );


        return true;

    },

   removeLifeEventReference(
        lifeEvent
    ){

        if(
            !lifeEvent ||
            !lifeEvent.id
        ){

            return this.cleanOrphanLifeEvents();

        }


        const sourceEventId =
            this.normalizeId(
                lifeEvent.id
            );


        if(!sourceEventId){

            return 0;

        }


        const before =
            this.events.length;


        const removedEvents =
            this.events.filter(
                event =>
                    event?.payload
                        ?.sourceEventId ===
                        sourceEventId
            );


        this.events =
            this.events.filter(
                event =>
                    event?.payload
                        ?.sourceEventId !==
                        sourceEventId
            );


        const removed =
            before -
            this.events.length;


        if(
            removed >
                0
        ){

            this.save();


            this.emit(
                "timeline:life-event:removed",
                {
                    sourceEventId,

                    removed,

                    events:
                        removedEvents,

                    time:
                        Date.now()
                }
            );

        }


        return removed;

    },


    resolveLifeEvent(
        timelineEvent
    ){

        if(
            !timelineEvent ||
            timelineEvent.type !==
                "life-event" ||
            !timelineEvent.payload
                ?.sourceEventId
        ){

            return null;

        }


        const evolution =
            this.getService(
                "evolution"
            );


        if(!evolution){

            return null;

        }


        const sourceEventId =
            timelineEvent.payload
                .sourceEventId;


        try{

            if(
                typeof evolution.find ===
                    "function"
            ){

                return (
                    evolution.find(
                        sourceEventId
                    ) ||
                    null
                );

            }


            if(
                typeof evolution.get ===
                    "function"
            ){

                return (
                    evolution.get(
                        sourceEventId
                    ) ||
                    null
                );

            }

        } catch(error){

            return null;

        }


        return null;

    },


    cleanOrphanLifeEvents(){

        const evolution =
            this.getService(
                "evolution"
            );


        if(!evolution){

            return 0;

        }


        const resolver =
            typeof evolution.find ===
                "function"
                ? id =>
                    evolution.find(
                        id
                    )
                : (
                    typeof evolution.get ===
                        "function"
                        ? id =>
                            evolution.get(
                                id
                            )
                        : null
                );


        if(!resolver){

            return 0;

        }


        const removedEvents =
            [];


        this.events =
            this.events.filter(
                event => {

                    if(
                        event.type !==
                            "life-event" ||
                        !event.payload
                            ?.sourceEventId
                    ){

                        return true;

                    }


                    try{

                        const exists =
                            Boolean(
                                resolver(
                                    event.payload
                                        .sourceEventId
                                )
                            );


                        if(!exists){

                            removedEvents.push(
                                event
                            );

                        }


                        return exists;

                    } catch(error){

                        /*
                         * Temporary Evolution lookup errors must
                         * never destroy Timeline history.
                         */

                        return true;

                    }

                }
            );


        const removed =
            removedEvents.length;


        if(
            removed >
                0
        ){

            this.save();


            this.emit(
                "timeline:orphans:cleaned",
                {
                    removed,

                    time:
                        Date.now()
                }
            );

        }


        return removed;

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


        const safeOptions =
            options &&
            typeof options ===
                "object" &&
            !Array.isArray(
                options
            )
                ? options
                : {};


        let events =
            this.events.filter(
                event =>
                    event.entityId ===
                        id
            );


        if(
            safeOptions.includeArchived !==
                true
        ){

            events =
                events.filter(
                    event =>
                        event.archived !==
                            true
                );

        }


        if(
            safeOptions.source
        ){

            const source =
                this.normalizeText(
                    safeOptions.source,
                    120
                )
                    .toLowerCase();


            events =
                events.filter(
                    event =>
                        event.source ===
                            source
                );

        }


        if(
            safeOptions.type
        ){

            const type =
                this.normalizeText(
                    safeOptions.type,
                    120
                )
                    .toLowerCase();


            events =
                events.filter(
                    event =>
                        event.type ===
                            type
                );

        }


        if(
            safeOptions.importance
        ){

            const importance =
                this.normalizeImportance(
                    safeOptions.importance
                );


            events =
                events.filter(
                    event =>
                        event.importance ===
                            importance
                );

        }


        return [
            ...events
        ]
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        b.occurredAt
                    ) -
                    Number(
                        a.occurredAt
                    )
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


        const safeOptions =
            options &&
            typeof options ===
                "object" &&
            !Array.isArray(
                options
            )
                ? options
                : {};


        let events =
            this.events.filter(
                event =>
                    event.worldId ===
                        id
            );


        if(
            safeOptions.includeArchived !==
                true
        ){

            events =
                events.filter(
                    event =>
                        event.archived !==
                            true
                );

        }


        if(
            safeOptions.source
        ){

            const source =
                this.normalizeText(
                    safeOptions.source,
                    120
                )
                    .toLowerCase();


            events =
                events.filter(
                    event =>
                        event.source ===
                            source
                );

        }


        if(
            safeOptions.type
        ){

            const type =
                this.normalizeText(
                    safeOptions.type,
                    120
                )
                    .toLowerCase();


            events =
                events.filter(
                    event =>
                        event.type ===
                            type
                );

        }


        return [
            ...events
        ]
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        b.occurredAt
                    ) -
                    Number(
                        a.occurredAt
                    )
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
            this.normalizeText(
                query,
                500
            )
                .toLocaleLowerCase(
                    "tr-TR"
                );


        let events =
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

                    event.category,

                    event.source,

                    ...(event.tags || [])

                ]
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
       ARCHIVE / RESTORE
    ===================================================== */

    archive(timelineId){

        const event =
            this.find(
                timelineId,
                {
                    includeArchived:
                        true
                }
            );


        if(!event){

            return false;

        }


        if(
            event.archived ===
                true
        ){

            return true;

        }


        event.archived =
            true;


        event.archivedAt =
            Date.now();


        event.updatedAt =
            Date.now();


        this.save();


        this.emit(
            "timeline:archived",
            {
                event,

                timelineId:
                    event.id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    restore(timelineId){

        const event =
            this.find(
                timelineId,
                {
                    includeArchived:
                        true
                }
            );


        if(!event){

            return false;

        }


        if(
            event.archived !==
                true
        ){

            return true;

        }


        event.archived =
            false;


        event.archivedAt =
            null;


        event.updatedAt =
            Date.now();


        this.save();


        this.emit(
            "timeline:restored",
            {
                event,

                timelineId:
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

    remove(timelineId){

        const event =
            this.find(
                timelineId,
                {
                    includeArchived:
                        true
                }
            );


        if(!event){

            return false;

        }


        const before =
            this.events.length;


        this.events =
            this.events.filter(
                item =>
                    item.id !==
                        event.id
            );


        if(
            before ===
                this.events.length
        ){

            return false;

        }


        this.save();


        this.emit(
            "timeline:removed",
            {
                event,

                timelineId:
                    event.id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       ALL
    ===================================================== */

    all(options = {}){

        const safeOptions =
            options &&
            typeof options ===
                "object" &&
            !Array.isArray(
                options
            )
                ? options
                : {};


        let events =
            [
                ...this.events
            ];


        if(
            safeOptions.includeArchived !==
                true
        ){

            events =
                events.filter(
                    event =>
                        event.archived !==
                            true
                );

        }


        if(
            safeOptions.entityId
        ){

            const entityId =
                this.normalizeId(
                    safeOptions.entityId
                );


            events =
                events.filter(
                    event =>
                        event.entityId ===
                            entityId
                );

        }


        if(
            safeOptions.worldId
        ){

            const worldId =
                this.normalizeId(
                    safeOptions.worldId
                );


            events =
                events.filter(
                    event =>
                        event.worldId ===
                            worldId
                );

        }


        if(
            safeOptions.source
        ){

            const source =
                this.normalizeText(
                    safeOptions.source,
                    120
                )
                    .toLowerCase();


            events =
                events.filter(
                    event =>
                        event.source ===
                            source
                );

        }


        if(
            safeOptions.type
        ){

            const type =
                this.normalizeText(
                    safeOptions.type,
                    120
                )
                    .toLowerCase();


            events =
                events.filter(
                    event =>
                        event.type ===
                            type
                );

        }


        if(
            safeOptions.category
        ){

            const category =
                this.normalizeText(
                    safeOptions.category,
                    120
                )
                    .toLowerCase();


            events =
                events.filter(
                    event =>
                        event.category ===
                            category
                );

        }


        if(
            safeOptions.importance
        ){

            const importance =
                this.normalizeImportance(
                    safeOptions.importance
                );


            events =
                events.filter(
                    event =>
                        event.importance ===
                            importance
                );

        }


        return events.sort(
            (
                a,
                b
            ) =>
                Number(
                    b.occurredAt
                ) -
                Number(
                    a.occurredAt
                )
        );

    },


    /* =====================================================
       STATS
    ===================================================== */

    stats(
        entityId = null
    ){

        const events =
            entityId
                ? this.forEntity(
                    entityId
                )
                : this.all();


        return {

            total:
                events.length,

            evolution:
                events.filter(
                    event =>
                        event.source ===
                            "evolution"
                ).length,

            memory:
                events.filter(
                    event =>
                        event.source ===
                            "memory"
                ).length,

            system:
                events.filter(
                    event =>
                        event.source ===
                            "system"
                ).length,

            highImportance:
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

            lifeEvents:
                events.filter(
                    event =>
                        event.type ===
                            "life-event"
                ).length

        };

    },


    /* =====================================================
       PERSISTENCE
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
                    this.events
                )
            );


            return true;

        } catch(error){

            console.error(
                "Timeline kaydedilemedi:",
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

                this.events =
                    [];


                return this.events;

            }


            let saved =
                localStorage.getItem(
                    this.storageKey
                );


            let migrated =
                false;


            /*
             * Legacy Timeline storage → v2.
             */

            if(!saved){

                saved =
                    localStorage.getItem(
                        this.legacyStorageKey
                    );


                migrated =
                    Boolean(
                        saved
                    );

            }


            if(!saved){

                this.events =
                    [];


                return this.events;

            }


            const parsed =
                JSON.parse(
                    saved
                );


            const sourceEvents =
                Array.isArray(
                    parsed
                )
                    ? parsed
                    : [];


            const normalized =
                sourceEvents
                    .filter(
                        event =>
                            event &&
                            typeof event ===
                                "object" &&
                            !Array.isArray(
                                event
                            )
                    )
                    .map(
                        event =>
                            this.normalizeRecord(
                                event
                            )
                    );


            /*
             * Timeline IDs are unique registry keys.
             * During migration the newest version wins.
             */

            const byId =
                new Map();


            normalized.forEach(
                event => {

                    const existing =
                        byId.get(
                            event.id
                        );


                    if(
                        !existing ||
                        Number(
                            event.updatedAt
                        ) >
                        Number(
                            existing.updatedAt
                        )
                    ){

                        byId.set(
                            event.id,
                            event
                        );

                    }

                }
            );


            /*
             * Also prevent duplicate canonical references.
             */

            const finalEvents =
                [];


            const sourceEventIds =
                new Set();


            const sourceMemoryIds =
                new Set();


            [
                ...byId.values()
            ]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        Number(
                            b.updatedAt
                        ) -
                        Number(
                            a.updatedAt
                        )
                )
                .forEach(
                    event => {

                        const sourceEventId =
                            this.normalizeId(
                                event.payload
                                    ?.sourceEventId
                            );


                        if(sourceEventId){

                            if(
                                sourceEventIds.has(
                                    sourceEventId
                                )
                            ){

                                return;

                            }


                            sourceEventIds.add(
                                sourceEventId
                            );

                        }


                        const sourceMemoryId =
                            this.normalizeId(
                                event.payload
                                    ?.sourceMemoryId
                            );


                        if(sourceMemoryId){

                            if(
                                sourceMemoryIds.has(
                                    sourceMemoryId
                                )
                            ){

                                return;

                            }


                            sourceMemoryIds.add(
                                sourceMemoryId
                            );

                        }


                        finalEvents.push(
                            event
                        );

                    }
                );


            this.events =
                finalEvents;


            this.save();


            if(migrated){

                this.emit(
                    "timeline:migrated",
                    {
                        from:
                            this.legacyStorageKey,

                        to:
                            this.storageKey,

                        count:
                            this.events.length,

                        time:
                            Date.now()
                    }
                );

            }


            return this.events;

        } catch(error){

            console.error(
                "Timeline yüklenemedi:",
                error
            );


            this.events =
                [];


            return this.events;

        }

    },


    /* =====================================================
       CLEAR
    ===================================================== */

    clear(options = {}){

        const safeOptions =
            options &&
            typeof options ===
                "object" &&
            !Array.isArray(
                options
            )
                ? options
                : {};


        if(
            safeOptions.entityId
        ){

            const entityId =
                this.normalizeId(
                    safeOptions.entityId
                );


            if(!entityId){

                return false;

            }


            const removed =
                this.events.filter(
                    event =>
                        event.entityId ===
                            entityId
                );


            if(
                removed.length ===
                    0
            ){

                return false;

            }


            this.events =
                this.events.filter(
                    event =>
                        event.entityId !==
                            entityId
                );


            this.save();


            this.emit(
                "timeline:cleared",
                {
                    entityId,

                    removed:
                        removed.length,

                    time:
                        Date.now()
                }
            );


            return true;

        }


        const removed =
            this.events.length;


        this.events =
            [];


        this.save();


        this.emit(
            "timeline:cleared",
            {
                entityId:
                    null,

                removed,

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
            this.events.filter(
                event =>
                    event.archived !==
                        true
            );


        const archived =
            this.events.filter(
                event =>
                    event.archived ===
                        true
            );


        const entityIds =
            new Set(
                this.events
                    .map(
                        event =>
                            event.entityId
                    )
                    .filter(Boolean)
            );


        const worldIds =
            new Set(
                this.events
                    .map(
                        event =>
                            event.worldId
                    )
                    .filter(Boolean)
            );


        return {

            booted:
                this.booted,

            total:
                this.events.length,

            active:
                active.length,

            archived:
                archived.length,

            entities:
                entityIds.size,

            worlds:
                worldIds.size,

            evolution:
                this.events.filter(
                    event =>
                        event.source ===
                            "evolution"
                ).length,

            memory:
                this.events.filter(
                    event =>
                        event.source ===
                            "memory"
                ).length,

            system:
                this.events.filter(
                    event =>
                        event.source ===
                            "system"
                ).length,

            lifeEvents:
                this.events.filter(
                    event =>
                        event.type ===
                            "life-event"
                ).length,

            critical:
                this.events.filter(
                    event =>
                        event.importance ===
                            "critical"
                ).length,

            storageKey:
                this.storageKey

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
            "timeline",
            Timeline
        );

    }

} catch(error){

    console.warn(
        "Timeline VAERO register başarısız:",
        error
    );

}


/* =========================================================
   GLOBAL
========================================================= */

window.Timeline =
    Timeline;
