/* =========================================================
   VAERO EVOLUTION APP
   Life Events / Goals / Decisions / Progress
========================================================= */

const EvolutionApp = {

    version:
        "3.0.0",

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
                `Evolution service okunamadı: ${serviceName}`,
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
                "Evolution remount başarısız:",
                error
            );


            return false;

        }

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


            if(
                !awareness ||
                typeof awareness.enter !==
                    "function"
            ){

                return false;

            }


            awareness.enter(
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
                        this.editorMode,

                    searchActive:
                        Boolean(
                            String(
                                this.searchQuery ||
                                    ""
                            ).trim()
                        ),

                    source:
                        "evolution-app"

                }
            );


            return true;

        } catch(error){

            console.warn(
                "Evolution Brain context açılamadı:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       EVOLUTION CORE
    ===================================================== */

    getEvolutionCore(){

        return (
            this.getService(
                "evolution"
            ) ||
            (
                typeof window !==
                    "undefined"
                    ? window.Evolution ||
                      null
                    : null
            )
        );

    },


    getEvents(
        entity = null,
        options = {}
    ){

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
                        entity.id,
                        {
                            includeArchived:
                                options.includeArchived ===
                                true
                        }
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
                    evolution.all({
                        includeArchived:
                            options.includeArchived ===
                            true
                    });


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
            .filter(
                Boolean
            )
            .filter(
                event =>
                    options.includeArchived ===
                        true ||
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

        const candidates = [

            event?.occurredAt,
            event?.updatedAt,
            event?.createdAt,
            event?.timestamp,
            event?.time

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
                ).split(
                    ","
                );


        const seen =
            new Set();


        const tags =
            [];


        source.forEach(
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


    setSearchQuery(value){

        this.searchQuery =
            String(
                value ??
                    ""
            ).slice(
                0,
                500
            );


        this.selectedEventId =
            null;


        this.editorMode =
            null;


        return this.searchQuery;

    },


    normalizeSearch(value){

        return String(
            value ??
                ""
        )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            )
            .replace(
                /\s+/g,
                " "
            );

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
            this.normalizeSearch(
                this.searchQuery
            );


        if(query){

            events =
                events.filter(
                    event => {

                        const haystack =
                            this.normalizeSearch(
                                [

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
            this.getEvents(
                this.getCurrentEntity(),
                {
                    includeArchived:
                        true
                }
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

        if(
            typeof document ===
                "undefined"
        ){

            return null;

        }


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
       CONTINUE IN PART 2
    ===================================================== */

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


        if(!values){

            return false;

        }


        if(!values.title){

            values.titleInput
                ?.focus?.();


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


        const engine =
            this.getEngine();


        const metadata = {

            title:
                values.title,

            description:
                values.description,

            relatedEntityId:
                entity.id,

            relatedWorldId:
                engine?.currentWorld?.id ||
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


        if(
            !created ||
            !created.id
        ){

            return false;

        }


        this.selectedEventId =
            created.id;


        this.editorMode =
            null;


        this.enterBrainContext(
            entity
        );


        return this.remount();

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    updateEvent(){

        const entity =
            this.getCurrentEntity();


        if(!entity){

            return false;

        }


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


        if(!values){

            return false;

        }


        if(!values.title){

            values.titleInput
                ?.focus?.();


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


        this.enterBrainContext(
            entity
        );


        return this.remount();

    },


    /* =====================================================
       ARCHIVE
    ===================================================== */

    archiveEvent(){

        const entity =
            this.getCurrentEntity();


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


        if(entity){

            this.enterBrainContext(
                entity
            );

        }


        return this.remount();

    },


    /* =====================================================
       RESTORE
    ===================================================== */

    restoreEvent(eventId){

        if(!eventId){

            return false;

        }


        const evolution =
            this.getEvolutionCore();


        if(
            !evolution ||
            typeof evolution.restore !==
                "function"
        ){

            return false;

        }


        try{

            const result =
                evolution.restore(
                    eventId
                );


            if(!result){

                return false;

            }


            this.selectedEventId =
                eventId;


            this.editorMode =
                null;


            return this.remount();

        } catch(error){

            console.warn(
                "Evolution olayı geri yüklenemedi:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       LINKED RECORDS
    ===================================================== */

    getTimelineCore(){

        return this.getService(
            "timeline"
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
            (
                typeof window !==
                    "undefined"
                    ? window.MemorySystem ||
                      null
                    : null
            )
        );

    },


    getLinkedRecordCounts(event){

        if(!event?.id){

            return {

                timeline:
                    0,

                memory:
                    0

            };

        }


        const eventId =
            String(
                event.id
            );


        const timeline =
            this.getTimelineCore();


        let timelineRecords =
            [];


        try{

            if(
                timeline &&
                typeof timeline.all ===
                    "function"
            ){

                const result =
                    timeline.all({
                        includeArchived:
                            true
                    });


                timelineRecords =
                    Array.isArray(
                        result
                    )
                        ? result
                        : [];

            }

        } catch(error){

            timelineRecords =
                [];

        }


        const memory =
            this.getMemoryCore();


        let memoryRecords =
            [];


        try{

            if(
                memory &&
                typeof memory.all ===
                    "function"
            ){

                const result =
                    memory.all({
                        includeArchived:
                            true
                    });


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


        const matchesEvent =
            record => {

                if(!record){

                    return false;

                }


                const candidates = [

                    record.sourceEventId,
                    record.eventId,
                    record.relatedEventId,
                    record.sourceId,

                    record.payload
                        ?.sourceEventId,

                    record.payload
                        ?.eventId,

                    record.payload
                        ?.relatedEventId,

                    record.context
                        ?.sourceEventId

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


                return candidates.includes(
                    eventId
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
       LINKED RECORD NAVIGATION
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
                    `Evolution bağlantılı sayfa açılamadı: ${page}`,
                    error
                );

            }

        }


        return false;

    },


    openLinkedRecords(target){

        const normalized =
            String(
                target ||
                    ""
            )
                .trim()
                .toLowerCase();


        if(
            ![
                "timeline",
                "memory"
            ].includes(
                normalized
            )
        ){

            return false;

        }


        const event =
            this.findEvent(
                this.selectedEventId
            );


        if(!event){

            return false;

        }


        if(
            normalized ===
                "timeline" &&
            typeof window !==
                "undefined" &&
            window.TimelineApp
        ){

            try{

                window.TimelineApp
                    .selectedItemId =
                    null;


                window.TimelineApp
                    .searchQuery =
                    "";


                window.TimelineApp
                    .activeFilter =
                    "all";

            } catch(error){

                /* navigation still allowed */

            }

        }


        if(
            normalized ===
                "memory" &&
            typeof window !==
                "undefined" &&
            window.MemoryApp
        ){

            try{

                window.MemoryApp
                    .selectedMemoryId =
                    null;


                window.MemoryApp
                    .editorMode =
                    null;


                window.MemoryApp
                    .searchQuery =
                    "";

            } catch(error){

                /* navigation still allowed */

            }

        }


        return this.openEntityPage(
            normalized
        );

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
       CONTINUE IN PART 3
    ===================================================== */

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
                        enterkeyhint="search"
                        aria-label="Evolution içinde ara"
                        placeholder="Evolution içinde ara"
                        value="${this.escapeHTML(
                            this.searchQuery
                        )}"
                    >

                </label>

                <div
                    class="evolution-filter-row"
                    role="group"
                    aria-label="Evolution filtreleri"
                >

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

        if(!event){

            return "";

        }


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


        const tags =
            Array.isArray(
                event.tags
            )
                ? event.tags.slice(
                    0,
                    3
                )
                : [];


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
                aria-label="${this.escapeHTML(
                    `${event.title || "Yaşam olayı"} detayını aç`
                )}"
            >

                <span
                    class="evolution-record-marker"
                    aria-hidden="true"
                >
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
                        tags.length
                            ? `
                                <span class="evolution-record-tags">

                                    ${tags
                                        .map(
                                            tag => `
                                                <small>
                                                    ${this.escapeHTML(
                                                        tag
                                                    )}
                                                </small>
                                            `
                                        )
                                        .join(
                                            ""
                                        )}

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
                                    .join(
                                        ""
                                    )}

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
                                        ([
                                            value,
                                            label
                                        ]) => `
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
                                    .join(
                                        ""
                                    )}

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
                                        ([
                                            value,
                                            label
                                        ]) => `
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
                                    .join(
                                        ""
                                    )}

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
                    aria-labelledby="evolutionDetailTitle"
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

                            <h2 id="evolutionDetailTitle">
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
                            Array.isArray(
                                event.tags
                            ) &&
                            event.tags.length
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
                                            .join(
                                                ""
                                            )}

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

        const filtered =
            Boolean(
                this.searchQuery
            ) ||
            this.activeFilter !==
                "all";


        return `
            <div class="section evolution-empty">

                <span aria-hidden="true">
                    ⌬
                </span>

                <h3>
                    ${
                        filtered
                            ? "Eşleşen olay bulunamadı"
                            : "Evolution henüz sessiz"
                    }
                </h3>

                <p>
                    ${
                        filtered
                            ? "Arama veya filtreyi değiştirerek tekrar deneyebilirsin."
                            : "İlk kararını, hedefini, başarını veya dönüm noktanı kaydederek gelişim akışını başlat."
                    }
                </p>

                ${
                    filtered
                        ? `
                            <button
                                type="button"
                                class="secondary-btn"
                                data-evolution-action="reset"
                            >
                                Filtreleri Temizle
                            </button>
                        `
                        : `
                            <button
                                type="button"
                                class="primary-btn"
                                data-evolution-action="create"
                            >
                                İlk Olayı Oluştur
                            </button>
                        `
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
                        "EVOLUTION",
                        "⌬"
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
                    EVOLUTION
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

    handleCommand(action){

        const entity =
            this.getCurrentEntity();


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

            case "create":

                this.selectedEventId =
                    null;


                this.editorMode =
                    "create";


                if(entity){

                    this.enterBrainContext(
                        entity
                    );

                }


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


                if(entity){

                    this.enterBrainContext(
                        entity
                    );

                }


                return this.remount();


            case "archive":

                return this.archiveEvent();


            case "editor:cancel":

                this.editorMode =
                    null;


                if(entity){

                    this.enterBrainContext(
                        entity
                    );

                }


                return this.remount();


            case "reset":

                this.activeFilter =
                    "all";


                this.searchQuery =
                    "";


                this.selectedEventId =
                    null;


                this.editorMode =
                    null;


                if(entity){

                    this.enterBrainContext(
                        entity
                    );

                }


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

        const entity =
            this.getCurrentEntity();


        switch(action){

            case "evolution:filter":

                this.setFilter(
                    button?.dataset
                        ?.filter ||
                    "all"
                );


                if(entity){

                    this.enterBrainContext(
                        entity
                    );

                }


                return this.remount();


            case "evolution:event:open": {

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


                if(entity){

                    this.enterBrainContext(
                        entity
                    );

                }


                return this.remount();

            }


            case "evolution:event:close":

                this.clearSelectedEvent();


                if(entity){

                    this.enterBrainContext(
                        entity
                    );

                }


                return this.remount();


            case "evolution:linked:open":

                return this.openLinkedRecords(
                    button?.dataset
                        ?.target ||
                    ""
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
                                "evolutionSearchInput"
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


        const events =
            entity
                ? this.getEvents(
                    entity
                )
                : [];


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

            selectedEventId:
                this.selectedEventId,

            editorMode:
                this.editorMode,

            eventCount:
                events.length,

            stats:
                this.getStats(
                    events
                ),

            progress:
                this.getEvolutionProgress(
                    events
                )

        };

    }

};


/* =========================================================
   EVOLUTION COMMANDS
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


            const evolutionButton =
                target.closest(
                    "[data-evolution-action]"
                );


            if(!evolutionButton){

                return;

            }


            event.preventDefault();


            EvolutionApp.handleCommand(
                evolutionButton.dataset
                    .evolutionAction
            );

        }
    );

    /* =====================================================
       EVOLUTION SEARCH
    ===================================================== */

    document.addEventListener(
        "input",
        event => {

            if(
                event.target?.id !==
                    "evolutionSearchInput"
            ){

                return;

            }


            EvolutionApp.handleSearchInput(
    event.target.value,
    event.target.selectionStart,
    event.target.selectionEnd
);

        }
    );


    /* =====================================================
       EVOLUTION FORMS
    ===================================================== */

    document.addEventListener(
        "submit",
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


            const form =
                target.closest(
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
            "evolutionApp",
            EvolutionApp
        );

    }

} catch(error){

    console.warn(
        "EvolutionApp VAERO registration failed:",
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

    window.EvolutionApp =
        EvolutionApp;

}
