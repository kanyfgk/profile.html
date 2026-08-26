/* =========================================================
   VAERO MEMORY SYSTEM
   Central Living Memory Core
========================================================= */

const MemorySystem = {

    records: [],

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

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
            ){
                return null;
            }


            return (
                VAERO.get(name) ||
                null
            );

        } catch(error){

            console.warn(
                `Memory service lookup failed: ${name}`,
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

        try{

            if(
                typeof VAERO !== "undefined" &&
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
                `Memory event failed: ${eventName}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID ===
                "function"
        ){

            return crypto.randomUUID();

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
            )
        ){
            return [];
        }


        return [
            ...new Set(
                value
                    .map(
                        item =>
                            String(
                                item ??
                                ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ];

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


    normalizeRecord(
        record = {}
    ){

        const now =
            Date.now();


        const payload =
            this.normalizePayload(
                record.payload
            );


        const entityId =
            String(
                record.entityId ||
                payload.entityId ||
                payload.relatedEntityId ||
                ""
            ).trim() ||
            null;


        const type =
            String(
                record.type ||
                "memory"
            )
                .trim()
                .toLowerCase();


        let category =
            record.category;


        if(!category){

            if(
                type ===
                "life-event"
            ){

                category =
                    "life-event";

            } else if(
                type ===
                "entity:mounted" ||
                type ===
                "entity.mounted"
            ){

                category =
                    "system";

            } else {

                category =
                    "note";

            }

        }


        const title =
            String(
                record.title ||
                payload.title ||
                record.description ||
                "İsimsiz Hafıza"
            ).trim();


        const content =
            String(
                record.content ||
                payload.content ||
                payload.description ||
                ""
            ).trim();


        return {

            id:
                String(
                    record.id ||
                    this.createId()
                ),

            type,

            entityId,

            worldId:
                String(
                    record.worldId ||
                    payload.worldId ||
                    payload.relatedWorldId ||
                    ""
                ).trim() ||
                null,

            title:
                title ||
                "İsimsiz Hafıza",

            content,

            category:
                this.normalizeCategory(
                    category
                ),

            payload,

            tags:
                this.normalizeTags(
                    record.tags ||
                    payload.tags
                ),

            source:
                String(
                    record.source ||
                    payload.source ||
                    "system"
                )
                    .trim() ||
                "system",

            important:
                record.important ===
                    true ||
                payload.importance ===
                    "high",

            pinned:
                record.pinned ===
                    true,

            archived:
                record.archived ===
                    true,

            archivedAt:
                record.archived ===
                    true
                    ? (
                        Number(
                            record.archivedAt
                        ) ||
                        now
                    )
                    : null,

            createdAt:
                Number(
                    record.createdAt
                ) ||
                now,

            updatedAt:
                Number(
                    record.updatedAt
                ) ||
                Number(
                    record.createdAt
                ) ||
                now

        };

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(this.booted){
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

            return true;

        }


        if(
            typeof events.on ===
                "function"
        ){

            /*
             * Eski ve yeni event isimlerini destekliyoruz.
             * rememberSystemEvent içindeki fingerprint
             * tekrar kaydı önler.
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


        const record =
            this.normalizeRecord({

                id:
                    this.createId(),

                type,

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
                    type ||
                    "Hafıza",

                content:
                    data.content ||
                    data.description ||
                    "",

                category:
                    type ===
                        "life-event"
                        ? "life-event"
                        : (
                            String(type).includes(
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
                        "high",

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now()

            });


        this.records.push(
            record
        );


        this.save();


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
            String(
                data.title ||
                ""
            ).trim();


        const content =
            String(
                data.content ||
                ""
            ).trim();


        if(!title){
            return null;
        }


        const record =
            this.normalizeRecord({

                ...data,

                id:
                    data.id ||
                    this.createId(),

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
                    Number(
                        data.createdAt
                    ) ||
                    Date.now(),

                updatedAt:
                    Number(
                        data.updatedAt
                    ) ||
                    Date.now()

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


        if(
            typeof changes.title ===
                "string" &&
            changes.title.trim()
        ){

            record.title =
                changes.title.trim();

        }


        if(
            typeof changes.content ===
                "string"
        ){

            record.content =
                changes.content.trim();

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
            Array.isArray(
                changes.tags
            )
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
            String(
                memoryId ??
                ""
            ).trim();


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


        if(
            !record ||
            (
                record.archived ===
                    true &&
                options.includeArchived !==
                    true
            )
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
            String(
                entityId ??
                ""
            ).trim();


        if(!id){
            return [];
        }


        /*
         * MemoryApp'in geçiş dönemindeki storage'ından
         * yeni kayıt geldiyse merkeze al.
         */

        this.syncFromEntityLegacyStorage(
            id
        );


        let records =
            this.records.filter(
                record =>
                    record?.entityId ===
                    id
            );


        if(
            options.includeArchived !==
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
            options.category &&
            options.category !==
                "all"
        ){

            const category =
                this.normalizeCategory(
                    options.category
                );


            records =
                records.filter(
                    record =>
                        record.category ===
                        category
                );

        }


        if(
            options.important ===
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
            options.pinned ===
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
            String(
                options.query ||
                ""
            )
                .trim()
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
        ].sort(
            (a,b) => {

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
                    b.updatedAt -
                    a.updatedAt
                );

            }
        );

    },


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


        if(record.archived){
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


        if(!record.archived){
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


        const entityId =
            String(
                data.entityId ||
                data.id ||
                ""
            ).trim() ||
            null;


        const fingerprint =
            [
                type,
                entityId ||
                    "global",
                data.sourceEventId ||
                    "",
                data.timestamp ||
                    data.createdAt ||
                    ""
            ]
                .join(":");


        const duplicate =
            this.records.some(
                record =>
                    record.payload
                        ?.fingerprint ===
                    fingerprint
            );


        if(duplicate){
            return null;
        }


        return this.remember(
            type,
            {
                ...data,

                entityId,

                fingerprint,

                title:
                    data.title ||
                    (
                        type ===
                            "entity:mounted"
                            ? "Varlık sisteme bağlandı"
                            : type
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


        const existing =
            this.records.find(
                record =>
                    record.payload
                        ?.sourceEventId ===
                    lifeEvent.id
            );


        if(existing){
            return existing;
        }


        return this.remember(
            "life-event",
            {
                sourceEventId:
                    lifeEvent.id,

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


        const linkedRecord =
            this.records.find(
                record =>
                    record.payload
                        ?.sourceEventId ===
                    lifeEvent.id
            );


        if(!linkedRecord){
            return false;
        }


        linkedRecord.title =
            lifeEvent.title ||
            linkedRecord.title;


        linkedRecord.content =
            lifeEvent.description ||
            linkedRecord.content;


        linkedRecord.important =
            lifeEvent.importance ===
                "high";


        linkedRecord.tags =
            this.normalizeTags(
                lifeEvent.tags ||
                linkedRecord.tags
            );


        linkedRecord.payload = {
            ...linkedRecord.payload,

            title:
                lifeEvent.title ||
                linkedRecord.payload.title,

            importance:
                lifeEvent.importance ||
                linkedRecord.payload.importance,

            relatedEntityId:
                lifeEvent.relatedEntityId ||
                linkedRecord.payload
                    .relatedEntityId,

            relatedWorldId:
                lifeEvent.relatedWorldId ||
                linkedRecord.payload
                    .relatedWorldId
        };


        linkedRecord.updatedAt =
            Date.now();


        this.save();


        return true;

    },


    removeLifeEventMemory(lifeEvent){

        if(
            !lifeEvent ||
            !lifeEvent.id
        ){

            return this.cleanOrphanLifeEvents();

        }


        const before =
            this.records.length;


        this.records =
            this.records.filter(
                record =>
                    record.payload
                        ?.sourceEventId !==
                    lifeEvent.id
            );


        const removed =
            before -
            this.records.length;


        if(removed > 0){

            this.save();

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


        if(
            !evolution ||
            typeof evolution.find !==
                "function"
        ){
            return null;
        }


        try{

            return evolution.find(
                memoryRecord.payload
                    .sourceEventId
            );

        } catch(error){

            return null;

        }

    },


    cleanOrphanLifeEvents(){

        const evolution =
            this.getService(
                "evolution"
            );


        if(
            !evolution ||
            typeof evolution.find !==
                "function"
        ){
            return 0;
        }


        const before =
            this.records.length;


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

                        return Boolean(
                            evolution.find(
                                record.payload
                                    .sourceEventId
                            )
                        );

                    } catch(error){

                        return true;

                    }

                }
            );


        const removed =
            before -
            this.records.length;


        if(removed > 0){

            this.save();

        }


        return removed;

    },


    /* =====================================================
       LEGACY ENTITY MEMORY BRIDGE

       MemoryApp currently writes:
       vaero:memory:entity:v2:<entityId>

       This bridge allows Memory Core to become authority
       without breaking the current app during migration.
    ===================================================== */

    syncFromEntityLegacyStorage(entityId){

        const id =
            String(
                entityId ??
                ""
            ).trim();


        if(!id){
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
                        "object"
                ){
                    return;
                }


                const legacyId =
                    String(
                        legacy.id ||
                        ""
                    ).trim();


                if(!legacyId){
                    return;
                }


                const normalized =
                    this.normalizeRecord({
                        ...legacy,

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
                    this.records.findIndex(
                        record =>
                            record.id ===
                            legacyId
                    );


                if(existingIndex < 0){

                    this.records.push(
                        normalized
                    );

                    changed += 1;

                    return;

                }


                const existing =
                    this.records[
                        existingIndex
                    ];


                if(
                    normalized.updatedAt >
                    existing.updatedAt
                ){

                    this.records[
                        existingIndex
                    ] = normalized;

                    changed += 1;

                }

            }
        );


        if(changed > 0){

            this.save();

        }


        return changed;

    },


    syncEntityLegacyStorage(entityId){

        const id =
            String(
                entityId ??
                ""
            ).trim();


        if(!id){
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

        let records =
            [
                ...this.records
            ];


        if(
            options.includeArchived !==
                true
        ){

            records =
                records.filter(
                    record =>
                        record.archived !==
                            true
                );

        }


        if(options.entityId){

            const entityId =
                String(
                    options.entityId
                );


            records =
                records.filter(
                    record =>
                        record.entityId ===
                            entityId
                );

        }


        if(options.worldId){

            const worldId =
                String(
                    options.worldId
                );


            records =
                records.filter(
                    record =>
                        record.worldId ===
                            worldId
                );

        }


        if(options.type){

            records =
                records.filter(
                    record =>
                        record.type ===
                            options.type
                );

        }


        return records.sort(
            (a,b) =>
                b.updatedAt -
                a.updatedAt
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
                        record.important
                ).length,

            pinned:
                records.filter(
                    record =>
                        record.pinned
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

            knowledge:
                records.filter(
                    record =>
                        record.category ===
                            "knowledge"
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


            /*
             * v2 -> v3 migration
             */

            if(!saved){

                saved =
                    localStorage.getItem(
                        this.legacyStorageKey
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


            this.records =
                Array.isArray(
                    parsed
                )
                    ? parsed
                        .filter(
                            record =>
                                record &&
                                typeof record ===
                                    "object"
                        )
                        .map(
                            record =>
                                this.normalizeRecord(
                                    record
                                )
                        )
                    : [];


            /*
             * Always persist in latest format.
             */

            this.save();


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

        if(options.entityId){

            const entityId =
                String(
                    options.entityId
                );


            const before =
                this.records.length;


            this.records =
                this.records.filter(
                    record =>
                        record.entityId !==
                            entityId
                );


            if(
                this.records.length ===
                before
            ){
                return false;
            }


            this.save();


            this.syncEntityLegacyStorage(
                entityId
            );


            return true;

        }


        this.records =
            [];


        this.save();


        return true;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            booted:
                this.booted,

            total:
                this.records.length,

            active:
                this.records.filter(
                    record =>
                        record.archived !==
                            true
                ).length,

            archived:
                this.records.filter(
                    record =>
                        record.archived ===
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
                ).length

        };

    }

};


VAERO.register(
    "memorySystem",
    MemorySystem
);


window.MemorySystem =
    MemorySystem;
