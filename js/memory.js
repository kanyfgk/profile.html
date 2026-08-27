/* =========================================================
   VAERO MEMORY SYSTEM
   Central Living Memory Core
========================================================= */

const MemorySystem = {

    records:
        [],

    booted:
        false,

    storageKey:
        "vaero:memory:records:v3",

    legacyStorageKey:
        "vaero:memory:records",

    entityStoragePrefix:
        "vaero:memory:entity:v2:",


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
                `Memory service lookup failed: ${serviceName}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       EVENT
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
                `Memory VAERO event failed: ${name}`,
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
                `Memory event fallback failed: ${name}`,
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


        return `memory_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeCategory(value){

        const category =
            String(
                value ||
                "note"
            )
                .trim()
                .toLowerCase();


        const allowed = [
            "note",
            "decision",
            "idea",
            "event",
            "knowledge",
            "system",
            "life-event"
        ];


        return allowed.includes(
            category
        )
            ? category
            : "note";

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
        record = {}
    ){

        const sourceRecord =
            record &&
            typeof record ===
                "object" &&
            !Array.isArray(
                record
            )
                ? record
                : {};


        const now =
            Date.now();


        const payload =
            this.normalizePayload(
                sourceRecord.payload
            );


        const entityId =
            this.normalizeId(
                sourceRecord.entityId ||
                payload.entityId ||
                payload.relatedEntityId
            );


        const worldId =
            this.normalizeId(
                sourceRecord.worldId ||
                payload.worldId ||
                payload.relatedWorldId
            );


        const type =
            this.normalizeText(
                sourceRecord.type ||
                "memory",
                120
            )
                .toLowerCase() ||
            "memory";


        let category =
            sourceRecord.category;


        if(!category){

            if(
                type ===
                    "life-event"
            ){

                category =
                    "life-event";

            }

            else if(
                type ===
                    "entity:mounted" ||
                type ===
                    "entity.mounted"
            ){

                category =
                    "system";

            }

            else {

                category =
                    "note";

            }

        }


        const title =
            this.normalizeText(
                sourceRecord.title ||
                payload.title ||
                sourceRecord.description ||
                "İsimsiz Hafıza",
                240
            ) ||
            "İsimsiz Hafıza";


        const content =
            this.normalizeText(
                sourceRecord.content ||
                payload.content ||
                payload.description ||
                "",
                30000
            );


        const archived =
            sourceRecord.archived ===
                true;


        const createdAt =
            this.normalizeTimestamp(
                sourceRecord.createdAt,
                now
            );


        const updatedAt =
            this.normalizeTimestamp(
                sourceRecord.updatedAt,
                createdAt
            );


        const importance =
            String(
                payload.importance ||
                ""
            )
                .trim()
                .toLowerCase();


        return {

            id:
                this.normalizeId(
                    sourceRecord.id
                ) ||
                this.createId(),

            type,

            entityId,

            worldId,

            title,

            content,

            category:
                this.normalizeCategory(
                    category
                ),

            payload,

            tags:
                this.normalizeTags(
                    sourceRecord.tags ||
                    payload.tags
                ),

            source:
                this.normalizeText(
                    sourceRecord.source ||
                    payload.source ||
                    "system",
                    120
                ) ||
                "system",

            important:
                sourceRecord.important ===
                    true ||
                importance ===
                    "high" ||
                importance ===
                    "critical",

            pinned:
                sourceRecord.pinned ===
                    true,

            archived,

            archivedAt:
                archived
                    ? this.normalizeTimestamp(
                        sourceRecord.archivedAt,
                        updatedAt
                    )
                    : null,

            createdAt,

            updatedAt:
                Math.max(
                    createdAt,
                    updatedAt
                )

        };

    },


    /* =====================================================
       DUPLICATE / LOOKUP HELPERS
    ===================================================== */

    hasId(memoryId){

        const id =
            this.normalizeId(
                memoryId
            );


        if(!id){

            return false;

        }


        return this.records.some(
            record =>
                record?.id ===
                    id
        );

    },


    findIndex(memoryId){

        const id =
            this.normalizeId(
                memoryId
            );


        if(!id){

            return -1;

        }


        return this.records.findIndex(
            record =>
                record?.id ===
                    id
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
                "Memory boot: Events service bulunamadı."
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

            /*
             * Legacy + canonical event names are both
             * supported. rememberSystemEvent fingerprint
             * prevents duplicate memory creation.
             */

            events.on(
                "entity.mounted",
                data => {

                    this.rememberSystemEvent(
                        "entity:mounted",
                        data
                    );

                }
            );


            events.on(
                "entity:mounted",
                data => {

                    this.rememberSystemEvent(
                        "entity:mounted",
                        data
                    );

                }
            );


            events.on(
                "life-event:created",
                lifeEvent => {

                    this.rememberLifeEvent(
                        lifeEvent
                    );

                }
            );


            events.on(
                "life-event:updated",
                lifeEvent => {

                    this.updateLifeEventMemory(
                        lifeEvent
                    );

                }
            );


            events.on(
                "life-event:removed",
                lifeEvent => {

                    this.removeLifeEventMemory(
                        lifeEvent
                    );

                }
            );

        }


        this.booted =
            true;


        this.cleanOrphanLifeEvents();


        this.emit(
            "memory:ready",
            {
                count:
                    this.records.length,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       GENERIC REMEMBER
       Backward-compatible API
    ===================================================== */

    remember(
        type,
        payload = {}
    ){

        const data =
            this.normalizePayload(
                payload
            );


        const normalizedType =
            this.normalizeText(
                type ||
                "memory",
                120
            )
                .toLowerCase() ||
            "memory";


        const record =
            this.normalizeRecord({

                id:
                    this.createId(),

                type:
                    normalizedType,

                entityId:
                    data.entityId ||
                    data.relatedEntityId ||
                    null,

                worldId:
                    data.worldId ||
                    data.relatedWorldId ||
                    null,

                title:
                    data.title ||
                    normalizedType ||
                    "Hafıza",

                content:
                    data.content ||
                    data.description ||
                    "",

                category:
                    normalizedType ===
                        "life-event"
                        ? "life-event"
                        : (
                            normalizedType.includes(
                                "entity"
                            )
                                ? "system"
                                : "note"
                        ),

                payload:
                    data,

                tags:
                    data.tags ||
                    [],

                source:
                    data.source ||
                    "system",

                important:
                    data.importance ===
                        "high" ||
                    data.importance ===
                        "critical",

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now()

            });


        this.records.push(
            record
        );


        this.save();


        if(
            record.entityId
        ){

            this.syncEntityLegacyStorage(
                record.entityId
            );

        }


        this.emit(
            "memory:created",
            {
                record,

                memoryId:
                    record.id,

                entityId:
                    record.entityId,

                time:
                    Date.now()
            }
        );


        return record;

    },


    /* =====================================================
       MANUAL MEMORY API
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


        const title =
            this.normalizeText(
                data.title,
                240
            );


        if(!title){

            return null;

        }


        const requestedId =
            this.normalizeId(
                data.id
            );


        if(
            requestedId &&
            this.hasId(
                requestedId
            )
        ){

            return this.find(
                requestedId,
                {
                    includeArchived:
                        true
                }
            );

        }


        const now =
            Date.now();


        const record =
            this.normalizeRecord({

                ...data,

                id:
                    requestedId ||
                    this.createId(),

                title,

                content:
                    this.normalizeText(
                        data.content,
                        30000
                    ),

                type:
                    data.type ||
                    "memory",

                category:
                    data.category ||
                    "note",

                source:
                    data.source ||
                    "manual",

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


        this.records.push(
            record
        );


        this.save();


        this.syncEntityLegacyStorage(
            record.entityId
        );


        this.emit(
            "memory:created",
            {
                record,

                memoryId:
                    record.id,

                entityId:
                    record.entityId,

                time:
                    Date.now()
            }
        );


        return record;

    },


    update(
        memoryId,
        changes = {}
    ){

        const record =
            this.find(
                memoryId,
                {
                    includeArchived:
                        true
                }
            );


        if(
            !record ||
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

            ...record,

            payload:{
                ...record.payload
            },

            tags:[
                ...record.tags
            ]

        };


        const previousEntityId =
            record.entityId;


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

                record.title =
                    title;

            }

        }


        if(
            changes.content !==
                undefined
        ){

            record.content =
                this.normalizeText(
                    changes.content,
                    30000
                );

        }


        if(
            changes.category !==
                undefined
        ){

            record.category =
                this.normalizeCategory(
                    changes.category
                );

        }


        if(
            changes.tags !==
                undefined
        ){

            record.tags =
                this.normalizeTags(
                    changes.tags
                );

        }


        if(
            typeof changes.important ===
                "boolean"
        ){

            record.important =
                changes.important;

        }


        if(
            typeof changes.pinned ===
                "boolean"
        ){

            record.pinned =
                changes.pinned;

        }


        if(
            changes.entityId !==
                undefined
        ){

            record.entityId =
                this.normalizeId(
                    changes.entityId
                );

        }


        if(
            changes.worldId !==
                undefined
        ){

            record.worldId =
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
                );


            if(source){

                record.source =
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

            record.payload = {

                ...record.payload,

                ...changes.payload

            };

        }


        record.updatedAt =
            Date.now();


        this.save();


        if(
            previousEntityId &&
            previousEntityId !==
                record.entityId
        ){

            this.syncEntityLegacyStorage(
                previousEntityId
            );

        }


        this.syncEntityLegacyStorage(
            record.entityId
        );


        this.emit(
            "memory:updated",
            {
                record,

                before,

                memoryId:
                    record.id,

                entityId:
                    record.entityId,

                time:
                    Date.now()
            }
        );


        return record;

    },


    /* =====================================================
       FIND
    ===================================================== */

    find(
        memoryId,
        options = {}
    ){

        const id =
            this.normalizeId(
                memoryId
            );


        if(!id){

            return null;

        }


        const record =
            this.records.find(
                item =>
                    item?.id ===
                        id
            ) ||
            null;


        if(!record){

            return null;

        }


        if(
            record.archived ===
                true &&
            options?.includeArchived !==
                true
        ){

            return null;

        }


        return record;

    },


    /* =====================================================
       ENTITY MEMORIES
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


        /*
         * During the MemoryApp migration period, import
         * records written to the entity compatibility store.
         */

        this.syncFromEntityLegacyStorage(
            id
        );


        const safeOptions =
            options &&
            typeof options ===
                "object" &&
            !Array.isArray(
                options
            )
                ? options
                : {};


        let records =
            this.records.filter(
                record =>
                    record?.entityId ===
                        id
            );


        if(
            safeOptions.includeArchived !==
                true
        ){

            records =
                records.filter(
                    record =>
                        record.archived !==
                            true
                );

        }


        if(
            safeOptions.category &&
            safeOptions.category !==
                "all"
        ){

            const category =
                this.normalizeCategory(
                    safeOptions.category
                );


            records =
                records.filter(
                    record =>
                        record.category ===
                            category
                );

        }


        if(
            safeOptions.important ===
                true
        ){

            records =
                records.filter(
                    record =>
                        record.important ===
                            true
                );

        }


        if(
            safeOptions.pinned ===
                true
        ){

            records =
                records.filter(
                    record =>
                        record.pinned ===
                            true
                );

        }


        const query =
            this.normalizeText(
                safeOptions.query,
                500
            )
                .toLocaleLowerCase(
                    "tr-TR"
                );


        if(query){

            records =
                records.filter(
                    record => {

                        const haystack = [
                            record.title,
                            record.content,
                            record.category,
                            record.source,
                            ...(record.tags || [])
                        ]
                            .join(" ")
                            .toLocaleLowerCase(
                                "tr-TR"
                            );


                        return haystack.includes(
                            query
                        );

                    }
                );

        }


        return [
            ...records
        ]
            .sort(
                (
                    a,
                    b
                ) => {

                    if(
                        a.pinned !==
                            b.pinned
                    ){

                        return a.pinned
                            ? -1
                            : 1;

                    }


                    if(
                        a.important !==
                            b.important
                    ){

                        return a.important
                            ? -1
                            : 1;

                    }


                    return (
                        Number(
                            b.updatedAt
                        ) -
                        Number(
                            a.updatedAt
                        )
                    );

                }
            );

    },


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


        let records =
            this.all(
                options
            );


        if(!text){

            return records;

        }


        return records.filter(
            record => {

                const haystack = [
                    record.title,
                    record.content,
                    record.type,
                    record.category,
                    record.source,
                    ...(record.tags || [])
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
       PIN / IMPORTANT
    ===================================================== */

    togglePin(memoryId){

        const record =
            this.find(
                memoryId,
                {
                    includeArchived:
                        true
                }
            );


        if(!record){

            return false;

        }


        return Boolean(
            this.update(
                record.id,
                {
                    pinned:
                        !record.pinned
                }
            )
        );

    },


    toggleImportant(memoryId){

        const record =
            this.find(
                memoryId,
                {
                    includeArchived:
                        true
                }
            );


        if(!record){

            return false;

        }


        return Boolean(
            this.update(
                record.id,
                {
                    important:
                        !record.important
                }
            )
        );

    },


    /* =====================================================
       ARCHIVE / RESTORE
    ===================================================== */

    archive(memoryId){

        const record =
            this.find(
                memoryId,
                {
                    includeArchived:
                        true
                }
            );


        if(!record){

            return false;

        }


        if(
            record.archived ===
                true
        ){

            return true;

        }


        record.archived =
            true;


        record.archivedAt =
            Date.now();


        record.updatedAt =
            Date.now();


        this.save();


        this.syncEntityLegacyStorage(
            record.entityId
        );


        this.emit(
            "memory:archived",
            {
                record,

                memoryId:
                    record.id,

                entityId:
                    record.entityId,

                time:
                    Date.now()
            }
        );


        return true;

    },


    restore(memoryId){

        const record =
            this.find(
                memoryId,
                {
                    includeArchived:
                        true
                }
            );


        if(!record){

            return false;

        }


        if(
            record.archived !==
                true
        ){

            return true;

        }


        record.archived =
            false;


        record.archivedAt =
            null;


        record.updatedAt =
            Date.now();


        this.save();


        this.syncEntityLegacyStorage(
            record.entityId
        );


        this.emit(
            "memory:restored",
            {
                record,

                memoryId:
                    record.id,

                entityId:
                    record.entityId,

                time:
                    Date.now()
            }
        );


        return true;

    },

   /* =====================================================
       HARD REMOVE
       Not the normal UX path.
    ===================================================== */

    remove(memoryId){

        const record =
            this.find(
                memoryId,
                {
                    includeArchived:
                        true
                }
            );


        if(!record){

            return false;

        }


        const before =
            this.records.length;


        this.records =
            this.records.filter(
                item =>
                    item.id !==
                        record.id
            );


        if(
            this.records.length ===
                before
        ){

            return false;

        }


        this.save();


        this.syncEntityLegacyStorage(
            record.entityId
        );


        this.emit(
            "memory:removed",
            {
                record,

                memoryId:
                    record.id,

                entityId:
                    record.entityId,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       SYSTEM EVENT MEMORY
    ===================================================== */

    rememberSystemEvent(
        type,
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


        const fingerprint =
            [
                normalizedType,
                entityId ||
                    "global",
                data.sourceEventId ||
                    "",
                data.timestamp ||
                    data.createdAt ||
                    ""
            ]
                .map(
                    item =>
                        String(
                            item ??
                            ""
                        )
                )
                .join(":");


        const duplicate =
            this.records.some(
                record =>
                    record?.payload
                        ?.fingerprint ===
                        fingerprint
            );


        if(duplicate){

            return null;

        }


        return this.remember(
            normalizedType,
            {
                ...data,

                entityId,

                fingerprint,

                title:
                    data.title ||
                    (
                        normalizedType ===
                            "entity:mounted"
                            ? "Varlık sisteme bağlandı"
                            : normalizedType
                    ),

                source:
                    "system"
            }
        );

    },


    /* =====================================================
       LIFE EVENT LINK
    ===================================================== */

    rememberLifeEvent(lifeEvent){

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
            this.records.find(
                record =>
                    record?.payload
                        ?.sourceEventId ===
                        sourceEventId
            );


        if(existing){

            return existing;

        }


        return this.remember(
            "life-event",
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

                title:
                    lifeEvent.title ||
                    "Yaşam Olayı",

                content:
                    lifeEvent.description ||
                    "",

                importance:
                    lifeEvent.importance ||
                    "medium",

                tags:
                    lifeEvent.tags ||
                    [],

                source:
                    "evolution"
            }
        );

    },


    updateLifeEventMemory(lifeEvent){

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


        const linkedRecord =
            this.records.find(
                record =>
                    record?.payload
                        ?.sourceEventId ===
                        sourceEventId
            );


        if(!linkedRecord){

            return false;

        }


        const previousEntityId =
            linkedRecord.entityId;


        if(
            lifeEvent.title !==
                undefined
        ){

            const title =
                this.normalizeText(
                    lifeEvent.title,
                    240
                );


            if(title){

                linkedRecord.title =
                    title;

            }

        }


        if(
            lifeEvent.description !==
                undefined
        ){

            linkedRecord.content =
                this.normalizeText(
                    lifeEvent.description,
                    30000
                );

        }


        if(
            lifeEvent.importance !==
                undefined
        ){

            const importance =
                String(
                    lifeEvent.importance ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            linkedRecord.important =
                importance ===
                    "high" ||
                importance ===
                    "critical";

        }


        if(
            lifeEvent.tags !==
                undefined
        ){

            linkedRecord.tags =
                this.normalizeTags(
                    lifeEvent.tags
                );

        }


        const nextEntityId =
            this.normalizeId(
                lifeEvent.relatedEntityId ||
                lifeEvent.entityId ||
                linkedRecord.entityId
            );


        const nextWorldId =
            this.normalizeId(
                lifeEvent.relatedWorldId ||
                lifeEvent.worldId ||
                linkedRecord.worldId
            );


        linkedRecord.entityId =
            nextEntityId;


        linkedRecord.worldId =
            nextWorldId;


        linkedRecord.payload = {

            ...linkedRecord.payload,

            sourceEventId,

            title:
                lifeEvent.title ||
                linkedRecord.payload
                    ?.title ||
                linkedRecord.title,

            description:
                lifeEvent.description ||
                linkedRecord.payload
                    ?.description ||
                linkedRecord.content,

            importance:
                lifeEvent.importance ||
                linkedRecord.payload
                    ?.importance ||
                "medium",

            relatedEntityId:
                nextEntityId,

            relatedWorldId:
                nextWorldId,

            tags:
                this.normalizeTags(
                    lifeEvent.tags ||
                    linkedRecord.tags
                ),

            source:
                "evolution"

        };


        linkedRecord.source =
            "evolution";


        linkedRecord.updatedAt =
            Date.now();


        this.save();


        if(
            previousEntityId &&
            previousEntityId !==
                linkedRecord.entityId
        ){

            this.syncEntityLegacyStorage(
                previousEntityId
            );

        }


        this.syncEntityLegacyStorage(
            linkedRecord.entityId
        );


        this.emit(
            "memory:updated",
            {
                record:
                    linkedRecord,

                memoryId:
                    linkedRecord.id,

                entityId:
                    linkedRecord.entityId,

                sourceEventId,

                source:
                    "evolution",

                time:
                    Date.now()
            }
        );


        return true;

    },


    removeLifeEventMemory(lifeEvent){

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


        const linked =
            this.records.filter(
                record =>
                    record?.payload
                        ?.sourceEventId ===
                        sourceEventId
            );


        if(
            linked.length ===
                0
        ){

            return 0;

        }


        const entityIds =
            [
                ...new Set(
                    linked
                        .map(
                            record =>
                                record.entityId
                        )
                        .filter(Boolean)
                )
            ];


        const before =
            this.records.length;


        this.records =
            this.records.filter(
                record =>
                    record?.payload
                        ?.sourceEventId !==
                        sourceEventId
            );


        const removed =
            before -
            this.records.length;


        if(
            removed >
                0
        ){

            this.save();


            entityIds.forEach(
                entityId =>
                    this.syncEntityLegacyStorage(
                        entityId
                    )
            );


            this.emit(
                "memory:life-event:removed",
                {
                    sourceEventId,

                    removed,

                    time:
                        Date.now()
                }
            );

        }


        return removed;

    },


    resolveLifeEvent(memoryRecord){

        if(
            !memoryRecord ||
            memoryRecord.type !==
                "life-event" ||
            !memoryRecord.payload
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
            memoryRecord.payload
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


        const removedRecords =
            [];


        this.records =
            this.records.filter(
                record => {

                    if(
                        record.type !==
                            "life-event" ||
                        !record.payload
                            ?.sourceEventId
                    ){

                        return true;

                    }


                    try{

                        const exists =
                            Boolean(
                                resolver(
                                    record.payload
                                        .sourceEventId
                                )
                            );


                        if(!exists){

                            removedRecords.push(
                                record
                            );

                        }


                        return exists;

                    } catch(error){

                        /*
                         * A temporary Evolution lookup error must not
                         * destroy Memory data.
                         */

                        return true;

                    }

                }
            );


        const removed =
            removedRecords.length;


        if(
            removed >
                0
        ){

            this.save();


            [
                ...new Set(
                    removedRecords
                        .map(
                            record =>
                                record.entityId
                        )
                        .filter(Boolean)
                )
            ]
                .forEach(
                    entityId =>
                        this.syncEntityLegacyStorage(
                            entityId
                        )
                );


            this.emit(
                "memory:orphans:cleaned",
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
       LEGACY ENTITY MEMORY BRIDGE

       MemoryApp compatibility storage:
       vaero:memory:entity:v2:<entityId>

       MemorySystem remains the central authority while
       supporting the transition period.
    ===================================================== */

    syncFromEntityLegacyStorage(entityId){

        const id =
            this.normalizeId(
                entityId
            );


        if(!id){

            return 0;

        }


        if(
            typeof localStorage ===
                "undefined"
        ){

            return 0;

        }


        let parsed =
            null;


        try{

            const saved =
                localStorage.getItem(
                    this.entityStoragePrefix +
                    id
                );


            if(!saved){

                return 0;

            }


            parsed =
                JSON.parse(
                    saved
                );

        } catch(error){

            return 0;

        }


        if(
            !Array.isArray(
                parsed
            )
        ){

            return 0;

        }


        let changed =
            0;


        parsed.forEach(
            legacy => {

                if(
                    !legacy ||
                    typeof legacy !==
                        "object" ||
                    Array.isArray(
                        legacy
                    )
                ){

                    return;

                }


                const legacyId =
                    this.normalizeId(
                        legacy.id
                    );


                if(!legacyId){

                    return;

                }


                const normalized =
                    this.normalizeRecord({

                        ...legacy,

                        id:
                            legacyId,

                        entityId:
                            id,

                        type:
                            legacy.type ||
                            "memory",

                        source:
                            legacy.source ||
                            "manual"

                    });


                const existingIndex =
                    this.findIndex(
                        legacyId
                    );


                if(
                    existingIndex <
                        0
                ){

                    this.records.push(
                        normalized
                    );


                    changed +=
                        1;


                    return;

                }


                const existing =
                    this.records[
                        existingIndex
                    ];


                if(
                    Number(
                        normalized.updatedAt
                    ) >
                    Number(
                        existing.updatedAt
                    )
                ){

                    this.records[
                        existingIndex
                    ] =
                        normalized;


                    changed +=
                        1;

                }

            }
        );


        if(
            changed >
                0
        ){

            this.save();

        }


        return changed;

    },


    syncEntityLegacyStorage(entityId){

        const id =
            this.normalizeId(
                entityId
            );


        if(!id){

            return false;

        }


        if(
            typeof localStorage ===
                "undefined"
        ){

            return false;

        }


        const records =
            this.records
                .filter(
                    record =>
                        record.entityId ===
                            id &&
                        record.type !==
                            "life-event" &&
                        record.category !==
                            "system"
                )
                .map(
                    record => ({

                        id:
                            record.id,

                        entityId:
                            record.entityId,

                        worldId:
                            record.worldId,

                        title:
                            record.title,

                        content:
                            record.content,

                        category:
                            record.category,

                        important:
                            record.important,

                        pinned:
                            record.pinned,

                        archived:
                            record.archived,

                        archivedAt:
                            record.archivedAt,

                        source:
                            record.source,

                        tags:[
                            ...record.tags
                        ],

                        createdAt:
                            record.createdAt,

                        updatedAt:
                            record.updatedAt

                    })
                );


        try{

            localStorage.setItem(
                this.entityStoragePrefix +
                    id,
                JSON.stringify(
                    records
                )
            );


            return true;

        } catch(error){

            console.warn(
                "Entity Memory compatibility storage yazılamadı:",
                error
            );


            return false;

        }

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


        let records =
            [
                ...this.records
            ];


        if(
            safeOptions.includeArchived !==
                true
        ){

            records =
                records.filter(
                    record =>
                        record.archived !==
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


            records =
                records.filter(
                    record =>
                        record.entityId ===
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


            records =
                records.filter(
                    record =>
                        record.worldId ===
                            worldId
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


            records =
                records.filter(
                    record =>
                        record.type ===
                            type
                );

        }


        if(
            safeOptions.category &&
            safeOptions.category !==
                "all"
        ){

            const category =
                this.normalizeCategory(
                    safeOptions.category
                );


            records =
                records.filter(
                    record =>
                        record.category ===
                            category
                );

        }


        if(
            safeOptions.important ===
                true
        ){

            records =
                records.filter(
                    record =>
                        record.important ===
                            true
                );

        }


        if(
            safeOptions.pinned ===
                true
        ){

            records =
                records.filter(
                    record =>
                        record.pinned ===
                            true
                );

        }


        return records.sort(
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
        );

    },


    /* =====================================================
       STATS
    ===================================================== */

    stats(entityId = null){

        const records =
            entityId
                ? this.forEntity(
                    entityId
                )
                : this.all();


        return {

            total:
                records.length,

            important:
                records.filter(
                    record =>
                        record.important ===
                            true
                ).length,

            pinned:
                records.filter(
                    record =>
                        record.pinned ===
                            true
                ).length,

            notes:
                records.filter(
                    record =>
                        record.category ===
                            "note"
                ).length,

            decisions:
                records.filter(
                    record =>
                        record.category ===
                            "decision"
                ).length,

            ideas:
                records.filter(
                    record =>
                        record.category ===
                            "idea"
                ).length,

            events:
                records.filter(
                    record =>
                        record.category ===
                            "event"
                ).length,

            lifeEvents:
                records.filter(
                    record =>
                        record.category ===
                            "life-event"
                ).length,

            knowledge:
                records.filter(
                    record =>
                        record.category ===
                            "knowledge"
                ).length,

            system:
                records.filter(
                    record =>
                        record.category ===
                            "system"
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
                    this.records
                )
            );


            return true;

        } catch(error){

            console.error(
                "Memory kaydedilemedi:",
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

                this.records =
                    [];


                return this.records;

            }


            let saved =
                localStorage.getItem(
                    this.storageKey
                );


            let migrated =
                false;


            /*
             * Previous global Memory storage → v3.
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

                this.records =
                    [];


                return this.records;

            }


            const parsed =
                JSON.parse(
                    saved
                );


            const sourceRecords =
                Array.isArray(
                    parsed
                )
                    ? parsed
                    : [];


            const normalized =
                sourceRecords
                    .filter(
                        record =>
                            record &&
                            typeof record ===
                                "object" &&
                            !Array.isArray(
                                record
                            )
                    )
                    .map(
                        record =>
                            this.normalizeRecord(
                                record
                            )
                    );


            /*
             * Keep one record for each memory id.
             * Newest updatedAt wins during migration.
             */

            const byId =
                new Map();


            normalized.forEach(
                record => {

                    const existing =
                        byId.get(
                            record.id
                        );


                    if(
                        !existing ||
                        Number(
                            record.updatedAt
                        ) >
                        Number(
                            existing.updatedAt
                        )
                    ){

                        byId.set(
                            record.id,
                            record
                        );

                    }

                }
            );


            this.records =
                [
                    ...byId.values()
                ];


            /*
             * Always persist the normalized latest format.
             */

            this.save();


            if(
                migrated
            ){

                this.emit(
                    "memory:migrated",
                    {
                        from:
                            this.legacyStorageKey,

                        to:
                            this.storageKey,

                        count:
                            this.records.length,

                        time:
                            Date.now()
                    }
                );

            }


            return this.records;

        } catch(error){

            console.error(
                "Memory yüklenemedi:",
                error
            );


            this.records =
                [];


            return this.records;

        }

    },


    /* =====================================================
       CLEAR
       Explicit low-level operation only.
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
                this.records.filter(
                    record =>
                        record.entityId ===
                            entityId
                );


            if(
                removed.length ===
                    0
            ){

                return false;

            }


            this.records =
                this.records.filter(
                    record =>
                        record.entityId !==
                            entityId
                );


            this.save();


            this.syncEntityLegacyStorage(
                entityId
            );


            this.emit(
                "memory:cleared",
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
            this.records.length;


        this.records =
            [];


        this.save();


        this.emit(
            "memory:cleared",
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
            this.records.filter(
                record =>
                    record.archived !==
                        true
            );


        const archived =
            this.records.filter(
                record =>
                    record.archived ===
                        true
            );


        const entityIds =
            new Set(
                this.records
                    .map(
                        record =>
                            record.entityId
                    )
                    .filter(Boolean)
            );


        return {

            booted:
                this.booted,

            total:
                this.records.length,

            active:
                active.length,

            archived:
                archived.length,

            entities:
                entityIds.size,

            important:
                active.filter(
                    record =>
                        record.important ===
                            true
                ).length,

            pinned:
                active.filter(
                    record =>
                        record.pinned ===
                            true
                ).length,

            manual:
                this.records.filter(
                    record =>
                        record.source ===
                            "manual"
                ).length,

            system:
                this.records.filter(
                    record =>
                        record.source ===
                            "system"
                ).length,

            evolution:
                this.records.filter(
                    record =>
                        record.source ===
                            "evolution"
                ).length,

            lifeEvents:
                this.records.filter(
                    record =>
                        record.type ===
                            "life-event" ||
                        record.category ===
                            "life-event"
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
            "memorySystem",
            MemorySystem
        );

    }

} catch(error){

    console.warn(
        "MemorySystem VAERO register başarısız:",
        error
    );

}


/* =========================================================
   GLOBAL
========================================================= */

window.MemorySystem =
    MemorySystem;
