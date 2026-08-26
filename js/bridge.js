/* =========================================================
   VAERO BRIDGE CORE
   Central Relationship / Connection System
========================================================= */

const Bridge = {

    links: [],

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
                `Bridge service okunamadı: ${name}`,
                error
            );


            return null;

        }

    },


    emit(
        eventName,
        payload = {}
    ){

        try{

            if(
                typeof VAERO !== "undefined" &&
                typeof VAERO.emit === "function"
            ){

                VAERO.emit(
                    eventName,
                    payload
                );

                return true;

            }


            const events =
                this.getService(
                    "events"
                );


            if(
                events &&
                typeof events.emit === "function"
            ){

                events.emit(
                    eventName,
                    payload
                );

                return true;

            }

        } catch(error){

            console.warn(
                `Bridge event gönderilemedi: ${eventName}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ){
            return crypto.randomUUID();
        }


        return `bridge_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeTags(value){

        if(
            !Array.isArray(value)
        ){
            return [];
        }


        return [
            ...new Set(
                value
                    .map(
                        item =>
                            String(
                                item ?? ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ];

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


    normalizeLink(
        link = {}
    ){

        const now =
            Date.now();


        const from =
            String(
                link.from ||
                link.sourceEntityId ||
                ""
            ).trim();


        const to =
            String(
                link.to ||
                link.targetEntityId ||
                ""
            ).trim();


        return {

            id:
                String(
                    link.id ||
                    this.createId()
                ),

            from,

            to,

            sourceEntityId:
                from,

            targetEntityId:
                to,

            type:
                this.normalizeRelationship(
                    link.type ||
                    link.relationship
                ),

            relationship:
                this.normalizeRelationship(
                    link.relationship ||
                    link.type
                ),

            label:
                String(
                    link.label ||
                    ""
                ).trim(),

            note:
                String(
                    link.note ||
                    link.description ||
                    ""
                ).trim(),

            tags:
                this.normalizeTags(
                    link.tags
                ),

            favorite:
                link.favorite ===
                true,

            bidirectional:
                link.bidirectional !==
                false,

            status:
                String(
                    link.status ||
                    "active"
                )
                    .trim()
                    .toLowerCase(),

            archived:
                link.archived ===
                true,

            archivedAt:
                link.archived ===
                    true
                    ? (
                        Number(
                            link.archivedAt
                        ) ||
                        now
                    )
                    : null,

            metadata:
                (
                    link.metadata &&
                    typeof link.metadata ===
                        "object" &&
                    !Array.isArray(
                        link.metadata
                    )
                )
                    ? {
                        ...link.metadata
                    }
                    : {},

            createdAt:
                Number(
                    link.createdAt
                ) ||
                now,

            updatedAt:
                Number(
                    link.updatedAt
                ) ||
                Number(
                    link.createdAt
                ) ||
                now

        };

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(this.booted){
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
            typeof events.on === "function"
        ){

            events.on(
                "entity.mounted",
                data => {

                    if(
                        !data ||
                        !data.entityId
                    ){
                        return;
                    }


                    this.connect(
                        data.entityId,
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

                }
            );


            events.on(
                "entity:mounted",
                data => {

                    if(
                        !data ||
                        !data.entityId
                    ){
                        return;
                    }


                    this.connect(
                        data.entityId,
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

                }
            );

        }


        this.booted =
            true;


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
            String(
                from ?? ""
            ).trim();


        const target =
            String(
                to ?? ""
            ).trim();


        if(
            !source ||
            !target ||
            source === target
        ){
            return null;
        }


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

            if(existing.archived){

                this.restore(
                    existing.id
                );

            }


            return existing;

        }


        const bridge =
            this.normalizeLink({

                id:
                    options.id ||
                    this.createId(),

                from:
                    source,

                to:
                    target,

                type:
                    relationship,

                relationship,

                label:
                    options.label,

                note:
                    options.note,

                tags:
                    options.tags,

                favorite:
                    options.favorite,

                bidirectional:
                    options.bidirectional !==
                    false,

                metadata:
                    options.metadata,

                status:
                    "active",

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now()

            });


        this.links.push(
            bridge
        );


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
            typeof data !== "object" ||
            Array.isArray(data)
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
       FIND
    ===================================================== */

    get(
        id,
        options = {}
    ){

        const bridgeId =
            String(
                id ?? ""
            ).trim();


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


        if(
            !link ||
            (
                link.archived === true &&
                options.includeArchived !== true
            )
        ){
            return null;
        }


        return link;

    },


    findConnection(
        from,
        to,
        type = null,
        options = {}
    ){

        const source =
            String(
                from ?? ""
            ).trim();


        const target =
            String(
                to ?? ""
            ).trim();


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
                        link.archived === true &&
                        options.includeArchived !== true
                    ){
                        return false;
                    }


                    const directionMatch =
                        (
                            link.from === source &&
                            link.to === target
                        ) ||
                        (
                            link.bidirectional === true &&
                            link.from === target &&
                            link.to === source
                        );


                    if(!directionMatch){
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
            String(
                entityId ?? ""
            ).trim();


        if(!id){
            return [];
        }


        let links =
            this.links.filter(
                link =>
                    link.from === id ||
                    (
                        link.bidirectional === true &&
                        link.to === id
                    )
            );


        if(
            options.includeArchived !== true
        ){

            links =
                links.filter(
                    link =>
                        link.archived !== true
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


        if(options.favorite === true){

            links =
                links.filter(
                    link =>
                        link.favorite === true
                );

        }


        return links.sort(
            (a,b) =>
                b.updatedAt -
                a.updatedAt
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
            String(
                entityA ?? ""
            ).trim();


        const b =
            String(
                entityB ?? ""
            ).trim();


        if(
            !a ||
            !b
        ){
            return [];
        }


        return this.links.filter(
            link => {

                if(
                    link.archived === true &&
                    options.includeArchived !== true
                ){
                    return false;
                }


                return (
                    (
                        link.from === a &&
                        link.to === b
                    ) ||
                    (
                        link.from === b &&
                        link.to === a
                    )
                );

            }
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
            typeof changes !== "object" ||
            Array.isArray(changes)
        ){
            return null;
        }


        const before = {
            ...link,
            tags:[
                ...link.tags
            ],
            metadata:{
                ...link.metadata
            }
        };


        if(
            changes.relationship !== undefined ||
            changes.type !== undefined
        ){

            const relationship =
                this.normalizeRelationship(
                    changes.relationship ||
                    changes.type
                );


            link.relationship =
                relationship;

            link.type =
                relationship;

        }


        if(
            typeof changes.label === "string"
        ){

            link.label =
                changes.label.trim();

        }


        if(
            typeof changes.note === "string"
        ){

            link.note =
                changes.note.trim();

        }


        if(
            Array.isArray(
                changes.tags
            )
        ){

            link.tags =
                this.normalizeTags(
                    changes.tags
                );

        }


        if(
            typeof changes.favorite === "boolean"
        ){

            link.favorite =
                changes.favorite;

        }


        if(
            typeof changes.bidirectional === "boolean"
        ){

            link.bidirectional =
                changes.bidirectional;

        }


        if(
            changes.metadata &&
            typeof changes.metadata === "object" &&
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


        this.save();

        this.syncEntitiesForLink(
            link
        );


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


        if(link.archived){
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


        if(!link.archived){
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


        const before =
            this.links.length;


        this.links =
            this.links.filter(
                item =>
                    item.id !==
                    link.id
            );


        if(
            this.links.length ===
            before
        ){
            return false;
        }


        this.save();

        this.removeEntitySnapshots(
            link
        );


        this.emit(
            "bridge.removed",
            link
        );


        this.emit(
            "bridge:removed",
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
       SEARCH
    ===================================================== */

    search(
        query,
        options = {}
    ){

        const text =
            String(
                query ?? ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        let links =
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

                    ...(link.tags || [])

                ]
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
            String(
                entityId ?? ""
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
            typeof manager.get === "function"
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

                /* world fallback */
            }

        }


        const worldService =
            this.getService(
                "world"
            );


        if(
            worldService &&
            typeof worldService.all === "function"
        ){

            try{

                const worlds =
                    worldService.all({
                        includeArchived:true
                    }) ||
                    [];


                for(
                    const world of worlds
                ){

                    const entity =
                        Array.isArray(
                            world?.entities
                        )
                            ? world.entities.find(
                                item =>
                                    item?.id === id
                            )
                            : null;


                    if(entity){
                        return entity;
                    }

                }

            } catch(error){

                return null;

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
            link.archived === true
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


        const snapshot =
            {
                ...link
            };


        if(
            source &&
            typeof source.addBridge ===
                "function"
        ){

            try{

                source.removeBridge?.(
                    link.id
                );

                source.addBridge(
                    snapshot
                );

            } catch(error){

                /* compatibility */
            }

        }


        if(
            target &&
            link.bidirectional === true &&
            typeof target.addBridge ===
                "function"
        ){

            try{

                target.removeBridge?.(
                    link.id
                );

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

            } catch(error){

                /* compatibility */
            }

        }


        this.getService(
            "world"
        )?.save?.();


        return true;

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


        try{

            source?.removeBridge?.(
                link.id
            );

        } catch(error){

            /* ignore */
        }


        try{

            target?.removeBridge?.(
                link.id
            );

        } catch(error){

            /* ignore */
        }


        this.getService(
            "world"
        )?.save?.();


        return true;

    },


    /* =====================================================
       LEGACY BRIDGE APP MIGRATION
    ===================================================== */

    migrateLegacyEntityStorage(){

        if(
            typeof localStorage === "undefined"
        ){
            return 0;
        }


        let migrated =
            0;


        const keys = [];


        try{

            for(
                let index = 0;
                index < localStorage.length;
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

                    records = [];

                }


                records.forEach(
                    legacy => {

                        if(
                            !legacy ||
                            typeof legacy !==
                                "object"
                        ){
                            return;
                        }


                        const from =
                            legacy.sourceEntityId ||
                            legacy.from;


                        const to =
                            legacy.targetEntityId ||
                            legacy.to;


                        if(
                            !from ||
                            !to
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
                                    includeArchived:true
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


                        migrated += 1;

                    }
                );

            }
        );


        if(migrated > 0){

            this.save();

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
            options.includeArchived !== true
        ){

            links =
                links.filter(
                    link =>
                        link.archived !== true
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
                String(
                    options.entityId
                );


            links =
                links.filter(
                    link =>
                        link.from === entityId ||
                        link.to === entityId
                );

        }


        return links.sort(
            (a,b) =>
                b.updatedAt -
                a.updatedAt
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
                        link.favorite === true
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

            projects:
                links.filter(
                    link =>
                        link.relationship ===
                        "project"
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


            this.links =
                Array.isArray(
                    parsed
                )
                    ? parsed
                        .filter(
                            link =>
                                link &&
                                typeof link ===
                                    "object"
                        )
                        .map(
                            link =>
                                this.normalizeLink(
                                    link
                                )
                        )
                    : [];


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
                String(
                    options.entityId
                );


            const affected =
                this.links.filter(
                    link =>
                        link.from === entityId ||
                        link.to === entityId
                );


            if(
                affected.length === 0
            ){
                return false;
            }


            affected.forEach(
                link =>
                    this.removeEntitySnapshots(
                        link
                    )
            );


            this.links =
                this.links.filter(
                    link =>
                        link.from !== entityId &&
                        link.to !== entityId
                );


            this.save();


            return true;

        }


        this.links.forEach(
            link =>
                this.removeEntitySnapshots(
                    link
                )
        );


        this.links =
            [];


        this.save();


        return true;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            booted:
                this.booted,

            total:
                this.links.length,

            active:
                this.links.filter(
                    link =>
                        link.archived !== true
                ).length,

            archived:
                this.links.filter(
                    link =>
                        link.archived === true
                ).length,

            bidirectional:
                this.links.filter(
                    link =>
                        link.bidirectional === true
                ).length,

            favorites:
                this.links.filter(
                    link =>
                        link.favorite === true &&
                        link.archived !== true
                ).length

        };

    }

};


VAERO.register(
    "bridge",
    Bridge
);


window.Bridge =
    Bridge;
