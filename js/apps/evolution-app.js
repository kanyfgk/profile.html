/* =========================================================
   VAERO EVOLUTION APP
   Life Events / Goals / Decisions / Progress
========================================================= */

const EvolutionApp = {

    activeFilter:
        "all",

    searchQuery:
        "",

    selectedEventId:
        null,

    editorMode:
        null,

    searchTimer:
        null,


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

    enterBrainContext(
        entity = null
    ){

        try{

            const awareness =
                this.getService(
                    "brainAwareness"
                );


            awareness?.enter?.(
                "evolution",
                {
                    entityId:
                        entity?.id ||
                        null,

                    filter:
                        this.activeFilter,

                    selectedEventId:
                        this.selectedEventId,

                    editorMode:
                        this.editorMode
                }
            );

        } catch(error){

            console.warn(
                "Evolution Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       EVOLUTION CORE
    ===================================================== */

    getEvolutionCore(){

        return this.getService(
            "evolution"
        );

    },


    getEvents(
        entity = null
    ){

        const evolution =
            this.getEvolutionCore();


        if(
            !evolution
        ){

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
                "Evolution olayları okunamadı:",
                error
            );


            return [];

        }


        return events
            .filter(Boolean)
            .filter(
                event =>
                    event.archived !==
                        true
            )
            .filter(
                event =>
                    event.type !==
                        "runtime:tick"
            )
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
       TYPES
    ===================================================== */

    getTypes(){

        return [

            {
                id:
                    "achievement",

                label:
                    "Başarı"
            },

            {
                id:
                    "decision",

                label:
                    "Karar"
            },

            {
                id:
                    "goal",

                label:
                    "Hedef"
            },

            {
                id:
                    "milestone",

                label:
                    "Dönüm Noktası"
            },

            {
                id:
                    "work",

                label:
                    "İş"
            },

            {
                id:
                    "relationship",

                label:
                    "İlişki"
            },

            {
                id:
                    "finance",

                label:
                    "Finans"
            },

            {
                id:
                    "failure",

                label:
                    "Deneyim"
            },

            {
                id:
                    "general",

                label:
                    "Genel"
            }

        ];

    },


    normalizeType(value){

        const type =
            String(
                value ||
                "general"
            )
                .trim()
                .toLowerCase();


        const allowed =
            this.getTypes()
                .map(
                    item =>
                        item.id
                );


        return allowed.includes(
            type
        )
            ? type
            : "general";

    },


    getTypeLabel(type){

        return (
            this.getTypes()
                .find(
                    item =>
                        item.id ===
                            type
                )
                ?.label ||
            "Genel"
        );

    },


    /* =====================================================
       IMPORTANCE
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


    getImportanceLabel(value){

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
       STATUS
    ===================================================== */

    normalizeStatus(value){

        const status =
            String(
                value ||
                "completed"
            )
                .trim()
                .toLowerCase();


        return [
            "planned",
            "progress",
            "completed",
            "paused",
            "cancelled"
        ].includes(
            status
        )
            ? status
            : "completed";

    },


    getStatusLabel(value){

        const labels = {

            planned:
                "Planlandı",

            progress:
                "Devam Ediyor",

            completed:
                "Tamamlandı",

            paused:
                "Duraklatıldı",

            cancelled:
                "İptal Edildi"

        };


        return (
            labels[
                this.normalizeStatus(
                    value
                )
            ] ||
            "Tamamlandı"
        );

    },


    /* =====================================================
       DATE
    ===================================================== */

    getTimestamp(event){

        const value =
            Number(
                event?.occurredAt ||
                event?.updatedAt ||
                event?.createdAt ||
                event?.timestamp ||
                event?.time ||
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


    /* =====================================================
       TAGS
    ===================================================== */

    parseTags(value){

        const source =
            Array.isArray(
                value
            )
                ? value
                : String(
                    value ||
                    ""
                ).split(",");


        const seen =
            new Set();


        const tags =
            [];


        source.forEach(
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
                            60
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


        return tags.slice(
            0,
            30
        );

    },


    /* =====================================================
       XP / PROGRESS
    ===================================================== */

    getEventXP(
        event = {}
    ){

        const direct =
            Number(
                event.xp
            );


        if(
            Number.isFinite(
                direct
            ) &&
            direct >=
                0
        ){

            return direct;

        }


        const payloadXP =
            Number(
                event.payload?.xp
            );


        if(
            Number.isFinite(
                payloadXP
            ) &&
            payloadXP >=
                0
        ){

            return payloadXP;

        }


        const defaults = {

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
            defaults[
                this.normalizeImportance(
                    event.importance
                )
            ] ||
            10
        );

    },


    getEvolutionProgress(events){

        const safeEvents =
            Array.isArray(
                events
            )
                ? events
                : [];


        const totalXP =
            safeEvents.reduce(
                (
                    total,
                    event
                ) =>
                    total +
                    this.getEventXP(
                        event
                    ),
                0
            );


        const level =
            Math.floor(
                totalXP /
                100
            ) +
            1;


        const currentLevelXP =
            totalXP %
            100;


        return {

            level,

            totalXP,

            currentLevelXP,

            nextLevelXP:
                100,

            progressPercent:
                currentLevelXP

        };

    },


    getGoalProgress(
        event = {}
    ){

        const direct =
            Number(
                event.progress
            );


        if(
            Number.isFinite(
                direct
            )
        ){

            return Math.min(
                100,
                Math.max(
                    0,
                    direct
                )
            );

        }


        const payload =
            Number(
                event.payload?.progress
            );


        if(
            Number.isFinite(
                payload
            )
        ){

            return Math.min(
                100,
                Math.max(
                    0,
                    payload
                )
            );

        }


        return (
            this.normalizeStatus(
                event.status
            ) ===
                "completed"
                ? 100
                : 0
        );

    },


    /* =====================================================
       FILTER / SEARCH
    ===================================================== */

    getAllowedFilters(){

        return [
            "all",
            "important",
            "achievement",
            "decision",
            "goal",
            "milestone"
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


        this.selectedEventId =
            null;


        this.editorMode =
            null;


        return this.activeFilter;

    },


    getVisibleEvents(entity){

        let events =
            this.getEvents(
                entity
            );


        if(
            this.activeFilter ===
                "important"
        ){

            events =
                events.filter(
                    event => {

                        const importance =
                            this.normalizeImportance(
                                event.importance
                            );


                        return (
                            importance ===
                                "high" ||
                            importance ===
                                "critical"
                        );

                    }
                );

        }

        else if(
            this.activeFilter !==
                "all"
        ){

            events =
                events.filter(
                    event =>
                        this.normalizeType(
                            event.type
                        ) ===
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

            events =
                events.filter(
                    event => {

                        const haystack = [

                            event.title,
                            event.description,
                            event.type,
                            event.status,
                            event.source,

                            ...(
                                Array.isArray(
                                    event.tags
                                )
                                    ? event.tags
                                    : []
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


        return events;

    },


    /* =====================================================
       EVENT RESOLUTION
    ===================================================== */

    findEvent(eventId){

        const id =
            String(
                eventId ||
                ""
            ).trim();


        if(!id){

            return null;

        }


        const evolution =
            this.getEvolutionCore();


        if(
            evolution &&
            typeof evolution.find ===
                "function"
        ){

            try{

                const result =
                    evolution.find(
                        id
                    );


                if(result){

                    return result;

                }

            } catch(error){

                /* list fallback */

            }

        }


        return (
            this
                .getEvents(
                    this.getCurrentEntity()
                )
                .find(
                    event =>
                        String(
                            event.id
                        ) ===
                            id
                ) ||
            null
        );

    },


    selectEvent(eventId){

        const id =
            String(
                eventId ||
                ""
            ).trim();


        this.selectedEventId =
            id ||
            null;


        this.editorMode =
            null;


        return this.selectedEventId;

    },


    clearSelectedEvent(){

        this.selectedEventId =
            null;


        this.editorMode =
            null;


        return true;

    },


    /* =====================================================
       FORM VALUES
    ===================================================== */

    readEditorValues(){

        const titleInput =
            document.getElementById(
                "evolutionTitleInput"
            );


        const descriptionInput =
            document.getElementById(
                "evolutionDescriptionInput"
            );


        const typeInput =
            document.getElementById(
                "evolutionTypeInput"
            );


        const importanceInput =
            document.getElementById(
                "evolutionImportanceInput"
            );


        const statusInput =
            document.getElementById(
                "evolutionStatusInput"
            );


        const tagsInput =
            document.getElementById(
                "evolutionTagsInput"
            );


        const progressInput =
            document.getElementById(
                "evolutionProgressInput"
            );


        const title =
            String(
                titleInput?.value ||
                ""
            )
                .trim()
                .slice(
                    0,
                    100
                );


        const description =
            String(
                descriptionInput?.value ||
                ""
            )
                .trim()
                .slice(
                    0,
                    1500
                );


        const type =
            this.normalizeType(
                typeInput?.value
            );


        const status =
            this.normalizeStatus(
                statusInput?.value
            );


        const importance =
            this.normalizeImportance(
                importanceInput?.value
            );


        const progress =
            type ===
                "goal"
                ? Math.min(
                    100,
                    Math.max(
                        0,
                        Number(
                            progressInput?.value ||
                            0
                        ) ||
                        0
                    )
                )
                : undefined;


        return {

            titleInput,

            title,

            description,

            type,

            status,

            importance,

            tags:
                this.parseTags(
                    tagsInput?.value
                ),

            progress

        };

    },


    /* =====================================================
       CREATE
    ===================================================== */

    createEvent(entity){

        if(
            !entity ||
            !entity.id
        ){

            return false;

        }


        const values =
            this.readEditorValues();


        if(
            !values.title
        ){

            values.titleInput
                ?.focus();


            return false;

        }


        const evolution =
            this.getEvolutionCore();


        if(
            !evolution ||
            typeof evolution.record !==
                "function"
        ){

            console.warn(
                "Evolution Core record API kullanılamıyor."
            );


            return false;

        }


        const metadata = {

            title:
                values.title,

            description:
                values.description,

            relatedEntityId:
                entity.id,

            relatedWorldId:
                this.getEngine()
                    ?.currentWorld
                    ?.id ||
                null,

            source:
                "evolution-app",

            status:
                values.status,

            importance:
                values.importance,

            tags:
                values.tags

        };


        if(
            values.progress !==
                undefined
        ){

            metadata.progress =
                values.progress;

        }


        let created =
            null;


        try{

            created =
                evolution.record(
                    values.type,
                    values.description ||
                    values.title,
                    metadata
                );

        } catch(error){

            console.error(
                "Evolution olayı oluşturulamadı:",
                error
            );


            return false;

        }


        if(!created){

            return false;

        }


        this.selectedEventId =
            created.id ||
            null;


        this.editorMode =
            null;


        return this.remount();

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    updateEvent(){

        const event =
            this.findEvent(
                this.selectedEventId
            );


        if(!event){

            return false;

        }


        const evolution =
            this.getEvolutionCore();


        if(
            !evolution ||
            typeof evolution.update !==
                "function"
        ){

            console.warn(
                "Evolution Core update API kullanılamıyor."
            );


            return false;

        }


        const values =
            this.readEditorValues();


        if(
            !values.title
        ){

            values.titleInput
                ?.focus();


            return false;

        }


        const changes = {

            title:
                values.title,

            description:
                values.description,

            type:
                values.type,

            importance:
                values.importance,

            status:
                values.status,

            tags:
                values.tags

        };


        if(
            values.type ===
                "goal"
        ){

            changes.progress =
                values.progress;

        }


        let updated =
            null;


        try{

            updated =
                evolution.update(
                    event.id,
                    changes
                );

        } catch(error){

            console.error(
                "Evolution olayı güncellenemedi:",
                error
            );


            return false;

        }


        if(!updated){

            return false;

        }


        this.selectedEventId =
            updated.id ||
            event.id;


        this.editorMode =
            null;


        return this.remount();

    },


    /* =====================================================
       ARCHIVE
    ===================================================== */

    archiveEvent(){

        const event =
            this.findEvent(
                this.selectedEventId
            );


        const evolution =
            this.getEvolutionCore();


        if(
            !event ||
            !evolution ||
            typeof evolution.archive !==
                "function"
        ){

            return false;

        }


        let result =
            false;


        try{

            result =
                evolution.archive(
                    event.id
                );

        } catch(error){

            console.error(
                "Evolution olayı arşivlenemedi:",
                error
            );


            return false;

        }


        if(!result){

            return false;

        }


        this.selectedEventId =
            null;


        this.editorMode =
            null;


        return this.remount();

    },


    /* =====================================================
       LINKED RECORDS
    ===================================================== */

    getLinkedRecordCounts(event){

        if(!event?.id){

            return {

                timeline:
                    0,

                memory:
                    0

            };

        }


        const timeline =
            this.getService(
                "timeline"
            );


        let timelineRecords =
            [];


        try{

            const result =
                timeline?.all?.({
                    includeArchived:
                        true
                });


            timelineRecords =
                Array.isArray(
                    result
                )
                    ? result
                    : [];

        } catch(error){

            timelineRecords =
                [];

        }


        let memoryRecords =
            [];


        const memoryServices = [

            this.getService(
                "memorySystem"
            ),

            this.getService(
                "memory"
            )

        ]
            .filter(Boolean);


        for(
            const memory of memoryServices
        ){

            try{

                const result =
                    memory?.all?.({
                        includeArchived:
                            true
                    });


                if(
                    Array.isArray(
                        result
                    )
                ){

                    memoryRecords =
                        result;


                    break;

                }

            } catch(error){

                /* MemoryApp fallback */

            }

        }


        if(
            memoryRecords.length ===
                0
        ){

            try{

                const entity =
                    this.getCurrentEntity();


                if(
                    entity &&
                    window.MemoryApp &&
                    typeof window.MemoryApp
                        .getAllMemories ===
                        "function"
                ){

                    const result =
                        window.MemoryApp
                            .getAllMemories(
                                entity
                            );


                    memoryRecords =
                        Array.isArray(
                            result
                        )
                            ? result
                            : [];

                }

            } catch(error){

                memoryRecords =
                    [];

            }

        }


        const matchesEvent =
            record => {

                const candidates = [

                    record?.sourceEventId,

                    record?.eventId,

                    record?.relatedEventId,

                    record?.payload
                        ?.sourceEventId,

                    record?.payload
                        ?.eventId,

                    record?.context
                        ?.sourceEventId

                ]
                    .filter(Boolean)
                    .map(
                        value =>
                            String(
                                value
                            )
                    );


                return candidates.includes(
                    String(
                        event.id
                    )
                );

            };


        return {

            timeline:
                timelineRecords
                    .filter(
                        matchesEvent
                    )
                    .length,

            memory:
                memoryRecords
                    .filter(
                        matchesEvent
                    )
                    .length

        };

    },


    /* =====================================================
       BRAIN ANALYSIS
       Local deterministic interpretation only.
    ===================================================== */

    getBrainAnalysis(event){

        const analysis = {

            summary:
                "Bu olay varlığın yaşam akışında yeni bir değişim oluşturdu.",

            impact:
                "Orta",

            risk:
                "Düşük",

            suggestion:
                "Olayın sonraki etkileri Timeline üzerinden takip edilebilir."

        };


        switch(
            this.normalizeType(
                event?.type
            )
        ){

            case "achievement":

                analysis.summary =
                    "Bu olay tamamlanmış bir ilerleme veya başarı gösteriyor.";

                analysis.impact =
                    "Yüksek";

                analysis.suggestion =
                    "Bu başarıyı yeni bir hedef veya dönüm noktasıyla ilişkilendirebilirsin.";

                break;


            case "goal":

                analysis.summary =
                    "Bu kayıt geleceğe yönelik aktif bir gelişim yönü oluşturuyor.";

                analysis.suggestion =
                    "Hedef ilerlemesini düzenli güncelleyerek değişimi ölçebilirsin.";

                break;


            case "decision":

                analysis.summary =
                    "Bu karar sonraki olayların yönünü değiştirebilir.";

                analysis.suggestion =
                    "Kararın nedenini ve sonuçlarını Memory ile ilişkilendirmek faydalı olabilir.";

                break;


            case "failure":

                analysis.summary =
                    "Bu deneyim gelişim için öğrenme verisi oluşturuyor.";

                analysis.impact =
                    "Yüksek";

                analysis.risk =
                    "Orta";

                analysis.suggestion =
                    "Çıkarılan dersleri Memory içinde kalıcı bir kayda dönüştürebilirsin.";

                break;


            case "finance":

                analysis.summary =
                    "Bu olay finansal durumu veya yükümlülükleri etkileyebilir.";

                analysis.impact =
                    "Yüksek";

                analysis.risk =
                    "Orta";

                break;

        }


        const importance =
            this.normalizeImportance(
                event?.importance
            );


        if(
            importance ===
                "critical"
        ){

            analysis.impact =
                "Kritik";

            analysis.risk =
                "Yüksek";

        }

        else if(
            importance ===
                "high"
        ){

            analysis.impact =
                "Yüksek";

        }


        return analysis;

    },

   /* =====================================================
       STATS
    ===================================================== */

    getStats(events){

        const safeEvents =
            Array.isArray(
                events
            )
                ? events
                : [];


        return {

            total:
                safeEvents.length,

            important:
                safeEvents.filter(
                    event => {

                        const importance =
                            this.normalizeImportance(
                                event.importance
                            );


                        return (
                            importance ===
                                "high" ||
                            importance ===
                                "critical"
                        );

                    }
                ).length,

            achievements:
                safeEvents.filter(
                    event =>
                        this.normalizeType(
                            event.type
                        ) ===
                            "achievement"
                ).length,

            goals:
                safeEvents.filter(
                    event =>
                        this.normalizeType(
                            event.type
                        ) ===
                            "goal" &&
                        this.normalizeStatus(
                            event.status
                        ) !==
                            "completed" &&
                        this.normalizeStatus(
                            event.status
                        ) !==
                            "cancelled"
                ).length

        };

    },


    /* =====================================================
       FILTER BAR
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
                    "important",

                label:
                    "Önemli"
            },

            {
                id:
                    "achievement",

                label:
                    "Başarı"
            },

            {
                id:
                    "decision",

                label:
                    "Karar"
            },

            {
                id:
                    "goal",

                label:
                    "Hedef"
            },

            {
                id:
                    "milestone",

                label:
                    "Dönüm Noktası"
            }

        ];


        return `
            <div class="evolution-toolbar">

                <label class="evolution-search">

                    <span aria-hidden="true">
                        ⌕
                    </span>


                    <input
                        id="evolutionSearchInput"
                        type="search"
                        autocomplete="off"
                        placeholder="Evolution içinde ara"
                        value="${this.escapeHTML(
                            this.searchQuery
                        )}"
                    >

                </label>


                <div class="evolution-filter-row">

                    ${filters
                        .map(
                            filter => `
                                <button
                                    type="button"
                                    class="evolution-filter-btn ${
                                        this.activeFilter ===
                                            filter.id
                                            ? "is-active"
                                            : ""
                                    }"
                                    data-action="evolution:filter"
                                    data-filter="${this.escapeHTML(
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


                <button
                    type="button"
                    class="primary-btn"
                    data-evolution-action="create"
                >
                    + Yaşam Olayı
                </button>

            </div>
        `;

    },


    /* =====================================================
       PROGRESS
    ===================================================== */

    renderEvolutionProgress(progress){

        const percent =
            Math.min(
                100,
                Math.max(
                    0,
                    Number(
                        progress?.progressPercent
                    ) ||
                    0
                )
            );


        return `
            <section class="evolution-progress-card">

                <div>

                    <span class="engine-section-label">
                        EVOLUTION LEVEL
                    </span>

                    <strong>
                        Seviye ${Number(
                            progress?.level
                        ) || 1}
                    </strong>

                </div>


                <div class="evolution-progress-value">

                    <strong>
                        ${Number(
                            progress?.totalXP
                        ) || 0} XP
                    </strong>

                    <small>
                        ${Number(
                            progress?.currentLevelXP
                        ) || 0}
                        /
                        ${Number(
                            progress?.nextLevelXP
                        ) || 100}
                    </small>

                </div>


                <div class="evolution-progress-track">

                    <span
                        style="width:${percent}%"
                    ></span>

                </div>

            </section>
        `;

    },


    /* =====================================================
       EVENT CARD
    ===================================================== */

    getEventIcon(type){

        const icons = {

            achievement:
                "★",

            goal:
                "◎",

            decision:
                "◇",

            milestone:
                "◆",

            work:
                "◫",

            relationship:
                "∞",

            finance:
                "◈",

            failure:
                "△",

            general:
                "⌬"

        };


        return (
            icons[
                this.normalizeType(
                    type
                )
            ] ||
            "⌬"
        );

    },


    renderEvent(event){

        const type =
            this.normalizeType(
                event.type
            );


        const importance =
            this.normalizeImportance(
                event.importance
            );


        const status =
            this.normalizeStatus(
                event.status
            );


        const progress =
            type ===
                "goal"
                ? this.getGoalProgress(
                    event
                )
                : null;


        const description =
            String(
                event.description ||
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
                    evolution-record
                    evolution-importance-${this.escapeHTML(
                        importance
                    )}
                "
                data-action="evolution:event:open"
                data-event-id="${this.escapeHTML(
                    event.id
                )}"
            >

                <span class="evolution-record-marker">
                    ${this.escapeHTML(
                        this.getEventIcon(
                            type
                        )
                    )}
                </span>


                <span class="evolution-record-body">

                    <span class="evolution-record-meta">

                        <small>
                            ${this.escapeHTML(
                                this.getTypeLabel(
                                    type
                                )
                            )}
                        </small>

                        <small>
                            ${this.escapeHTML(
                                this.getImportanceLabel(
                                    importance
                                )
                            )}
                        </small>

                        <small>
                            ${this.escapeHTML(
                                this.getStatusLabel(
                                    status
                                )
                            )}
                        </small>

                    </span>


                    <strong>
                        ${this.escapeHTML(
                            event.title ||
                            "Yaşam olayı"
                        )}
                    </strong>


                    ${
                        preview
                            ? `
                                <span class="evolution-record-description">
                                    ${this.escapeHTML(
                                        preview
                                    )}
                                </span>
                              `
                            : ""
                    }


                    ${
                        progress !==
                            null
                            ? `
                                <span class="evolution-goal-progress">

                                    <span>

                                        <i
                                            style="width:${progress}%"
                                        ></i>

                                    </span>

                                    <small>
                                        %${progress}
                                    </small>

                                </span>
                              `
                            : ""
                    }


                    ${
                        Array.isArray(
                            event.tags
                        ) &&
                        event.tags.length
                            ? `
                                <span class="evolution-record-tags">

                                    ${event.tags
                                        .slice(
                                            0,
                                            3
                                        )
                                        .map(
                                            tag => `
                                                <small>
                                                    ${this.escapeHTML(
                                                        tag
                                                    )}
                                                </small>
                                            `
                                        )
                                        .join("")}

                                </span>
                              `
                            : ""
                    }

                </span>


                <span class="evolution-record-side">

                    <small>
                        ${this.escapeHTML(
                            this.formatDate(
                                this.getTimestamp(
                                    event
                                )
                            )
                        )}
                    </small>


                    <strong>
                        +${this.getEventXP(
                            event
                        )} XP
                    </strong>

                </span>

            </button>
        `;

    },


    /* =====================================================
       EDITOR
    ===================================================== */

    renderEditor(
        event = null
    ){

        const editing =
            Boolean(
                event
            );


        const type =
            this.normalizeType(
                event?.type ||
                "general"
            );


        const status =
            this.normalizeStatus(
                event?.status ||
                "completed"
            );


        const importance =
            this.normalizeImportance(
                event?.importance ||
                "medium"
            );


        const progress =
            this.getGoalProgress(
                event ||
                {}
            );


        return `
            <div class="evolution-detail-layer">

                <div
                    class="evolution-detail-backdrop"
                    data-evolution-action="editor:cancel"
                ></div>


                <form
                    class="evolution-editor"
                    data-evolution-form="${
                        editing
                            ? "edit"
                            : "create"
                    }"
                >

                    <header class="evolution-detail-header">

                        <div>

                            <span class="engine-section-label">
                                EVOLUTION EDITOR
                            </span>


                            <h2>
                                ${
                                    editing
                                        ? "Yaşam olayını düzenle"
                                        : "Yeni yaşam olayı"
                                }
                            </h2>

                        </div>


                        <button
                            type="button"
                            class="engine-icon-btn"
                            data-evolution-action="editor:cancel"
                            aria-label="Kapat"
                        >
                            ×
                        </button>

                    </header>


                    <div class="evolution-editor-scroll">

                        <label class="engine-field">

                            <span>
                                Başlık
                            </span>


                            <input
                                id="evolutionTitleInput"
                                type="text"
                                maxlength="100"
                                autocomplete="off"
                                value="${this.escapeHTML(
                                    event?.title ||
                                    ""
                                )}"
                                placeholder="Ne oldu?"
                                required
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                Açıklama
                            </span>


                            <textarea
                                id="evolutionDescriptionInput"
                                maxlength="1500"
                                rows="6"
                                placeholder="Olayın bağlamını ve etkisini yaz"
                            >${this.escapeHTML(
                                event?.description ||
                                ""
                            )}</textarea>

                        </label>


                        <label class="engine-field">

                            <span>
                                Tür
                            </span>


                            <select
                                id="evolutionTypeInput"
                            >

                                ${this.getTypes()
                                    .map(
                                        item => `
                                            <option
                                                value="${this.escapeHTML(
                                                    item.id
                                                )}"
                                                ${
                                                    item.id ===
                                                        type
                                                        ? "selected"
                                                        : ""
                                                }
                                            >
                                                ${this.escapeHTML(
                                                    item.label
                                                )}
                                            </option>
                                        `
                                    )
                                    .join("")}

                            </select>

                        </label>


                        <label class="engine-field">

                            <span>
                                Durum
                            </span>


                            <select
                                id="evolutionStatusInput"
                            >

                                ${[
                                    [
                                        "planned",
                                        "Planlandı"
                                    ],
                                    [
                                        "progress",
                                        "Devam Ediyor"
                                    ],
                                    [
                                        "completed",
                                        "Tamamlandı"
                                    ],
                                    [
                                        "paused",
                                        "Duraklatıldı"
                                    ],
                                    [
                                        "cancelled",
                                        "İptal Edildi"
                                    ]
                                ]
                                    .map(
                                        (
                                            [
                                                value,
                                                label
                                            ]
                                        ) => `
                                            <option
                                                value="${value}"
                                                ${
                                                    status ===
                                                        value
                                                        ? "selected"
                                                        : ""
                                                }
                                            >
                                                ${label}
                                            </option>
                                        `
                                    )
                                    .join("")}

                            </select>

                        </label>


                        <label class="engine-field">

                            <span>
                                Önem
                            </span>


                            <select
                                id="evolutionImportanceInput"
                            >

                                ${[
                                    [
                                        "low",
                                        "Düşük"
                                    ],
                                    [
                                        "medium",
                                        "Orta"
                                    ],
                                    [
                                        "high",
                                        "Yüksek"
                                    ],
                                    [
                                        "critical",
                                        "Kritik"
                                    ]
                                ]
                                    .map(
                                        (
                                            [
                                                value,
                                                label
                                            ]
                                        ) => `
                                            <option
                                                value="${value}"
                                                ${
                                                    importance ===
                                                        value
                                                        ? "selected"
                                                        : ""
                                                }
                                            >
                                                ${label}
                                            </option>
                                        `
                                    )
                                    .join("")}

                            </select>

                        </label>


                        <label class="engine-field evolution-progress-field">

                            <span>
                                Hedef ilerlemesi (%)
                            </span>


                            <input
                                id="evolutionProgressInput"
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                inputmode="numeric"
                                value="${progress}"
                            >


                            <small>
                                Yalnız Hedef türünde kullanılır.
                            </small>

                        </label>


                        <label class="engine-field">

                            <span>
                                Etiketler
                            </span>


                            <input
                                id="evolutionTagsInput"
                                type="text"
                                maxlength="220"
                                autocomplete="off"
                                value="${this.escapeHTML(
                                    Array.isArray(
                                        event?.tags
                                    )
                                        ? event.tags.join(
                                            ", "
                                        )
                                        : ""
                                )}"
                                placeholder="iş, karar, gelişim"
                            >

                        </label>

                    </div>


                    <footer class="evolution-detail-actions">

                        <button
                            type="button"
                            class="secondary-btn"
                            data-evolution-action="editor:cancel"
                        >
                            Vazgeç
                        </button>


                        <button
                            type="submit"
                            class="primary-btn"
                        >
                            ${
                                editing
                                    ? "Değişiklikleri Kaydet"
                                    : "Olayı Kaydet"
                            }
                        </button>

                    </footer>

                </form>

            </div>
        `;

    },


    /* =====================================================
       DETAIL
    ===================================================== */

    renderSelectedEvent(event){

        if(!event){

            return "";

        }


        const analysis =
            this.getBrainAnalysis(
                event
            );


        const linked =
            this.getLinkedRecordCounts(
                event
            );


        const type =
            this.normalizeType(
                event.type
            );


        const progress =
            type ===
                "goal"
                ? this.getGoalProgress(
                    event
                )
                : null;


        return `
            <div class="evolution-detail-layer">

                <div
                    class="evolution-detail-backdrop"
                    data-action="evolution:event:close"
                ></div>


                <section
                    class="evolution-detail"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Evolution olayı"
                >

                    <header class="evolution-detail-header">

                        <div>

                            <span class="engine-section-label">
                                ${this.escapeHTML(
                                    this.getTypeLabel(
                                        type
                                    )
                                )}
                            </span>


                            <h2>
                                ${this.escapeHTML(
                                    event.title ||
                                    "Yaşam olayı"
                                )}
                            </h2>

                        </div>


                        <button
                            type="button"
                            class="engine-icon-btn"
                            data-action="evolution:event:close"
                            aria-label="Kapat"
                        >
                            ×
                        </button>

                    </header>


                    <div class="evolution-detail-scroll">

                        ${
                            event.description
                                ? `
                                    <p class="evolution-detail-description">
                                        ${this.escapeHTML(
                                            event.description
                                        )}
                                    </p>
                                  `
                                : ""
                        }


                        ${
                            progress !==
                                null
                                ? `
                                    <section class="evolution-detail-progress">

                                        <div>

                                            <span>
                                                Hedef ilerlemesi
                                            </span>

                                            <strong>
                                                %${progress}
                                            </strong>

                                        </div>


                                        <div>

                                            <span
                                                style="width:${progress}%"
                                            ></span>

                                        </div>

                                    </section>
                                  `
                                : ""
                        }


                        <div class="evolution-detail-meta">

                            <div>

                                <span>
                                    Durum
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        this.getStatusLabel(
                                            event.status
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
                                        this.getImportanceLabel(
                                            event.importance
                                        )
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    XP
                                </span>

                                <strong>
                                    +${this.getEventXP(
                                        event
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
                                            this.getTimestamp(
                                                event
                                            )
                                        )
                                    )}
                                </strong>

                            </div>

                        </div>


                        ${
                            event.tags?.length
                                ? `
                                    <div class="evolution-detail-tags">

                                        ${event.tags
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


                        <section class="evolution-analysis-card">

                            <span class="engine-section-label">
                                BRAIN CONTEXT
                            </span>


                            <p>
                                ${this.escapeHTML(
                                    analysis.summary
                                )}
                            </p>


                            <div>

                                <span>
                                    Etki

                                    <strong>
                                        ${this.escapeHTML(
                                            analysis.impact
                                        )}
                                    </strong>
                                </span>


                                <span>
                                    Risk

                                    <strong>
                                        ${this.escapeHTML(
                                            analysis.risk
                                        )}
                                    </strong>
                                </span>

                            </div>


                            <small>
                                ${this.escapeHTML(
                                    analysis.suggestion
                                )}
                            </small>

                        </section>


                        <div class="evolution-linked-records">

                            <button
                                type="button"
                                data-action="evolution:linked:open"
                                data-target="timeline"
                            >

                                <span>
                                    Timeline
                                </span>

                                <strong>
                                    ${linked.timeline}
                                </strong>

                            </button>


                            <button
                                type="button"
                                data-action="evolution:linked:open"
                                data-target="memory"
                            >

                                <span>
                                    Memory
                                </span>

                                <strong>
                                    ${linked.memory}
                                </strong>

                            </button>

                        </div>

                    </div>


                    <footer class="evolution-detail-actions">

                        <button
                            type="button"
                            class="primary-btn"
                            data-evolution-action="edit"
                        >
                            Düzenle
                        </button>


                        <button
                            type="button"
                            class="secondary-btn"
                            data-evolution-action="archive"
                        >
                            Arşivle
                        </button>


                        <button
                            type="button"
                            class="secondary-btn"
                            data-action="evolution:event:close"
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
            <div class="section evolution-empty">

                <span aria-hidden="true">
                    ⌬
                </span>


                <h3>
                    ${
                        this.searchQuery ||
                        this.activeFilter !==
                            "all"
                            ? "Eşleşen olay bulunamadı"
                            : "Evolution henüz sessiz"
                    }
                </h3>


                <p>
                    ${
                        this.searchQuery ||
                        this.activeFilter !==
                            "all"
                            ? "Arama veya filtreyi değiştirerek tekrar deneyebilirsin."
                            : "İlk kararını, hedefini, başarını veya dönüm noktanı kaydederek gelişim akışını başlat."
                    }
                </p>


                ${
                    !this.searchQuery &&
                    this.activeFilter ===
                        "all"
                        ? `
                            <button
                                type="button"
                                class="primary-btn"
                                data-evolution-action="create"
                            >
                                İlk Olayı Oluştur
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
                "EVOLUTION",
                "⌬"
            );

        }


        return `
            <header class="engine-app-header">

                <span class="engine-section-label">
                    EVOLUTION
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
                            Evolution açılamadı
                        </h1>

                        <p>
                            Bu varlığın gelişim bağlamı bulunamadı.
                        </p>

                    </div>

                </section>
            `;

        }


        if(
            !this.getAllowedFilters()
                .includes(
                    this.activeFilter
                )
        ){

            this.activeFilter =
                "all";

        }


        this.enterBrainContext(
            entity
        );


        const allEvents =
            this.getEvents(
                entity
            );


        const events =
            this.getVisibleEvents(
                entity
            );


        let selected =
            this.selectedEventId
                ? this.findEvent(
                    this.selectedEventId
                )
                : null;


        if(
            this.selectedEventId &&
            !selected
        ){

            this.selectedEventId =
                null;


            this.editorMode =
                null;


            selected =
                null;

        }


        const stats =
            this.getStats(
                allEvents
            );


        const progress =
            this.getEvolutionProgress(
                allEvents
            );


        const editorEvent =
            this.editorMode ===
                "edit"
                ? selected
                : null;


        if(
            this.editorMode ===
                "edit" &&
            !editorEvent
        ){

            this.editorMode =
                null;

        }


        return `
            <section class="engine-page evolution-app-page">

                <div class="evolution-app-shell">

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


                    <section class="evolution-app-intro">

                        <div>

                            <span class="engine-section-label">
                                LIVING EVOLUTION
                            </span>


                            <h2>
                                Yaşam ve gelişim
                            </h2>


                            <p>
                                Kararlar, hedefler, başarılar, deneyimler ve dönüm noktaları bu varlığın gelişim haritasını oluşturur.
                            </p>

                        </div>


                        <div class="evolution-stats">

                            <div>

                                <strong>
                                    ${stats.total}
                                </strong>

                                <span>
                                    Olay
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${stats.important}
                                </strong>

                                <span>
                                    Önemli
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${stats.achievements}
                                </strong>

                                <span>
                                    Başarı
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${stats.goals}
                                </strong>

                                <span>
                                    Aktif Hedef
                                </span>

                            </div>

                        </div>

                    </section>


                    ${this.renderEvolutionProgress(
                        progress
                    )}


                    ${this.renderToolbar()}


                    <div class="evolution-records-scroll">

                        ${
                            events.length
                                ? `
                                    <div class="evolution-record-list">

                                        ${events
                                            .map(
                                                event =>
                                                    this.renderEvent(
                                                        event
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
                    this.editorMode
                        ? this.renderEditor(
                            editorEvent
                        )
                        : (
                            selected
                                ? this.renderSelectedEvent(
                                    selected
                                )
                                : ""
                        )
                }

            </section>
        `;

    },


    /* =====================================================
       COMMANDS
    ===================================================== */

    handleCommand(
        action
    ){

        switch(action){

            case "create":

                this.selectedEventId =
                    null;


                this.editorMode =
                    "create";


                return this.remount();


            case "edit":

                if(
                    !this.selectedEventId ||
                    !this.findEvent(
                        this.selectedEventId
                    )
                ){

                    return false;

                }


                this.editorMode =
                    "edit";


                return this.remount();


            case "archive":

                return this.archiveEvent();


            case "editor:cancel":

                this.editorMode =
                    null;


                return this.remount();


            default:

                return false;

        }

    },


    /* =====================================================
       GENERIC ACTIONS
    ===================================================== */

    handleGenericAction(
        action,
        button
    ){

        switch(action){

            case "evolution:filter":

                this.setFilter(
                    button?.dataset
                        ?.filter ||
                    "all"
                );


                return this.remount();


            case "evolution:event:open":{

                const eventId =
                    button?.dataset
                        ?.eventId ||
                    null;


                if(
                    !eventId ||
                    !this.findEvent(
                        eventId
                    )
                ){

                    return false;

                }


                this.selectEvent(
                    eventId
                );


                return this.remount();

            }


            case "evolution:event:close":

                this.clearSelectedEvent();


                return this.remount();


            case "evolution:linked:open":{

                const target =
                    String(
                        button?.dataset
                            ?.target ||
                        ""
                    );


                if(
                    ![
                        "timeline",
                        "memory"
                    ].includes(
                        target
                    )
                ){

                    return false;

                }


                const eventId =
                    this.selectedEventId;


                this.editorMode =
                    null;


                if(
                    target ===
                        "timeline" &&
                    window.TimelineApp &&
                    eventId
                ){

                    try{

                        const entity =
                            this.getCurrentEntity();


                        const timelineItems =
                            window.TimelineApp
                                .getAllUnifiedItems?.(
                                    entity
                                ) ||
                            [];


                        const matched =
                            timelineItems.find(
                                item =>
                                    item.source ===
                                        "evolution" &&
                                    String(
                                        item.sourceId ||
                                        ""
                                    ) ===
                                        String(
                                            eventId
                                        )
                            );


                        if(matched){

                            window.TimelineApp
                                .selectedItemId =
                                matched.id;

                        }

                    } catch(error){

                        console.warn(
                            "Timeline Evolution context aktarılamadı:",
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
                            target
                        );

                }


                return false;

            }


            default:

                return false;

        }

    }

};


/* =========================================================
   EVOLUTION COMMANDS
========================================================= */

document.addEventListener(
    "click",
    event => {

        const evolutionButton =
            event.target.closest(
                "[data-evolution-action]"
            );


        if(evolutionButton){

            event.preventDefault();


            EvolutionApp.handleCommand(
                evolutionButton.dataset
                    .evolutionAction
            );


            return;

        }


        const actionButton =
            event.target.closest(
                "[data-action]"
            );


        if(!actionButton){

            return;

        }


        const action =
            actionButton.dataset
                .action;


        if(
            !action ||
            !action.startsWith(
                "evolution:"
            )
        ){

            return;

        }


        event.preventDefault();


        EvolutionApp.handleGenericAction(
            action,
            actionButton
        );

    }
);


/* =========================================================
   EVOLUTION SEARCH
========================================================= */

document.addEventListener(
    "input",
    event => {

        if(
            event.target.id !==
                "evolutionSearchInput"
        ){

            return;

        }


        EvolutionApp.searchQuery =
            String(
                event.target.value ||
                ""
            );


        clearTimeout(
            EvolutionApp.searchTimer
        );


        EvolutionApp.searchTimer =
            setTimeout(
                () => {

                    EvolutionApp.selectedEventId =
                        null;


                    EvolutionApp.editorMode =
                        null;


                    EvolutionApp.remount();

                },
                120
            );

    }
);


/* =========================================================
   EVOLUTION FORMS
========================================================= */

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target.closest(
                "[data-evolution-form]"
            );


        if(!form){

            return;

        }


        event.preventDefault();


        const entity =
            EvolutionApp
                .getCurrentEntity();


        if(!entity){

            return;

        }


        if(
            form.dataset
                .evolutionForm ===
                "create"
        ){

            EvolutionApp.createEvent(
                entity
            );


            return;

        }


        if(
            form.dataset
                .evolutionForm ===
                "edit"
        ){

            EvolutionApp.updateEvent();

        }

    }
);


/* =========================================================
   REGISTER
========================================================= */

try{

    VAERO?.register?.(
        "evolutionApp",
        EvolutionApp
    );

} catch(error){

    /* global remains available */

}


window.EvolutionApp =
    EvolutionApp;
