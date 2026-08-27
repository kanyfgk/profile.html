/* =========================================================
   VAERO BRIDGE APP
   Entity Relationship / Connection Management Surface
========================================================= */

const BridgeApp = {

    searchQuery:
        "",

    activeFilter:
        "all",

    selectedBridgeId:
        null,

    editorMode:
        null,

    searchTimer:
        null,

    storagePrefix:
        "vaero:bridge:entity:v2:",


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


        return `bridge_${Date.now()}_${Math.random()
            .toString(36)
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
                "bridge",
                {
                    entityId:
                        entity?.id ||
                        null,

                    filter:
                        this.activeFilter,

                    selectedBridgeId:
                        this.selectedBridgeId,

                    editorMode:
                        this.editorMode
                }
            );

        } catch(error){

            console.warn(
                "Bridge Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       RELATION TYPES
    ===================================================== */

    getRelationshipTypes(){

        return [

            {
                id:
                    "connection",

                label:
                    "Bağlantı",

                icon:
                    "⌁"
            },

            {
                id:
                    "person",

                label:
                    "Kişi",

                icon:
                    "♙"
            },

            {
                id:
                    "company",

                label:
                    "Şirket",

                icon:
                    "▣"
            },

            {
                id:
                    "team",

                label:
                    "Ekip",

                icon:
                    "◯"
            },

            {
                id:
                    "partner",

                label:
                    "Ortak",

                icon:
                    "◇"
            },

            {
                id:
                    "project",

                label:
                    "Proje",

                icon:
                    "◫"
            },

            {
                id:
                    "resource",

                label:
                    "Kaynak",

                icon:
                    "⌘"
            },

            {
                id:
                    "custom",

                label:
                    "Özel",

                icon:
                    "✦"
            }

        ];

    },


    normalizeRelationshipType(value){

        const type =
            String(
                value ||
                "connection"
            )
                .trim()
                .toLowerCase();


        const allowed =
            this
                .getRelationshipTypes()
                .map(
                    item =>
                        item.id
                );


        return allowed.includes(
            type
        )
            ? type
            : "connection";

    },


    relationshipLabel(value){

        const type =
            this
                .getRelationshipTypes()
                .find(
                    item =>
                        item.id ===
                            value
                );


        return (
            type?.label ||
            "Bağlantı"
        );

    },


    relationshipIcon(value){

        const type =
            this
                .getRelationshipTypes()
                .find(
                    item =>
                        item.id ===
                            value
                );


        return (
            type?.icon ||
            "⌁"
        );

    },


    /* =====================================================
       STORAGE
       -----------------------------------------------------
       Compatibility surface only.

       Bridge Core authority remains in js/bridge.js.
       No guessed Bridge Core write API is used here.
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

        if(!entityId){

            return [];

        }


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


            const seen =
                new Set();


            return parsed
                .filter(
                    bridge =>
                        bridge &&
                        typeof bridge ===
                            "object" &&
                        !Array.isArray(
                            bridge
                        )
                )
                .map(
                    bridge =>
                        this.normalizeBridge(
                            bridge,
                            entityId
                        )
                )
                .filter(
                    bridge => {

                        if(
                            seen.has(
                                bridge.id
                            )
                        ){

                            return false;

                        }


                        seen.add(
                            bridge.id
                        );


                        return true;

                    }
                );

        } catch(error){

            console.error(
                "Bridge kayıtları okunamadı:",
                error
            );


            return [];

        }

    },


    save(
        entityId,
        bridges
    ){

        if(!entityId){

            return false;

        }


        try{

            const safeBridges =
                Array.isArray(
                    bridges
                )
                    ? bridges
                        .filter(
                            bridge =>
                                bridge &&
                                typeof bridge ===
                                    "object"
                        )
                        .map(
                            bridge =>
                                this.normalizeBridge(
                                    bridge,
                                    entityId
                                )
                        )
                    : [];


            localStorage.setItem(
                this.getStorageKey(
                    entityId
                ),
                JSON.stringify(
                    safeBridges
                )
            );


            return true;

        } catch(error){

            console.error(
                "Bridge kayıtları kaydedilemedi:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeTags(value){

        const source =
            Array.isArray(
                value
            )
                ? value
                : [];


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


    parseTags(value){

        return this.normalizeTags(
            String(
                value ||
                ""
            ).split(",")
        );

    },


    normalizeStatus(value){

        const status =
            String(
                value ||
                "active"
            )
                .trim()
                .toLowerCase();


        return [
            "active",
            "archived"
        ].includes(
            status
        )
            ? status
            : "active";

    },


    normalizeBridge(
        bridge = {},
        entityId = null
    ){

        const now =
            Date.now();


        const createdAt =
            Number(
                bridge.createdAt
            ) ||
            now;


        const archived =
            bridge.archived ===
                true;


        return {

            id:
                String(
                    bridge.id ||
                    this.createId()
                )
                    .trim()
                    .slice(
                        0,
                        160
                    ),

            sourceEntityId:
                String(
                    bridge.sourceEntityId ||
                    entityId ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        160
                    ),

            targetEntityId:
                String(
                    bridge.targetEntityId ||
                    bridge.entityId ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        160
                    ),

            targetName:
                String(
                    bridge.targetName ||
                    "İsimsiz Varlık"
                )
                    .trim()
                    .slice(
                        0,
                        120
                    ),

            targetType:
                String(
                    bridge.targetType ||
                    "entity"
                )
                    .trim()
                    .slice(
                        0,
                        80
                    ),

            relationship:
                this.normalizeRelationshipType(
                    bridge.relationship ||
                    bridge.type
                ),

            label:
                String(
                    bridge.label ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        80
                    ),

            note:
                String(
                    bridge.note ||
                    bridge.description ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        1000
                    ),

            tags:
                this.normalizeTags(
                    bridge.tags
                ),

            favorite:
                bridge.favorite ===
                    true,

            archived,

            archivedAt:
                archived
                    ? (
                        Number(
                            bridge.archivedAt
                        ) ||
                        now
                    )
                    : null,

            status:
                archived
                    ? "archived"
                    : this.normalizeStatus(
                        bridge.status
                    ),

            createdAt,

            updatedAt:
                Number(
                    bridge.updatedAt
                ) ||
                createdAt

        };

    },


    /* =====================================================
       ENTITY DISCOVERY
    ===================================================== */

    getAllEntities(){

        const manager =
            this.getService(
                "entityManager"
            );


        const entities =
            [];


        const addEntity =
            entity => {

                if(
                    !entity ||
                    !entity.id ||
                    entity.archived ===
                        true
                ){

                    return;

                }


                const id =
                    String(
                        entity.id
                    );


                if(
                    entities.some(
                        item =>
                            String(
                                item?.id
                            ) ===
                                id
                    )
                ){

                    return;

                }


                entities.push(
                    entity
                );

            };


        if(
            manager &&
            typeof manager.all ===
                "function"
        ){

            try{

                const result =
                    manager.all({
                        includeArchived:
                            false
                    });


                if(
                    Array.isArray(
                        result
                    )
                ){

                    result.forEach(
                        addEntity
                    );

                }

            } catch(error){

                /* world fallback */

            }

        }


        const worldService =
            this.getService(
                "world"
            );


        if(
            worldService &&
            typeof worldService.all ===
                "function"
        ){

            try{

                const worlds =
                    worldService.all();


                if(
                    Array.isArray(
                        worlds
                    )
                ){

                    worlds.forEach(
                        world => {

                            if(
                                !Array.isArray(
                                    world?.entities
                                )
                            ){

                                return;

                            }


                            world.entities.forEach(
                                addEntity
                            );

                        }
                    );

                }

            } catch(error){

                /* manager results remain */

            }

        }


        return entities;

    },


    getAvailableTargets(entity){

        if(
            !entity ||
            !entity.id
        ){

            return [];

        }


        return this
            .getAllEntities()
            .filter(
                candidate =>
                    String(
                        candidate.id
                    ) !==
                        String(
                            entity.id
                        ) &&
                    candidate.archived !==
                        true
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.name ||
                        ""
                    ).localeCompare(
                        String(
                            b.name ||
                            ""
                        ),
                        "tr"
                    )
            );

    },


    resolveTargetEntity(
        targetEntityId
    ){

        const id =
            String(
                targetEntityId ||
                ""
            ).trim();


        if(!id){

            return null;

        }


        const manager =
            this.getService(
                "entityManager"
            );


        if(
            manager &&
            typeof manager.get ===
                "function"
        ){

            try{

                const entity =
                    manager.get(
                        id
                    );


                if(entity){

                    return entity;

                }

            } catch(error){

                /* fallback */

            }

        }


        return (
            this
                .getAllEntities()
                .find(
                    entity =>
                        String(
                            entity.id
                        ) ===
                            id
                ) ||
            null
        );

    },


    /* =====================================================
       QUERY
    ===================================================== */

    getAllBridges(entity){

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


    getBridges(entity){

        let bridges =
            this
                .getAllBridges(
                    entity
                )
                .filter(
                    bridge =>
                        bridge.archived !==
                            true
                );


        const allowedFilters = [

            "all",

            ...this
                .getRelationshipTypes()
                .map(
                    type =>
                        type.id
                )

        ];


        if(
            !allowedFilters.includes(
                this.activeFilter
            )
        ){

            this.activeFilter =
                "all";

        }


        if(
            this.activeFilter !==
                "all"
        ){

            bridges =
                bridges.filter(
                    bridge =>
                        bridge.relationship ===
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

            bridges =
                bridges.filter(
                    bridge => {

                        const haystack = [

                            bridge.targetName,
                            bridge.targetType,
                            bridge.relationship,
                            bridge.label,
                            bridge.note,

                            ...(
                                bridge.tags ||
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


        return bridges.sort(
            (
                a,
                b
            ) => {

                if(
                    a.favorite !==
                        b.favorite
                ){

                    return a.favorite
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

    },


    findBridge(
        entity,
        bridgeId
    ){

        const id =
            String(
                bridgeId ||
                ""
            ).trim();


        if(!id){

            return null;

        }


        return (
            this
                .getAllBridges(
                    entity
                )
                .find(
                    bridge =>
                        bridge.id ===
                            id
                ) ||
            null
        );

    },


    /* =====================================================
       EDITOR VALUES
    ===================================================== */

    readEditorValues(){

        const targetInput =
            document.getElementById(
                "bridgeTargetInput"
            );


        const relationshipInput =
            document.getElementById(
                "bridgeRelationshipInput"
            );


        const labelInput =
            document.getElementById(
                "bridgeLabelInput"
            );


        const noteInput =
            document.getElementById(
                "bridgeNoteInput"
            );


        const tagsInput =
            document.getElementById(
                "bridgeTagsInput"
            );


        return {

            targetInput,

            targetId:
                String(
                    targetInput?.value ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        160
                    ),

            relationship:
                this.normalizeRelationshipType(
                    relationshipInput?.value
                ),

            label:
                String(
                    labelInput?.value ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        80
                    ),

            note:
                String(
                    noteInput?.value ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        1000
                    ),

            tags:
                this.parseTags(
                    tagsInput?.value
                )

        };

    },


    /* =====================================================
       CREATE BRIDGE
    ===================================================== */

    createBridge(entity){

        if(
            !entity ||
            !entity.id
        ){

            return false;

        }


        const values =
            this.readEditorValues();


        if(
            !values.targetId
        ){

            values.targetInput
                ?.focus();


            return false;

        }


        const target =
            this.resolveTargetEntity(
                values.targetId
            );


        if(!target){

            return false;

        }


        if(
            String(
                target.id
            ) ===
                String(
                    entity.id
                )
        ){

            return false;

        }


        const bridges =
            this.getAllBridges(
                entity
            );


        const existing =
            bridges.find(
                bridge =>
                    bridge.targetEntityId ===
                        String(
                            target.id
                        ) &&
                    bridge.relationship ===
                        values.relationship &&
                    bridge.archived !==
                        true
            );


        if(existing){

            this.selectedBridgeId =
                existing.id;


            this.editorMode =
                null;


            return this.remount();

        }


        const now =
            Date.now();


        const bridge =
            this.normalizeBridge(
                {
                    id:
                        this.createId(),

                    sourceEntityId:
                        entity.id,

                    targetEntityId:
                        target.id,

                    targetName:
                        target.name,

                    targetType:
                        target.type,

                    relationship:
                        values.relationship,

                    label:
                        values.label,

                    note:
                        values.note,

                    tags:
                        values.tags,

                    favorite:
                        false,

                    archived:
                        false,

                    status:
                        "active",

                    createdAt:
                        now,

                    updatedAt:
                        now
                },
                entity.id
            );


        bridges.push(
            bridge
        );


        if(
            !this.save(
                entity.id,
                bridges
            )
        ){

            return false;

        }


        /*
         * Entity'nin mevcut addBridge uyumluluk kontratı
         * varsa referans güncellenir. Bridge Core API'si
         * olmadığı varsayılmaz.
         */

        if(
            typeof entity.addBridge ===
                "function"
        ){

            try{

                entity.addBridge(
                    bridge
                );

            } catch(error){

                console.warn(
                    "Entity Bridge referansı eklenemedi:",
                    error
                );

            }

        }


        try{

            this.getService(
                "world"
            )?.save?.();

        } catch(error){

            /* compatibility */

        }


        this.recordEvolution(
            entity,
            bridge,
            "created"
        );


        this.selectedBridgeId =
            bridge.id;


        this.editorMode =
            null;


        return this.remount();

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    updateBridge(entity){

        if(
            !entity ||
            !entity.id ||
            !this.selectedBridgeId
        ){

            return false;

        }


        const bridges =
            this.getAllBridges(
                entity
            );


        const index =
            bridges.findIndex(
                bridge =>
                    bridge.id ===
                        this.selectedBridgeId
            );


        if(
            index <
                0
        ){

            return false;

        }


        const values =
            this.readEditorValues();


        bridges[index] =
            this.normalizeBridge(
                {
                    ...bridges[index],

                    relationship:
                        values.relationship,

                    label:
                        values.label,

                    note:
                        values.note,

                    tags:
                        values.tags,

                    updatedAt:
                        Date.now()
                },
                entity.id
            );


        if(
            !this.save(
                entity.id,
                bridges
            )
        ){

            return false;

        }


        const updated =
            bridges[index];


        if(
            Array.isArray(
                entity.bridges
            )
        ){

            const entityBridgeIndex =
                entity.bridges.findIndex(
                    bridge =>
                        bridge?.id ===
                            updated.id
                );


            if(
                entityBridgeIndex >=
                    0
            ){

                entity.bridges[
                    entityBridgeIndex
                ] = {
                    ...updated
                };

            }

        }


        try{

            this.getService(
                "world"
            )?.save?.();

        } catch(error){

            /* compatibility */

        }


        this.recordEvolution(
            entity,
            updated,
            "updated"
        );


        this.editorMode =
            null;


        return this.remount();

    },


    /* =====================================================
       MUTATION
    ===================================================== */

    mutateBridge(
        entity,
        bridgeId,
        mutator,
        options = {}
    ){

        if(
            !entity ||
            !entity.id ||
            !bridgeId ||
            typeof mutator !==
                "function"
        ){

            return false;

        }


        const bridges =
            this.getAllBridges(
                entity
            );


        const index =
            bridges.findIndex(
                bridge =>
                    bridge.id ===
                        bridgeId
            );


        if(
            index <
                0
        ){

            return false;

        }


        const next = {
            ...bridges[index]
        };


        try{

            mutator(
                next
            );

        } catch(error){

            console.warn(
                "Bridge mutation başarısız:",
                error
            );


            return false;

        }


        next.updatedAt =
            Date.now();


        bridges[index] =
            this.normalizeBridge(
                next,
                entity.id
            );


        if(
            !this.save(
                entity.id,
                bridges
            )
        ){

            return false;

        }


        if(
            options.remount ===
                false
        ){

            return bridges[index];

        }


        return this.remount();

    },


    toggleFavorite(
        entity,
        bridgeId
    ){

        return this.mutateBridge(
            entity,
            bridgeId,
            bridge => {

                bridge.favorite =
                    !bridge.favorite;

            }
        );

    },


    archiveBridge(
        entity,
        bridgeId
    ){

        const bridge =
            this.findBridge(
                entity,
                bridgeId
            );


        if(
            !bridge ||
            bridge.archived ===
                true
        ){

            return false;

        }


        const updated =
            this.mutateBridge(
                entity,
                bridgeId,
                target => {

                    target.archived =
                        true;

                    target.archivedAt =
                        Date.now();

                    target.status =
                        "archived";

                    target.favorite =
                        false;

                },
                {
                    remount:
                        false
                }
            );


        if(!updated){

            return false;

        }


        if(
            typeof entity.removeBridge ===
                "function"
        ){

            try{

                entity.removeBridge(
                    bridgeId
                );

            } catch(error){

                /* compatibility */

            }

        }


        try{

            this.getService(
                "world"
            )?.save?.();

        } catch(error){

            /* compatibility */

        }


        this.recordEvolution(
            entity,
            updated,
            "archived"
        );


        if(
            this.selectedBridgeId ===
                bridgeId
        ){

            this.selectedBridgeId =
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
        bridge,
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


        const messages = {

            created:
                `${bridge.targetName} ile bağlantı kuruldu`,

            updated:
                `${bridge.targetName} bağlantısı güncellendi`,

            archived:
                `${bridge.targetName} bağlantısı arşivlendi`

        };


        const message =
            messages[action] ||
            "Bridge güncellendi";


        try{

            evolution.record(
                "life-event",
                message,
                {
                    title:
                        message,

                    source:
                        "bridge",

                    status:
                        "completed",

                    importance:
                        bridge.favorite
                            ? "medium"
                            : "low",

                    relatedEntityId:
                        entity.id,

                    bridgeId:
                        bridge.id,

                    targetEntityId:
                        bridge.targetEntityId,

                    tags:[
                        "bridge",
                        bridge.relationship,
                        ...(
                            bridge.tags ||
                            []
                        )
                    ]
                }
            );


            return true;

        } catch(error){

            console.warn(
                "Bridge Evolution kaydı oluşturulamadı:",
                error
            );


            return false;

        }

    },

   /* =====================================================
       STATS
    ===================================================== */

    getStats(entity){

        const bridges =
            this
                .getAllBridges(
                    entity
                )
                .filter(
                    bridge =>
                        bridge.archived !==
                            true
                );


        return {

            total:
                bridges.length,

            people:
                bridges.filter(
                    bridge =>
                        bridge.relationship ===
                            "person"
                ).length,

            companies:
                bridges.filter(
                    bridge =>
                        bridge.relationship ===
                            "company"
                ).length,

            favorites:
                bridges.filter(
                    bridge =>
                        bridge.favorite ===
                            true
                ).length

        };

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

            return new Intl.DateTimeFormat(
                "tr-TR",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric"
                }
            ).format(
                new Date(
                    value
                )
            );

        } catch(error){

            return "";

        }

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

            ...this.getRelationshipTypes()

        ];


        return `
            <div class="bridge-toolbar">

                <label class="bridge-search">

                    <span aria-hidden="true">
                        ⌕
                    </span>


                    <input
                        id="bridgeSearchInput"
                        type="search"
                        autocomplete="off"
                        placeholder="Bağlantılarda ara"
                        value="${this.escapeHTML(
                            this.searchQuery
                        )}"
                    >

                </label>


                <div class="bridge-filter-row">

                    ${filters
                        .map(
                            filter => `
                                <button
                                    type="button"
                                    class="bridge-filter-btn ${
                                        this.activeFilter ===
                                            filter.id
                                            ? "is-active"
                                            : ""
                                    }"
                                    data-bridge-action="filter"
                                    data-bridge-filter="${this.escapeHTML(
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
                    data-bridge-action="create"
                >
                    + Bağlantı Kur
                </button>

            </div>
        `;

    },


    /* =====================================================
       CARD
    ===================================================== */

    renderBridgeCard(bridge){

        const initial =
            String(
                bridge.targetName ||
                "V"
            )
                .charAt(
                    0
                )
                .toUpperCase();


        return `
            <button
                type="button"
                class="bridge-record ${
                    bridge.favorite
                        ? "is-favorite"
                        : ""
                }"
                data-bridge-action="open"
                data-bridge-id="${this.escapeHTML(
                    bridge.id
                )}"
            >

                <span class="bridge-record-avatar">
                    ${this.escapeHTML(
                        initial
                    )}
                </span>


                <span class="bridge-record-body">

                    <span class="bridge-record-meta">

                        <small>
                            ${this.escapeHTML(
                                this.relationshipLabel(
                                    bridge.relationship
                                )
                            )}
                        </small>


                        ${
                            bridge.favorite
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
                            bridge.targetName
                        )}
                    </strong>


                    <span class="bridge-record-type">
                        ${this.escapeHTML(
                            bridge.targetType
                        )}
                    </span>


                    ${
                        bridge.label
                            ? `
                                <span class="bridge-record-label">
                                    ${this.escapeHTML(
                                        bridge.label
                                    )}
                                </span>
                              `
                            : ""
                    }


                    ${
                        bridge.tags.length
                            ? `
                                <span class="bridge-record-tags">

                                    ${bridge.tags
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


                <span class="bridge-record-side">

                    <small>
                        ${this.escapeHTML(
                            this.formatDate(
                                bridge.updatedAt
                            )
                        )}
                    </small>


                    <span aria-hidden="true">
                        →
                    </span>

                </span>

            </button>
        `;

    },


    /* =====================================================
       DETAIL
    ===================================================== */

    renderDetail(
        entity,
        bridge
    ){

        if(!bridge){

            return "";

        }


        const target =
            this.resolveTargetEntity(
                bridge.targetEntityId
            );


        return `
            <div class="bridge-detail-layer">

                <div
                    class="bridge-detail-backdrop"
                    data-bridge-action="close"
                ></div>


                <section
                    class="bridge-detail"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Bridge bağlantısı"
                >

                    <header class="bridge-detail-header">

                        <div>

                            <span class="engine-section-label">
                                ${this.escapeHTML(
                                    this.relationshipLabel(
                                        bridge.relationship
                                    )
                                )}
                            </span>


                            <h2>
                                ${this.escapeHTML(
                                    bridge.targetName
                                )}
                            </h2>

                        </div>


                        <button
                            type="button"
                            class="engine-icon-btn"
                            data-bridge-action="close"
                            aria-label="Kapat"
                        >
                            ×
                        </button>

                    </header>


                    <div class="bridge-detail-scroll">

                        <div class="bridge-detail-relationship">

                            <span class="bridge-detail-node">

                                <strong>
                                    ${this.escapeHTML(
                                        entity.name ||
                                        "İsimsiz Varlık"
                                    )}
                                </strong>

                                <small>
                                    ${this.escapeHTML(
                                        entity.type ||
                                        "entity"
                                    )}
                                </small>

                            </span>


                            <span
                                class="bridge-detail-link"
                                aria-hidden="true"
                            >
                                ──
                                ${this.escapeHTML(
                                    this.relationshipIcon(
                                        bridge.relationship
                                    )
                                )}
                                ──
                            </span>


                            <span class="bridge-detail-node">

                                <strong>
                                    ${this.escapeHTML(
                                        bridge.targetName
                                    )}
                                </strong>

                                <small>
                                    ${this.escapeHTML(
                                        bridge.targetType
                                    )}
                                </small>

                            </span>

                        </div>


                        ${
                            bridge.label
                                ? `
                                    <div class="bridge-detail-section">

                                        <span>
                                            İlişki etiketi
                                        </span>

                                        <strong>
                                            ${this.escapeHTML(
                                                bridge.label
                                            )}
                                        </strong>

                                    </div>
                                  `
                                : ""
                        }


                        ${
                            bridge.note
                                ? `
                                    <div class="bridge-detail-section">

                                        <span>
                                            Not
                                        </span>

                                        <p>
                                            ${this.escapeHTML(
                                                bridge.note
                                            )}
                                        </p>

                                    </div>
                                  `
                                : ""
                        }


                        ${
                            bridge.tags.length
                                ? `
                                    <div class="bridge-detail-tags">

                                        ${bridge.tags
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


                        <div class="bridge-detail-info">

                            <div>

                                <span>
                                    Tür
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        this.relationshipLabel(
                                            bridge.relationship
                                        )
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Oluşturuldu
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        this.formatDate(
                                            bridge.createdAt
                                        )
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Durum
                                </span>

                                <strong>
                                    ${
                                        bridge.archived
                                            ? "Arşivlendi"
                                            : "Aktif"
                                    }
                                </strong>

                            </div>

                        </div>

                    </div>


                    <footer class="bridge-detail-actions">

                        ${
                            target
                                ? `
                                    <button
                                        type="button"
                                        class="primary-btn"
                                        data-bridge-action="target:open"
                                        data-target-entity-id="${this.escapeHTML(
                                            target.id
                                        )}"
                                    >
                                        Varlığı Aç
                                    </button>
                                  `
                                : ""
                        }


                        <button
                            type="button"
                            class="secondary-btn"
                            data-bridge-action="favorite"
                            data-bridge-id="${this.escapeHTML(
                                bridge.id
                            )}"
                        >
                            ${
                                bridge.favorite
                                    ? "Önemliyi Kaldır"
                                    : "Önemli Yap"
                            }
                        </button>


                        <button
                            type="button"
                            class="secondary-btn"
                            data-bridge-action="edit"
                            data-bridge-id="${this.escapeHTML(
                                bridge.id
                            )}"
                        >
                            Düzenle
                        </button>


                        <button
                            type="button"
                            class="secondary-btn"
                            data-bridge-action="archive"
                            data-bridge-id="${this.escapeHTML(
                                bridge.id
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
        bridge = null
    ){

        const editing =
            Boolean(
                bridge
            );


        const targets =
            this.getAvailableTargets(
                entity
            );


        const relationship =
            this.normalizeRelationshipType(
                bridge?.relationship ||
                "connection"
            );


        return `
            <div class="bridge-detail-layer">

                <div
                    class="bridge-detail-backdrop"
                    data-bridge-action="editor:cancel"
                ></div>


                <form
                    class="bridge-editor"
                    data-bridge-form="${
                        editing
                            ? "edit"
                            : "create"
                    }"
                >

                    <header class="bridge-detail-header">

                        <div>

                            <span class="engine-section-label">
                                BRIDGE EDITOR
                            </span>


                            <h2>
                                ${
                                    editing
                                        ? "Bağlantıyı düzenle"
                                        : "Yeni bağlantı kur"
                                }
                            </h2>

                        </div>


                        <button
                            type="button"
                            class="engine-icon-btn"
                            data-bridge-action="editor:cancel"
                            aria-label="Kapat"
                        >
                            ×
                        </button>

                    </header>


                    <div class="bridge-editor-scroll">

                        ${
                            !editing
                                ? `
                                    <label class="engine-field">

                                        <span>
                                            Hedef varlık
                                        </span>


                                        <select
                                            id="bridgeTargetInput"
                                            name="bridgeTarget"
                                            required
                                        >

                                            <option value="">
                                                Varlık seç
                                            </option>


                                            ${targets
                                                .map(
                                                    target => `
                                                        <option
                                                            value="${this.escapeHTML(
                                                                target.id
                                                            )}"
                                                        >
                                                            ${this.escapeHTML(
                                                                target.name ||
                                                                "İsimsiz Varlık"
                                                            )}
                                                            ·
                                                            ${this.escapeHTML(
                                                                target.type ||
                                                                "entity"
                                                            )}
                                                        </option>
                                                    `
                                                )
                                                .join("")}

                                        </select>

                                    </label>
                                  `
                                : `
                                    <div class="bridge-editor-target">

                                        <span>
                                            Bağlı varlık
                                        </span>

                                        <strong>
                                            ${this.escapeHTML(
                                                bridge.targetName
                                            )}
                                        </strong>

                                    </div>
                                  `
                        }


                        <label class="engine-field">

                            <span>
                                İlişki türü
                            </span>


                            <select
                                id="bridgeRelationshipInput"
                                name="bridgeRelationship"
                            >

                                ${this
                                    .getRelationshipTypes()
                                    .map(
                                        type => `
                                            <option
                                                value="${this.escapeHTML(
                                                    type.id
                                                )}"
                                                ${
                                                    relationship ===
                                                        type.id
                                                        ? "selected"
                                                        : ""
                                                }
                                            >
                                                ${this.escapeHTML(
                                                    type.label
                                                )}
                                            </option>
                                        `
                                    )
                                    .join("")}

                            </select>

                        </label>


                        <label class="engine-field">

                            <span>
                                İlişki etiketi
                            </span>


                            <input
                                id="bridgeLabelInput"
                                name="bridgeLabel"
                                type="text"
                                maxlength="80"
                                autocomplete="off"
                                value="${this.escapeHTML(
                                    bridge?.label ||
                                    ""
                                )}"
                                placeholder="Örn. Kurucu ortak"
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                Not
                            </span>


                            <textarea
                                id="bridgeNoteInput"
                                name="bridgeNote"
                                maxlength="1000"
                                rows="5"
                                placeholder="Bu bağlantının anlamını veya bağlamını yaz"
                            >${this.escapeHTML(
                                bridge?.note ||
                                ""
                            )}</textarea>

                        </label>


                        <label class="engine-field">

                            <span>
                                Etiketler
                            </span>


                            <input
                                id="bridgeTagsInput"
                                name="bridgeTags"
                                type="text"
                                maxlength="200"
                                autocomplete="off"
                                value="${this.escapeHTML(
                                    Array.isArray(
                                        bridge?.tags
                                    )
                                        ? bridge.tags.join(
                                            ", "
                                        )
                                        : ""
                                )}"
                                placeholder="iş, ekip, önemli"
                            >

                        </label>

                    </div>


                    <footer class="bridge-detail-actions">

                        <button
                            type="button"
                            class="secondary-btn"
                            data-bridge-action="editor:cancel"
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
                                    : "Bağlantıyı Kur"
                            }
                        </button>

                    </footer>

                </form>

            </div>
        `;

    },


    /* =====================================================
       EMPTY
    ===================================================== */

    renderEmptyState(entity){

        const targetCount =
            this.getAvailableTargets(
                entity
            ).length;


        return `
            <div class="section bridge-empty">

                <span
                    class="bridge-empty-icon"
                    aria-hidden="true"
                >
                    ⌁
                </span>


                <h3>
                    ${
                        this.searchQuery ||
                        this.activeFilter !==
                            "all"
                            ? "Eşleşen bağlantı bulunamadı"
                            : "Bridge henüz sessiz"
                    }
                </h3>


                <p>
                    ${
                        this.searchQuery ||
                        this.activeFilter !==
                            "all"
                            ? "Arama veya filtreyi değiştirerek tekrar deneyebilirsin."
                            : (
                                targetCount >
                                    0
                                    ? "Bu varlığı Engine içindeki diğer varlıklarla bağlayarak ilişki ağını oluşturmaya başla."
                                    : "Bağlantı kurmak için önce Engine içinde başka bir varlık oluştur."
                            )
                    }
                </p>


                ${
                    !this.searchQuery &&
                    this.activeFilter ===
                        "all" &&
                    targetCount >
                        0
                        ? `
                            <button
                                type="button"
                                class="primary-btn"
                                data-bridge-action="create"
                            >
                                İlk Bağlantıyı Kur
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
                    "İsimsiz Varlık"
                ),
                "BRIDGE",
                "⌁"
            );

        }


        return `
            <header class="engine-app-header">

                <span class="engine-section-label">
                    BRIDGE
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
       RENDER
    ===================================================== */

    render(entity){

        if(!entity){

            return `
                <section class="engine-page">

                    <div class="section engine-error-state">

                        <h1>
                            Bridge açılamadı
                        </h1>

                        <p>
                            Bu varlığın bağlantı bağlamı şu anda kullanılamıyor.
                        </p>

                    </div>

                </section>
            `;

        }


        this.enterBrainContext(
            entity
        );


        const bridges =
            this.getBridges(
                entity
            );


        const stats =
            this.getStats(
                entity
            );


        let selected =
            this.selectedBridgeId
                ? this.findBridge(
                    entity,
                    this.selectedBridgeId
                )
                : null;


        if(
            this.selectedBridgeId &&
            (
                !selected ||
                selected.archived ===
                    true
            )
        ){

            this.selectedBridgeId =
                null;


            this.editorMode =
                null;


            selected =
                null;

        }


        const editorBridge =
            this.editorMode ===
                "edit"
                ? selected
                : null;


        if(
            this.editorMode ===
                "edit" &&
            !editorBridge
        ){

            this.editorMode =
                null;

        }


        return `
            <section class="engine-page bridge-app-page">

                <div class="bridge-app-shell">

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


                    <section class="bridge-app-intro">

                        <div>

                            <span class="engine-section-label">
                                RELATIONSHIP NETWORK
                            </span>


                            <h2>
                                Bağlantı ağı
                            </h2>


                            <p>
                                Bu varlığın kişiler, şirketler, projeler ve diğer VAERO varlıklarıyla kurduğu yaşayan ilişkiler.
                            </p>

                        </div>


                        <div class="bridge-stats">

                            <div>

                                <strong>
                                    ${stats.total}
                                </strong>

                                <span>
                                    Bağlantı
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${stats.people}
                                </strong>

                                <span>
                                    Kişi
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${stats.companies}
                                </strong>

                                <span>
                                    Şirket
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${stats.favorites}
                                </strong>

                                <span>
                                    Önemli
                                </span>

                            </div>

                        </div>

                    </section>


                    ${this.renderToolbar()}


                    <div class="bridge-records-scroll">

                        ${
                            bridges.length
                                ? `
                                    <div class="bridge-record-list">

                                        ${bridges
                                            .map(
                                                bridge =>
                                                    this.renderBridgeCard(
                                                        bridge
                                                    )
                                            )
                                            .join("")}

                                    </div>
                                  `
                                : this.renderEmptyState(
                                    entity
                                )
                        }

                    </div>


                    <div class="bridge-communication-note">

                        <span aria-hidden="true">
                            ◇
                        </span>


                        <div>

                            <strong>
                                Communication katmanı
                            </strong>

                            <small>
                                Mesaj, sesli arama ve görüntülü arama için Bridge ilişkileri bağlantı altyapısı olarak kullanılabilir.
                            </small>

                        </div>

                    </div>


                    ${this.renderBrainPanel()}

                </div>


                ${
                    this.editorMode
                        ? this.renderEditor(
                            entity,
                            editorBridge
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
       TARGET NAVIGATION
    ===================================================== */

    openTargetEntity(
        targetId
    ){

        const id =
            String(
                targetId ||
                ""
            ).trim();


        if(!id){

            return false;

        }


        const actions =
            window.Actions ||
            null;


        if(
            !actions ||
            typeof actions.openEntity !==
                "function"
        ){

            return false;

        }


        const engine =
            this.getEngine();


        const currentWorld =
            engine?.currentWorld ||
            null;


        try{

            if(
                currentWorld &&
                Array.isArray(
                    currentWorld.entities
                ) &&
                currentWorld.entities.some(
                    item =>
                        String(
                            item?.id
                        ) ===
                            id
                )
            ){

                this.selectedBridgeId =
                    null;


                this.editorMode =
                    null;


                return actions.openEntity(
                    id
                );

            }

        } catch(error){

            /* world search fallback */

        }


        const worldService =
            this.getService(
                "world"
            );


        if(
            worldService &&
            typeof worldService.all ===
                "function"
        ){

            try{

                const worlds =
                    worldService.all();


                if(
                    Array.isArray(
                        worlds
                    )
                ){

                    const targetWorld =
                        worlds.find(
                            world =>
                                Array.isArray(
                                    world?.entities
                                ) &&
                                world.entities.some(
                                    item =>
                                        String(
                                            item?.id
                                        ) ===
                                            id
                                )
                        );


                    if(targetWorld){

                        if(
                            typeof actions.openWorld ===
                                "function"
                        ){

                            const opened =
                                actions.openWorld(
                                    targetWorld.id
                                );


                            if(
                                opened ===
                                    false
                            ){

                                return false;

                            }

                        }


                        this.selectedBridgeId =
                            null;


                        this.editorMode =
                            null;


                        return actions.openEntity(
                            id
                        );

                    }

                }

            } catch(error){

                console.warn(
                    "Bridge hedef varlığı açılamadı:",
                    error
                );

            }

        }


        /*
         * EntityManager hedefi biliyorsa Actions karar versin.
         */

        if(
            this.resolveTargetEntity(
                id
            )
        ){

            this.selectedBridgeId =
                null;


            this.editorMode =
                null;


            try{

                return actions.openEntity(
                    id
                );

            } catch(error){

                console.warn(
                    "Bridge hedef varlığı açılamadı:",
                    error
                );

            }

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

            case "create":

                this.selectedBridgeId =
                    null;


                this.editorMode =
                    "create";


                return this.remount();


            case "open":{

                const bridgeId =
                    button?.dataset
                        ?.bridgeId ||
                    null;


                const bridge =
                    this.findBridge(
                        entity,
                        bridgeId
                    );


                if(
                    !bridge ||
                    bridge.archived ===
                        true
                ){

                    return false;

                }


                this.selectedBridgeId =
                    bridgeId;


                this.editorMode =
                    null;


                return this.remount();

            }


            case "close":

                this.selectedBridgeId =
                    null;


                this.editorMode =
                    null;


                return this.remount();


            case "edit":{

                const bridgeId =
                    button?.dataset
                        ?.bridgeId ||
                    this.selectedBridgeId ||
                    null;


                const bridge =
                    this.findBridge(
                        entity,
                        bridgeId
                    );


                if(
                    !bridge ||
                    bridge.archived ===
                        true
                ){

                    return false;

                }


                this.selectedBridgeId =
                    bridgeId;


                this.editorMode =
                    "edit";


                return this.remount();

            }


            case "editor:cancel":

                this.editorMode =
                    null;


                return this.remount();


            case "filter":{

                const filter =
                    String(
                        button?.dataset
                            ?.bridgeFilter ||
                        "all"
                    );


                const allowed = [

                    "all",

                    ...this
                        .getRelationshipTypes()
                        .map(
                            type =>
                                type.id
                        )

                ];


                this.activeFilter =
                    allowed.includes(
                        filter
                    )
                        ? filter
                        : "all";


                this.selectedBridgeId =
                    null;


                this.editorMode =
                    null;


                return this.remount();

            }


            case "favorite":

                return this.toggleFavorite(
                    entity,
                    button?.dataset
                        ?.bridgeId
                );


            case "archive":

                return this.archiveBridge(
                    entity,
                    button?.dataset
                        ?.bridgeId
                );


            case "target:open":

                return this.openTargetEntity(
                    button?.dataset
                        ?.targetEntityId
                );


            default:

                return false;

        }

    }

};


/* =========================================================
   BRIDGE CLICK DELEGATION
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-bridge-action]"
            );


        if(!button){

            return;

        }


        event.preventDefault();


        BridgeApp.handleCommand(
            button.dataset
                .bridgeAction,
            button
        );

    }
);


/* =========================================================
   BRIDGE SEARCH
========================================================= */

document.addEventListener(
    "input",
    event => {

        if(
            event.target.id !==
                "bridgeSearchInput"
        ){

            return;

        }


        BridgeApp.searchQuery =
            String(
                event.target.value ||
                ""
            );


        clearTimeout(
            BridgeApp.searchTimer
        );


        BridgeApp.searchTimer =
            setTimeout(
                () => {

                    BridgeApp.selectedBridgeId =
                        null;


                    BridgeApp.editorMode =
                        null;


                    BridgeApp.remount();

                },
                120
            );

    }
);


/* =========================================================
   BRIDGE FORMS
========================================================= */

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target.closest(
                "[data-bridge-form]"
            );


        if(!form){

            return;

        }


        event.preventDefault();


        const entity =
            BridgeApp.getCurrentEntity();


        if(!entity){

            return;

        }


        if(
            form.dataset
                .bridgeForm ===
                "create"
        ){

            BridgeApp.createBridge(
                entity
            );


            return;

        }


        if(
            form.dataset
                .bridgeForm ===
                "edit"
        ){

            BridgeApp.updateBridge(
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
        "bridgeApp",
        BridgeApp
    );

} catch(error){

    /* global remains available */

}


window.BridgeApp =
    BridgeApp;
