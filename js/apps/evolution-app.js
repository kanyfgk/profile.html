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
                typeof VAERO.get !==
                    "function"
            ){
                return null;
            }


            return (
                VAERO.get(name) ||
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


        return engine.mount(
            engine.currentEntity
        );

    },


    /* =====================================================
       BRAIN CONTEXT
    ===================================================== */

    enterBrainContext(entity = null){

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
                        this.selectedEventId
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


    getEvents(entity = null){

        const evolution =
            this.getEvolutionCore();


        if(
            !evolution ||
            typeof evolution.all !==
                "function"
        ){
            return [];
        }


        let events = [];


        try{

            if(
                entity?.id &&
                typeof evolution.forEntity ===
                    "function"
            ){

                events =
                    evolution.forEntity(
                        entity.id
                    ) ||
                    [];

            } else {

                events =
                    evolution.all() ||
                    [];

            }

        } catch(error){

            console.warn(
                "Evolution olayları okunamadı:",
                error
            );


            return [];

        }


        if(
            !Array.isArray(events)
        ){
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
                (a,b) =>
                    this.getTimestamp(b) -
                    this.getTimestamp(a)
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


        return allowed.includes(type)
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
            labels[value] ||
            "Orta"
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
            labels[value] ||
            value ||
            "Tamamlandı"
        );

    },


    /* =====================================================
       DATE
    ===================================================== */

    getTimestamp(event){

        return Number(
            event?.occurredAt ||
            event?.updatedAt ||
            event?.createdAt ||
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


    /* =====================================================
       TAGS
    ===================================================== */

    parseTags(value){

        return [
            ...new Set(
                String(
                    value ||
                    ""
                )
                    .split(",")
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(Boolean)
            )
        ];

    },


    /* =====================================================
       XP / PROGRESS
    ===================================================== */

    getEventXP(event = {}){

        const direct =
            Number(
                event.xp
            );


        if(
            Number.isFinite(direct) &&
            direct >= 0
        ){
            return direct;
        }


        const payloadXP =
            Number(
                event.payload?.xp
            );


        if(
            Number.isFinite(payloadXP) &&
            payloadXP >= 0
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
                event.importance
            ] ||
            10
        );

    },


    getEvolutionProgress(events){

        const totalXP =
            events.reduce(
                (total,event) =>
                    total +
                    this.getEventXP(
                        event
                    ),
                0
            );


        const level =
            Math.floor(
                totalXP / 100
            ) + 1;


        const currentLevelXP =
            totalXP % 100;


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


    getGoalProgress(event){

        const direct =
            Number(
                event.progress
            );


        if(
            Number.isFinite(direct)
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
            Number.isFinite(payload)
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
            event.status ===
                "completed"
                ? 100
                : 0
        );

    },


    /* =====================================================
       FILTER / SEARCH
    ===================================================== */

    setFilter(filter){

        const allowed = [
            "all",
            "important",
            "achievement",
            "decision",
            "goal",
            "milestone"
        ];


        this.activeFilter =
            allowed.includes(
                filter
            )
                ? filter
                : "all";


        this.selectedEventId =
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
                    event =>
                        event.importance ===
                            "high" ||
                        event.importance ===
                            "critical"
                );

        } else if(
            this.activeFilter !==
                "all"
        ){

            events =
                events.filter(
                    event =>
                        event.type ===
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

                            ...(event.tags || [])

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

        if(!eventId){
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

                return (
                    evolution.find(
                        eventId
                    ) ||
                    null
                );

            } catch(error){

                /* fallback */
            }

        }


        return (
            this
                .getEvents(
                    this.getCurrentEntity()
                )
                .find(
                    event =>
                        event.id ===
                        eventId
                ) ||
            null
        );

    },


    selectEvent(eventId){

        this.selectedEventId =
            String(
                eventId ||
                ""
            ).trim() ||
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
       CREATE
    ===================================================== */

    createEvent(entity){

        if(
            !entity ||
            !entity.id
        ){
            return false;
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
            ).trim();


        if(!title){

            titleInput?.focus();

            return false;

        }


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
            type === "goal"
                ? Math.min(
                    100,
                    Math.max(
                        0,
                        Number(
                            progressInput?.value ||
                            0
                        )
                    )
                )
                : undefined;


        const evolution =
            this.getEvolutionCore();


        if(
            !evolution ||
            typeof evolution.record !==
                "function"
        ){
            return false;
        }


        let created =
            null;


        const metadata = {

            title,

            description:
                String(
                    descriptionInput?.value ||
                    ""
                ).trim(),

            relatedEntityId:
                entity.id,

            relatedWorldId:
                this.getEngine()
                    ?.currentWorld
                    ?.id ||
                null,

            source:
                "evolution-app",

            status,

            importance,

            tags:
                this.parseTags(
                    tagsInput?.value
                )
        };


        if(
            progress !== undefined
        ){

            metadata.progress =
                progress;

        }


        try{

            created =
                evolution.record(
                    type,
                    metadata.description ||
                    title,
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
                "Evolution Core update API henüz kullanılamıyor."
            );


            return false;

        }


        const title =
            String(
                document.getElementById(
                    "evolutionTitleInput"
                )?.value ||
                ""
            ).trim();


        if(!title){
            return false;
        }


        const type =
            this.normalizeType(
                document.getElementById(
                    "evolutionTypeInput"
                )?.value
            );


        const changes = {

            title,

            description:
                String(
                    document.getElementById(
                        "evolutionDescriptionInput"
                    )?.value ||
                    ""
                ).trim(),

            type,

            importance:
                this.normalizeImportance(
                    document.getElementById(
                        "evolutionImportanceInput"
                    )?.value
                ),

            status:
                this.normalizeStatus(
                    document.getElementById(
                        "evolutionStatusInput"
                    )?.value
                ),

            tags:
                this.parseTags(
                    document.getElementById(
                        "evolutionTagsInput"
                    )?.value
                )

        };


        if(type === "goal"){

            changes.progress =
                Math.min(
                    100,
                    Math.max(
                        0,
                        Number(
                            document.getElementById(
                                "evolutionProgressInput"
                            )?.value ||
                            0
                        )
                    )
                );

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
            updated.id;

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
                timeline:0,
                memory:0
            };

        }


        const timeline =
            this.getService(
                "timeline"
            );


        const memory =
            this.getService(
                "memorySystem"
            );


        let timelineRecords = [];

        let memoryRecords = [];


        try{

            timelineRecords =
                timeline?.all?.({
                    includeArchived:true
                }) ||
                [];

        } catch(error){

            timelineRecords = [];

        }


        try{

            memoryRecords =
                memory?.all?.({
                    includeArchived:true
                }) ||
                [];

        } catch(error){

            memoryRecords = [];

        }


        return {

            timeline:
                timelineRecords.filter(
                    record =>
                        record?.payload
                            ?.sourceEventId ===
                        event.id
                ).length,

            memory:
                memoryRecords.filter(
                    record =>
                        record?.payload
                            ?.sourceEventId ===
                        event.id
                ).length

        };

    },


    /* =====================================================
       BRAIN ANALYSIS
       Local deterministic interpretation.
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
            event?.type
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
                    "Kararın nedenini ve sonuçlarını Memory ile ilişkilendirmek faydalı olur.";

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


        if(
            event?.importance ===
                "critical"
        ){

            analysis.impact =
                "Kritik";

            analysis.risk =
                "Yüksek";

        } else if(
            event?.importance ===
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

            achievements:
                events.filter(
                    event =>
                        event.type ===
                            "achievement"
                ).length,

            goals:
                events.filter(
                    event =>
                        event.type ===
                            "goal" &&
                        event.status !==
                            "completed"
                ).length

        };

    },


    /* =====================================================
       FILTER BAR
    ===================================================== */

    renderToolbar(){

        const filters = [

            {
                id:"all",
                label:"Tümü"
            },

            {
                id:"important",
                label:"Önemli"
            },

            {
                id:"achievement",
                label:"Başarı"
            },

            {
                id:"decision",
                label:"Karar"
            },

            {
                id:"goal",
                label:"Hedef"
            },

            {
                id:"milestone",
                label:"Dönüm Noktası"
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

        return `
            <section class="evolution-progress-card">

                <div>

                    <span class="engine-section-label">
                        EVOLUTION LEVEL
                    </span>

                    <strong>
                        Seviye ${progress.level}
                    </strong>

                </div>


                <div class="evolution-progress-value">

                    <strong>
                        ${progress.totalXP} XP
                    </strong>

                    <small>
                        ${progress.currentLevelXP}
                        / 100
                    </small>

                </div>


                <div class="evolution-progress-track">

                    <span
                        style="
                            width:${progress.progressPercent}%;
                        "
                    ></span>

                </div>

            </section>
        `;

    },


    /* =====================================================
       EVENT CARD
    ===================================================== */

    renderEvent(event){

        const progress =
            event.type ===
                "goal"
                ? this.getGoalProgress(
                    event
                )
                : null;


        return `
            <button
                type="button"
                class="
                    evolution-record
                    evolution-importance-${this.escapeHTML(
                        event.importance ||
                        "medium"
                    )}
                "
                data-action="evolution:event:open"
                data-event-id="${this.escapeHTML(
                    event.id
                )}"
            >

                <span class="evolution-record-marker">
                    ${
                        event.type ===
                            "achievement"
                            ? "★"
                            : event.type ===
                                "goal"
                                ? "◎"
                                : event.type ===
                                    "decision"
                                    ? "◇"
                                    : event.type ===
                                        "milestone"
                                        ? "◆"
                                        : "⌬"
                    }
                </span>


                <span class="evolution-record-body">

                    <span class="evolution-record-meta">

                        <small>
                            ${this.escapeHTML(
                                this.getTypeLabel(
                                    event.type
                                )
                            )}
                        </small>

                        <small>
                            ${this.escapeHTML(
                                this.getImportanceLabel(
                                    event.importance
                                )
                            )}
                        </small>

                        <small>
                            ${this.escapeHTML(
                                this.getStatusLabel(
                                    event.status
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
                        event.description
                            ? `
                                <span class="evolution-record-description">
                                    ${this.escapeHTML(
                                        event.description.length > 150
                                            ? `${event.description
                                                .slice(
                                                    0,
                                                    150
                                                )
                                                .trim()}…`
                                            : event.description
                                    )}
                                </span>
                              `
                            : ""
                    }


                    ${
                        progress !== null
                            ? `
                                <span class="evolution-goal-progress">

                                    <span>
                                        <i
                                            style="
                                                width:${progress}%;
                                            "
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
                                        .slice(0,3)
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

    renderEditor(event = null){

        const editing =
            Boolean(
                event
            );


        const type =
            event?.type ||
            "general";


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
                                    ["planned","Planlandı"],
                                    ["progress","Devam Ediyor"],
                                    ["completed","Tamamlandı"],
                                    ["paused","Duraklatıldı"],
                                    ["cancelled","İptal Edildi"]
                                ]
                                    .map(
                                        ([value,label]) => `
                                            <option
                                                value="${value}"
                                                ${
                                                    (
                                                        event?.status ||
                                                        "completed"
                                                    ) ===
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
                                    ["low","Düşük"],
                                    ["medium","Orta"],
                                    ["high","Yüksek"],
                                    ["critical","Kritik"]
                                ]
                                    .map(
                                        ([value,label]) => `
                                            <option
                                                value="${value}"
                                                ${
                                                    (
                                                        event?.importance ||
                                                        "medium"
                                                    ) ===
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


        const progress =
            event.type ===
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
                >

                    <header class="evolution-detail-header">

                        <div>

                            <span class="engine-section-label">
                                ${this.escapeHTML(
                                    this.getTypeLabel(
                                        event.type
                                    )
                                )}
                            </span>

                            <h2>
                                ${this.escapeHTML(
                                    event.title
                                )}
                            </h2>

                        </div>


                        <button
                            type="button"
                            class="engine-icon-btn"
                            data-action="evolution:event:close"
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
                            progress !== null
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
                                                style="
                                                    width:${progress}%;
                                                "
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
       RENDER
    ===================================================== */

    render(entity){

        this.enterBrainContext(
            entity
        );


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


                    ${UI.appHeader(
                        this.escapeHTML(
                            entity.name ||
                            "VAERO Varlığı"
                        ),
                        "EVOLUTION",
                        "⌬"
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


                    ${UI.brainPanel()}

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
                    !this.selectedEventId
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

        }


        return false;

    }

};


/* =========================================================
   EVOLUTION COMMANDS
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-evolution-action]"
            );


        if(!button){
            return;
        }


        event.preventDefault();


        EvolutionApp.handleCommand(
            button.dataset
                .evolutionAction
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
            EvolutionApp.getCurrentEntity();


        if(!entity){
            return;
        }


        if(
            form.dataset.evolutionForm ===
                "create"
        ){

            EvolutionApp.createEvent(
                entity
            );


            return;

        }


        if(
            form.dataset.evolutionForm ===
                "edit"
        ){

            EvolutionApp.updateEvent();

        }

    }
);


window.EvolutionApp =
    EvolutionApp;
