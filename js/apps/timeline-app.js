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


    /* =====================================================
       SAFETY
    ===================================================== */

    escapeHTML(value){

        return String(
            value ?? ""
        )
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    },


    /* =====================================================
       ENGINE / SERVICES
    ===================================================== */

    getEngine(){

        try{

            if(
                typeof VAERO !== "undefined" &&
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


        return engine.mount(
            engine.currentEntity
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


            if(
                awareness &&
                typeof awareness.enter ===
                    "function"
            ){

                awareness.enter(
                    "timeline",
                    {
                        entityId:
                            entity?.id ||
                            null,

                        filter:
                            this.activeFilter,

                        selectedItemId:
                            this.selectedItemId
                    }
                );

            }

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

        return Number(
            item?.occurredAt ||
            item?.updatedAt ||
            item?.createdAt ||
            item?.timestamp ||
            0
        ) || 0;

    },


    formatDate(timestamp){

        const value =
            Number(
                timestamp
            );


        if(
            !Number.isFinite(value) ||
            value <= 0
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
                new Date(value)
            );

        } catch(error){

            return new Date(
                value
            ).toLocaleString(
                "tr-TR"
            );

        }

    },


    formatDay(timestamp){

        const value =
            Number(
                timestamp
            );


        if(
            !Number.isFinite(value) ||
            value <= 0
        ){
            return "Tarih bilinmiyor";
        }


        const date =
            new Date(
                value
            );


        const now =
            new Date();


        const todayKey =
            [
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            ].join("-");


        const dateKey =
            [
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            ].join("-");


        if(
            dateKey ===
            todayKey
        ){
            return "Bugün";
        }


        const yesterday =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 1
            );


        const yesterdayKey =
            [
                yesterday.getFullYear(),
                yesterday.getMonth(),
                yesterday.getDate()
            ].join("-");


        if(
            dateKey ===
            yesterdayKey
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
            )
        ){
            return "system";
        }


        return "timeline";

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
            .filter(Boolean)
            .map(
                value =>
                    String(value)
            );


        /*
         * Eski Timeline kayıtlarında entity bilgisi
         * bulunmayabilir. Bunları root/general timeline
         * olarak göstermeye devam ediyoruz.
         */

        if(
            candidates.length === 0
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


        let records = [];


        try{

            records =
                timeline.all() ||
                [];

        } catch(error){

            console.warn(
                "Timeline kayıtları okunamadı:",
                error
            );


            return [];

        }


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


                    return {

                        id:
                            `timeline:${
                                item.id ||
                                lifeEvent?.id ||
                                this.getTimestamp(
                                    item
                                )
                            }`,

                        rawId:
                            item.id ||
                            null,

                        source,

                        sourceId:
                            lifeEvent?.id ||
                            item.id ||
                            null,

                        entityId:
                            lifeEvent?.relatedEntityId ||
                            item.entityId ||
                            item.payload?.entityId ||
                            null,

                        worldId:
                            lifeEvent?.relatedWorldId ||
                            item.worldId ||
                            item.payload?.worldId ||
                            null,

                        title:
                            lifeEvent?.title ||
                            item.title ||
                            item.description ||
                            "Timeline Olayı",

                        description:
                            lifeEvent?.description ||
                            item.description ||
                            item.content ||
                            "",

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
                            null,

                        tags:
                            Array.isArray(
                                lifeEvent?.tags
                            )
                                ? lifeEvent.tags
                                : (
                                    Array.isArray(
                                        item.tags
                                    )
                                        ? item.tags
                                        : []
                                ),

                        occurredAt:
                            lifeEvent?.occurredAt ||
                            lifeEvent?.createdAt ||
                            item.occurredAt ||
                            item.createdAt ||
                            item.updatedAt ||
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


        let events = [];


        try{

            events =
                evolution.all() ||
                [];

        } catch(error){

            return [];

        }


        if(
            !Array.isArray(
                events
            )
        ){
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
                event => ({

                    id:
                        `evolution:${
                            event.id ||
                            this.getTimestamp(
                                event
                            )
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
                        event.title ||
                        event.description ||
                        event.type ||
                        "Evolution Olayı",

                    description:
                        event.description ||
                        "",

                    importance:
                        this.normalizeImportance(
                            event.importance
                        ),

                    type:
                        event.type ||
                        "life-event",

                    category:
                        "evolution",

                    tags:
                        Array.isArray(
                            event.tags
                        )
                            ? event.tags
                            : [],

                    occurredAt:
                        event.occurredAt ||
                        event.createdAt ||
                        event.updatedAt ||
                        Date.now(),

                    raw:
                        event,

                    linked:
                        event

                })
            );

    },


    /* =====================================================
       MEMORY SOURCE
    ===================================================== */

    getMemoryItems(entity){

        const memory =
            this.getService(
                "memorySystem"
            );


        if(
            !memory ||
            !entity?.id
        ){
            return [];
        }


        let records = [];


        try{

            if(
                typeof memory.forEntity ===
                    "function"
            ){

                records =
                    memory.forEntity(
                        entity.id
                    ) ||
                    [];

            } else if(
                typeof memory.all ===
                    "function"
            ){

                records =
                    (
                        memory.all() ||
                        []
                    ).filter(
                        record =>
                            this.belongsToEntity(
                                record,
                                entity.id
                            )
                    );

            }

        } catch(error){

            console.warn(
                "Memory Timeline verisi okunamadı:",
                error
            );


            return [];

        }


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

                    /*
                     * Evolution'dan otomatik üretilen Memory kayıtlarını
                     * Timeline'da ikinci kez göstermiyoruz.
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
            .map(
                memoryRecord => ({

                    id:
                        `memory:${
                            memoryRecord.id
                        }`,

                    rawId:
                        memoryRecord.id,

                    source:
                        memoryRecord.source ===
                            "system"
                            ? "system"
                            : "memory",

                    sourceId:
                        memoryRecord.id,

                    entityId:
                        memoryRecord.entityId ||
                        null,

                    worldId:
                        memoryRecord.worldId ||
                        null,

                    title:
                        memoryRecord.title ||
                        "Hafıza",

                    description:
                        memoryRecord.content ||
                        "",

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
                        Array.isArray(
                            memoryRecord.tags
                        )
                            ? memoryRecord.tags
                            : [],

                    occurredAt:
                        memoryRecord.updatedAt ||
                        memoryRecord.createdAt ||
                        Date.now(),

                    raw:
                        memoryRecord,

                    linked:
                        memoryRecord

                })
            );

    },


    /* =====================================================
       DEDUPLICATION
    ===================================================== */

    deduplicate(items){

        const map =
            new Map();


        items.forEach(
            item => {

                if(!item){
                    return;
                }


                /*
                 * Evolution event hem Timeline referansı hem
                 * Evolution Core'dan geliyorsa tek göster.
                 */

                const key =
                    item.source ===
                        "evolution" &&
                    item.sourceId
                        ? `evolution:${item.sourceId}`
                        : item.id;


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


                /*
                 * Daha zengin description/tags varsa onu koru.
                 */

                map.set(
                    key,
                    {
                        ...existing,
                        ...item,

                        description:
                            item.description ||
                            existing.description,

                        tags:
                            [
                                ...new Set([
                                    ...(existing.tags || []),
                                    ...(item.tags || [])
                                ])
                            ],

                        occurredAt:
                            Math.max(
                                this.getTimestamp(
                                    existing
                                ),
                                this.getTimestamp(
                                    item
                                )
                            )
                    }
                );

            }
        );


        return [
            ...map.values()
        ];

    },


    /* =====================================================
       UNIFIED STREAM
    ===================================================== */

    getUnifiedItems(entity){

        const timelineItems =
            this.getTimelineItems(
                entity
            );


        const evolutionItems =
            this.getEvolutionItems(
                entity
            );


        const memoryItems =
            this.getMemoryItems(
                entity
            );


        let items =
            this.deduplicate([
                ...timelineItems,
                ...evolutionItems,
                ...memoryItems
            ]);


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

                            ...(item.tags || [])

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


        return items
            .sort(
                (a,b) =>
                    this.getTimestamp(b) -
                    this.getTimestamp(a)
            )
            .slice(
                0,
                this.visibleLimit
            );

    },


    /* =====================================================
       STATS
    ===================================================== */

    getStats(entity){

        const items =
            this.deduplicate([
                ...this.getTimelineItems(entity),
                ...this.getEvolutionItems(entity),
                ...this.getMemoryItems(entity)
            ]);


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
                ).length

        };

    },


    /* =====================================================
       GROUP BY DAY
    ===================================================== */

    groupByDay(items){

        const groups =
            [];


        items.forEach(
            item => {

                const label =
                    this.formatDay(
                        this.getTimestamp(
                            item
                        )
                    );


                let group =
                    groups.find(
                        current =>
                            current.label ===
                            label
                    );


                if(!group){

                    group = {
                        label,
                        items:[]
                    };


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
            description.length > 150
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
                                                .slice(0,2)
                                                .join(" · ")
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

    renderToolbar(){

        const filters = [

            {
                id:"all",
                label:"Tümü"
            },

            {
                id:"evolution",
                label:"Evolution"
            },

            {
                id:"memory",
                label:"Memory"
            },

            {
                id:"system",
                label:"System"
            },

            {
                id:"timeline",
                label:"Timeline"
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

        const items =
            this.deduplicate([
                ...this.getTimelineItems(entity),
                ...this.getEvolutionItems(entity),
                ...this.getMemoryItems(entity)
            ]);


        return (
            items.find(
                item =>
                    item.id ===
                    itemId
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
                                "evolution"
                                ? `
                                    <button
                                        type="button"
                                        class="primary-btn"
                                        data-timeline-action="source:evolution"
                                        data-source-id="${this.escapeHTML(
                                            item.sourceId ||
                                            ""
                                        )}"
                                    >
                                        Evolution’da Aç
                                    </button>
                                  `
                                : ""
                        }


                        ${
                            item.source ===
                                "memory"
                                ? `
                                    <button
                                        type="button"
                                        class="primary-btn"
                                        data-timeline-action="source:memory"
                                        data-source-id="${this.escapeHTML(
                                            item.sourceId ||
                                            ""
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
       RENDER
    ===================================================== */

    render(entity){

        this.enterBrainContext(
            entity
        );


        this.cleanOrphans();


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


        const selected =
            this.selectedItemId
                ? this.findVisibleItem(
                    entity,
                    this.selectedItemId
                )
                : null;


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


                    ${UI.appHeader(
                        this.escapeHTML(
                            entity.name ||
                            "VAERO Varlığı"
                        ),
                        "TIMELINE",
                        "◷"
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


                    ${UI.brainPanel()}

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

            case "open":

                this.selectedItemId =
                    button.dataset
                        .timelineId ||
                    null;


                return this.remount();


            case "close":

                this.selectedItemId =
                    null;


                return this.remount();


            case "filter":

                this.activeFilter =
                    button.dataset
                        .timelineFilter ||
                    "all";


                this.selectedItemId =
                    null;


                return this.remount();


            case "source:evolution":{

                const sourceId =
                    button.dataset
                        .sourceId ||
                    null;


                this.selectedItemId =
                    null;


                if(
                    window.EvolutionApp &&
                    sourceId &&
                    typeof window.EvolutionApp
                        .selectEvent ===
                        "function"
                ){

                    try{

                        window.EvolutionApp
                            .selectEvent(
                                sourceId
                            );

                    } catch(error){

                        console.warn(
                            "Evolution olayı seçilemedi:",
                            error
                        );

                    }

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

            }


            case "source:memory":{

                const sourceId =
                    button.dataset
                        .sourceId ||
                    null;


                this.selectedItemId =
                    null;


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

            }

        }


        return false;

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


window.TimelineApp =
    TimelineApp;
