/* =========================================================
   VAERO MEMORY APP
   Entity Memory / Notes / Records / Context Surface
========================================================= */

const MemoryApp = {

    version:
        "3.0.0",

    searchQuery:
        "",

    searchTimer:
        null,

    activeCategory:
        "all",

    selectedMemoryId:
        null,

    editorMode:
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

            /* fallback */

        }


        return `memory_${Date.now()}_${Math.random()
            .toString(
                36
            )
            .slice(
                2,
                10
            )}`;

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
                `Memory service okunamadı: ${serviceName}`,
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
                "Memory remount başarısız:",
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
                "memory",
                {

                    entityId:
                        entity?.id ||
                        null,

                    category:
                        this.activeCategory,

                    selectedMemoryId:
                        this.selectedMemoryId,

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
                        "memory-app"

                }
            );


            return true;

        } catch(error){

            console.warn(
                "Memory Brain context açılamadı:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       MEMORY CORE
    ===================================================== */

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


    hasMemoryCore(){

        return Boolean(
            this.getMemoryCore()
        );

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    getAllowedCategories(){

        return [

            "all",
            "note",
            "decision",
            "idea",
            "event",
            "knowledge"

        ];

    },


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
            "knowledge"

        ];


        return allowed.includes(
            category
        )
            ? category
            : "note";

    },


    normalizeTags(value){

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


        const result =
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
                            50
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


                result.push(
                    tag
                );

            }
        );


        return result.slice(
            0,
            30
        );

    },


    normalizeMemory(
        memory = {},
        entityId = null
    ){

        const now =
            Date.now();


        const createdAt =
            Number(
                memory.createdAt
            ) ||
            now;


        const id =
            String(
                memory.id ||
                this.createId()
            )
                .trim()
                .slice(
                    0,
                    160
                );


        return {

            ...memory,

            id,

            entityId:
                String(
                    entityId ||
                    memory.entityId ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        160
                    ),

            title:
                String(
                    memory.title ||
                    "İsimsiz Hafıza"
                )
                    .trim()
                    .slice(
                        0,
                        90
                    ),

            content:
                String(
                    memory.content ||
                    memory.description ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        4000
                    ),

            category:
                this.normalizeCategory(
                    memory.category
                ),

            important:
                memory.important ===
                    true,

            pinned:
                memory.pinned ===
                    true,

            archived:
                memory.archived ===
                    true,

            source:
                String(
                    memory.source ||
                    "manual"
                )
                    .trim()
                    .slice(
                        0,
                        80
                    ),

            tags:
                this.normalizeTags(
                    memory.tags
                ),

            createdAt,

            updatedAt:
                Number(
                    memory.updatedAt
                ) ||
                createdAt

        };

    },


    parseTags(value){

        return this.normalizeTags(
            value
        );

    },


    /* =====================================================
       MEMORY CORE READ
    ===================================================== */

    readAllFromCore(){

        const memory =
            this.getMemoryCore();


        if(!memory){

            return [];

        }


        try{

            if(
                typeof memory.all ===
                    "function"
            ){

                const result =
                    memory.all();


                return Array.isArray(
                    result
                )
                    ? result
                    : [];

            }

        } catch(error){

            console.warn(
                "Memory Core kayıtları okunamadı:",
                error
            );

        }


        return [];

    },


    readEntityFromCore(entityId){

        if(!entityId){

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

                const result =
                    memory.forEntity(
                        entityId
                    );


                if(
                    Array.isArray(
                        result
                    )
                ){

                    return result;

                }

            }

        } catch(error){

            console.warn(
                "Memory Core entity sorgusu başarısız:",
                error
            );

        }


        return this
            .readAllFromCore()
            .filter(
                item =>
                    String(
                        item?.entityId ||
                            ""
                    ) ===
                    String(
                        entityId
                    )
            );

    },


    /* =====================================================
       CORE RECORD NORMALIZATION
    ===================================================== */

    getAllMemories(entity){

        if(
            !entity ||
            !entity.id
        ){

            return [];

        }


        const records =
            this.readEntityFromCore(
                entity.id
            );


        const seen =
            new Set();


        const memories =
            [];


        (
            Array.isArray(
                records
            )
                ? records
                : []
        )
            .filter(
                item =>
                    item &&
                    typeof item ===
                        "object" &&
                    !Array.isArray(
                        item
                    )
            )
            .forEach(
                item => {

                    const memory =
                        this.normalizeMemory(
                            item,
                            entity.id
                        );


                    if(
                        !memory.id ||
                        seen.has(
                            memory.id
                        )
                    ){

                        return;

                    }


                    seen.add(
                        memory.id
                    );


                    memories.push(
                        memory
                    );

                }
            );


        return memories;

    },


    findMemory(
        entity,
        memoryId
    ){

        if(
            !entity?.id ||
            !memoryId
        ){

            return null;

        }


        const id =
            String(
                memoryId
            );


        return (
            this.getAllMemories(
                entity
            )
                .find(
                    memory =>
                        String(
                            memory.id
                        ) ===
                        id
                ) ||
            null
        );

    },


    /* =====================================================
       SEARCH
    ===================================================== */

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


    matchesSearch(
        memory,
        query
    ){

        if(!query){

            return true;

        }


        if(!memory){

            return false;

        }


        const text =
            this.normalizeSearch(
                [

                    memory.title,
                    memory.content,
                    memory.category,
                    memory.source,

                    ...(
                        Array.isArray(
                            memory.tags
                        )
                            ? memory.tags
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


        return text.includes(
            query
        );

    },


    /* =====================================================
       QUERY
    ===================================================== */

    getMemories(
        entity,
        options = {}
    ){

        if(
            !entity ||
            !entity.id
        ){

            return [];

        }


        let memories =
            this.getAllMemories(
                entity
            );


        if(
            options.includeArchived !==
                true
        ){

            memories =
                memories.filter(
                    memory =>
                        memory.archived !==
                            true
                );

        }


        if(
            this.activeCategory !==
                "all"
        ){

            memories =
                memories.filter(
                    memory =>
                        memory.category ===
                            this.activeCategory
                );

        }


        const query =
            this.normalizeSearch(
                this.searchQuery
            );


        if(query){

            memories =
                memories.filter(
                    memory =>
                        this.matchesSearch(
                            memory,
                            query
                        )
                );

        }


        memories.sort(
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


        return memories;

    },


    /* =====================================================
       FILTER STATE
    ===================================================== */

    setCategory(category){

        const normalized =
            String(
                category ||
                    "all"
            )
                .trim()
                .toLowerCase();


        this.activeCategory =
            this.getAllowedCategories()
                .includes(
                    normalized
                )
                ? normalized
                : "all";


        this.selectedMemoryId =
            null;


        this.editorMode =
            null;


        return this.activeCategory;

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


        this.selectedMemoryId =
            null;


        this.editorMode =
            null;


        return this.searchQuery;

    },


    resetFilters(){

        this.searchQuery =
            "";


        this.activeCategory =
            "all";


        this.selectedMemoryId =
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
                "memoryTitleInput"
            );


        const contentInput =
            document.getElementById(
                "memoryContentInput"
            );


        const categoryInput =
            document.getElementById(
                "memoryCategoryInput"
            );


        const tagsInput =
            document.getElementById(
                "memoryTagsInput"
            );


        const importantInput =
            document.getElementById(
                "memoryImportantInput"
            );


        const title =
            String(
                titleInput?.value ||
                    ""
            )
                .trim()
                .slice(
                    0,
                    90
                );


        const content =
            String(
                contentInput?.value ||
                    ""
            )
                .trim()
                .slice(
                    0,
                    4000
                );


        if(!title){

            titleInput?.focus?.();


            return null;

        }


        if(!content){

            contentInput?.focus?.();


            return null;

        }


        return {

            title,

            content,

            category:
                this.normalizeCategory(
                    categoryInput?.value
                ),

            tags:
                this.parseTags(
                    tagsInput?.value
                ),

            important:
                Boolean(
                    importantInput?.checked
                )

        };

    },


    /* =====================================================
       CONTINUE IN PART 2
    ===================================================== */

   /* =====================================================
   MEMORY CORE WRITE
===================================================== */

    createMemory(entity){

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


        const memory =
            this.getMemoryCore();


        if(
            !memory ||
            typeof memory.create !==
                "function"
        ){

            console.error(
                "Memory Core create API bulunamadı."
            );


            return false;

        }


        const engine =
            this.getEngine();


        let created =
            null;


        try{

            created =
                memory.create({

                    entityId:
                        entity.id,

                    worldId:
                        engine?.currentWorld?.id ||
                        null,

                    title:
                        values.title,

                    content:
                        values.content,

                    category:
                        values.category,

                    tags:
                        values.tags,

                    important:
                        values.important,

                    pinned:
                        false,

                    archived:
                        false,

                    source:
                        "manual",

                    type:
                        "memory",

                    payload: {

                        source:
                            "memory-app",

                        entityId:
                            entity.id,

                        worldId:
                            engine?.currentWorld?.id ||
                            null

                    }

                });

        } catch(error){

            console.error(
                "Memory oluşturulamadı:",
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


        this.editorMode =
            null;


        this.selectedMemoryId =
            created.id;


        this.recordEvolution(
            entity,
            created,
            "created"
        );


        this.enterBrainContext(
            entity
        );


        return this.remount();

    },


    /* =====================================================
       UPDATE MEMORY
    ===================================================== */

    updateMemory(entity){

        if(
            !entity ||
            !entity.id ||
            !this.selectedMemoryId
        ){

            return false;

        }


        const values =
            this.readEditorValues();


        if(!values){

            return false;

        }


        const memory =
            this.getMemoryCore();


        if(
            !memory ||
            typeof memory.update !==
                "function"
        ){

            console.error(
                "Memory Core update API bulunamadı."
            );


            return false;

        }


        let updated =
            null;


        try{

            updated =
                memory.update(
                    this.selectedMemoryId,
                    {

                        title:
                            values.title,

                        content:
                            values.content,

                        category:
                            values.category,

                        tags:
                            values.tags,

                        important:
                            values.important,

                        source:
                            "manual",

                        payload: {

                            source:
                                "memory-app",

                            entityId:
                                entity.id

                        }

                    }
                );

        } catch(error){

            console.error(
                "Memory güncellenemedi:",
                error
            );


            return false;

        }


        if(!updated){

            return false;

        }


        this.editorMode =
            null;


        this.selectedMemoryId =
            updated.id ||
            this.selectedMemoryId;


        this.recordEvolution(
            entity,
            updated,
            "updated"
        );


        this.enterBrainContext(
            entity
        );


        return this.remount();

    },


    /* =====================================================
       MUTATION HELPERS
    ===================================================== */

    togglePin(
        entity,
        memoryId
    ){

        if(
            !entity?.id ||
            !memoryId
        ){

            return false;

        }


        const memory =
            this.getMemoryCore();


        if(
            !memory ||
            typeof memory.togglePin !==
                "function"
        ){

            return false;

        }


        try{

            const result =
                memory.togglePin(
                    memoryId
                );


            if(!result){

                return false;

            }


            this.enterBrainContext(
                entity
            );


            return this.remount();

        } catch(error){

            console.warn(
                "Memory pin durumu değiştirilemedi:",
                error
            );


            return false;

        }

    },


    toggleImportant(
        entity,
        memoryId
    ){

        if(
            !entity?.id ||
            !memoryId
        ){

            return false;

        }


        const memory =
            this.getMemoryCore();


        if(
            !memory ||
            typeof memory.toggleImportant !==
                "function"
        ){

            return false;

        }


        try{

            const result =
                memory.toggleImportant(
                    memoryId
                );


            if(!result){

                return false;

            }


            this.enterBrainContext(
                entity
            );


            return this.remount();

        } catch(error){

            console.warn(
                "Memory önem durumu değiştirilemedi:",
                error
            );


            return false;

        }

    },


    archiveMemory(
        entity,
        memoryId
    ){

        if(
            !entity?.id ||
            !memoryId
        ){

            return false;

        }


        const memory =
            this.getMemoryCore();


        if(
            !memory ||
            typeof memory.archive !==
                "function"
        ){

            return false;

        }


        try{

            const result =
                memory.archive(
                    memoryId
                );


            if(!result){

                return false;

            }


            if(
                this.selectedMemoryId ===
                    memoryId
            ){

                this.selectedMemoryId =
                    null;

            }


            this.editorMode =
                null;


            this.enterBrainContext(
                entity
            );


            return this.remount();

        } catch(error){

            console.warn(
                "Memory arşivlenemedi:",
                error
            );


            return false;

        }

    },


    restoreMemory(
        entity,
        memoryId
    ){

        if(
            !entity?.id ||
            !memoryId
        ){

            return false;

        }


        const memory =
            this.getMemoryCore();


        if(
            !memory ||
            typeof memory.restore !==
                "function"
        ){

            return false;

        }


        try{

            const result =
                memory.restore(
                    memoryId
                );


            if(!result){

                return false;

            }


            this.selectedMemoryId =
                memoryId;


            this.editorMode =
                null;


            this.enterBrainContext(
                entity
            );


            return this.remount();

        } catch(error){

            console.warn(
                "Memory geri yüklenemedi:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       OPTIONAL HARD REMOVE
    ===================================================== */

    removeMemory(
        entity,
        memoryId
    ){

        if(
            !entity?.id ||
            !memoryId
        ){

            return false;

        }


        const memory =
            this.getMemoryCore();


        if(
            !memory ||
            typeof memory.remove !==
                "function"
        ){

            return false;

        }


        try{

            const result =
                memory.remove(
                    memoryId
                );


            if(!result){

                return false;

            }


            if(
                this.selectedMemoryId ===
                    memoryId
            ){

                this.selectedMemoryId =
                    null;

            }


            this.editorMode =
                null;


            this.enterBrainContext(
                entity
            );


            return this.remount();

        } catch(error){

            console.warn(
                "Memory silinemedi:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       EVOLUTION RECORD
    ===================================================== */

    recordEvolution(
        entity,
        memory,
        action
    ){

        if(
            !entity?.id ||
            !memory
        ){

            return false;

        }


        const evolution =
            this.getService(
                "evolution"
            );


        if(
            !evolution ||
            typeof evolution.record !==
                "function"
        ){

            return false;

        }


        const labels = {

            created:
                "hafızaya eklendi",

            updated:
                "hafızada güncellendi"

        };


        const engine =
            this.getEngine();


        try{

            const result =
                evolution.record(
                    "life-event",
                    `${memory.title || "Hafıza"} ${
                        labels[
                            action
                        ] ||
                        "güncellendi"
                    }`,
                    {

                        title:
                            memory.title ||
                            "Hafıza",

                        description:
                            memory.content ||
                            "",

                        source:
                            "memory",

                        status:
                            "completed",

                        importance:
                            memory.important ===
                                true
                                ? "high"
                                : "low",

                        relatedEntityId:
                            entity.id,

                        relatedWorldId:
                            engine?.currentWorld?.id ||
                            null,

                        memoryId:
                            memory.id,

                        organs: [
                            "memory",
                            "timeline"
                        ],

                        tags: [

                            "memory",

                            memory.category ||
                            "note",

                            ...(
                                Array.isArray(
                                    memory.tags
                                )
                                    ? memory.tags
                                    : []
                            )

                        ]

                    }
                );


            return result !==
                false;

        } catch(error){

            console.warn(
                "Memory Evolution kaydı oluşturulamadı:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       FORMAT
    ===================================================== */

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

            return "";

        }


        try{

            return new Date(
                value
            ).toLocaleString(
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
            );

        } catch(error){

            return "";

        }

    },


    categoryLabel(category){

        const labels = {

            all:
                "Tümü",

            note:
                "Not",

            decision:
                "Karar",

            idea:
                "Fikir",

            event:
                "Olay",

            knowledge:
                "Bilgi"

        };


        return (
            labels[
                category
            ] ||
            category
        );

    },


    categoryIcon(category){

        const icons = {

            note:
                "◫",

            decision:
                "◇",

            idea:
                "✦",

            event:
                "◷",

            knowledge:
                "⌁"

        };


        return (
            icons[
                category
            ] ||
            "◫"
        );

    },


    /* =====================================================
       STATS
    ===================================================== */

    getStats(entity){

        if(!entity?.id){

            return {

                total:
                    0,

                important:
                    0,

                pinned:
                    0

            };

        }


        const memory =
            this.getMemoryCore();


        if(
            memory &&
            typeof memory.stats ===
                "function"
        ){

            try{

                const stats =
                    memory.stats(
                        entity.id
                    );


                if(
                    stats &&
                    typeof stats ===
                        "object"
                ){

                    return {

                        total:
                            Number(
                                stats.total
                            ) ||
                            0,

                        important:
                            Number(
                                stats.important
                            ) ||
                            0,

                        pinned:
                            Number(
                                stats.pinned
                            ) ||
                            0

                    };

                }

            } catch(error){

                /* local fallback */

            }

        }


        const memories =
            this.getAllMemories(
                entity
            )
                .filter(
                    item =>
                        item.archived !==
                            true
                );


        return {

            total:
                memories.length,

            important:
                memories.filter(
                    item =>
                        item.important ===
                            true
                ).length,

            pinned:
                memories.filter(
                    item =>
                        item.pinned ===
                            true
                ).length

        };

    },


    /* =====================================================
       CONTINUE IN PART 3
    ===================================================== */

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
                        "İsimsiz Varlık",
                        "MEMORY",
                        "◫"
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
                    MEMORY
                </span>

                <h1>
                    ${this.escapeHTML(
                        entity?.name ||
                        "İsimsiz Varlık"
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
       TOOLBAR
    ===================================================== */

    renderToolbar(){

        const categories = [

            "all",
            "note",
            "decision",
            "idea",
            "event",
            "knowledge"

        ];


        return `
            <div class="memory-toolbar">

                <label class="memory-search">

                    <span aria-hidden="true">
                        ⌕
                    </span>

                    <input
                        id="memorySearchInput"
                        type="search"
                        autocomplete="off"
                        enterkeyhint="search"
                        aria-label="Hafızada ara"
                        placeholder="Hafızada ara"
                        value="${this.escapeHTML(
                            this.searchQuery
                        )}"
                    >

                </label>

                <div
                    class="memory-category-tabs"
                    role="group"
                    aria-label="Memory kategorileri"
                >

                    ${categories
                        .map(
                            category => `
                                <button
                                    type="button"
                                    class="memory-category-btn ${
                                        this.activeCategory ===
                                            category
                                            ? "is-active"
                                            : ""
                                    }"
                                    data-memory-action="category"
                                    data-memory-category="${this.escapeHTML(
                                        category
                                    )}"
                                    aria-pressed="${
                                        this.activeCategory ===
                                            category
                                            ? "true"
                                            : "false"
                                    }"
                                >
                                    ${this.escapeHTML(
                                        this.categoryLabel(
                                            category
                                        )
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
                    class="primary-btn memory-new-btn"
                    data-memory-action="create"
                >
                    + Yeni Hafıza
                </button>

            </div>
        `;

    },


    /* =====================================================
       STATS
    ===================================================== */

    renderStats(entity){

        const stats =
            this.getStats(
                entity
            );


        return `
            <div class="memory-stats">

                <div class="memory-stat">

                    <strong>
                        ${stats.total}
                    </strong>

                    <span>
                        Hafıza
                    </span>

                </div>

                <div class="memory-stat">

                    <strong>
                        ${stats.important}
                    </strong>

                    <span>
                        Önemli
                    </span>

                </div>

                <div class="memory-stat">

                    <strong>
                        ${stats.pinned}
                    </strong>

                    <span>
                        Sabitlenmiş
                    </span>

                </div>

            </div>
        `;

    },


    /* =====================================================
       MEMORY CARD
    ===================================================== */

    renderMemoryCard(memory){

        if(!memory){

            return "";

        }


        const content =
            String(
                memory.content ||
                    ""
            );


        const preview =
            content.length >
                130
                ? `${content
                    .slice(
                        0,
                        130
                    )
                    .trim()}…`
                : content;


        const tags =
            Array.isArray(
                memory.tags
            )
                ? memory.tags.slice(
                    0,
                    3
                )
                : [];


        return `
            <button
                type="button"
                class="memory-record ${
                    memory.pinned
                        ? "is-pinned"
                        : ""
                } ${
                    memory.important
                        ? "is-important"
                        : ""
                }"
                data-memory-action="open"
                data-memory-id="${this.escapeHTML(
                    memory.id
                )}"
                aria-label="${this.escapeHTML(
                    `${memory.title || "Hafıza"} detayını aç`
                )}"
            >

                <span
                    class="memory-record-icon"
                    aria-hidden="true"
                >
                    ${this.escapeHTML(
                        this.categoryIcon(
                            memory.category
                        )
                    )}
                </span>

                <span class="memory-record-body">

                    <span class="memory-record-meta">

                        <small>
                            ${this.escapeHTML(
                                this.categoryLabel(
                                    memory.category
                                )
                            )}
                        </small>

                        ${
                            memory.pinned
                                ? `
                                    <small>
                                        SABİT
                                    </small>
                                `
                                : ""
                        }

                        ${
                            memory.important
                                ? `
                                    <small>
                                        ÖNEMLİ
                                    </small>
                                `
                                : ""
                        }

                    </span>

                    <strong>
                        ${this.escapeHTML(
                            memory.title
                        )}
                    </strong>

                    ${
                        preview
                            ? `
                                <span class="memory-record-preview">
                                    ${this.escapeHTML(
                                        preview
                                    )}
                                </span>
                            `
                            : ""
                    }

                    ${
                        tags.length
                            ? `
                                <span class="memory-record-tags">

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

                <span class="memory-record-time">
                    ${this.escapeHTML(
                        this.formatDate(
                            memory.updatedAt
                        )
                    )}
                </span>

            </button>
        `;

    },


    /* =====================================================
       DETAIL
    ===================================================== */

    renderDetail(
        entity,
        memory
    ){

        if(!memory){

            return "";

        }


        return `
            <div class="memory-detail-layer">

                <div
                    class="memory-detail-backdrop"
                    data-memory-action="close"
                ></div>

                <section
                    class="memory-detail"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="memoryDetailTitle"
                >

                    <header class="memory-detail-header">

                        <div>

                            <span class="engine-section-label">
                                ${this.escapeHTML(
                                    this.categoryLabel(
                                        memory.category
                                    )
                                )}
                            </span>

                            <h2 id="memoryDetailTitle">
                                ${this.escapeHTML(
                                    memory.title
                                )}
                            </h2>

                        </div>

                        <button
                            type="button"
                            class="engine-icon-btn"
                            data-memory-action="close"
                            aria-label="Kapat"
                        >
                            ×
                        </button>

                    </header>

                    <div class="memory-detail-scroll">

                        <p class="memory-detail-content">
                            ${this.escapeHTML(
                                memory.content
                            )}
                        </p>

                        ${
                            Array.isArray(
                                memory.tags
                            ) &&
                            memory.tags.length
                                ? `
                                    <div class="memory-detail-tags">

                                        ${memory.tags
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

                        <div class="memory-detail-info">

                            <div>

                                <span>
                                    Oluşturuldu
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        this.formatDate(
                                            memory.createdAt
                                        )
                                    )}
                                </strong>

                            </div>

                            <div>

                                <span>
                                    Güncellendi
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        this.formatDate(
                                            memory.updatedAt
                                        )
                                    )}
                                </strong>

                            </div>

                            <div>

                                <span>
                                    Kaynak
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        memory.source ||
                                        "manual"
                                    )}
                                </strong>

                            </div>

                        </div>

                    </div>

                    <footer class="memory-detail-actions">

                        <button
                            type="button"
                            class="secondary-btn"
                            data-memory-action="pin"
                            data-memory-id="${this.escapeHTML(
                                memory.id
                            )}"
                        >
                            ${
                                memory.pinned
                                    ? "Sabitlemeyi Kaldır"
                                    : "Sabitle"
                            }
                        </button>

                        <button
                            type="button"
                            class="secondary-btn"
                            data-memory-action="important"
                            data-memory-id="${this.escapeHTML(
                                memory.id
                            )}"
                        >
                            ${
                                memory.important
                                    ? "Önemliyi Kaldır"
                                    : "Önemli Yap"
                            }
                        </button>

                        <button
                            type="button"
                            class="secondary-btn"
                            data-memory-action="edit"
                            data-memory-id="${this.escapeHTML(
                                memory.id
                            )}"
                        >
                            Düzenle
                        </button>

                        <button
                            type="button"
                            class="secondary-btn"
                            data-memory-action="archive"
                            data-memory-id="${this.escapeHTML(
                                memory.id
                            )}"
                        >
                            Arşivle
                        </button>

                    </footer>

                </section>

            </div>
        `;

    },


    /* =====================================================
       EDITOR
    ===================================================== */

    renderEditor(
        entity,
        memory = null
    ){

        const editing =
            Boolean(
                memory
            );


        const title =
            memory?.title ||
            "";


        const content =
            memory?.content ||
            "";


        const category =
            memory?.category ||
            "note";


        const tags =
            Array.isArray(
                memory?.tags
            )
                ? memory.tags.join(
                    ", "
                )
                : "";


        const categories = [

            "note",
            "decision",
            "idea",
            "event",
            "knowledge"

        ];


        return `
            <div class="memory-detail-layer">

                <div
                    class="memory-detail-backdrop"
                    data-memory-action="editor:cancel"
                ></div>

                <form
                    class="memory-editor"
                    data-memory-form="${
                        editing
                            ? "edit"
                            : "create"
                    }"
                >

                    <header class="memory-detail-header">

                        <div>

                            <span class="engine-section-label">
                                MEMORY EDITOR
                            </span>

                            <h2>
                                ${
                                    editing
                                        ? "Hafızayı düzenle"
                                        : "Yeni hafıza"
                                }
                            </h2>

                        </div>

                        <button
                            type="button"
                            class="engine-icon-btn"
                            data-memory-action="editor:cancel"
                            aria-label="Kapat"
                        >
                            ×
                        </button>

                    </header>

                    <div class="memory-editor-scroll">

                        <label class="engine-field">

                            <span>
                                Başlık
                            </span>

                            <input
                                id="memoryTitleInput"
                                name="memoryTitle"
                                type="text"
                                maxlength="90"
                                autocomplete="off"
                                value="${this.escapeHTML(
                                    title
                                )}"
                                placeholder="Bu hafızayı tanımla"
                                required
                            >

                        </label>

                        <label class="engine-field">

                            <span>
                                İçerik
                            </span>

                            <textarea
                                id="memoryContentInput"
                                name="memoryContent"
                                maxlength="4000"
                                rows="9"
                                placeholder="Hatırlanması gereken şeyi yaz"
                                required
                            >${this.escapeHTML(
                                content
                            )}</textarea>

                        </label>

                        <label class="engine-field">

                            <span>
                                Tür
                            </span>

                            <select
                                id="memoryCategoryInput"
                                name="memoryCategory"
                            >

                                ${categories
                                    .map(
                                        item => `
                                            <option
                                                value="${this.escapeHTML(
                                                    item
                                                )}"
                                                ${
                                                    category ===
                                                        item
                                                        ? "selected"
                                                        : ""
                                                }
                                            >
                                                ${this.escapeHTML(
                                                    this.categoryLabel(
                                                        item
                                                    )
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
                                Etiketler
                            </span>

                            <input
                                id="memoryTagsInput"
                                name="memoryTags"
                                type="text"
                                maxlength="240"
                                autocomplete="off"
                                value="${this.escapeHTML(
                                    tags
                                )}"
                                placeholder="iş, fikir, önemli"
                            >

                        </label>

                        <label class="memory-important-field">

                            <input
                                id="memoryImportantInput"
                                type="checkbox"
                                ${
                                    memory?.important
                                        ? "checked"
                                        : ""
                                }
                            >

                            <span>
                                Önemli hafıza olarak işaretle
                            </span>

                        </label>

                    </div>

                    <footer class="memory-detail-actions">

                        <button
                            type="button"
                            class="secondary-btn"
                            data-memory-action="editor:cancel"
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
                                    : "Hafızaya Ekle"
                            }
                        </button>

                    </footer>

                </form>

            </div>
        `;

    },


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    renderEmptyState(){

        const filtered =
            Boolean(
                this.searchQuery
            ) ||
            this.activeCategory !==
                "all";


        return `
            <div class="section memory-empty">

                <span aria-hidden="true">
                    ◫
                </span>

                <h3>
                    ${
                        filtered
                            ? "Eşleşen hafıza bulunamadı"
                            : "Hafıza henüz sessiz"
                    }
                </h3>

                <p>
                    ${
                        filtered
                            ? "Arama veya filtreyi değiştirerek tekrar deneyebilirsin."
                            : "İlk önemli notunu, kararını veya fikrini kaydederek başlayabilirsin."
                    }
                </p>

                ${
                    filtered
                        ? `
                            <button
                                type="button"
                                class="secondary-btn"
                                data-memory-action="reset"
                            >
                                Filtreleri Temizle
                            </button>
                        `
                        : `
                            <button
                                type="button"
                                class="primary-btn"
                                data-memory-action="create"
                            >
                                İlk Hafızayı Ekle
                            </button>
                        `
                }

            </div>
        `;

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
                            Hafıza açılamadı
                        </h1>

                        <p>
                            Bu varlığın hafıza bağlamı şu anda kullanılamıyor.
                        </p>

                    </div>

                </section>
            `;

        }


        this.enterBrainContext(
            entity
        );


        if(
            !this.getAllowedCategories()
                .includes(
                    this.activeCategory
                )
        ){

            this.activeCategory =
                "all";

        }


        const memories =
            this.getMemories(
                entity
            );


        let selected =
            this.selectedMemoryId
                ? this.findMemory(
                    entity,
                    this.selectedMemoryId
                )
                : null;


        if(
            selected?.archived ===
                true &&
            !this.editorMode
        ){

            this.selectedMemoryId =
                null;


            selected =
                null;

        }


        if(
            this.editorMode ===
                "edit" &&
            !selected
        ){

            this.editorMode =
                null;

        }


        const editorMemory =
            this.editorMode ===
                "edit"
                ? selected
                : null;


        return `
            <section class="engine-page memory-app-page">

                <div class="memory-app-shell">

                    ${this.renderAppHeader(
                        entity
                    )}

                    <div class="memory-app-intro">

                        <div>

                            <span class="engine-section-label">
                                LIVING MEMORY
                            </span>

                            <h2>
                                Hatırlanması gerekenler
                            </h2>

                            <p>
                                Notlarını, kararlarını, fikirlerini ve önemli bağlamlarını bu varlığın yaşayan hafızasında tut.
                            </p>

                        </div>

                        ${this.renderStats(
                            entity
                        )}

                    </div>

                    ${this.renderToolbar()}

                    <div class="memory-records-scroll">

                        ${
                            memories.length
                                ? `
                                    <div class="memory-record-list">

                                        ${memories
                                            .map(
                                                memory =>
                                                    this.renderMemoryCard(
                                                        memory
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
                            entity,
                            this.editorMode ===
                                "edit"
                                ? editorMemory
                                : null
                        )
                        : (
                            selected
                                ? this.renderDetail(
                                    entity,
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

            case "create":

                this.selectedMemoryId =
                    null;


                this.editorMode =
                    "create";


                this.enterBrainContext(
                    entity
                );


                return this.remount();


            case "open": {

                const memoryId =
                    button?.dataset
                        ?.memoryId ||
                    null;


                const memory =
                    this.findMemory(
                        entity,
                        memoryId
                    );


                if(
                    !memory ||
                    memory.archived ===
                        true
                ){

                    return false;

                }


                this.selectedMemoryId =
                    memoryId;


                this.editorMode =
                    null;


                this.enterBrainContext(
                    entity
                );


                return this.remount();

            }


            case "close":

                this.selectedMemoryId =
                    null;


                this.editorMode =
                    null;


                this.enterBrainContext(
                    entity
                );


                return this.remount();


            case "edit": {

                const memoryId =
                    button?.dataset
                        ?.memoryId ||
                    null;


                const memory =
                    this.findMemory(
                        entity,
                        memoryId
                    );


                if(
                    !memory ||
                    memory.archived ===
                        true
                ){

                    return false;

                }


                this.selectedMemoryId =
                    memoryId;


                this.editorMode =
                    "edit";


                this.enterBrainContext(
                    entity
                );


                return this.remount();

            }


            case "editor:cancel":

                this.editorMode =
                    null;


                this.enterBrainContext(
                    entity
                );


                return this.remount();


            case "category":

                this.setCategory(
                    button?.dataset
                        ?.memoryCategory ||
                    "all"
                );


                this.enterBrainContext(
                    entity
                );


                return this.remount();


            case "reset":

                this.resetFilters();


                this.enterBrainContext(
                    entity
                );


                return this.remount();


            case "pin":

                return this.togglePin(
                    entity,
                    button?.dataset
                        ?.memoryId
                );


            case "important":

                return this.toggleImportant(
                    entity,
                    button?.dataset
                        ?.memoryId
                );


            case "archive":

                return this.archiveMemory(
                    entity,
                    button?.dataset
                        ?.memoryId
                );


            case "restore":

                return this.restoreMemory(
                    entity,
                    button?.dataset
                        ?.memoryId
                );


            default:

                return false;

        }

    },


    /* =====================================================
       SEARCH
    ===================================================== */

    handleSearchInput(value){

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

            coreAvailable:
                this.hasMemoryCore(),

            activeCategory:
                this.activeCategory,

            searchQuery:
                this.searchQuery,

            selectedMemoryId:
                this.selectedMemoryId,

            editorMode:
                this.editorMode,

            stats:
                entity
                    ? this.getStats(
                        entity
                    )
                    : {
                        total:
                            0,

                        important:
                            0,

                        pinned:
                            0
                    }

        };

    }

};


/* =========================================================
   MEMORY CLICK DELEGATION
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
                    "[data-memory-action]"
                );


            if(!button){

                return;

            }


            event.preventDefault();


            MemoryApp.handleCommand(
                button.dataset
                    .memoryAction,
                button
            );

        }
    );


    /* =====================================================
       MEMORY SEARCH
    ===================================================== */

    document.addEventListener(
        "input",
        event => {

            if(
                event.target?.id !==
                    "memorySearchInput"
            ){

                return;

            }


            MemoryApp.handleSearchInput(
                event.target.value
            );

        }
    );


    /* =====================================================
       MEMORY FORMS
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
                    "[data-memory-form]"
                );


            if(!form){

                return;

            }


            event.preventDefault();


            const entity =
                MemoryApp.getCurrentEntity();


            if(!entity){

                return;

            }


            if(
                form.dataset.memoryForm ===
                    "create"
            ){

                MemoryApp.createMemory(
                    entity
                );


                return;

            }


            if(
                form.dataset.memoryForm ===
                    "edit"
            ){

                MemoryApp.updateMemory(
                    entity
                );

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
            "memoryApp",
            MemoryApp
        );

    }

} catch(error){

    console.warn(
        "MemoryApp VAERO registration failed:",
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

    window.MemoryApp =
        MemoryApp;

}
