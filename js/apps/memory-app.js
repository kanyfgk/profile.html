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

   
