/* =========================================================
   VAERO TIMELINE APP
   Unified Entity Life Stream
   Timeline + Evolution + Memory
========================================================= */

const TimelineApp = {

    searchQuery:
        "",

    activeFilter:
        "all",

    selectedItemId:
        null,

    visibleLimit:
        40,

    searchTimer:
        null,

    orphanCleanupAttempted:
        false,


    /* =====================================================
       SAFETY
    ===================================================== */

    escapeHTML(value){

        if(
            window.UI &&
            typeof UI.escapeHTML ===
                "function"
        ){

            return UI.escapeHTML(
                value
            );

        }


        return String(
            value ?? ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    },


    /* =====================================================
       ENGINE / SERVICES
    ===================================================== */

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


    getService(name){

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
                    name
                ) ||
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


    getCurrentEntity(){

        const engine =
            this.getEngine();


        return (
            engine?.currentOpenedEntity ||
            engine?.currentEntity ||
            engine?.rootEntity ||
            null
        );

    },


    remount(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.mount !==
                "function"
        ){

            return false;

        }


        const entity =
            engine.currentOpenedEntity ||
            engine.currentEntity ||
            engine.rootEntity ||
            null;


        return engine.mount(
            entity
        );

    },


    /* =====================================================
       BRAIN CONTEXT
    ===================================================== */

    enterBrainContext(entity){

        try{

            const awareness =
                this.getService(
                    "brainAwareness"
                );


            awareness?.enter?.(
                "timeline",
                {
                    entityId:
                        entity?.id ||
                        null,

                    filter:
                        this.activeFilter,

                    selectedItemId:
                        this.selectedItemId,

                    searchActive:
                        Boolean(
                            String(
                                this.searchQuery ||
                                ""
                            ).trim()
                        )
                }
            );

        } catch(error){

            console.warn(
                "Timeline Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       TIMELINE CORE
    ===================================================== */

    getTimelineCore(){

        return this.getService(
            "timeline"
        );

    },


    cleanOrphans(){

        if(
            this.orphanCleanupAttempted
        ){

            return true;

        }


        this.orphanCleanupAttempted =
            true;


        const timeline =
            this.getTimelineCore();


        if(
            !timeline ||
            typeof timeline.cleanOrphanLifeEvents !==
                "function"
        ){

            return false;

        }


        try{

            timeline.cleanOrphanLifeEvents();


            return true;

        } catch(error){

            console.warn(
                "Timeline orphan kayıtları temizlenemedi:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       TIME
    ===================================================== */

    getTimestamp(item){

        const value =
            Number(
                item?.occurredAt ||
                item?.updatedAt ||
                item?.createdAt ||
                item?.timestamp ||
                item?.time ||
                0
            );


        return Number.isFinite(
            value
        )
            ? value
            : 0;

    },


    formatDate(timestamp){

        const value =
            Number(
                timestamp
            );


        if(
            !Number.isFinite(
                value
            ) ||
            value <=
                0
        ){

            return "Tarih bilinmiyor";

        }


        try{

            return new Intl.DateTimeFormat(
                "tr-TR",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            ).format(
                new Date(
                    value
                )
            );

        } catch(error){

            try{

                return new Date(
                    value
                ).toLocaleString(
                    "tr-TR"
                );

            } catch(secondError){

                return "Tarih bilinmiyor";

            }

        }

    },


    getDayKey(timestamp){

        const value =
            Number(
                timestamp
            );


        if(
            !Number.isFinite(
                value
            ) ||
            value <=
                0
        ){

            return "unknown";

        }


        const date =
            new Date(
                value
            );


        return [
            date.getFullYear(),
            String(
                date.getMonth() +
                1
            ).padStart(
                2,
                "0"
            ),
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            )
        ].join("-");

    },


    formatDay(timestamp){

        const value =
            Number(
                timestamp
            );


        if(
            !Number.isFinite(
                value
            ) ||
            value <=
                0
        ){

            return "Tarih bilinmiyor";

        }


        const date =
            new Date(
                value
            );


        const now =
            new Date();


        const today =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );


        const target =
            new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );


        const difference =
            Math.round(
                (
                    today.getTime() -
                    target.getTime()
                ) /
                86400000
            );


        if(
            difference ===
                0
        ){

            return "Bugün";

        }


        if(
            difference ===
                1
        ){

            return "Dün";

        }


        try{

            return new Intl.DateTimeFormat(
                "tr-TR",
                {
                    day:
                        "2-digit",

                    month:
                        "long",

                    year:
                        "numeric"
                }
            ).format(
                date
            );

        } catch(error){

            return date.toLocaleDateString(
                "tr-TR"
            );

        }

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

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


    normalizeSource(value){

        const source =
            String(
                value ||
                "timeline"
            )
                .trim()
                .toLowerCase();


        if(
            source.includes(
                "memory"
            )
        ){

            return "memory";

        }


        if(
            source.includes(
                "evolution"
            )
        ){

            return "evolution";

        }


        if(
            source.includes(
                "system"
            ) ||
            source.includes(
                "engine"
            )
        ){

            return "system";

        }


        return "timeline";

    },


    normalizeTags(value){

        if(
            !Array.isArray(
                value
            )
        ){

            return [];

        }


        const seen =
            new Set();


        const tags =
            [];


        value.forEach(
            item => {

                const tag =
                    String(
                        item ?? ""
                    )
                        .trim()
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .slice(
                            0,
                            80
                        );


                if(!tag){

                    return;

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

                    return;

                }


                seen.add(
                    key
                );


                tags.push(
                    tag
                );

            }
        );


        return tags;

    },


    sourceLabel(source){

        const labels = {

            timeline:
                "Timeline",

            evolution:
                "Evolution",

            memory:
                "Memory",

            system:
                "System"

        };


        return (
            labels[source] ||
            source
        );

    },


    sourceIcon(source){

        const icons = {

            timeline:
                "◷",

            evolution:
                "⌬",

            memory:
                "◫",

            system:
                "◇"

        };


        return (
            icons[source] ||
            "◷"
        );

    },


    importanceLabel(value){

        const labels = {

            low:
                "Düşük",

            medium:
                "Orta",

            high:
                "Yüksek",

            critical:
                "Kritik"

        };


        return (
            labels[
                this.normalizeImportance(
                    value
                )
            ] ||
            "Orta"
        );

    },


    /* =====================================================
       ENTITY MATCH
    ===================================================== */

    belongsToEntity(
        item,
        entityId
    ){

        if(!entityId){

            return true;

        }


        const candidates = [

            item?.entityId,

            item?.relatedEntityId,

            item?.payload?.entityId,

            item?.payload?.relatedEntityId,

            item?.context?.entityId

        ]
            .filter(
                value =>
                    value !==
                        null &&
                    value !==
                        undefined &&
                    value !==
                        ""
            )
            .map(
                value =>
                    String(
                        value
                    )
            );


        if(
            candidates.length ===
                0
        ){

            return true;

        }


        return candidates.includes(
            String(
                entityId
            )
        );

    },


    /* =====================================================
       TIMELINE SOURCE
    ===================================================== */

    getTimelineItems(entity){

        const timeline =
            this.getTimelineCore();


        if(
            !timeline ||
            typeof timeline.all !==
                "function"
        ){

            return [];

        }


        let records =
            [];


        try{

            const result =
                timeline.all();


            records =
                Array.isArray(
                    result
                )
                    ? result
                    : [];

        } catch(error){

            console.warn(
                "Timeline kayıtları okunamadı:",
                error
            );


            return [];

        }


        return records
            .filter(Boolean)
            .filter(
                item =>
                    this.belongsToEntity(
                        item,
                        entity?.id
                    )
            )
            .map(
                item => {

                    let lifeEvent =
                        null;


                    if(
                        item.type ===
                            "life-event" &&
                        typeof timeline.resolveLifeEvent ===
                            "function"
                    ){

                        try{

                            lifeEvent =
                                timeline.resolveLifeEvent(
                                    item
                                ) ||
                                null;

                        } catch(error){

                            lifeEvent =
                                null;

                        }

                    }


                    const source =
                        lifeEvent
                            ? "evolution"
                            : this.normalizeSource(
                                item.source ||
                                "timeline"
                            );


                    const timestamp =
                        lifeEvent?.occurredAt ||
                        lifeEvent?.updatedAt ||
                        lifeEvent?.createdAt ||
                        item.occurredAt ||
                        item.updatedAt ||
                        item.createdAt ||
                        item.timestamp ||
                        item.time ||
                        0;


                    const fallbackId =
                        `${source}:${timestamp}:${String(
                            item.title ||
                            item.description ||
                            item.type ||
                            "event"
                        )
                            .slice(
                                0,
                                60
                            )}`;


                    return {

                        id:
                            `timeline:${
                                item.id ||
                                lifeEvent?.id ||
                                fallbackId
                            }`,

                        rawId:
                            item.id ||
                            null,

                        source,

                        sourceId:
                            lifeEvent?.id ||
                            item.sourceId ||
                            item.id ||
                            null,

                        entityId:
                            lifeEvent?.relatedEntityId ||
                            lifeEvent?.entityId ||
                            item.entityId ||
                            item.relatedEntityId ||
                            item.payload?.entityId ||
                            item.payload?.relatedEntityId ||
                            null,

                        worldId:
                            lifeEvent?.relatedWorldId ||
                            lifeEvent?.worldId ||
                            item.worldId ||
                            item.relatedWorldId ||
                            item.payload?.worldId ||
                            null,

                        title:
                            String(
                                lifeEvent?.title ||
                                item.title ||
                                item.description ||
                                "Timeline Olayı"
                            ).trim(),

                        description:
                            String(
                                lifeEvent?.description ||
                                item.description ||
                                item.content ||
                                ""
                            ).trim(),

                        importance:
                            this.normalizeImportance(
                                lifeEvent?.importance ||
                                item.importance ||
                                item.payload?.importance
                            ),

                        type:
                            lifeEvent
                                ? "life-event"
                                : (
                                    item.type ||
                                    "timeline-event"
                                ),

                        category:
                            item.category ||
                            lifeEvent?.category ||
                            null,

                        tags:
                            this.normalizeTags(
                                Array.isArray(
                                    lifeEvent?.tags
                                )
                                    ? lifeEvent.tags
                                    : item.tags
                            ),

                        occurredAt:
                            Number(
                                timestamp
                            ) ||
                            Date.now(),

                        raw:
                            item,

                        linked:
                            lifeEvent ||
                            null

                    };

                }
            );

    },


    /* =====================================================
       EVOLUTION SOURCE
    ===================================================== */

    getEvolutionItems(entity){

        const evolution =
            this.getService(
                "evolution"
            );


        if(
            !evolution ||
            typeof evolution.all !==
                "function"
        ){

            return [];

        }


        let events =
            [];


        try{

            const result =
                evolution.all();


            events =
                Array.isArray(
                    result
                )
                    ? result
                    : [];

        } catch(error){

            console.warn(
                "Evolution Timeline verisi okunamadı:",
                error
            );


            return [];

        }


        return events
            .filter(Boolean)
            .filter(
                event =>
                    event.type !==
                        "runtime:tick"
            )
            .filter(
                event =>
                    this.belongsToEntity(
                        event,
                        entity?.id
                    )
            )
            .map(
                event => {

                    const timestamp =
                        event.occurredAt ||
                        event.updatedAt ||
                        event.createdAt ||
                        event.timestamp ||
                        event.time ||
                        0;


                    return {

                        id:
                            `evolution:${
                                event.id ||
                                `${timestamp}:${String(
                                    event.title ||
                                    event.description ||
                                    event.type ||
                                    "event"
                                ).slice(
                                    0,
                                    60
                                )}`
                            }`,

                        rawId:
                            event.id ||
                            null,

                        source:
                            "evolution",

                        sourceId:
                            event.id ||
                            null,

                        entityId:
                            event.relatedEntityId ||
                            event.entityId ||
                            null,

                        worldId:
                            event.relatedWorldId ||
                            event.worldId ||
                            null,

                        title:
                            String(
                                event.title ||
                                event.description ||
                                event.type ||
                                "Evolution Olayı"
                            ).trim(),

                        description:
                            String(
                                event.description ||
                                ""
                            ).trim(),

                        importance:
                            this.normalizeImportance(
                                event.importance
                            ),

                        type:
                            event.type ||
                            "life-event",

                        category:
                            event.category ||
                            "evolution",

                        tags:
                            this.normalizeTags(
                                event.tags
                            ),

                        occurredAt:
                            Number(
                                timestamp
                            ) ||
                            Date.now(),

                        raw:
                            event,

                        linked:
                            event

                    };

                }
            );

    },


    /* =====================================================
       MEMORY SOURCE
    ===================================================== */

    readMemoryCore(entity){

        if(!entity?.id){

            return [];

        }


        const candidates = [

            this.getService(
                "memorySystem"
            ),

            this.getService(
                "memory"
            )

        ]
            .filter(Boolean);


        for(
            const memory of candidates
        ){

            try{

                if(
                    typeof memory.forEntity ===
                        "function"
                ){

                    const records =
                        memory.forEntity(
                            entity.id
                        );


                    if(
                        Array.isArray(
                            records
                        )
                    ){

                        return records;

                    }

                }


                if(
                    typeof memory.all ===
                        "function"
                ){

                    const records =
                        memory.all();


                    if(
                        Array.isArray(
                            records
                        )
                    ){

                        return records.filter(
                            record =>
                                this.belongsToEntity(
                                    record,
                                    entity.id
                                )
                        );

                    }

                }

            } catch(error){

                console.warn(
                    "Memory Core Timeline verisi okunamadı:",
                    error
                );

            }

        }


        try{

            if(
                window.MemoryApp &&
                typeof window.MemoryApp
                    .getAllMemories ===
                    "function"
            ){

                const records =
                    window.MemoryApp
                        .getAllMemories(
                            entity
                        );


                return Array.isArray(
                    records
                )
                    ? records
                    : [];

            }

        } catch(error){

            console.warn(
                "Memory App Timeline verisi okunamadı:",
                error
            );

        }


        return [];

    },


    getMemoryItems(entity){

        const records =
            this.readMemoryCore(
                entity
            );


        if(
            !Array.isArray(
                records
            )
        ){

            return [];

        }


        return records
            .filter(Boolean)
            .filter(
                memoryRecord =>
                    memoryRecord.archived !==
                        true
            )
            .filter(
                memoryRecord => {

                    if(
                        memoryRecord.type ===
                            "life-event" ||
                        memoryRecord.source ===
                            "evolution"
                    ){

                        return false;

                    }


                    return true;

                }
            )
            .filter(
                memoryRecord =>
                    this.belongsToEntity(
                        memoryRecord,
                        entity?.id
                    )
            )
            .map(
                memoryRecord => {

                    const timestamp =
                        memoryRecord.updatedAt ||
                        memoryRecord.createdAt ||
                        memoryRecord.timestamp ||
                        0;


                    const source =
                        memoryRecord.source ===
                            "system"
                            ? "system"
                            : "memory";


                    return {

                        id:
                            `memory:${
                                memoryRecord.id ||
                                `${timestamp}:${String(
                                    memoryRecord.title ||
                                    "memory"
                                ).slice(
                                    0,
                                    60
                                )}`
                            }`,

                        rawId:
                            memoryRecord.id ||
                            null,

                        source,

                        sourceId:
                            memoryRecord.id ||
                            null,

                        entityId:
                            memoryRecord.entityId ||
                            null,

                        worldId:
                            memoryRecord.worldId ||
                            null,

                        title:
                            String(
                                memoryRecord.title ||
                                "Hafıza"
                            ).trim(),

                        description:
                            String(
                                memoryRecord.content ||
                                memoryRecord.description ||
                                ""
                            ).trim(),

                        importance:
                            memoryRecord.important
                                ? "high"
                                : "low",

                        type:
                            memoryRecord.type ||
                            "memory",

                        category:
                            memoryRecord.category ||
                            "note",

                        tags:
                            this.normalizeTags(
                                memoryRecord.tags
                            ),

                        occurredAt:
                            Number(
                                timestamp
                            ) ||
                            Date.now(),

                        raw:
                            memoryRecord,

                        linked:
                            memoryRecord

                    };

                }
            );

    },


    /* =====================================================
       DEDUPLICATION
    ===================================================== */

    getDeduplicationKey(item){

        if(!item){

            return null;

        }


        if(
            item.source ===
                "evolution" &&
            item.sourceId
        ){

            return `evolution:${item.sourceId}`;

        }


        if(
            item.source ===
                "memory" &&
            item.sourceId
        ){

            return `memory:${item.sourceId}`;

        }


        if(
            item.source ===
                "system" &&
            item.sourceId
        ){

            return `system:${item.sourceId}`;

        }


        return (
            item.id ||
            null
        );

    },


    deduplicate(items){

        const map =
            new Map();


        (
            Array.isArray(
                items
            )
                ? items
                : []
        )
            .forEach(
                item => {

                    if(!item){

                        return;

                    }


                    const key =
                        this.getDeduplicationKey(
                            item
                        );


                    if(!key){

                        return;

                    }


                    const existing =
                        map.get(
                            key
                        );


                    if(!existing){

                        map.set(
                            key,
                            item
                        );


                        return;

                    }


                    const existingDescription =
                        String(
                            existing.description ||
                            ""
                        );


                    const incomingDescription =
                        String(
                            item.description ||
                            ""
                        );


                    const description =
                        incomingDescription.length >
                            existingDescription.length
                            ? incomingDescription
                            : existingDescription;


                    const timestamp =
                        Math.max(
                            this.getTimestamp(
                                existing
                            ),
                            this.getTimestamp(
                                item
                            )
                        );


                    map.set(
                        key,
                        {
                            ...existing,
                            ...item,

                            title:
                                item.title ||
                                existing.title,

                            description,

                            tags:
                                this.normalizeTags([
                                    ...(
                                        existing.tags ||
                                        []
                                    ),
                                    ...(
                                        item.tags ||
                                        []
                                    )
                                ]),

                            occurredAt:
                                timestamp ||
                                item.occurredAt ||
                                existing.occurredAt
                        }
                    );

                }
            );


        return [
            ...map.values()
        ];

    },


    /* =====================================================
       RAW UNIFIED STREAM
    ===================================================== */

    getAllUnifiedItems(entity){

        return this.deduplicate([
            ...this.getTimelineItems(
                entity
            ),
            ...this.getEvolutionItems(
                entity
            ),
            ...this.getMemoryItems(
                entity
            )
        ])
            .sort(
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
       UNIFIED STREAM
    ===================================================== */

    getUnifiedItems(entity){

        let items =
            this.getAllUnifiedItems(
                entity
            );


        if(
            this.activeFilter !==
                "all"
        ){

            items =
                items.filter(
                    item =>
                        item.source ===
                            this.activeFilter
                );

        }


        const query =
            String(
                this.searchQuery ||
                ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        if(query){

            items =
                items.filter(
                    item => {

                        const haystack = [

                            item.title,
                            item.description,
                            item.type,
                            item.category,
                            item.source,

                            ...(
                                item.tags ||
                                []
                            )

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


        return items.slice(
            0,
            Math.max(
                1,
                Number(
                    this.visibleLimit
                ) ||
                40
            )
        );

    },


    /* =====================================================
       STATS
    ===================================================== */

    getStats(entity){

        const items =
            this.getAllUnifiedItems(
                entity
            );


        return {

            total:
                items.length,

            evolution:
                items.filter(
                    item =>
                        item.source ===
                            "evolution"
                ).length,

            memory:
                items.filter(
                    item =>
                        item.source ===
                            "memory"
                ).length,

            system:
                items.filter(
                    item =>
                        item.source ===
                            "system"
                ).length,

            timeline:
                items.filter(
                    item =>
                        item.source ===
                            "timeline"
                ).length

        };

    },


    /* =====================================================
       GROUP BY DAY
    ===================================================== */

    groupByDay(items){

        const groups =
            [];

        const map =
            new Map();


        (
            Array.isArray(
                items
            )
                ? items
                : []
        )
            .forEach(
                item => {

                    const timestamp =
                        this.getTimestamp(
                            item
                        );


                    const key =
                        this.getDayKey(
                            timestamp
                        );


                    let group =
                        map.get(
                            key
                        );


                    if(!group){

                        group = {

                            key,

                            label:
                                this.formatDay(
                                    timestamp
                                ),

                            timestamp,

                            items:[]

                        };


                        map.set(
                            key,
                            group
                        );


                        groups.push(
                            group
                        );

                    }


                    group.items.push(
                        item
                    );

                }
            );


        return groups;

    },

   /* =====================================================
       ITEM CARD
    ===================================================== */

    renderItem(item){

        const description =
            String(
                item.description ||
                ""
            );


        const preview =
            description.length >
                150
                ? `${description
                    .slice(
                        0,
                        150
                    )
                    .trim()}…`
                : description;


        return `
            <button
                type="button"
                class="
                    timeline-stream-item
                    timeline-source-${this.escapeHTML(
                        item.source
                    )}
                "
                data-timeline-action="open"
                data-timeline-id="${this.escapeHTML(
                    item.id
                )}"
            >

                <span
                    class="timeline-stream-marker"
                    aria-hidden="true"
                >
                    ${this.escapeHTML(
                        this.sourceIcon(
                            item.source
                        )
                    )}
                </span>


                <span class="timeline-stream-content">

                    <span class="timeline-stream-meta">

                        <small class="timeline-source-label">
                            ${this.escapeHTML(
                                this.sourceLabel(
                                    item.source
                                )
                            )}
                        </small>


                        <small>
                            ${this.escapeHTML(
                                this.formatDate(
                                    item.occurredAt
                                )
                            )}
                        </small>

                    </span>


                    <strong>
                        ${this.escapeHTML(
                            item.title
                        )}
                    </strong>


                    ${
                        preview
                            ? `
                                <span class="timeline-stream-description">
                                    ${this.escapeHTML(
                                        preview
                                    )}
                                </span>
                              `
                            : ""
                    }


                    <span class="timeline-stream-footer">

                        <small>
                            ${this.escapeHTML(
                                this.importanceLabel(
                                    item.importance
                                )
                            )}
                        </small>


                        ${
                            item.category
                                ? `
                                    <small>
                                        ${this.escapeHTML(
                                            item.category
                                        )}
                                    </small>
                                  `
                                : ""
                        }


                        ${
                            Array.isArray(
                                item.tags
                            ) &&
                            item.tags.length
                                ? `
                                    <small>
                                        ${this.escapeHTML(
                                            item.tags
                                                .slice(
                                                    0,
                                                    2
                                                )
                                                .join(
                                                    " · "
                                                )
                                        )}
                                    </small>
                                  `
                                : ""
                        }

                    </span>

                </span>


                <span
                    class="timeline-stream-arrow"
                    aria-hidden="true"
                >
                    →
                </span>

            </button>
        `;

    },


    /* =====================================================
       GROUP
    ===================================================== */

    renderGroup(group){

        return `
            <section class="timeline-day-group">

                <div class="timeline-day-heading">

                    <span></span>

                    <strong>
                        ${this.escapeHTML(
                            group.label
                        )}
                    </strong>

                    <small>
                        ${group.items.length}
                        olay
                    </small>

                </div>


                <div class="timeline-day-items">

                    ${group.items
                        .map(
                            item =>
                                this.renderItem(
                                    item
                                )
                        )
                        .join("")}

                </div>

            </section>
        `;

    },


    /* =====================================================
       FILTERS
    ===================================================== */

    getAllowedFilters(){

        return [
            "all",
            "evolution",
            "memory",
            "system",
            "timeline"
        ];

    },


    renderToolbar(){

        const filters = [

            {
                id:
                    "all",

                label:
                    "Tümü"
            },

            {
                id:
                    "evolution",

                label:
                    "Evolution"
            },

            {
                id:
                    "memory",

                label:
                    "Memory"
            },

            {
                id:
                    "system",

                label:
                    "System"
            },

            {
                id:
                    "timeline",

                label:
                    "Timeline"
            }

        ];


        return `
            <div class="timeline-toolbar">

                <label class="timeline-search">

                    <span aria-hidden="true">
                        ⌕
                    </span>


                    <input
                        id="timelineSearchInput"
                        type="search"
                        autocomplete="off"
                        placeholder="Yaşam akışında ara"
                        value="${this.escapeHTML(
                            this.searchQuery
                        )}"
                    >

                </label>


                <div class="timeline-filter-row">

                    ${filters
                        .map(
                            filter => `
                                <button
                                    type="button"
                                    class="timeline-filter-btn ${
                                        this.activeFilter ===
                                            filter.id
                                            ? "is-active"
                                            : ""
                                    }"
                                    data-timeline-action="filter"
                                    data-timeline-filter="${this.escapeHTML(
                                        filter.id
                                    )}"
                                >
                                    ${this.escapeHTML(
                                        filter.label
                                    )}
                                </button>
                            `
                        )
                        .join("")}

                </div>

            </div>
        `;

    },


    /* =====================================================
       DETAIL
    ===================================================== */

    findVisibleItem(
        entity,
        itemId
    ){

        const id =
            String(
                itemId ||
                ""
            );


        if(!id){

            return null;

        }


        return (
            this.getAllUnifiedItems(
                entity
            )
                .find(
                    item =>
                        item.id ===
                            id
                ) ||
            null
        );

    },


    renderDetail(item){

        if(!item){

            return "";

        }


        return `
            <div class="timeline-detail-layer">

                <div
                    class="timeline-detail-backdrop"
                    data-timeline-action="close"
                ></div>


                <section
                    class="timeline-detail"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Timeline olayı"
                >

                    <header class="timeline-detail-header">

                        <div>

                            <span class="engine-section-label">
                                ${this.escapeHTML(
                                    this.sourceLabel(
                                        item.source
                                    )
                                )}
                            </span>


                            <h2>
                                ${this.escapeHTML(
                                    item.title
                                )}
                            </h2>

                        </div>


                        <button
                            type="button"
                            class="engine-icon-btn"
                            data-timeline-action="close"
                            aria-label="Kapat"
                        >
                            ×
                        </button>

                    </header>


                    <div class="timeline-detail-scroll">

                        ${
                            item.description
                                ? `
                                    <p class="timeline-detail-description">
                                        ${this.escapeHTML(
                                            item.description
                                        )}
                                    </p>
                                  `
                                : `
                                    <p class="timeline-detail-description">
                                        Bu olay için ek açıklama bulunmuyor.
                                    </p>
                                  `
                        }


                        <div class="timeline-detail-info">

                            <div>

                                <span>
                                    Kaynak
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        this.sourceLabel(
                                            item.source
                                        )
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Tarih
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        this.formatDate(
                                            item.occurredAt
                                        )
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Önem
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        this.importanceLabel(
                                            item.importance
                                        )
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Tür
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        item.type ||
                                        "event"
                                    )}
                                </strong>

                            </div>


                            ${
                                item.category
                                    ? `
                                        <div>

                                            <span>
                                                Kategori
                                            </span>

                                            <strong>
                                                ${this.escapeHTML(
                                                    item.category
                                                )}
                                            </strong>

                                        </div>
                                      `
                                    : ""
                            }

                        </div>


                        ${
                            item.tags?.length
                                ? `
                                    <div class="timeline-detail-tags">

                                        ${item.tags
                                            .map(
                                                tag => `
                                                    <span>
                                                        ${this.escapeHTML(
                                                            tag
                                                        )}
                                                    </span>
                                                `
                                            )
                                            .join("")}

                                    </div>
                                  `
                                : ""
                        }

                    </div>


                    <footer class="timeline-detail-actions">

                        ${
                            item.source ===
                                "evolution" &&
                            item.sourceId
                                ? `
                                    <button
                                        type="button"
                                        class="primary-btn"
                                        data-timeline-action="source:evolution"
                                        data-source-id="${this.escapeHTML(
                                            item.sourceId
                                        )}"
                                    >
                                        Evolution’da Aç
                                    </button>
                                  `
                                : ""
                        }


                        ${
                            item.source ===
                                "memory" &&
                            item.sourceId
                                ? `
                                    <button
                                        type="button"
                                        class="primary-btn"
                                        data-timeline-action="source:memory"
                                        data-source-id="${this.escapeHTML(
                                            item.sourceId
                                        )}"
                                    >
                                        Memory’de Aç
                                    </button>
                                  `
                                : ""
                        }


                        <button
                            type="button"
                            class="secondary-btn"
                            data-timeline-action="close"
                        >
                            Kapat
                        </button>

                    </footer>

                </section>

            </div>
        `;

    },


    /* =====================================================
       EMPTY
    ===================================================== */

    renderEmptyState(){

        return `
            <div class="section timeline-empty">

                <span
                    class="timeline-empty-icon"
                    aria-hidden="true"
                >
                    ◷
                </span>


                <h3>
                    ${
                        this.searchQuery ||
                        this.activeFilter !==
                            "all"
                            ? "Eşleşen olay bulunamadı"
                            : "Timeline henüz sessiz"
                    }
                </h3>


                <p>
                    ${
                        this.searchQuery ||
                        this.activeFilter !==
                            "all"
                            ? "Arama veya filtreyi değiştirerek tekrar deneyebilirsin."
                            : "Memory, Evolution ve Engine olayları oluştukça burada tek bir yaşam akışında birleşecek."
                    }
                </p>

            </div>
        `;

    },


    /* =====================================================
       UI FALLBACKS
    ===================================================== */

    renderAppHeader(entity){

        if(
            window.UI &&
            typeof UI.appHeader ===
                "function"
        ){

            return UI.appHeader(
                this.escapeHTML(
                    entity.name ||
                    "VAERO Varlığı"
                ),
                "TIMELINE",
                "◷"
            );

        }


        return `
            <header class="engine-app-header">

                <span class="engine-section-label">
                    TIMELINE
                </span>

                <h1>
                    ${this.escapeHTML(
                        entity.name ||
                        "VAERO Varlığı"
                    )}
                </h1>

            </header>
        `;

    },


    renderBrainPanel(){

        try{

            return (
                window.UI
                    ?.brainPanel?.() ||
                ""
            );

        } catch(error){

            return "";

        }

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(entity){

        if(!entity){

            return `
                <section class="engine-page">

                    <div class="section engine-error-state">

                        <h1>
                            Timeline açılamadı
                        </h1>

                        <p>
                            Bu varlığın zaman bağlamı bulunamadı.
                        </p>

                    </div>

                </section>
            `;

        }


        this.enterBrainContext(
            entity
        );


        this.cleanOrphans();


        if(
            !this.getAllowedFilters()
                .includes(
                    this.activeFilter
                )
        ){

            this.activeFilter =
                "all";

        }


        const items =
            this.getUnifiedItems(
                entity
            );


        const groups =
            this.groupByDay(
                items
            );


        const stats =
            this.getStats(
                entity
            );


        let selected =
            this.selectedItemId
                ? this.findVisibleItem(
                    entity,
                    this.selectedItemId
                )
                : null;


        if(
            this.selectedItemId &&
            !selected
        ){

            this.selectedItemId =
                null;


            selected =
                null;

        }


        return `
            <section class="engine-page timeline-app-page">

                <div class="timeline-app-shell">

                    <div class="engine-page-toolbar">

                        <button
                            type="button"
                            class="engine-back-btn"
                            data-action="entity:dashboard"
                        >
                            ← Varlığa Dön
                        </button>

                    </div>


                    ${this.renderAppHeader(
                        entity
                    )}


                    <section class="timeline-app-intro">

                        <div>

                            <span class="engine-section-label">
                                LIVING TIMELINE
                            </span>


                            <h2>
                                Yaşam akışı
                            </h2>


                            <p>
                                Memory, Evolution ve Engine olaylarının zaman içinde oluşturduğu birleşik akış.
                            </p>

                        </div>


                        <div class="timeline-stats">

                            <div>

                                <strong>
                                    ${stats.total}
                                </strong>

                                <span>
                                    Toplam
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${stats.evolution}
                                </strong>

                                <span>
                                    Evolution
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${stats.memory}
                                </strong>

                                <span>
                                    Memory
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${stats.system}
                                </strong>

                                <span>
                                    System
                                </span>

                            </div>

                        </div>

                    </section>


                    ${this.renderToolbar()}


                    <div class="timeline-stream-scroll">

                        ${
                            groups.length
                                ? `
                                    <div class="timeline-stream">

                                        ${groups
                                            .map(
                                                group =>
                                                    this.renderGroup(
                                                        group
                                                    )
                                            )
                                            .join("")}

                                    </div>
                                  `
                                : this.renderEmptyState()
                        }

                    </div>


                    ${this.renderBrainPanel()}

                </div>


                ${
                    selected
                        ? this.renderDetail(
                            selected
                        )
                        : ""
                }

            </section>
        `;

    },


    /* =====================================================
       SOURCE NAVIGATION
    ===================================================== */

    openEvolutionSource(
        sourceId
    ){

        if(!sourceId){

            return false;

        }


        this.selectedItemId =
            null;


        try{

            if(
                window.EvolutionApp &&
                typeof window.EvolutionApp
                    .selectEvent ===
                    "function"
            ){

                window.EvolutionApp
                    .selectEvent(
                        sourceId
                    );

            }

            else if(
                window.EvolutionApp &&
                "selectedEventId" in
                    window.EvolutionApp
            ){

                window.EvolutionApp
                    .selectedEventId =
                    sourceId;

            }

        } catch(error){

            console.warn(
                "Evolution olayı seçilemedi:",
                error
            );

        }


        if(
            window.Actions &&
            typeof window.Actions
                .openEntityPage ===
                "function"
        ){

            return window.Actions
                .openEntityPage(
                    "evolution"
                );

        }


        return false;

    },


    openMemorySource(
        sourceId
    ){

        if(!sourceId){

            return false;

        }


        this.selectedItemId =
            null;


        try{

            if(
                window.MemoryApp
            ){

                window.MemoryApp
                    .selectedMemoryId =
                    sourceId;


                window.MemoryApp
                    .editorMode =
                    null;

            }

        } catch(error){

            console.warn(
                "Memory kaydı seçilemedi:",
                error
            );

        }


        if(
            window.Actions &&
            typeof window.Actions
                .openEntityPage ===
                "function"
        ){

            return window.Actions
                .openEntityPage(
                    "memory"
                );

        }


        return false;

    },


    /* =====================================================
       COMMANDS
    ===================================================== */

    handleCommand(
        action,
        button
    ){

        const entity =
            this.getCurrentEntity();


        if(!entity){

            return false;

        }


        switch(action){

            case "open":{

                const itemId =
                    button?.dataset
                        ?.timelineId ||
                    null;


                if(
                    !this.findVisibleItem(
                        entity,
                        itemId
                    )
                ){

                    return false;

                }


                this.selectedItemId =
                    itemId;


                return this.remount();

            }


            case "close":

                this.selectedItemId =
                    null;


                return this.remount();


            case "filter":{

                const filter =
                    String(
                        button?.dataset
                            ?.timelineFilter ||
                        "all"
                    );


                this.activeFilter =
                    this.getAllowedFilters()
                        .includes(
                            filter
                        )
                            ? filter
                            : "all";


                this.selectedItemId =
                    null;


                return this.remount();

            }


            case "source:evolution":

                return this.openEvolutionSource(
                    button?.dataset
                        ?.sourceId ||
                    null
                );


            case "source:memory":

                return this.openMemorySource(
                    button?.dataset
                        ?.sourceId ||
                    null
                );


            default:

                return false;

        }

    }

};


/* =========================================================
   TIMELINE CLICK DELEGATION
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-timeline-action]"
            );


        if(!button){

            return;

        }


        event.preventDefault();


        TimelineApp.handleCommand(
            button.dataset
                .timelineAction,
            button
        );

    }
);


/* =========================================================
   TIMELINE SEARCH
========================================================= */

document.addEventListener(
    "input",
    event => {

        if(
            event.target.id !==
                "timelineSearchInput"
        ){

            return;

        }


        TimelineApp.searchQuery =
            String(
                event.target.value ||
                ""
            );


        clearTimeout(
            TimelineApp.searchTimer
        );


        TimelineApp.searchTimer =
            setTimeout(
                () => {

                    TimelineApp.selectedItemId =
                        null;


                    TimelineApp.remount();

                },
                120
            );

    }
);


/* =========================================================
   REGISTER
========================================================= */

try{

    VAERO?.register?.(
        "timelineApp",
        TimelineApp
    );

} catch(error){

    /* global remains available */

}


window.TimelineApp =
    TimelineApp;
