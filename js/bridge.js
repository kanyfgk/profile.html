/* =========================================================
   VAERO BRIDGE CORE
   Central Relationship / Connection System
========================================================= */

const Bridge = {

    links:
        [],

    booted:
        false,

    storageKey:
        "vaero:bridge:links:v2",

    legacyEntityStoragePrefix:
        "vaero:bridge:entity:v2:",


    /* =====================================================
       SAFE ACCESS
    ===================================================== */

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
                `Bridge service okunamadı: ${serviceName}`,
                error
            );


            return null;

        }

    },


    emit(
        eventName,
        payload = {}
    ){

        const name =
            String(
                eventName ??
                ""
            ).trim();


        if(!name){

            return false;

        }


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    name,
                    payload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `Bridge event gönderilemedi: ${name}`,
                error
            );

        }


        try{

            const events =
                this.getService(
                    "events"
                );


            if(
                events &&
                typeof events.emit ===
                    "function"
            ){

                events.emit(
                    name,
                    payload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `Bridge event fallback gönderilemedi: ${name}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       ID
    ===================================================== */

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

            /* fallback below */

        }


        return `bridge_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeId(value){

        const id =
            String(
                value ??
                ""
            )
                .trim()
                .slice(
                    0,
                    200
                );


        return (
            id ||
            null
        );

    },


    normalizeText(
        value,
        maxLength = 10000
    ){

        return String(
            value ??
                ""
        )
            .trim()
            .slice(
                0,
                maxLength
            );

    },


    normalizeTimestamp(
        value,
        fallback = Date.now()
    ){

        const timestamp =
            Number(
                value
            );


        return Number.isFinite(
            timestamp
        )
            ? timestamp
            : fallback;

    },


    normalizeTags(value){

        if(
            !Array.isArray(
                value
            ) &&
            !(value instanceof Set)
        ){

            return [];

        }


        const source =
            Array.isArray(
                value
            )
                ? value
                : [
                    ...value
                ];


        const seen =
            new Set();


        return source
            .map(
                item =>
                    String(
                        item ??
                            ""
                    )
                        .trim()
                        .slice(
                            0,
                            80
                        )
            )
            .filter(
                item => {

                    if(!item){

                        return false;

                    }


                    const key =
                        item.toLocaleLowerCase(
                            "tr-TR"
                        );


                    if(
                        seen.has(
                            key
                        )
                    ){

                        return false;

                    }


                    seen.add(
                        key
                    );


                    return true;

                }
            )
            .slice(
                0,
                40
            );

    },


    normalizeRelationship(value){

        const type =
            String(
                value ||
                    "connection"
            )
                .trim()
                .toLowerCase();


        const allowed = [

            "connection",
            "person",
            "company",
            "team",
            "partner",
            "project",
            "resource",
            "custom",
            "root-community",
            "default"

        ];


        return allowed.includes(
            type
        )
            ? type
            : "connection";

    },


    normalizeStatus(value){

        const status =
            String(
                value ||
                    "active"
            )
                .trim()
                .toLowerCase();


        if(
            [
                "active",
                "inactive",
                "paused",
                "blocked",
                "archived"
            ].includes(
                status
            )
        ){

            return status;

        }


        return "active";

    },


    normalizeMetadata(value){

        if(
            !value ||
            typeof value !==
                "object" ||
            Array.isArray(
                value
            )
        ){

            return {};

        }


        return {
            ...value
        };

    },


    normalizeLink(
        link = {}
    ){

        const sourceLink =
            link &&
            typeof link ===
                "object" &&
            !Array.isArray(
                link
            )
                ? link
                : {};


        const now =
            Date.now();


        const from =
            this.normalizeId(
                sourceLink.from ||
                sourceLink.sourceEntityId
            ) ||
            "";


        const to =
            this.normalizeId(
                sourceLink.to ||
                sourceLink.targetEntityId
            ) ||
            "";


        const relationship =
            this.normalizeRelationship(
                sourceLink.relationship ||
                sourceLink.type
            );


        const createdAt =
            this.normalizeTimestamp(
                sourceLink.createdAt,
                now
            );


        const updatedAt =
            this.normalizeTimestamp(
                sourceLink.updatedAt,
                createdAt
            );


        const archived =
            sourceLink.archived ===
                true;


        return {

            id:
                this.normalizeId(
                    sourceLink.id
                ) ||
                this.createId(),

            from,

            to,

            sourceEntityId:
                from,

            targetEntityId:
                to,

            type:
                relationship,

            relationship,

            label:
                this.normalizeText(
                    sourceLink.label,
                    240
                ),

            note:
                this.normalizeText(
                    sourceLink.note ||
                    sourceLink.description,
                    20000
                ),

            tags:
                this.normalizeTags(
                    sourceLink.tags
                ),

            favorite:
                sourceLink.favorite ===
                    true,

            bidirectional:
                sourceLink.bidirectional !==
                    false,

            status:
                archived
                    ? "archived"
                    : this.normalizeStatus(
                        sourceLink.status
                    ),

            archived,

            archivedAt:
                archived
                    ? this.normalizeTimestamp(
                        sourceLink.archivedAt,
                        updatedAt
                    )
                    : null,

            metadata:
                this.normalizeMetadata(
                    sourceLink.metadata
                ),

            createdAt,

            updatedAt:
                Math.max(
                    createdAt,
                    updatedAt
                )

        };

    },


    /* =====================================================
       INTERNAL HELPERS
    ===================================================== */

    getIndex(id){

        const bridgeId =
            this.normalizeId(
                id
            );


        if(!bridgeId){

            return -1;

        }


        return this.links.findIndex(
            link =>
                link?.id ===
                    bridgeId
        );

    },


    sort(){

        this.links.sort(
            (
                a,
                b
            ) =>
                Number(
                    b?.updatedAt ||
                    b?.createdAt ||
                    0
                ) -
                Number(
                    a?.updatedAt ||
                    a?.createdAt ||
                    0
                )
        );


        return this.links;

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(
            this.booted
        ){

            return true;

        }


        this.load();


        this.migrateLegacyEntityStorage();


        const events =
            this.getService(
                "events"
            );


        if(
            events &&
            typeof events.on ===
                "function"
        ){

            const handleEntityMounted =
                data => {

                    const entityId =
                        this.normalizeId(
                            data?.entityId ||
                            data?.entity?.id
                        );


                    if(!entityId){

                        return;

                    }


                    /*
                     * Every mounted entity can belong to
                     * the root VAERO community graph.
                     */

                    this.connect(
                        entityId,
                        "vaero-community",
                        "root-community",
                        {
                            label:
                                "VAERO Community",

                            bidirectional:
                                true,

                            metadata:{
                                system:
                                    true
                            }
                        }
                    );

                };


            try{

                events.on(
                    "entity.mounted",
                    handleEntityMounted
                );


                events.on(
                    "entity:mounted",
                    handleEntityMounted
                );

            } catch(error){

                console.warn(
                    "Bridge entity event listener kurulamadı.",
                    error
                );

            }

        }


        this.booted =
            true;


        this.emit(
            "bridge:ready",
            {
                count:
                    this.links.length,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       CONNECT
       Backward-compatible:
       connect(from, to, type)
    ===================================================== */

    connect(
        from,
        to,
        type = "connection",
        options = {}
    ){

        const source =
            this.normalizeId(
                from
            );


        const target =
            this.normalizeId(
                to
            );


        if(
            !source ||
            !target ||
            source ===
                target
        ){

            return null;

        }


        const safeOptions =
            options &&
            typeof options ===
                "object" &&
            !Array.isArray(
                options
            )
                ? options
                : {};


        const relationship =
            this.normalizeRelationship(
                type
            );


        const existing =
            this.findConnection(
                source,
                target,
                relationship,
                {
                    includeArchived:
                        true
                }
            );


        if(existing){

            if(
                existing.archived
            ){

                this.restore(
                    existing.id
                );

            }


            return existing;

        }


        const bridge =
            this.normalizeLink({

                id:
                    safeOptions.id ||
                    this.createId(),

                from:
                    source,

                to:
                    target,

                type:
                    relationship,

                relationship,

                label:
                    safeOptions.label,

                note:
                    safeOptions.note,

                tags:
                    safeOptions.tags,

                favorite:
                    safeOptions.favorite,

                bidirectional:
                    safeOptions.bidirectional !==
                        false,

                metadata:
                    safeOptions.metadata,

                status:
                    safeOptions.status ||
                    "active",

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now()

            });


        /*
         * Canonical endpoints must stay valid after
         * normalization.
         */

        if(
            !bridge.from ||
            !bridge.to ||
            bridge.from ===
                bridge.to
        ){

            return null;

        }


        this.links.push(
            bridge
        );


        this.sort();


        this.save();


        this.syncEntitiesForLink(
            bridge
        );


        this.emit(
            "bridge.created",
            bridge
        );


        this.emit(
            "bridge:created",
            {
                bridge,

                bridgeId:
                    bridge.id,

                from:
                    bridge.from,

                to:
                    bridge.to,

                time:
                    Date.now()
            }
        );


        return bridge;

    },


    /* =====================================================
       STRUCTURED CREATE
    ===================================================== */

    create(data = {}){

        if(
            !data ||
            typeof data !==
                "object" ||
            Array.isArray(
                data
            )
        ){

            return null;

        }


        return this.connect(
            data.from ||
            data.sourceEntityId,
            data.to ||
            data.targetEntityId,
            data.relationship ||
            data.type ||
            "connection",
            data
        );

    },


    /* =====================================================
       GET
    ===================================================== */

    get(
        id,
        options = {}
    ){

        const bridgeId =
            this.normalizeId(
                id
            );


        if(!bridgeId){

            return null;

        }


        const link =
            this.links.find(
                item =>
                    item?.id ===
                        bridgeId
            ) ||
            null;


        if(!link){

            return null;

        }


        if(
            link.archived ===
                true &&
            options.includeArchived !==
                true
        ){

            return null;

        }


        return link;

    },


    /* =====================================================
       FIND CONNECTION
    ===================================================== */

    findConnection(
        from,
        to,
        type = null,
        options = {}
    ){

        const source =
            this.normalizeId(
                from
            );


        const target =
            this.normalizeId(
                to
            );


        if(
            !source ||
            !target
        ){

            return null;

        }


        const normalizedType =
            type
                ? this.normalizeRelationship(
                    type
                )
                : null;


        return (
            this.links.find(
                link => {

                    if(
                        link.archived ===
                            true &&
                        options.includeArchived !==
                            true
                    ){

                        return false;

                    }


                    const forward =
                        link.from ===
                            source &&
                        link.to ===
                            target;


                    const reverse =
                        link.bidirectional ===
                            true &&
                        link.from ===
                            target &&
                        link.to ===
                            source;


                    if(
                        !forward &&
                        !reverse
                    ){

                        return false;

                    }


                    if(
                        normalizedType &&
                        link.relationship !==
                            normalizedType
                    ){

                        return false;

                    }


                    return true;

                }
            ) ||
            null
        );

    },


    /* =====================================================
       ENTITY CONNECTION QUERY
    ===================================================== */

    find(
        entityId,
        options = {}
    ){

        const id =
            this.normalizeId(
                entityId
            );


        if(!id){

            return [];

        }


        let links =
            this.links.filter(
                link =>
                    link.from ===
                        id ||
                    (
                        link.bidirectional ===
                            true &&
                        link.to ===
                            id
                    )
            );


        if(
            options.includeArchived !==
                true
        ){

            links =
                links.filter(
                    link =>
                        link.archived !==
                            true
                );

        }


        if(options.relationship){

            const relationship =
                this.normalizeRelationship(
                    options.relationship
                );


            links =
                links.filter(
                    link =>
                        link.relationship ===
                            relationship
                );

        }


        if(
            options.favorite ===
                true
        ){

            links =
                links.filter(
                    link =>
                        link.favorite ===
                            true
                );

        }


        if(options.status){

            const status =
                this.normalizeStatus(
                    options.status
                );


            links =
                links.filter(
                    link =>
                        link.status ===
                            status
                );

        }


        return [
            ...links
        ].sort(
            (
                a,
                b
            ) =>
                Number(
                    b.updatedAt
                ) -
                Number(
                    a.updatedAt
                )
        );

    },


    forEntity(
        entityId,
        options = {}
    ){

        return this.find(
            entityId,
            options
        );

    },


    connectionsBetween(
        entityA,
        entityB,
        options = {}
    ){

        const a =
            this.normalizeId(
                entityA
            );


        const b =
            this.normalizeId(
                entityB
            );


        if(
            !a ||
            !b
        ){

            return [];

        }


        let links =
            this.links.filter(
                link => {

                    if(
                        link.archived ===
                            true &&
                        options.includeArchived !==
                            true
                    ){

                        return false;

                    }


                    return (
                        (
                            link.from ===
                                a &&
                            link.to ===
                                b
                        ) ||
                        (
                            link.from ===
                                b &&
                            link.to ===
                                a
                        )
                    );

                }
            );


        if(options.relationship){

            const relationship =
                this.normalizeRelationship(
                    options.relationship
                );


            links =
                links.filter(
                    link =>
                        link.relationship ===
                            relationship
                );

        }


        return [
            ...links
        ].sort(
            (
                left,
                right
            ) =>
                Number(
                    right.updatedAt
                ) -
                Number(
                    left.updatedAt
                )
        );

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    update(
        id,
        changes = {}
    ){

        const link =
            this.get(
                id,
                {
                    includeArchived:
                        true
                }
            );


        if(
            !link ||
            !changes ||
            typeof changes !==
                "object" ||
            Array.isArray(
                changes
            )
        ){

            return null;

        }


        const before = {

            ...link,

            tags:[
                ...(link.tags || [])
            ],

            metadata:{
                ...(link.metadata || {})
            }

        };


        if(
            changes.relationship !==
                undefined ||
            changes.type !==
                undefined
        ){

            const relationship =
                this.normalizeRelationship(
                    changes.relationship ??
                    changes.type
                );


            link.relationship =
                relationship;


            link.type =
                relationship;

        }


        if(
            changes.label !==
                undefined
        ){

            link.label =
                this.normalizeText(
                    changes.label,
                    240
                );

        }


        if(
            changes.note !==
                undefined ||
            changes.description !==
                undefined
        ){

            link.note =
                this.normalizeText(
                    changes.note ??
                    changes.description,
                    20000
                );

        }


        if(
            changes.tags !==
                undefined
        ){

            link.tags =
                this.normalizeTags(
                    changes.tags
                );

        }


        if(
            typeof changes.favorite ===
                "boolean"
        ){

            link.favorite =
                changes.favorite;

        }


        if(
            typeof changes.bidirectional ===
                "boolean"
        ){

            link.bidirectional =
                changes.bidirectional;

        }


        if(
            changes.status !==
                undefined &&
            link.archived !==
                true
        ){

            link.status =
                this.normalizeStatus(
                    changes.status
                );

        }


        if(
            changes.metadata &&
            typeof changes.metadata ===
                "object" &&
            !Array.isArray(
                changes.metadata
            )
        ){

            link.metadata = {

                ...link.metadata,

                ...changes.metadata

            };

        }


        link.updatedAt =
            Date.now();


        this.sort();


        this.save();


        /*
         * Rebuild both endpoint snapshots because
         * bidirectional/metadata/relationship may change.
         */

        this.removeEntitySnapshots(
            before
        );


        if(
            link.archived !==
                true
        ){

            this.syncEntitiesForLink(
                link
            );

        }


        this.emit(
            "bridge:updated",
            {
                bridge:
                    link,

                before,

                bridgeId:
                    link.id,

                time:
                    Date.now()
            }
        );


        return link;

    },


    /* =====================================================
       FAVORITE
    ===================================================== */

    toggleFavorite(id){

        const link =
            this.get(
                id,
                {
                    includeArchived:
                        true
                }
            );


        if(!link){

            return false;

        }


        return Boolean(
            this.update(
                link.id,
                {
                    favorite:
                        !link.favorite
                }
            )
        );

    },


    /* =====================================================
       ARCHIVE / RESTORE
    ===================================================== */

    archive(id){

        const link =
            this.get(
                id,
                {
                    includeArchived:
                        true
                }
            );


        if(!link){

            return false;

        }


        if(
            link.archived
        ){

            return true;

        }


        link.archived =
            true;


        link.archivedAt =
            Date.now();


        link.status =
            "archived";


        link.updatedAt =
            Date.now();


        this.sort();


        this.save();


        this.removeEntitySnapshots(
            link
        );


        this.emit(
            "bridge:archived",
            {
                bridge:
                    link,

                bridgeId:
                    link.id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    restore(id){

        const link =
            this.get(
                id,
                {
                    includeArchived:
                        true
                }
            );


        if(!link){

            return false;

        }


        if(
            !link.archived
        ){

            return true;

        }


        link.archived =
            false;


        link.archivedAt =
            null;


        link.status =
            "active";


        link.updatedAt =
            Date.now();


        this.sort();


        this.save();


        this.syncEntitiesForLink(
            link
        );


        this.emit(
            "bridge:restored",
            {
                bridge:
                    link,

                bridgeId:
                    link.id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       REMOVE
       Backward-compatible hard remove
    ===================================================== */

    remove(id){

        const link =
            this.get(
                id,
                {
                    includeArchived:
                        true
                }
            );


        if(!link){

            return false;

        }


        const index =
            this.getIndex(
                link.id
            );


        if(
            index <
                0
        ){

            return false;

        }


        const [
            removed
        ] =
            this.links.splice(
                index,
                1
            );


        this.save();


        this.removeEntitySnapshots(
            removed
        );


        this.emit(
            "bridge.removed",
            removed
        );


        this.emit(
            "bridge:removed",
            {
                bridge:
                    removed,

                bridgeId:
                    removed.id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       SEARCH
    ===================================================== */

    search(
        query,
        options = {}
    ){

        const text =
            String(
                query ??
                    ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        const links =
            this.all(
                options
            );


        if(!text){

            return links;

        }


        return links.filter(
            link => {

                const haystack = [

                    link.from,

                    link.to,

                    link.relationship,

                    link.label,

                    link.note,

                    link.status,

                    ...(link.tags || [])

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLocaleLowerCase(
                        "tr-TR"
                    );


                return haystack.includes(
                    text
                );

            }
        );

    },


    /* =====================================================
       ENTITY RESOLUTION
    ===================================================== */

    resolveEntity(entityId){

        const id =
            this.normalizeId(
                entityId
            );


        if(!id){

            return null;

        }


        const manager =
            this.getService(
                "entityManager"
            );


        if(manager){

            const methods = [
                "get",
                "find",
                "getById"
            ];


            for(
                const method of methods
            ){

                if(
                    typeof manager[
                        method
                    ] !==
                        "function"
                ){

                    continue;

                }


                try{

                    const entity =
                        manager[
                            method
                        ](
                            id
                        );


                    if(entity){

                        return entity;

                    }

                } catch(error){

                    /* next resolver */

                }

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
                    worldService.all({
                        includeArchived:
                            true
                    }) ||
                    [];


                for(
                    const world of worlds
                ){

                    const entities =
                        Array.isArray(
                            world?.entities
                        )
                            ? world.entities
                            : [];


                    const entity =
                        entities.find(
                            item =>
                                item?.id ===
                                    id
                        );


                    if(entity){

                        return entity;

                    }

                }

            } catch(error){

                /* unresolved */

            }

        }


        return null;

    },


    /* =====================================================
       ENTITY SNAPSHOT SYNC
    ===================================================== */

    syncEntitiesForLink(link){

        if(
            !link ||
            link.archived ===
                true
        ){

            return false;

        }


        const source =
            this.resolveEntity(
                link.from
            );


        const target =
            this.resolveEntity(
                link.to
            );


        let changed =
            false;


        const snapshot = {

            ...link,

            tags:[
                ...(link.tags || [])
            ],

            metadata:{
                ...(link.metadata || {})
            }

        };


        if(
            source &&
            typeof source.addBridge ===
                "function"
        ){

            try{

                if(
                    typeof source.removeBridge ===
                        "function"
                ){

                    source.removeBridge(
                        link.id
                    );

                }


                source.addBridge(
                    snapshot
                );


                changed =
                    true;

            } catch(error){

                console.warn(
                    `Bridge source snapshot yazılamadı: ${link.id}`,
                    error
                );

            }

        }


        if(
            target &&
            link.bidirectional ===
                true &&
            typeof target.addBridge ===
                "function"
        ){

            try{

                if(
                    typeof target.removeBridge ===
                        "function"
                ){

                    target.removeBridge(
                        link.id
                    );

                }


                target.addBridge({

                    ...snapshot,

                    from:
                        link.to,

                    to:
                        link.from,

                    sourceEntityId:
                        link.to,

                    targetEntityId:
                        link.from

                });


                changed =
                    true;

            } catch(error){

                console.warn(
                    `Bridge target snapshot yazılamadı: ${link.id}`,
                    error
                );

            }

        }


        if(changed){

            try{

                const world =
                    this.getService(
                        "world"
                    );


                if(
                    typeof world?.save ===
                        "function"
                ){

                    world.save();

                }

            } catch(error){

                console.warn(
                    "Bridge world snapshot kaydedilemedi.",
                    error
                );

            }

        }


        return changed;

    },


    removeEntitySnapshots(link){

        if(!link){

            return false;

        }


        const source =
            this.resolveEntity(
                link.from
            );


        const target =
            this.resolveEntity(
                link.to
            );


        let changed =
            false;


        try{

            if(
                typeof source?.removeBridge ===
                    "function"
            ){

                source.removeBridge(
                    link.id
                );


                changed =
                    true;

            }

        } catch(error){

            console.warn(
                `Bridge source snapshot silinemedi: ${link.id}`,
                error
            );

        }


        try{

            if(
                typeof target?.removeBridge ===
                    "function"
            ){

                target.removeBridge(
                    link.id
                );


                changed =
                    true;

            }

        } catch(error){

            console.warn(
                `Bridge target snapshot silinemedi: ${link.id}`,
                error
            );

        }


        if(changed){

            try{

                const world =
                    this.getService(
                        "world"
                    );


                if(
                    typeof world?.save ===
                        "function"
                ){

                    world.save();

                }

            } catch(error){

                console.warn(
                    "Bridge world snapshot kaydedilemedi.",
                    error
                );

            }

        }


        return changed;

    },


    /* =====================================================
       LEGACY BRIDGE APP MIGRATION
    ===================================================== */

    migrateLegacyEntityStorage(){

        if(
            typeof localStorage ===
                "undefined"
        ){

            return 0;

        }


        let migrated =
            0;


        const keys =
            [];


        try{

            for(
                let index = 0;
                index <
                    localStorage.length;
                index += 1
            ){

                const key =
                    localStorage.key(
                        index
                    );


                if(
                    key &&
                    key.startsWith(
                        this.legacyEntityStoragePrefix
                    )
                ){

                    keys.push(
                        key
                    );

                }

            }

        } catch(error){

            return 0;

        }


        keys.forEach(
            key => {

                let records =
                    [];


                try{

                    const parsed =
                        JSON.parse(
                            localStorage.getItem(
                                key
                            ) ||
                            "[]"
                        );


                    records =
                        Array.isArray(
                            parsed
                        )
                            ? parsed
                            : [];

                } catch(error){

                    records =
                        [];

                }


                records.forEach(
                    legacy => {

                        if(
                            !legacy ||
                            typeof legacy !==
                                "object" ||
                            Array.isArray(
                                legacy
                            )
                        ){

                            return;

                        }


                        const from =
                            this.normalizeId(
                                legacy.sourceEntityId ||
                                legacy.from
                            );


                        const to =
                            this.normalizeId(
                                legacy.targetEntityId ||
                                legacy.to
                            );


                        if(
                            !from ||
                            !to ||
                            from ===
                                to
                        ){

                            return;

                        }


                        const exists =
                            this.findConnection(
                                from,
                                to,
                                legacy.relationship ||
                                legacy.type,
                                {
                                    includeArchived:
                                        true
                                }
                            );


                        if(exists){

                            return;

                        }


                        const link =
                            this.normalizeLink({

                                ...legacy,

                                from,

                                to,

                                sourceEntityId:
                                    from,

                                targetEntityId:
                                    to

                            });


                        this.links.push(
                            link
                        );


                        migrated +=
                            1;

                    }
                );

            }
        );


        if(
            migrated >
                0
        ){

            this.sort();


            this.save();


            this.emit(
                "bridge:migrated",
                {
                    count:
                        migrated,

                    time:
                        Date.now()
                }
            );

        }


        return migrated;

    },


    /* =====================================================
       ALL
    ===================================================== */

    all(options = {}){

        let links =
            [
                ...this.links
            ];


        if(
            options.includeArchived !==
                true
        ){

            links =
                links.filter(
                    link =>
                        link.archived !==
                            true
                );

        }


        if(options.relationship){

            const relationship =
                this.normalizeRelationship(
                    options.relationship
                );


            links =
                links.filter(
                    link =>
                        link.relationship ===
                            relationship
                );

        }


        if(options.entityId){

            const entityId =
                this.normalizeId(
                    options.entityId
                );


            links =
                links.filter(
                    link =>
                        link.from ===
                            entityId ||
                        link.to ===
                            entityId
                );

        }


        if(
            options.favorite ===
                true
        ){

            links =
                links.filter(
                    link =>
                        link.favorite ===
                            true
                );

        }


        if(options.status){

            const status =
                this.normalizeStatus(
                    options.status
                );


            links =
                links.filter(
                    link =>
                        link.status ===
                            status
                );

        }


        return links.sort(
            (
                a,
                b
            ) =>
                Number(
                    b.updatedAt
                ) -
                Number(
                    a.updatedAt
                )
        );

    },


    /* =====================================================
       STATS
    ===================================================== */

    stats(entityId = null){

        const links =
            entityId
                ? this.find(
                    entityId
                )
                : this.all();


        return {

            total:
                links.length,

            favorites:
                links.filter(
                    link =>
                        link.favorite ===
                            true
                ).length,

            people:
                links.filter(
                    link =>
                        link.relationship ===
                            "person"
                ).length,

            companies:
                links.filter(
                    link =>
                        link.relationship ===
                            "company"
                ).length,

            teams:
                links.filter(
                    link =>
                        link.relationship ===
                            "team"
                ).length,

            partners:
                links.filter(
                    link =>
                        link.relationship ===
                            "partner"
                ).length,

            projects:
                links.filter(
                    link =>
                        link.relationship ===
                            "project"
                ).length,

            resources:
                links.filter(
                    link =>
                        link.relationship ===
                            "resource"
                ).length

        };

    },


    /* =====================================================
       PERSISTENCE
    ===================================================== */

    save(){

        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){

                return false;

            }


            localStorage.setItem(
                this.storageKey,
                JSON.stringify(
                    this.links
                )
            );


            return true;

        } catch(error){

            console.error(
                "Bridge kaydedilemedi:",
                error
            );


            return false;

        }

    },


    load(){

        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){

                this.links =
                    [];


                return this.links;

            }


            const saved =
                localStorage.getItem(
                    this.storageKey
                );


            if(!saved){

                this.links =
                    [];


                return this.links;

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

                this.links =
                    [];


                this.save();


                return this.links;

            }


            const byId =
                new Map();


            parsed
                .filter(
                    link =>
                        link &&
                        typeof link ===
                            "object" &&
                        !Array.isArray(
                            link
                        )
                )
                .forEach(
                    link => {

                        const normalized =
                            this.normalizeLink(
                                link
                            );


                        if(
                            !normalized.from ||
                            !normalized.to ||
                            normalized.from ===
                                normalized.to
                        ){

                            return;

                        }


                        const existing =
                            byId.get(
                                normalized.id
                            );


                        if(
                            !existing ||
                            Number(
                                normalized.updatedAt
                            ) >=
                            Number(
                                existing.updatedAt
                            )
                        ){

                            byId.set(
                                normalized.id,
                                normalized
                            );

                        }

                    }
                );


            this.links =
                [
                    ...byId.values()
                ];


            this.sort();


            /*
             * Persist canonical representation.
             */

            this.save();


            return this.links;

        } catch(error){

            console.error(
                "Bridge yüklenemedi:",
                error
            );


            this.links =
                [];


            return this.links;

        }

    },


    /* =====================================================
       CLEAR
    ===================================================== */

    clear(options = {}){

        if(options.entityId){

            const entityId =
                this.normalizeId(
                    options.entityId
                );


            if(!entityId){

                return false;

            }


            const affected =
                this.links.filter(
                    link =>
                        link.from ===
                            entityId ||
                        link.to ===
                            entityId
                );


            if(
                affected.length ===
                    0
            ){

                return false;

            }


            affected.forEach(
                link => {

                    this.removeEntitySnapshots(
                        link
                    );

                }
            );


            this.links =
                this.links.filter(
                    link =>
                        link.from !==
                            entityId &&
                        link.to !==
                            entityId
                );


            this.save();


            this.emit(
                "bridge:cleared",
                {
                    entityId,

                    count:
                        affected.length,

                    time:
                        Date.now()
                }
            );


            return true;

        }


        const previous =
            [
                ...this.links
            ];


        previous.forEach(
            link => {

                this.removeEntitySnapshots(
                    link
                );

            }
        );


        this.links =
            [];


        this.save();


        this.emit(
            "bridge:cleared",
            {
                count:
                    previous.length,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const active =
            this.links.filter(
                link =>
                    link.archived !==
                        true
            );


        const archived =
            this.links.filter(
                link =>
                    link.archived ===
                        true
            );


        return {

            booted:
                this.booted,

            total:
                this.links.length,

            active:
                active.length,

            archived:
                archived.length,

            bidirectional:
                active.filter(
                    link =>
                        link.bidirectional ===
                            true
                ).length,

            directional:
                active.filter(
                    link =>
                        link.bidirectional !==
                            true
                ).length,

            favorites:
                active.filter(
                    link =>
                        link.favorite ===
                            true
                ).length,

            relationships:
                active.reduce(
                    (
                        result,
                        link
                    ) => {

                        const type =
                            link.relationship ||
                            "connection";


                        result[
                            type
                        ] =
                            (
                                result[
                                    type
                                ] ||
                                0
                            ) +
                            1;


                        return result;

                    },
                    {}
                )

        };

    }

};


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
            "bridge",
            Bridge
        );

    }

} catch(error){

    console.error(
        "Bridge register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.Bridge =
        Bridge;

}
