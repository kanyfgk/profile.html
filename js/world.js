/* =========================================================
   VAERO WORLD
   World Lifecycle / Membership / Persistence
========================================================= */

const World = {

    worlds:
        [],

    booted:
        false,

    storageKey:
        "vaero:worlds:v2",


    /* =====================================================
       SAFE SERVICE ACCESS
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
                `World service lookup failed: ${serviceName}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       EVENT
    ===================================================== */

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
                `World event failed: ${name}`,
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
                `World event fallback failed: ${name}`,
                error
            );

        }


        return false;

    },


    emitAliases(
        names,
        payload = {}
    ){

        if(
            !Array.isArray(
                names
            )
        ){

            return false;

        }


        let emitted =
            false;


        names.forEach(
            name => {

                if(
                    this.emit(
                        name,
                        payload
                    )
                ){

                    emitted =
                        true;

                }

            }
        );


        return emitted;

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


        return `world_${Date.now()}_${Math.random()
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
        fallback = "",
        maxLength = 10000
    ){

        const result =
            String(
                value ??
                fallback
            )
                .trim()
                .slice(
                    0,
                    maxLength
                );


        if(result){

            return result;

        }


        return String(
            fallback ??
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


        return (
            Number.isFinite(
                timestamp
            ) &&
            timestamp >
                0
        )
            ? timestamp
            : fallback;

    },


    normalizeArray(value){

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
                            160
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
            );

    },


    normalizeObject(value){

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


    normalizeStatus(status){

        const value =
            String(
                status ||
                "active"
            )
                .trim()
                .toLowerCase();


        const allowed = [

            "active",
            "inactive",
            "paused",
            "archived"

        ];


        return allowed.includes(
            value
        )
            ? value
            : "active";

    },


    normalizeEntityList(value){

        if(
            !Array.isArray(
                value
            )
        ){

            return [];

        }


        const byId =
            new Map();


        value.forEach(
            entity => {

                if(
                    !entity ||
                    typeof entity !==
                        "object" ||
                    Array.isArray(
                        entity
                    )
                ){

                    return;

                }


                const id =
                    this.normalizeId(
                        entity.id
                    );


                if(!id){

                    return;

                }


                const existing =
                    byId.get(
                        id
                    );


                if(!existing){

                    byId.set(
                        id,
                        entity
                    );


                    return;

                }


                const existingUpdatedAt =
                    Number(
                        existing.updatedAt ||
                        existing.createdAt ||
                        0
                    );


                const incomingUpdatedAt =
                    Number(
                        entity.updatedAt ||
                        entity.createdAt ||
                        0
                    );


                if(
                    incomingUpdatedAt >=
                        existingUpdatedAt
                ){

                    byId.set(
                        id,
                        entity
                    );

                }

            }
        );


        return [
            ...byId.values()
        ];

    },


    normalize(world = {}){

        const source =
            world &&
            typeof world ===
                "object" &&
            !Array.isArray(
                world
            )
                ? world
                : {};


        const now =
            Date.now();


        const archived =
            source.archived ===
                true ||
            String(
                source.status ||
                    ""
            )
                .trim()
                .toLowerCase() ===
                    "archived";


        const createdAt =
            this.normalizeTimestamp(
                source.createdAt,
                now
            );


        const updatedAt =
            this.normalizeTimestamp(
                source.updatedAt,
                createdAt
            );


        return {

            id:
                this.normalizeId(
                    source.id
                ) ||
                this.createId(),

            name:
                this.normalizeText(
                    source.name,
                    "İsimsiz Dünya",
                    240
                ),

            description:
                this.normalizeText(
                    source.description,
                    "",
                    10000
                ),

            type:
                this.normalizeText(
                    source.type,
                    "custom-world",
                    120
                ),

            owner:
                this.normalizeId(
                    source.owner
                ),

            entities:
                this.normalizeEntityList(
                    source.entities
                ),

            tags:
                this.normalizeArray(
                    source.tags
                ),

            metadata:
                this.normalizeObject(
                    source.metadata
                ),

            status:
                archived
                    ? "archived"
                    : this.normalizeStatus(
                        source.status
                    ),

            archived,

            archivedAt:
                archived
                    ? this.normalizeTimestamp(
                        source.archivedAt,
                        updatedAt
                    )
                    : null,

            createdAt,

            updatedAt:
                Math.max(
                    createdAt,
                    updatedAt
                )

        };

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


        const events =
            this.getService(
                "events"
            );


        if(
            !events ||
            typeof events.on !==
                "function"
        ){

            console.error(
                "World boot failed: Events service not found."
            );


            return false;

        }


        const handleEngineStarted =
            data => {

                const entityId =
                    this.normalizeId(
                        data?.entityId ||
                        data?.rootEntityId ||
                        data?.ownerId
                    );


                if(!entityId){

                    return;

                }


                this.ensureRootWorld(
                    entityId
                );

            };


        try{

            events.on(
                "engine.started",
                handleEngineStarted
            );


            events.on(
                "engine:started",
                handleEngineStarted
            );

        } catch(error){

            console.error(
                "World engine listener kurulamadı:",
                error
            );


            return false;

        }


        this.booted =
            true;


        this.emit(
            "world:ready",
            {
                worlds:
                    this.worlds.length,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       ROOT WORLD
    ===================================================== */

    ensureRootWorld(ownerId){

        const normalizedOwner =
            this.normalizeId(
                ownerId
            );


        const existing =
            this.get(
                "vaero-world"
            );


        if(existing){

            let changed =
                false;


            if(
                existing.archived
            ){

                existing.archived =
                    false;


                existing.archivedAt =
                    null;


                existing.status =
                    "active";


                changed =
                    true;

            }


            if(
                !existing.owner &&
                normalizedOwner
            ){

                existing.owner =
                    normalizedOwner;


                changed =
                    true;

            }


            if(
                existing.type !==
                    "root-world"
            ){

                existing.type =
                    "root-world";


                changed =
                    true;

            }


            existing.metadata = {

                ...existing.metadata,

                system:
                    true,

                removable:
                    false

            };


            if(changed){

                existing.updatedAt =
                    Date.now();


                this.save();


                this.emitAliases(
                    [
                        "world.updated",
                        "world:updated"
                    ],
                    {
                        world:
                            existing,

                        worldId:
                            existing.id,

                        system:
                            true,

                        time:
                            existing.updatedAt
                    }
                );

            }


            return {

                world:
                    existing,

                created:
                    false

            };

        }


        const world =
            this.create({

                id:
                    "vaero-world",

                name:
                    "VAERO World",

                description:
                    "VAERO Engine ana dünyası.",

                type:
                    "root-world",

                owner:
                    normalizedOwner,

                entities:
                    [],

                metadata:{
                    system:
                        true,

                    removable:
                        false
                }

            });


        return {

            world,

            created:
                Boolean(
                    world
                )

        };

    },


    /* =====================================================
       CREATE
    ===================================================== */

    create(world = {}){

        if(
            !world ||
            typeof world !==
                "object" ||
            Array.isArray(
                world
            )
        ){

            return null;

        }


        const item =
            this.normalize(
                world
            );


        const existing =
            this.get(
                item.id
            );


        if(existing){

            return existing;

        }


        this.worlds.push(
            item
        );


        this.sort();


        this.save();


        const payload = {

            ...item,

            world:
                item,

            worldId:
                item.id,

            id:
                item.id,

            name:
                item.name,

            owner:
                item.owner,

            universeId:
                "vaero-universe",

            time:
                Date.now()

        };


        this.emitAliases(
            [
                "world.created",
                "world:created"
            ],
            payload
        );


        return item;

    },


    /* =====================================================
       GET
    ===================================================== */

    get(worldId){

        const id =
            this.normalizeId(
                worldId
            );


        if(!id){

            return null;

        }


        return (
            this.worlds.find(
                world =>
                    world?.id ===
                        id
            ) ||
            null
        );

    },


    find(worldId){

        return this.get(
            worldId
        );

    },


    getById(worldId){

        return this.get(
            worldId
        );

    },


    has(worldId){

        return Boolean(
            this.get(
                worldId
            )
        );

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    update(
        worldId,
        changes = {}
    ){

        const world =
            this.get(
                worldId
            );


        if(
            !world ||
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

            ...world,

            entities:[
                ...(world.entities || [])
            ],

            tags:[
                ...(world.tags || [])
            ],

            metadata:{
                ...(world.metadata || {})
            }

        };


        if(
            changes.name !==
                undefined
        ){

            const name =
                this.normalizeText(
                    changes.name,
                    "",
                    240
                );


            if(name){

                world.name =
                    name;

            }

        }


        if(
            changes.description !==
                undefined
        ){

            world.description =
                this.normalizeText(
                    changes.description,
                    "",
                    10000
                );

        }


        /*
         * Root world type is immutable.
         */

        if(
            world.id !==
                "vaero-world" &&
            changes.type !==
                undefined
        ){

            const type =
                this.normalizeText(
                    changes.type,
                    "",
                    120
                );


            if(type){

                world.type =
                    type;

            }

        }


        if(
            changes.owner !==
                undefined
        ){

            world.owner =
                this.normalizeId(
                    changes.owner
                );

        }


        if(
            changes.entities !==
                undefined &&
            Array.isArray(
                changes.entities
            )
        ){

            world.entities =
                this.normalizeEntityList(
                    changes.entities
                );

        }


        if(
            changes.tags !==
                undefined
        ){

            world.tags =
                this.normalizeArray(
                    changes.tags
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

            world.metadata = {

                ...world.metadata,

                ...changes.metadata

            };

        }


        if(
            changes.status !==
                undefined &&
            world.archived !==
                true
        ){

            const status =
                this.normalizeStatus(
                    changes.status
                );


            if(
                status !==
                    "archived"
            ){

                world.status =
                    status;

            }

        }


        /*
         * Root world protection remains authoritative.
         */

        if(
            world.id ===
                "vaero-world"
        ){

            world.type =
                "root-world";


            world.archived =
                false;


            world.archivedAt =
                null;


            if(
                world.status ===
                    "archived"
            ){

                world.status =
                    "active";

            }


            world.metadata = {

                ...world.metadata,

                system:
                    true,

                removable:
                    false

            };

        }


        world.updatedAt =
            Date.now();


        this.sort();


        this.save();


        this.emitAliases(
            [
                "world.updated",
                "world:updated"
            ],
            {
                world,

                worldId:
                    world.id,

                before,

                time:
                    Date.now()
            }
        );


        return world;

    },


    /* =====================================================
       ENTITY MEMBERSHIP
    ===================================================== */

    addEntity(
        worldId,
        entity
    ){

        const world =
            this.get(
                worldId
            );


        if(
            !world ||
            !entity ||
            typeof entity !==
                "object" ||
            Array.isArray(
                entity
            ) ||
            !entity.id ||
            world.archived ===
                true
        ){

            return null;

        }


        const entityId =
            this.normalizeId(
                entity.id
            );


        if(!entityId){

            return null;

        }


        if(
            !Array.isArray(
                world.entities
            )
        ){

            world.entities =
                [];

        }


        const index =
            world.entities.findIndex(
                item =>
                    item?.id ===
                        entityId
            );


        if(
            index >=
                0
        ){

            const existing =
                world.entities[
                    index
                ];


            /*
             * Keep the newest canonical object reference
             * when the caller provides a newer entity.
             */

            if(
                entity !==
                    existing
            ){

                world.entities[
                    index
                ] =
                    entity;


                world.updatedAt =
                    Date.now();


                this.save();

            }


            return world.entities[
                index
            ];

        }


        world.entities.push(
            entity
        );


        world.entities =
            this.normalizeEntityList(
                world.entities
            );


        world.updatedAt =
            Date.now();


        this.save();


        this.emitAliases(
            [
                "world.entity.added",
                "world:entity:added"
            ],
            {
                worldId:
                    world.id,

                entityId,

                entity,

                time:
                    Date.now()
            }
        );


        return entity;

    },


    removeEntity(
        worldId,
        entityId
    ){

        const world =
            this.get(
                worldId
            );


        const id =
            this.normalizeId(
                entityId
            );


        if(
            !world ||
            !id ||
            !Array.isArray(
                world.entities
            )
        ){

            return false;

        }


        const removed =
            world.entities.find(
                entity =>
                    entity?.id ===
                        id
            ) ||
            null;


        if(!removed){

            return false;

        }


        world.entities =
            world.entities.filter(
                entity =>
                    entity?.id !==
                        id
            );


        world.updatedAt =
            Date.now();


        this.save();


        this.emitAliases(
            [
                "world.entity.removed",
                "world:entity:removed"
            ],
            {
                worldId:
                    world.id,

                entityId:
                    id,

                entity:
                    removed,

                time:
                    Date.now()
            }
        );


        return true;

    },


    hasEntity(
        worldId,
        entityId
    ){

        return Boolean(
            this.getEntity(
                worldId,
                entityId
            )
        );

    },


    getEntity(
        worldId,
        entityId
    ){

        const world =
            this.get(
                worldId
            );


        const id =
            this.normalizeId(
                entityId
            );


        if(
            !world ||
            !id ||
            !Array.isArray(
                world.entities
            )
        ){

            return null;

        }


        return (
            world.entities.find(
                entity =>
                    entity?.id ===
                        id
            ) ||
            null
        );

    },


    worldsForEntity(
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


        return this
            .all(
                options
            )
            .filter(
                world =>
                    Array.isArray(
                        world.entities
                    ) &&
                    world.entities.some(
                        entity =>
                            entity?.id ===
                                id
                    )
            );

    },


    /* =====================================================
       ARCHIVE
    ===================================================== */

    archive(worldId){

        const world =
            this.get(
                worldId
            );


        if(!world){

            return false;

        }


        if(
            world.id ===
                "vaero-world" ||
            world.type ===
                "root-world"
        ){

            console.warn(
                "VAERO root world cannot be archived."
            );


            return false;

        }


        if(
            world.archived
        ){

            return true;

        }


        world.archived =
            true;


        world.archivedAt =
            Date.now();


        world.status =
            "archived";


        world.updatedAt =
            Date.now();


        this.sort();


        this.save();


        this.emitAliases(
            [
                "world.archived",
                "world:archived"
            ],
            {
                world,

                worldId:
                    world.id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       RESTORE
    ===================================================== */

    restore(worldId){

        const world =
            this.get(
                worldId
            );


        if(!world){

            return false;

        }


        if(
            !world.archived
        ){

            return true;

        }


        world.archived =
            false;


        world.archivedAt =
            null;


        world.status =
            "active";


        world.updatedAt =
            Date.now();


        this.sort();


        this.save();


        this.emitAliases(
            [
                "world.restored",
                "world:restored"
            ],
            {
                world,

                worldId:
                    world.id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       REMOVE
    ===================================================== */

    remove(
        worldId,
        options = {}
    ){

        const world =
            this.get(
                worldId
            );


        if(!world){

            return false;

        }


        if(
            world.id ===
                "vaero-world" ||
            world.type ===
                "root-world"
        ){

            console.warn(
                "VAERO root world cannot be removed."
            );


            return false;

        }


        if(
            options.force !==
                true &&
            Array.isArray(
                world.entities
            ) &&
            world.entities.length >
                0
        ){

            console.warn(
                "World remove blocked: world still contains entities.",
                world.id
            );


            return false;

        }


        const index =
            this.worlds.findIndex(
                item =>
                    item?.id ===
                        world.id
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
            this.worlds.splice(
                index,
                1
            );


        this.save();


        this.emitAliases(
            [
                "world.removed",
                "world:removed"
            ],
            {
                ...removed,

                world:
                    removed,

                id:
                    removed.id,

                worldId:
                    removed.id,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       LIST
    ===================================================== */

    all(options = {}){

        let worlds =
            [
                ...this.worlds
            ];


        if(
            options.includeArchived !==
                true
        ){

            worlds =
                worlds.filter(
                    world =>
                        world?.archived !==
                            true
                );

        }


        if(options.owner){

            const owner =
                this.normalizeId(
                    options.owner
                );


            worlds =
                worlds.filter(
                    world =>
                        world?.owner ===
                            owner
                );

        }


        if(options.type){

            const type =
                this.normalizeText(
                    options.type,
                    "",
                    120
                )
                    .toLowerCase();


            worlds =
                worlds.filter(
                    world =>
                        String(
                            world?.type ||
                            ""
                        )
                            .trim()
                            .toLowerCase() ===
                        type
                );

        }


        if(options.status){

            const status =
                this.normalizeStatus(
                    options.status
                );


            worlds =
                worlds.filter(
                    world =>
                        world?.status ===
                            status
                );

        }


        return worlds.sort(
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


    archived(){

        return this.worlds
            .filter(
                world =>
                    world?.archived ===
                        true
            )
            .sort(
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


        const worlds =
            this.all(
                options
            );


        if(!text){

            return worlds;

        }


        return worlds.filter(
            world => {

                const haystack = [

                    world.id,

                    world.name,

                    world.description,

                    world.type,

                    world.owner,

                    world.status,

                    ...(world.tags || [])

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
       SORT
    ===================================================== */

    sort(){

        this.worlds.sort(
            (
                a,
                b
            ) => {

                if(
                    a?.id ===
                        "vaero-world"
                ){

                    return -1;

                }


                if(
                    b?.id ===
                        "vaero-world"
                ){

                    return 1;

                }


                return (
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

            }
        );


        return this.worlds;

    },


    /* =====================================================
       PERSISTENCE
    ===================================================== */

   toPersistenceEntityReference(entity){

        if(
            !entity ||
            typeof entity !==
                "object" ||
            Array.isArray(
                entity
            )
        ){

            return null;

        }


        const id =
            this.normalizeId(
                entity.id
            );


        if(!id){

            return null;

        }


        return {

            id,

            type:
                this.normalizeText(
                    entity.type,
                    "entity",
                    120
                ),

            name:
                this.normalizeText(
                    entity.name,
                    "İsimsiz Varlık",
                    240
                ),

            status:
                this.normalizeText(
                    entity.status,
                    "active",
                    120
                ),

            archived:
                entity.archived ===
                    true,

            createdAt:
                this.normalizeTimestamp(
                    entity.createdAt,
                    null
                ),

            updatedAt:
                this.normalizeTimestamp(
                    entity.updatedAt,
                    entity.createdAt ||
                    null
                )

        };

    },


    toPersistenceWorld(world){

        if(
            !world ||
            typeof world !==
                "object" ||
            Array.isArray(
                world
            )
        ){

            return null;

        }


        return {

            ...world,

            entities:
                Array.isArray(
                    world.entities
                )
                    ? world.entities
                        .map(
                            entity =>
                                this.toPersistenceEntityReference(
                                    entity
                                )
                        )
                        .filter(
                            Boolean
                        )
                    : []

        };

    },
   
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
    this.worlds
        .map(
            world =>
                this.toPersistenceWorld(
                    world
                )
        )
        .filter(
            Boolean
        )
)
            );


            return true;

        } catch(error){

            console.error(
                "World data could not be saved:",
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

                this.worlds =
                    [];


                return false;

            }


            const saved =
                localStorage.getItem(
                    this.storageKey
                );


            if(!saved){

                this.worlds =
                    [];


                return true;

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

                this.worlds =
                    [];


                return false;

            }


            const byId =
                new Map();


            parsed
                .filter(
                    world =>
                        world &&
                        typeof world ===
                            "object" &&
                        !Array.isArray(
                            world
                        )
                )
                .forEach(
                    world => {

                        const normalized =
                            this.normalize(
                                world
                            );


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


            this.worlds =
                [
                    ...byId.values()
                ];


            /*
             * Root-world invariants are repaired on load
             * if a previous version stored invalid state.
             */

            const rootWorld =
                this.worlds.find(
                    world =>
                        world.id ===
                            "vaero-world"
                );


            if(rootWorld){

                rootWorld.type =
                    "root-world";


                rootWorld.archived =
                    false;


                rootWorld.archivedAt =
                    null;


                if(
                    rootWorld.status ===
                        "archived"
                ){

                    rootWorld.status =
                        "active";

                }


                rootWorld.metadata = {

                    ...rootWorld.metadata,

                    system:
                        true,

                    removable:
                        false

                };

            }


            this.sort();


            /*
             * Persist canonical representation.
             */

            this.save();


            return true;

        } catch(error){

            console.error(
                "World data could not be loaded:",
                error
            );


            this.worlds =
                [];


            return false;

        }

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const active =
            this.worlds.filter(
                world =>
                    world?.archived !==
                        true
            );


        const archived =
            this.worlds.filter(
                world =>
                    world?.archived ===
                        true
            );


        return {

            total:
                this.worlds.length,

            active:
                active.filter(
                    world =>
                        world.status ===
                            "active"
                ).length,

            inactive:
                active.filter(
                    world =>
                        world.status ===
                            "inactive"
                ).length,

            paused:
                active.filter(
                    world =>
                        world.status ===
                            "paused"
                ).length,

            archived:
                archived.length,

            entities:
                active.reduce(
                    (
                        total,
                        world
                    ) =>
                        total +
                        (
                            Array.isArray(
                                world?.entities
                            )
                                ? world.entities.length
                                : 0
                        ),
                    0
                ),

            rootWorld:
                Boolean(
                    this.get(
                        "vaero-world"
                    )
                ),

            booted:
                this.booted

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
            "world",
            World
        );

    }

} catch(error){

    console.error(
        "World register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.World =
        World;

}
