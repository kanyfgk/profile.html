/* =========================================================
   VAERO TIMELINE APP
   Unified Entity Life Stream
   Timeline + Evolution + Memory
========================================================= */

const TimelineApp = {

    version:
        "3.0.0",

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


    /* =====================================================
       SAFETY
    ===================================================== */

    escapeHTML(value){

        try{

            if(
                typeof window !==
                    "undefined" &&
                window.UI &&
                typeof window.UI.escapeHTML ===
                    "function"
            ){

                return window.UI.escapeHTML(
                    value
                );

            }

        } catch(error){

            /* local fallback */

        }


        return String(
            value ??
                ""
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


        if(
            typeof window !==
                "undefined"
        ){

            return (
                window.Engine ||
                null
            );

        }


        return null;

    },


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


        if(!entity){

            return false;

        }


        try{

            return (
                engine.mount(
                    entity
                ) !==
                false
            );

        } catch(error){

            console.warn(
                "Timeline remount başarısız:",
                error
            );


            return false;

        }

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


            if(
                !awareness ||
                typeof awareness.enter !==
                    "function"
            ){

                return false;

            }


            awareness.enter(
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
                        ),

                    source:
                        "timeline-app"

                }
            );


            return true;

        } catch(error){

            console.warn(
                "Timeline Brain context açılamadı:",
                error
            );


            return false;

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


    getEvolutionCore(){

        return this.getService(
            "evolution"
        );

    },


    getMemoryCore(){

        return (
            this.getService(
                "memorySystem"
            ) ||
            this.getService(
                "memory"
            ) ||
            null
        );

    },


    /* =====================================================
       TIME
    ===================================================== */

    getTimestamp(item){

        const candidates = [

            item?.occurredAt,
            item?.updatedAt,
            item?.createdAt,
            item?.timestamp,
            item?.time

        ];


        for(
            const candidate of
                candidates
        ){

            const value =
                Number(
                    candidate
                );


            if(
                Number.isFinite(
                    value
                ) &&
                value >
                    0
            ){

                return value;

            }

        }


        return 0;

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

        ].join(
            "-"
        );

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
                        item ??
                            ""
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
            labels[
                source
            ] ||
            String(
                source ||
                    "Timeline"
            )
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
            icons[
                source
            ] ||
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


        if(!item){

            return false;

        }


        const candidates = [

            item.entityId,
            item.relatedEntityId,
            item.payload?.entityId,
            item.payload?.relatedEntityId,
            item.context?.entityId

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


        /*
         * Global/system events without an Entity binding can
         * still appear in the unified life stream.
         */

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


        if(!timeline){

            return [];

        }


        let records =
            [];


        try{

            /*
             * Prefer the Entity-aware API from Timeline Core.
             */

            if(
                entity?.id &&
                typeof timeline.forEntity ===
                    "function"
            ){

                const result =
                    timeline.forEntity(
                        entity.id
                    );


                records =
                    Array.isArray(
                        result
                    )
                        ? result
                        : [];

            }
            else if(
                typeof timeline.all ===
                    "function"
            ){

                const result =
                    timeline.all();


                records =
                    Array.isArray(
                        result
                    )
                        ? result
                        : [];

            }

        } catch(error){

            console.warn(
                "Timeline kayıtları okunamadı:",
                error
            );


            return [];

        }


        return records
            .filter(
                Boolean
            )
            .filter(
                item =>
                    this.belongsToEntity(
                        item,
                        entity?.id
                    )
            )
            .map(
                item => {

                    const source =
                        this.normalizeSource(
                            item.source ||
                            item.payload?.source ||
                            "timeline"
                        );


                    const timestamp =
                        this.getTimestamp(
                            item
                        );


                    const rawId =
                        item.id ||
                        null;


                    const sourceId =
                        item.sourceId ||
                        item.sourceRef?.id ||
                        rawId ||
                        null;


                    const fallbackId =
                        `${source}:${timestamp}:${String(
                            item.title ||
                            item.description ||
                            item.type ||
                            "event"
                        ).slice(
                            0,
                            60
                        )}`;


                    return {

                        id:
                            `timeline:${
                                rawId ||
                                fallbackId
                            }`,

                        rawId,

                        source,

                        sourceId,

                        entityId:
                            item.entityId ||
                            item.relatedEntityId ||
                            item.payload?.entityId ||
                            item.payload
                                ?.relatedEntityId ||
                            null,

                        worldId:
                            item.worldId ||
                            item.relatedWorldId ||
                            item.payload?.worldId ||
                            item.payload
                                ?.relatedWorldId ||
                            null,

                        title:
                            String(
                                item.title ||
                                item.description ||
                                "Timeline Olayı"
                            ).trim(),

                        description:
                            String(
                                item.description ||
                                item.content ||
                                ""
                            ).trim(),

                        importance:
                            this.normalizeImportance(
                                item.importance ||
                                item.payload
                                    ?.importance
                            ),

                        type:
                            item.type ||
                            "timeline-event",

                        category:
                            item.category ||
                            null,

                        tags:
                            this.normalizeTags(
                                item.tags
                            ),

                        occurredAt:
                            timestamp,

                        raw:
                            item,

                        linked:
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
            this.getEvolutionCore();


        if(!evolution){

            return [];

        }


        let events =
            [];


        try{

            if(
                entity?.id &&
                typeof evolution.forEntity ===
                    "function"
            ){

                const result =
                    evolution.forEntity(
                        entity.id
                    );


                events =
                    Array.isArray(
                        result
                    )
                        ? result
                        : [];

            }
            else if(
                typeof evolution.all ===
                    "function"
            ){

                const result =
                    evolution.all();


                events =
                    Array.isArray(
                        result
                    )
                        ? result
                        : [];

            }

        } catch(error){

            console.warn(
                "Evolution Timeline verisi okunamadı:",
                error
            );


            return [];

        }


        return events
            .filter(
                Boolean
            )
            .filter(
                event =>
                    event.type !==
                        "runtime:tick"
            )
            .filter(
                event =>
                    event.archived !==
                        true
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
                        this.getTimestamp(
                            event
                        );


                    const rawId =
                        event.id ||
                        null;


                    const fallbackId =
                        `${timestamp}:${String(
                            event.title ||
                            event.description ||
                            event.type ||
                            "event"
                        ).slice(
                            0,
                            60
                        )}`;


                    return {

                        id:
                            `evolution:${
                                rawId ||
                                fallbackId
                            }`,

                        rawId,

                        source:
                            "evolution",

                        sourceId:
                            rawId,

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
                            timestamp,

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


        const memory =
            this.getMemoryCore();


        if(!memory){

            return [];

        }


        try{

            if(
                typeof memory.forEntity ===
                    "function"
            ){

                const records =
                    memory.forEntity(
                        entity.id
                    );


                return Array.isArray(
                    records
                )
                    ? records
                    : [];

            }


            if(
                typeof memory.all ===
                    "function"
            ){

                const records =
                    memory.all();


                if(
                    !Array.isArray(
                        records
                    )
                ){

                    return [];

                }


                return records.filter(
                    record =>
                        this.belongsToEntity(
                            record,
                            entity.id
                        )
                );

            }

        } catch(error){

            console.warn(
                "Memory Core Timeline verisi okunamadı:",
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
            .filter(
                Boolean
            )
            .filter(
                memoryRecord =>
                    memoryRecord.archived !==
                        true
            )
            .filter(
                memoryRecord => {

                    /*
                     * Evolution-backed life events are already
                     * represented by Evolution/Timeline.
                     */

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
                        this.getTimestamp(
                            memoryRecord
                        );


                    const source =
                        memoryRecord.source ===
                            "system"
                            ? "system"
                            : "memory";


                    const rawId =
                        memoryRecord.id ||
                        null;


                    const fallbackId =
                        `${timestamp}:${String(
                            memoryRecord.title ||
                            memoryRecord.type ||
                            "memory"
                        ).slice(
                            0,
                            60
                        )}`;


                    return {

                        id:
                            `memory:${
                                rawId ||
                                fallbackId
                            }`,

                        rawId,

                        source,

                        sourceId:
                            rawId,

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
                            this.normalizeImportance(
                                memoryRecord.importance ||
                                (
                                    memoryRecord.important ===
                                        true
                                        ? "high"
                                        : "low"
                                )
                            ),

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
                            timestamp,

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


        const source =
            this.normalizeSource(
                item.source
            );


        const sourceId =
            item.sourceId ||
            null;


        /*
         * Timeline Core may already contain a projection of
         * an Evolution or Memory record.
         *
         * When that source reference exists, both projections
         * must collapse into one life-stream item.
         */

        if(sourceId){

            if(
                source ===
                    "evolution"
            ){

                return `evolution:${String(
                    sourceId
                )}`;

            }


            if(
                source ===
                    "memory"
            ){

                return `memory:${String(
                    sourceId
                )}`;

            }


            if(
                source ===
                    "system"
            ){

                return `system:${String(
                    sourceId
                )}`;

            }


            return `timeline:${String(
                sourceId
            )}`;

        }


        if(item.rawId){

            return `${source}:${String(
                item.rawId
            )}`;

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


                    /*
                     * Prefer the richer source object while
                     * retaining stable unified identity.
                     */

                    const preferred =
                        this.getItemRichness(
                            item
                        ) >=
                        this.getItemRichness(
                            existing
                        )
                            ? item
                            : existing;


                    const secondary =
                        preferred ===
                            item
                            ? existing
                            : item;


                    map.set(
                        key,
                        {

                            ...secondary,

                            ...preferred,

                            id:
                                existing.id ||
                                item.id ||
                                key,

                            rawId:
                                preferred.rawId ||
                                secondary.rawId ||
                                null,

                            sourceId:
                                preferred.sourceId ||
                                secondary.sourceId ||
                                null,

                            entityId:
                                preferred.entityId ||
                                secondary.entityId ||
                                null,

                            worldId:
                                preferred.worldId ||
                                secondary.worldId ||
                                null,

                            title:
                                preferred.title ||
                                secondary.title ||
                                "Timeline Olayı",

                            description,

                            importance:
                                this.getHigherImportance(
                                    existing.importance,
                                    item.importance
                                ),

                            category:
                                preferred.category ||
                                secondary.category ||
                                null,

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
                                preferred.occurredAt ||
                                secondary.occurredAt ||
                                0,

                            linked:
                                preferred.linked ||
                                secondary.linked ||
                                null

                        }
                    );

                }
            );


        return [
            ...map.values()
        ];

    },


    getItemRichness(item){

        if(!item){

            return 0;

        }


        let score =
            0;


        if(item.sourceId){

            score +=
                4;

        }


        if(item.rawId){

            score +=
                2;

        }


        if(item.title){

            score +=
                2;

        }


        if(item.description){

            score +=
                Math.min(
                    5,
                    Math.ceil(
                        String(
                            item.description
                        ).length /
                        80
                    )
                );

        }


        if(item.category){

            score +=
                1;

        }


        if(
            Array.isArray(
                item.tags
            )
        ){

            score +=
                Math.min(
                    3,
                    item.tags.length
                );

        }


        if(item.linked){

            score +=
                3;

        }


        return score;

    },


    getHigherImportance(
        first,
        second
    ){

        const levels = {

            low:
                1,

            medium:
                2,

            high:
                3,

            critical:
                4

        };


        const firstNormalized =
            this.normalizeImportance(
                first
            );


        const secondNormalized =
            this.normalizeImportance(
                second
            );


        return (
            levels[
                secondNormalized
            ] >
            levels[
                firstNormalized
            ]
                ? secondNormalized
                : firstNormalized
        );

    },


    /* =====================================================
       RAW UNIFIED STREAM
    ===================================================== */

    getAllUnifiedItems(entity){

        const combined = [

            ...this.getTimelineItems(
                entity
            ),

            ...this.getEvolutionItems(
                entity
            ),

            ...this.getMemoryItems(
                entity
            )

        ];


        return this
            .deduplicate(
                combined
            )
            .sort(
                (
                    a,
                    b
                ) => {

                    const difference =
                        this.getTimestamp(
                            b
                        ) -
                        this.getTimestamp(
                            a
                        );


                    if(
                        difference !==
                            0
                    ){

                        return difference;

                    }


                    return String(
                        a.id ||
                            ""
                    ).localeCompare(
                        String(
                            b.id ||
                                ""
                        )
                    );

                }
            );

    },


    /* =====================================================
       SEARCH NORMALIZATION
    ===================================================== */

    normalizeSearch(value){

        return String(
            value ??
                ""
        )
            .toLocaleLowerCase(
                "tr-TR"
            )
            .trim()
            .replace(
                /\s+/g,
                " "
            );

    },


    itemMatchesSearch(
        item,
        query
    ){

        if(!query){

            return true;

        }


        if(!item){

            return false;

        }


        const haystack =
            this.normalizeSearch(
                [

                    item.title,
                    item.description,
                    item.type,
                    item.category,
                    item.source,

                    ...(
                        Array.isArray(
                            item.tags
                        )
                            ? item.tags
                            : []
                    )

                ]
                    .filter(
                        value =>
                            value !==
                                null &&
                            value !==
                                undefined
                    )
                    .join(
                        " "
                    )
            );


        return haystack.includes(
            query
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


        const allowedFilters =
            this.getAllowedFilters();


        const filter =
            allowedFilters.includes(
                this.activeFilter
            )
                ? this.activeFilter
                : "all";


        if(
            filter !==
                "all"
        ){

            items =
                items.filter(
                    item =>
                        item.source ===
                            filter
                );

        }


        const query =
            this.normalizeSearch(
                this.searchQuery
            );


        if(query){

            items =
                items.filter(
                    item =>
                        this.itemMatchesSearch(
                            item,
                            query
                        )
                );

        }


        const limit =
            Math.max(
                1,
                Math.min(
                    500,
                    Number(
                        this.visibleLimit
                    ) ||
                    40
                )
            );


        return items.slice(
            0,
            limit
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


        const stats = {

            total:
                items.length,

            evolution:
                0,

            memory:
                0,

            system:
                0,

            timeline:
                0

        };


        items.forEach(
            item => {

                const source =
                    this.normalizeSource(
                        item?.source
                    );


                if(
                    Object.prototype
                        .hasOwnProperty.call(
                            stats,
                            source
                        )
                ){

                    stats[
                        source
                    ] +=
                        1;

                }

            }
        );


        return stats;

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

                            items:
                                []

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

        if(!item){

            return "";

        }


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


        const source =
            this.normalizeSource(
                item.source
            );


        const tags =
            Array.isArray(
                item.tags
            )
                ? item.tags
                    .slice(
                        0,
                        2
                    )
                : [];


        return `
            <button
                type="button"
                class="
                    timeline-stream-item
                    timeline-source-${this.escapeHTML(
                        source
                    )}
                "
                data-timeline-action="open"
                data-timeline-id="${this.escapeHTML(
                    item.id
                )}"
                aria-label="${this.escapeHTML(
                    `${item.title || "Timeline olayı"} ayrıntılarını aç`
                )}"
            >

                <span
                    class="timeline-stream-marker"
                    aria-hidden="true"
                >
                    ${this.escapeHTML(
                        this.sourceIcon(
                            source
                        )
                    )}
                </span>

                <span class="timeline-stream-content">

                    <span class="timeline-stream-meta">

                        <small class="timeline-source-label">
                            ${this.escapeHTML(
                                this.sourceLabel(
                                    source
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
                            item.title ||
                            "Timeline Olayı"
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
                            tags.length >
                                0
                                ? `
                                    <small>
                                        ${this.escapeHTML(
                                            tags.join(
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

        if(
            !group ||
            !Array.isArray(
                group.items
            )
        ){

            return "";

        }


        return `
            <section
                class="timeline-day-group"
                data-timeline-day="${this.escapeHTML(
                    group.key ||
                    ""
                )}"
            >

                <div class="timeline-day-heading">

                    <span aria-hidden="true"></span>

                    <strong>
                        ${this.escapeHTML(
                            group.label ||
                            "Tarih bilinmiyor"
                        )}
                    </strong>

                    <small>
                        ${group.items.length} olay
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
                        .join(
                            ""
                        )}

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


    setFilter(filter){

        const normalized =
            String(
                filter ||
                    "all"
            )
                .trim()
                .toLowerCase();


        this.activeFilter =
            this.getAllowedFilters()
                .includes(
                    normalized
                )
                ? normalized
                : "all";


        this.selectedItemId =
            null;


        return this.activeFilter;

    },


    setSearchQuery(value){

        this.searchQuery =
            String(
                value ??
                    ""
            )
                .slice(
                    0,
                    500
                );


        this.selectedItemId =
            null;


        return this.searchQuery;

    },


    resetFilters(){

        this.searchQuery =
            "";


        this.activeFilter =
            "all";


        this.selectedItemId =
            null;


        this.visibleLimit =
            40;


        return true;

    },


    /* =====================================================
       TOOLBAR
    ===================================================== */

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
                        enterkeyhint="search"
                        aria-label="Yaşam akışında ara"
                        placeholder="Yaşam akışında ara"
                        value="${this.escapeHTML(
                            this.searchQuery
                        )}"
                    >

                </label>

                <div
                    class="timeline-filter-row"
                    role="group"
                    aria-label="Timeline filtreleri"
                >

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
                                    aria-pressed="${
                                        this.activeFilter ===
                                            filter.id
                                            ? "true"
                                            : "false"
                                    }"
                                >
                                    ${this.escapeHTML(
                                        filter.label
                                    )}
                                </button>
                            `
                        )
                        .join(
                            ""
                        )}

                </div>

            </div>
        `;

    },


    /* =====================================================
       FIND ITEM
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
                        String(
                            item.id
                        ) ===
                        id
                ) ||
            null
        );

    },


    /* =====================================================
       CONTINUE IN PART 3
    ===================================================== */

   /* =====================================================
       DETAIL
    ===================================================== */

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
                    aria-labelledby="timelineDetailTitle"
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

                            <h2 id="timelineDetailTitle">
                                ${this.escapeHTML(
                                    item.title ||
                                    "Timeline Olayı"
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
                            Array.isArray(
                                item.tags
                            ) &&
                            item.tags.length >
                                0
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
                                            .join(
                                                ""
                                            )}

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

        const filtered =
            Boolean(
                this.searchQuery
            ) ||
            this.activeFilter !==
                "all";


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
                        filtered
                            ? "Eşleşen olay bulunamadı"
                            : "Timeline henüz sessiz"
                    }
                </h3>

                <p>
                    ${
                        filtered
                            ? "Arama veya filtreyi değiştirerek tekrar deneyebilirsin."
                            : "Memory, Evolution ve Engine olayları oluştukça burada tek bir yaşam akışında birleşecek."
                    }
                </p>

                ${
                    filtered
                        ? `
                            <button
                                type="button"
                                class="secondary-btn"
                                data-timeline-action="reset"
                            >
                                Filtreleri Temizle
                            </button>
                        `
                        : ""
                }

            </div>
        `;

    },


    /* =====================================================
       UI FALLBACKS
    ===================================================== */

    renderAppHeader(entity){

        try{

            if(
                typeof window !==
                    "undefined" &&
                window.UI &&
                typeof window.UI.appHeader ===
                    "function"
            ){

                const result =
                    window.UI.appHeader(
                        entity?.name ||
                        "VAERO Varlığı",
                        "TIMELINE",
                        "◷"
                    );


                if(
                    typeof result ===
                        "string"
                ){

                    return result;

                }

            }

        } catch(error){

            /* fallback */

        }


        return `
            <header class="engine-app-header">

                <span class="engine-section-label">
                    TIMELINE
                </span>

                <h1>
                    ${this.escapeHTML(
                        entity?.name ||
                        "VAERO Varlığı"
                    )}
                </h1>

            </header>
        `;

    },


    renderBrainPanel(){

        try{

            if(
                typeof window !==
                    "undefined" &&
                window.UI &&
                typeof window.UI.brainPanel ===
                    "function"
            ){

                const result =
                    window.UI.brainPanel();


                return typeof result ===
                    "string"
                    ? result
                    : "";

            }

        } catch(error){

            /* optional */

        }


        return "";

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
                            groups.length >
                                0
                                ? `
                                    <div class="timeline-stream">

                                        ${groups
                                            .map(
                                                group =>
                                                    this.renderGroup(
                                                        group
                                                    )
                                            )
                                            .join(
                                                ""
                                            )}

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
       ACTION BRIDGE
    ===================================================== */

    getActions(){

        if(
            typeof window !==
                "undefined" &&
            window.Actions
        ){

            return window.Actions;

        }


        return (
            this.getService(
                "actions"
            ) ||
            this.getService(
                "actionsV2"
            ) ||
            null
        );

    },


    openEntityPage(page){

        const actions =
            this.getActions();


        if(
            actions &&
            typeof actions.openEntityPage ===
                "function"
        ){

            try{

                return (
                    actions.openEntityPage(
                        page
                    ) !==
                    false
                );

            } catch(error){

                console.warn(
                    `Timeline source page açılamadı: ${page}`,
                    error
                );

            }

        }


        const engine =
            this.getEngine();


        if(
            engine &&
            typeof engine.setView ===
                "function"
        ){

            try{

                return (
                    engine.setView(
                        "entity",
                        {
                            entity:
                                engine.currentOpenedEntity ||
                                engine.currentEntity ||
                                null,

                            page
                        }
                    ) !==
                    false
                );

            } catch(error){

                /* final fallback */

            }

        }


        return false;

    },


    /* =====================================================
       SOURCE NAVIGATION
    ===================================================== */

    openEvolutionSource(sourceId){

        if(!sourceId){

            return false;

        }


        this.selectedItemId =
            null;


        try{

            const evolutionApp =
                (
                    typeof window !==
                        "undefined"
                        ? window.EvolutionApp ||
                          null
                        : null
                ) ||
                this.getService(
                    "evolutionApp"
                );


            if(
                evolutionApp &&
                typeof evolutionApp.selectEvent ===
                    "function"
            ){

                evolutionApp.selectEvent(
                    sourceId
                );

            }
            else if(
                evolutionApp &&
                "selectedEventId" in
                    evolutionApp
            ){

                evolutionApp.selectedEventId =
                    sourceId;

            }

        } catch(error){

            console.warn(
                "Evolution olayı seçilemedi:",
                error
            );

        }


        return this.openEntityPage(
            "evolution"
        );

    },


    openMemorySource(sourceId){

        if(!sourceId){

            return false;

        }


        this.selectedItemId =
            null;


        try{

            const memoryApp =
                (
                    typeof window !==
                        "undefined"
                        ? window.MemoryApp ||
                          null
                        : null
                ) ||
                this.getService(
                    "memoryApp"
                );


            if(memoryApp){

                if(
                    typeof memoryApp.selectMemory ===
                        "function"
                ){

                    memoryApp.selectMemory(
                        sourceId
                    );

                }
                else if(
                    "selectedMemoryId" in
                        memoryApp
                ){

                    memoryApp.selectedMemoryId =
                        sourceId;

                }


                if(
                    "editorMode" in
                        memoryApp
                ){

                    memoryApp.editorMode =
                        null;

                }

            }

        } catch(error){

            console.warn(
                "Memory kaydı seçilemedi:",
                error
            );

        }


        return this.openEntityPage(
            "memory"
        );

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


        const normalizedAction =
            String(
                action ||
                ""
            )
                .trim()
                .toLowerCase();


        switch(
            normalizedAction
        ){

            case "open": {

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


                this.enterBrainContext(
                    entity
                );


                return this.remount();

            }


            case "close":

                this.selectedItemId =
                    null;


                this.enterBrainContext(
                    entity
                );


                return this.remount();


            case "filter": {

                const filter =
                    button?.dataset
                        ?.timelineFilter ||
                    "all";


                this.setFilter(
                    filter
                );


                this.enterBrainContext(
                    entity
                );


                return this.remount();

            }


            case "reset":

                this.resetFilters();


                this.enterBrainContext(
                    entity
                );


                return this.remount();


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

    },


    /* =====================================================
       SEARCH
    ===================================================== */

    handleSearchInput(
    value,
    cursorStart = null,
    cursorEnd = null
){

    this.setSearchQuery(
        value
    );


    if(
        this.searchTimer !==
            null
    ){

        clearTimeout(
            this.searchTimer
        );

    }


    this.searchTimer =
        setTimeout(
            () => {

                this.searchTimer =
                    null;


                const entity =
                    this.getCurrentEntity();


                if(entity){

                    this.enterBrainContext(
                        entity
                    );

                }


                this.remount();


                requestAnimationFrame(
                    () => {

                        const input =
                            document.getElementById(
                                "timelineSearchInput"
                            );


                        if(!input){

                            return;

                        }


                        input.focus({
                            preventScroll:
                                true
                        });


                        if(
                            typeof input.setSelectionRange ===
                                "function"
                        ){

                            const start =
                                Number.isFinite(
                                    cursorStart
                                )
                                    ? cursorStart
                                    : input.value.length;


                            const end =
                                Number.isFinite(
                                    cursorEnd
                                )
                                    ? cursorEnd
                                    : start;


                            input.setSelectionRange(
                                start,
                                end
                            );

                        }

                    }
                );

            },
            120
        );


    return true;

},


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const entity =
            this.getCurrentEntity();


        return {

            version:
                this.version,

            entityId:
                entity?.id ||
                null,

            activeFilter:
                this.activeFilter,

            searchQuery:
                this.searchQuery,

            selectedItemId:
                this.selectedItemId,

            visibleLimit:
                this.visibleLimit,

            counts:
                entity
                    ? this.getStats(
                        entity
                    )
                    : {
                        total:
                            0,

                        evolution:
                            0,

                        memory:
                            0,

                        system:
                            0,

                        timeline:
                            0
                    }

        };

    }

};


/* =========================================================
   TIMELINE CLICK DELEGATION
========================================================= */

if(
    typeof document !==
        "undefined"
){

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target;


            if(
                !target ||
                typeof target.closest !==
                    "function"
            ){

                return;

            }


            const button =
                target.closest(
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


    /* =====================================================
       TIMELINE SEARCH
    ===================================================== */

    document.addEventListener(
        "input",
        event => {

            if(
                event.target?.id !==
                    "timelineSearchInput"
            ){

                return;

            }


            TimelineApp.handleSearchInput(
    event.target.value,
    event.target.selectionStart,
    event.target.selectionEnd
);
        }
    );

}


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
            "timelineApp",
            TimelineApp
        );

    }

} catch(error){

    console.warn(
        "TimelineApp VAERO registration failed:",
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

    window.TimelineApp =
        TimelineApp;

}
