/* =========================================================
   VAERO MEMORY APP
   Entity Memory / Notes / Records / Context Surface
========================================================= */

const MemoryApp = {

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

    storagePrefix:
        "vaero:memory:entity:v2:",


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
            .toString(36)
            .slice(2,10)}`;

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
                        this.editorMode
                }
            );

        } catch(error){

            console.warn(
                "Memory Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       STORAGE
       -----------------------------------------------------
       Current Memory App persistence layer.

       Memory Core authority lives in js/memory.js.
       Its write contract will be connected only after
       that file is reviewed; no guessed API calls here.
    ===================================================== */

    getStorageKey(entityId){

        return (
            this.storagePrefix +
            String(
                entityId ||
                "global"
            )
        );

    },


    load(entityId){

        try{

            const saved =
                localStorage.getItem(
                    this.getStorageKey(
                        entityId
                    )
                );


            if(!saved){

                return [];

            }


            const parsed =
                JSON.parse(
                    saved
                );


            if(
                !Array.isArray(
                    parsed
                )
            ){

                return [];

            }


            const normalized =
                parsed
                    .filter(
                        item =>
                            item &&
                            typeof item ===
                                "object" &&
                            !Array.isArray(
                                item
                            )
                    )
                    .map(
                        item =>
                            this.normalizeMemory(
                                item,
                                entityId
                            )
                    );


            const seen =
                new Set();


            return normalized.filter(
                memory => {

                    if(
                        seen.has(
                            memory.id
                        )
                    ){

                        return false;

                    }


                    seen.add(
                        memory.id
                    );


                    return true;

                }
            );

        } catch(error){

            console.error(
                "Memory kayıtları okunamadı:",
                error
            );


            return [];

        }

    },


    save(
        entityId,
        memories
    ){

        if(!entityId){

            return false;

        }


        try{

            const safeMemories =
                Array.isArray(
                    memories
                )
                    ? memories
                        .filter(
                            item =>
                                item &&
                                typeof item ===
                                    "object"
                        )
                        .map(
                            item =>
                                this.normalizeMemory(
                                    item,
                                    entityId
                                )
                        )
                    : [];


            localStorage.setItem(
                this.getStorageKey(
                    entityId
                ),
                JSON.stringify(
                    safeMemories
                )
            );


            return true;

        } catch(error){

            console.error(
                "Memory kayıtları kaydedilemedi:",
                error
            );


            return false;

        }

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
                ).split(",");


        const seen =
            new Set();


        const result =
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


        return {

            id:
                String(
                    memory.id ||
                    this.createId()
                )
                    .trim()
                    .slice(
                        0,
                        160
                    ),

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
            this.load(
                entity.id
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
            String(
                this.searchQuery ||
                ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        if(query){

            memories =
                memories.filter(
                    memory => {

                        const text = [

                            memory.title,
                            memory.content,
                            memory.category,
                            memory.source,

                            ...(
                                memory.tags ||
                                []
                            )

                        ]
                            .join(" ")
                            .toLocaleLowerCase(
                                "tr-TR"
                            );


                        return text.includes(
                            query
                        );

                    }
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


    getAllMemories(entity){

        if(
            !entity ||
            !entity.id
        ){

            return [];

        }


        return this.load(
            entity.id
        );

    },


    findMemory(
        entity,
        memoryId
    ){

        const id =
            String(
                memoryId ||
                ""
            );


        if(!id){

            return null;

        }


        return (
            this
                .getAllMemories(
                    entity
                )
                .find(
                    memory =>
                        memory.id ===
                            id
                ) ||
            null
        );

    },


    /* =====================================================
       CREATE
    ===================================================== */

    createMemory(entity){

        if(
            !entity ||
            !entity.id
        ){

            return false;

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

            titleInput?.focus();


            return false;

        }


        if(!content){

            contentInput?.focus();


            return false;

        }


        const memories =
            this.getAllMemories(
                entity
            );


        const now =
            Date.now();


        const memory =
            this.normalizeMemory(
                {
                    id:
                        this.createId(),

                    entityId:
                        entity.id,

                    title,

                    content,

                    category:
                        categoryInput?.value ||
                        "note",

                    important:
                        Boolean(
                            importantInput?.checked
                        ),

                    pinned:
                        false,

                    archived:
                        false,

                    tags:
                        this.parseTags(
                            tagsInput?.value
                        ),

                    source:
                        "manual",

                    createdAt:
                        now,

                    updatedAt:
                        now
                },
                entity.id
            );


        memories.unshift(
            memory
        );


        if(
            !this.save(
                entity.id,
                memories
            )
        ){

            return false;

        }


        this.editorMode =
            null;


        this.selectedMemoryId =
            memory.id;


        this.recordEvolution(
            entity,
            memory,
            "created"
        );


        return this.remount();

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    updateMemory(entity){

        if(
            !entity ||
            !entity.id ||
            !this.selectedMemoryId
        ){

            return false;

        }


        const memories =
            this.getAllMemories(
                entity
            );


        const index =
            memories.findIndex(
                memory =>
                    memory.id ===
                        this.selectedMemoryId
            );


        if(
            index <
                0
        ){

            return false;

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

            titleInput?.focus();


            return false;

        }


        if(!content){

            contentInput?.focus();


            return false;

        }


        memories[index] =
            this.normalizeMemory(
                {
                    ...memories[index],

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
                        ),

                    updatedAt:
                        Date.now()
                },
                entity.id
            );


        if(
            !this.save(
                entity.id,
                memories
            )
        ){

            return false;

        }


        this.editorMode =
            null;


        this.recordEvolution(
            entity,
            memories[index],
            "updated"
        );


        return this.remount();

    },


    /* =====================================================
       MUTATION
    ===================================================== */

    mutateMemory(
        entity,
        memoryId,
        mutator,
        options = {}
    ){

        if(
            !entity ||
            !entity.id ||
            !memoryId ||
            typeof mutator !==
                "function"
        ){

            return false;

        }


        const memories =
            this.getAllMemories(
                entity
            );


        const index =
            memories.findIndex(
                memory =>
                    memory.id ===
                        memoryId
            );


        if(
            index <
                0
        ){

            return false;

        }


        const next = {
            ...memories[index]
        };


        try{

            mutator(
                next
            );

        } catch(error){

            console.warn(
                "Memory mutation başarısız:",
                error
            );


            return false;

        }


        next.updatedAt =
            Date.now();


        memories[index] =
            this.normalizeMemory(
                next,
                entity.id
            );


        if(
            !this.save(
                entity.id,
                memories
            )
        ){

            return false;

        }


        if(
            options.remount ===
                false
        ){

            return true;

        }


        return this.remount();

    },


    /* =====================================================
       PIN / IMPORTANT / ARCHIVE
    ===================================================== */

    togglePin(
        entity,
        memoryId
    ){

        return this.mutateMemory(
            entity,
            memoryId,
            memory => {

                memory.pinned =
                    !memory.pinned;

            }
        );

    },


    toggleImportant(
        entity,
        memoryId
    ){

        return this.mutateMemory(
            entity,
            memoryId,
            memory => {

                memory.important =
                    !memory.important;

            }
        );

    },


    archiveMemory(
        entity,
        memoryId
    ){

        const result =
            this.mutateMemory(
                entity,
                memoryId,
                memory => {

                    memory.archived =
                        true;

                    memory.pinned =
                        false;

                },
                {
                    remount:
                        false
                }
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


        return this.remount();

    },


    /* =====================================================
       EVOLUTION
    ===================================================== */

    recordEvolution(
        entity,
        memory,
        action
    ){

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


        try{

            const labels = {

                created:
                    "hafızaya eklendi",

                updated:
                    "hafızada güncellendi"

            };


            evolution.record(
                "life-event",
                `${memory.title} ${labels[action] || "güncellendi"}`,
                {
                    title:
                        memory.title,

                    source:
                        "memory",

                    status:
                        "completed",

                    importance:
                        memory.important
                            ? "high"
                            : "low",

                    relatedEntityId:
                        entity.id,

                    relatedWorldId:
                        this.getEngine()
                            ?.currentWorld
                            ?.id ||
                        null,

                    memoryId:
                        memory.id,

                    organs:[
                        "memory",
                        "timeline"
                    ],

                    tags:[
                        "memory",
                        memory.category,
                        ...(
                            memory.tags ||
                            []
                        )
                    ]
                }
            );


            return true;

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
            labels[category] ||
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
            icons[category] ||
            "◫"
        );

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
                    "İsimsiz Varlık"
                ),
                "MEMORY",
                "◫"
            );

        }


        return `
            <header class="engine-app-header">

                <span class="engine-section-label">
                    MEMORY
                </span>

                <h1>
                    ${this.escapeHTML(
                        entity.name ||
                        "İsimsiz Varlık"
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
                        placeholder="Hafızada ara"
                        value="${this.escapeHTML(
                            this.searchQuery
                        )}"
                    >

                </label>


                <div class="memory-category-tabs">

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
                                >
                                    ${this.escapeHTML(
                                        this.categoryLabel(
                                            category
                                        )
                                    )}
                                </button>
                            `
                        )
                        .join("")}

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

        const memories =
            this.getAllMemories(
                entity
            )
                .filter(
                    memory =>
                        memory.archived !==
                            true
                );


        const important =
            memories.filter(
                memory =>
                    memory.important
            ).length;


        const pinned =
            memories.filter(
                memory =>
                    memory.pinned
            ).length;


        return `
            <div class="memory-stats">

                <div class="memory-stat">

                    <strong>
                        ${memories.length}
                    </strong>

                    <span>
                        Hafıza
                    </span>

                </div>


                <div class="memory-stat">

                    <strong>
                        ${important}
                    </strong>

                    <span>
                        Önemli
                    </span>

                </div>


                <div class="memory-stat">

                    <strong>
                        ${pinned}
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
            >

                <span class="memory-record-icon">

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


                    <span class="memory-record-preview">
                        ${this.escapeHTML(
                            preview
                        )}
                    </span>


                    ${
                        memory.tags.length
                            ? `
                                <span class="memory-record-tags">

                                    ${memory.tags
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
                    aria-label="Hafıza detayı"
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

                            <h2>
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
                                            .join("")}

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

                                ${[
                                    "note",
                                    "decision",
                                    "idea",
                                    "event",
                                    "knowledge"
                                ]
                                    .map(
                                        item => `
                                            <option
                                                value="${item}"
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
                                    .join("")}

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


        const memories =
            this.getMemories(
                entity
            );


        const selected =
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

        }


        const effectiveSelected =
            this.selectedMemoryId
                ? this.findMemory(
                    entity,
                    this.selectedMemoryId
                )
                : null;


        const editorMemory =
            this.editorMode ===
                "edit"
                ? effectiveSelected
                : null;


        if(
            this.editorMode ===
                "edit" &&
            !editorMemory
        ){

            this.editorMode =
                null;

        }


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
                                            .join("")}

                                    </div>
                                  `
                                : `
                                    <div class="section memory-empty">

                                        <span aria-hidden="true">
                                            ◫
                                        </span>


                                        <h3>
                                            ${
                                                this.searchQuery ||
                                                this.activeCategory !==
                                                    "all"
                                                    ? "Eşleşen hafıza bulunamadı"
                                                    : "Hafıza henüz sessiz"
                                            }
                                        </h3>


                                        <p>
                                            ${
                                                this.searchQuery ||
                                                this.activeCategory !==
                                                    "all"
                                                    ? "Arama veya filtreyi değiştirerek tekrar deneyebilirsin."
                                                    : "İlk önemli notunu, kararını veya fikrini kaydederek başlayabilirsin."
                                            }
                                        </p>


                                        ${
                                            !this.searchQuery &&
                                            this.activeCategory ===
                                                "all"
                                                ? `
                                                    <button
                                                        type="button"
                                                        class="primary-btn"
                                                        data-memory-action="create"
                                                    >
                                                        İlk Hafızayı Ekle
                                                    </button>
                                                  `
                                                : ""
                                        }

                                    </div>
                                  `
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
                            effectiveSelected
                                ? this.renderDetail(
                                    entity,
                                    effectiveSelected
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


        switch(action){

            case "create":

                this.selectedMemoryId =
                    null;


                this.editorMode =
                    "create";


                return this.remount();


            case "open":{

                const memoryId =
                    button?.dataset
                        ?.memoryId ||
                    null;


                if(
                    !this.findMemory(
                        entity,
                        memoryId
                    )
                ){

                    return false;

                }


                this.selectedMemoryId =
                    memoryId;


                this.editorMode =
                    null;


                return this.remount();

            }


            case "close":

                this.selectedMemoryId =
                    null;


                this.editorMode =
                    null;


                return this.remount();


            case "edit":{

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


                return this.remount();

            }


            case "editor:cancel":

                this.editorMode =
                    null;


                return this.remount();


            case "category":{

                const category =
                    String(
                        button?.dataset
                            ?.memoryCategory ||
                        "all"
                    );


                this.activeCategory =
                    [
                        "all",
                        "note",
                        "decision",
                        "idea",
                        "event",
                        "knowledge"
                    ].includes(
                        category
                    )
                        ? category
                        : "all";


                this.selectedMemoryId =
                    null;


                this.editorMode =
                    null;


                return this.remount();

            }


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


            default:

                return false;

        }

    }

};


/* =========================================================
   MEMORY CLICK DELEGATION
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
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


/* =========================================================
   MEMORY SEARCH
========================================================= */

document.addEventListener(
    "input",
    event => {

        if(
            event.target.id !==
                "memorySearchInput"
        ){

            return;

        }


        MemoryApp.searchQuery =
            String(
                event.target.value ||
                ""
            );


        if(
            !MemoryApp.getCurrentEntity()
        ){

            return;

        }


        clearTimeout(
            MemoryApp.searchTimer
        );


        MemoryApp.searchTimer =
            setTimeout(
                () => {

                    MemoryApp.selectedMemoryId =
                        null;


                    MemoryApp.editorMode =
                        null;


                    MemoryApp.remount();

                },
                120
            );

    }
);


/* =========================================================
   MEMORY FORMS
========================================================= */

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target.closest(
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


/* =========================================================
   REGISTER
========================================================= */

try{

    VAERO?.register?.(
        "memoryApp",
        MemoryApp
    );

} catch(error){

    /* global remains available */

}


window.MemoryApp =
    MemoryApp;
