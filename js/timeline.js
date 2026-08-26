/* =========================================================
   VAERO TIMELINE CORE
   Central Chronological Event System
========================================================= */

const Timeline = {

    events: [],

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
                `Timeline service okunamadı: ${name}`,
                error
            );


            return null;

        }

    },


    emit(
        eventName,
        payload = {}
    ){

        try{

            if(
                typeof VAERO !== "undefined" &&
                typeof VAERO.emit === "function"
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
                typeof events.emit === "function"
            ){

                events.emit(
                    eventName,
                    payload
                );

                return true;

            }

        } catch(error){

            console.warn(
                `Timeline event gönderilemedi: ${eventName}`,
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
            typeof crypto.randomUUID === "function"
        ){

            return crypto.randomUUID();

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
            typeof value !== "object" ||
            Array.isArray(value)
        ){
            return {};
        }


        return {
            ...value
        };

    },


    normalizeTags(value){

        if(
            !Array.isArray(value)
        ){
            return [];
        }


        return [
            ...new Set(
                value
                    .map(
                        item =>
                            String(
                                item ?? ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ];

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


    normalizeRecord(
        event = {}
    ){

        const now =
            Date.now();


        const payload =
            this.normalizePayload(
                event.payload
            );


        const type =
            String(
                event.type ||
                "event"
            )
                .trim()
                .toLowerCase();


        const source =
            String(
                event.source ||
                payload.source ||
                (
                    type === "life-event"
                        ? "evolution"
                        : "timeline"
                )
            )
                .trim()
                .toLowerCase();


        return {

            id:
                String(
                    event.id ||
                    this.createId()
                ),

            type,

            title:
                String(
                    event.title ||
                    payload.title ||
                    type ||
                    "Timeline Olayı"
                ).trim(),

            description:
                String(
                    event.description ||
                    payload.description ||
                    payload.content ||
                    ""
                ).trim(),

            source,

            category:
                String(
                    event.category ||
                    payload.category ||
                    type ||
                    "event"
                )
                    .trim()
                    .toLowerCase(),

            importance:
                this.normalizeImportance(
                    event.importance ||
                    payload.importance
                ),

            entityId:
                String(
                    event.entityId ||
                    event.relatedEntityId ||
                    payload.entityId ||
                    payload.relatedEntityId ||
                    ""
                ).trim() ||
                null,

            worldId:
                String(
                    event.worldId ||
                    event.relatedWorldId ||
                    payload.worldId ||
                    payload.relatedWorldId ||
                    ""
                ).trim() ||
                null,

            payload,

            tags:
                this.normalizeTags(
                    event.tags ||
                    payload.tags
                ),

            archived:
                event.archived === true,

            archivedAt:
                event.archived === true
                    ? (
                        Number(
                            event.archivedAt
                        ) ||
                        now
                    )
                    : null,

            occurredAt:
                Number(
                    event.occurredAt
                ) ||
                Number(
                    payload.occurredAt
                ) ||
                Number(
                    event.createdAt
                ) ||
                now,

            createdAt:
                Number(
                    event.createdAt
                ) ||
                now,

            updatedAt:
                Number(
                    event.updatedAt
                ) ||
                Number(
                    event.createdAt
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
                "Timeline boot: Events servisi bulunamadı."
            );

            this.booted =
                true;

            return true;

        }


        if(
            typeof events.on === "function"
        ){

            /*
             * Entity Mount
             */

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


            /*
             * Engine
             */

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


            /*
             * Runtime
             */

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
             * Runtime tick geçmişini şişirmesin.
             * Yalnız ilk/önemli tick kayıtları dışarıdan
             * explicit add ile eklenebilir.
             */


            /*
             * Evolution
             */

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


            /*
             * Memory
             */

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
                     * Evolution kaynaklı Memory,
                     * Timeline'da ikinci kez eklenmez.
                     */

                    if(
                        record.source === "evolution" ||
                        record.type === "life-event"
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
                                record.important
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
                        this.events.find(
                            event =>
                                event.payload
                                    ?.sourceMemoryId ===
                                record.id
                        );


                    if(!linked){
                        return;
                    }


                    linked.title =
                        record.title ||
                        linked.title;


                    linked.description =
                        record.content ||
                        linked.description;


                    linked.category =
                        record.category ||
                        linked.category;


                    linked.importance =
                        record.important
                            ? "high"
                            : "low";


                    linked.tags =
                        this.normalizeTags(
                            record.tags ||
                            linked.tags
                        );


                    linked.updatedAt =
                        Date.now();


                    linked.occurredAt =
                        Number(
                            record.updatedAt
                        ) ||
                        linked.occurredAt;


                    this.save();

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
                        this.events.find(
                            event =>
                                event.payload
                                    ?.sourceMemoryId ===
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
                        this.events.find(
                            event =>
                                event.payload
                                    ?.sourceMemoryId ===
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

        }


        this.cleanOrphanLifeEvents();


        this.booted =
            true;


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


        /*
         * source reference varsa duplicate engelle.
         */

        if(
            data.sourceEventId
        ){

            const existing =
                this.events.find(
                    event =>
                        event.payload
                            ?.sourceEventId ===
                        data.sourceEventId
                );


            if(existing){
                return existing;
            }

        }


        if(
            data.sourceMemoryId
        ){

            const existing =
                this.events.find(
                    event =>
                        event.payload
                            ?.sourceMemoryId ===
                        data.sourceMemoryId
                );


            if(existing){
                return existing;
            }

        }


        const event =
            this.normalizeRecord({

                id:
                    this.createId(),

                type,

                title,

                description:
                    data.description ||
                    data.content ||
                    "",

                source:
                    data.source ||
                    (
                        type === "life-event"
                            ? "evolution"
                            : "timeline"
                    ),

                category:
                    data.category ||
                    type,

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

                payload:
                    data,

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
            typeof data !== "object" ||
            Array.isArray(data)
        ){
            return null;
        }


        const event =
            this.normalizeRecord({

                ...data,

                id:
                    data.id ||
                    this.createId(),

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


        const entityId =
            String(
                data.entityId ||
                data.id ||
                ""
            ).trim() ||
            null;


        const worldId =
            String(
                data.worldId ||
                data.relatedWorldId ||
                ""
            ).trim() ||
            null;


        /*
         * Boot sırasında aynı event iki farklı event adıyla
         * tetiklenirse duplicate oluşmasın.
         */

        const now =
            Date.now();


        const recentDuplicate =
            this.events.find(
                event => {

                    if(
                        event.source !== "system"
                    ){
                        return false;
                    }


                    if(
                        event.type !==
                        String(type)
                            .toLowerCase()
                    ){
                        return false;
                    }


                    if(
                        event.entityId !==
                        entityId
                    ){
                        return false;
                    }


                    return (
                        now -
                        event.createdAt
                    ) < 1500;

                }
            );


        if(recentDuplicate){
            return recentDuplicate;
        }


        return this.add(
            type,
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
            typeof changes !== "object" ||
            Array.isArray(changes)
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
            typeof changes.title === "string" &&
            changes.title.trim()
        ){

            event.title =
                changes.title.trim();

        }


        if(
            typeof changes.description === "string"
        ){

            event.description =
                changes.description.trim();

        }


        if(
            changes.importance !== undefined
        ){

            event.importance =
                this.normalizeImportance(
                    changes.importance
                );

        }


        if(
            typeof changes.category === "string"
        ){

            event.category =
                changes.category
                    .trim()
                    .toLowerCase();

        }


        if(
            Array.isArray(changes.tags)
        ){

            event.tags =
                this.normalizeTags(
                    changes.tags
                );

        }


        if(
            changes.payload &&
            typeof changes.payload === "object" &&
            !Array.isArray(changes.payload)
        ){

            event.payload = {
                ...event.payload,
                ...changes.payload
            };

        }


        if(
            Number.isFinite(
                Number(
                    changes.occurredAt
                )
            )
        ){

            event.occurredAt =
                Number(
                    changes.occurredAt
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
            String(
                timelineId ??
                ""
            ).trim();


        if(!id){
            return null;
        }


        const event =
            this.events.find(
                item =>
                    item?.id === id
            ) ||
            null;


        if(
            !event ||
            (
                event.archived === true &&
                options.includeArchived !== true
            )
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


        const existing =
            this.events.find(
                event =>
                    event.payload
                        ?.sourceEventId ===
                    lifeEvent.id
            );


        if(existing){
            return existing;
        }


        return this.add(
            "life-event",
            lifeEvent.title ||
            "Yaşam Olayı",
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


        const linkedEvent =
            this.events.find(
                event =>
                    event.payload
                        ?.sourceEventId ===
                    lifeEvent.id
            );


        if(!linkedEvent){
            return false;
        }


        linkedEvent.title =
            lifeEvent.title ||
            linkedEvent.title;


        linkedEvent.description =
            lifeEvent.description ||
            linkedEvent.description;


        linkedEvent.importance =
            this.normalizeImportance(
                lifeEvent.importance ||
                linkedEvent.importance
            );


        linkedEvent.entityId =
            lifeEvent.relatedEntityId ||
            lifeEvent.entityId ||
            linkedEvent.entityId;


        linkedEvent.worldId =
            lifeEvent.relatedWorldId ||
            lifeEvent.worldId ||
            linkedEvent.worldId;


        linkedEvent.tags =
            this.normalizeTags(
                lifeEvent.tags ||
                linkedEvent.tags
            );


        linkedEvent.occurredAt =
            Number(
                lifeEvent.occurredAt ||
                lifeEvent.createdAt
            ) ||
            linkedEvent.occurredAt;


        linkedEvent.updatedAt =
            Date.now();


        this.save();


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


        const before =
            this.events.length;


        this.events =
            this.events.filter(
                event =>
                    event.payload
                        ?.sourceEventId !==
                    lifeEvent.id
            );


        const removed =
            before -
            this.events.length;


        if(removed > 0){

            this.save();

        }


        return removed;

    },


    resolveLifeEvent(
        timelineEvent
    ){

        if(
            !timelineEvent ||
            timelineEvent.type !== "life-event" ||
            !timelineEvent.payload
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
            typeof evolution.find !== "function"
        ){
            return null;
        }


        try{

            return evolution.find(
                timelineEvent.payload
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
            typeof evolution.find !== "function"
        ){
            return 0;
        }


        const before =
            this.events.length;


        this.events =
            this.events.filter(
                event => {

                    if(
                        event.type !== "life-event" ||
                        !event.payload
                            ?.sourceEventId
                    ){
                        return true;
                    }


                    try{

                        return Boolean(
                            evolution.find(
                                event.payload
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
            this.events.length;


        if(removed > 0){

            this.save();

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
            String(
                entityId ??
                ""
            ).trim();


        if(!id){
            return [];
        }


        let events =
            this.events.filter(
                event =>
                    event.entityId === id
            );


        if(
            options.includeArchived !== true
        ){

            events =
                events.filter(
                    event =>
                        event.archived !== true
                );

        }


        if(options.source){

            const source =
                String(
                    options.source
                )
                    .trim()
                    .toLowerCase();


            events =
                events.filter(
                    event =>
                        event.source === source
                );

        }


        return [
            ...events
        ].sort(
            (a,b) =>
                b.occurredAt -
                a.occurredAt
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
            String(
                worldId ??
                ""
            ).trim();


        if(!id){
            return [];
        }


        let events =
            this.events.filter(
                event =>
                    event.worldId === id
            );


        if(
            options.includeArchived !== true
        ){

            events =
                events.filter(
                    event =>
                        event.archived !== true
                );

        }


        return [
            ...events
        ].sort(
            (a,b) =>
                b.occurredAt -
                a.occurredAt
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

        let events =
            [
                ...this.events
            ];


        if(
            options.includeArchived !== true
        ){

            events =
                events.filter(
                    event =>
                        event.archived !== true
                );

        }


        if(options.entityId){

            const entityId =
                String(
                    options.entityId
                );


            events =
                events.filter(
                    event =>
                        event.entityId ===
                        entityId
                );

        }


        if(options.worldId){

            const worldId =
                String(
                    options.worldId
                );


            events =
                events.filter(
                    event =>
                        event.worldId ===
                        worldId
                );

        }


        if(options.source){

            const source =
                String(
                    options.source
                )
                    .trim()
                    .toLowerCase();


            events =
                events.filter(
                    event =>
                        event.source ===
                        source
                );

        }


        if(options.type){

            const type =
                String(
                    options.type
                )
                    .trim()
                    .toLowerCase();


            events =
                events.filter(
                    event =>
                        event.type === type
                );

        }


        return events.sort(
            (a,b) =>
                b.occurredAt -
                a.occurredAt
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

                this.events = [];

                return this.events;

            }


            let saved =
                localStorage.getItem(
                    this.storageKey
                );


            /*
             * v1 -> v2 migration
             */

            if(!saved){

                saved =
                    localStorage.getItem(
                        this.legacyStorageKey
                    );

            }


            if(!saved){

                this.events = [];

                return this.events;

            }


            const parsed =
                JSON.parse(
                    saved
                );


            this.events =
                Array.isArray(parsed)
                    ? parsed
                        .filter(
                            event =>
                                event &&
                                typeof event ===
                                    "object"
                        )
                        .map(
                            event =>
                                this.normalizeRecord(
                                    event
                                )
                        )
                    : [];


            this.save();


            return this.events;

        } catch(error){

            console.error(
                "Timeline yüklenemedi:",
                error
            );


            this.events = [];


            return this.events;

        }

    },


    /* =====================================================
       CLEAR
    ===================================================== */

    clear(options = {}){

        if(options.entityId){

            const entityId =
                String(
                    options.entityId
                );


            const before =
                this.events.length;


            this.events =
                this.events.filter(
                    event =>
                        event.entityId !==
                            entityId
                );


            if(
                this.events.length ===
                before
            ){
                return false;
            }


            this.save();


            return true;

        }


        this.events = [];


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
                this.events.length,

            active:
                this.events.filter(
                    event =>
                        event.archived !== true
                ).length,

            archived:
                this.events.filter(
                    event =>
                        event.archived === true
                ).length,

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
                ).length

        };

    }

};


VAERO.register(
    "timeline",
    Timeline
);


window.Timeline =
    Timeline;
