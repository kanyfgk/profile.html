/* =========================================================
   VAERO WORLD
   World Lifecycle / Membership / Persistence
========================================================= */

const World = {

    worlds: [],

    booted:
        false,

    storageKey:
        "vaero:worlds:v2",


    /* =====================================================
       SAFE SERVICE ACCESS
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
            ){
                return null;
            }

            return VAERO.get(name) || null;

        } catch(error){

            console.warn(
                `World service lookup failed: ${name}`,
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
                `World event failed: ${eventName}`,
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


        return `world_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeText(
        value,
        fallback = ""
    ){

        const result =
            String(
                value ?? fallback
            ).trim();


        return (
            result ||
            String(
                fallback
            ).trim()
        );

    },


    normalizeArray(value){

        if(
            !Array.isArray(
                value
            )
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


    normalizeObject(value){

        if(
            !value ||
            typeof value !== "object" ||
            Array.isArray(value)
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
                status || "active"
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


    normalize(world = {}){

        const now =
            Date.now();


        const archived =
            world.archived === true ||
            world.status === "archived";


        return {

            id:
                this.normalizeText(
                    world.id,
                    this.createId()
                ),

            name:
                this.normalizeText(
                    world.name,
                    "İsimsiz Dünya"
                ),

            description:
                this.normalizeText(
                    world.description,
                    ""
                ),

            type:
                this.normalizeText(
                    world.type,
                    "custom-world"
                ),

            owner:
                world.owner
                    ? String(
                        world.owner
                    )
                    : null,

            entities:
                Array.isArray(
                    world.entities
                )
                    ? [
                        ...world.entities
                    ]
                    : [],

            tags:
                this.normalizeArray(
                    world.tags
                ),

            metadata:
                this.normalizeObject(
                    world.metadata
                ),

            status:
                archived
                    ? "archived"
                    : this.normalizeStatus(
                        world.status
                    ),

            archived,

            archivedAt:
                archived
                    ? (
                        Number(
                            world.archivedAt
                        ) ||
                        now
                    )
                    : null,

            createdAt:
                Number(
                    world.createdAt
                ) ||
                now,

            updatedAt:
                Number(
                    world.updatedAt
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


        const events =
            this.getService(
                "events"
            );


        if(!events){

            console.error(
                "World boot failed: Events service not found."
            );

            return false;

        }


        if(
            typeof events.on ===
            "function"
        ){

            events.on(
                "engine.started",
                data => {

                    if(
                        !data ||
                        !data.entityId
                    ){
                        return;
                    }


                    this.ensureRootWorld(
                        data.entityId
                    );

                }
            );

        }


        this.booted =
            true;


        return true;

    },


    /* =====================================================
       ROOT WORLD
    ===================================================== */

    ensureRootWorld(ownerId){

        const existing =
            this.get(
                "vaero-world"
            );


        if(existing){

            /*
             * Root world daha önce archive edilmişse
             * Engine başlatılırken yeniden aktif edilir.
             */

            if(existing.archived){

                existing.archived =
                    false;

                existing.archivedAt =
                    null;

                existing.status =
                    "active";

                existing.updatedAt =
                    Date.now();

                this.save();

            }


            if(
                !existing.owner &&
                ownerId
            ){

                existing.owner =
                    ownerId;

                existing.updatedAt =
                    Date.now();

                this.save();

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
                    ownerId,

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
                Boolean(world)

        };

    },


    /* =====================================================
       CREATE
    ===================================================== */

    create(world = {}){

        if(
            !world ||
            typeof world !== "object" ||
            Array.isArray(world)
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


        this.save();


        this.emit(
            "world.created",
            {
                world:
                    item,

                worldId:
                    item.id,

                time:
                    Date.now()
            }
        );


        return item;

    },


    /* =====================================================
       GET
    ===================================================== */

    get(worldId){

        const id =
            String(
                worldId ?? ""
            ).trim();


        if(!id){
            return null;
        }


        return (
            this.worlds.find(
                world =>
                    world?.id === id
            ) ||
            null
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
            typeof changes !== "object" ||
            Array.isArray(changes)
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
            typeof changes.name ===
                "string" &&
            changes.name.trim()
        ){

            world.name =
                changes.name.trim();

        }


        if(
            typeof changes.description ===
                "string"
        ){

            world.description =
                changes.description.trim();

        }


        /*
         * Root world tipi sonradan değiştirilemez.
         */

        if(
            world.id !==
                "vaero-world" &&
            typeof changes.type ===
                "string" &&
            changes.type.trim()
        ){

            world.type =
                changes.type.trim();

        }


        if(
            Array.isArray(
                changes.entities
            )
        ){

            world.entities =
                [
                    ...changes.entities
                ];

        }


        if(
            Array.isArray(
                changes.tags
            )
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


        world.updatedAt =
            Date.now();


        this.save();


        this.emit(
            "world.updated",
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
            !entity.id ||
            world.archived ===
                true
        ){
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


        const exists =
            world.entities.some(
                item =>
                    item?.id ===
                    entity.id
            );


        if(exists){

            return world.entities.find(
                item =>
                    item?.id ===
                    entity.id
            );

        }


        world.entities.push(
            entity
        );


        world.updatedAt =
            Date.now();


        this.save();


        this.emit(
            "world.entity.added",
            {
                worldId:
                    world.id,

                entityId:
                    entity.id,

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
            String(
                entityId ?? ""
            ).trim();


        if(
            !world ||
            !id ||
            !Array.isArray(
                world.entities
            )
        ){
            return false;
        }


        const before =
            world.entities.length;


        world.entities =
            world.entities.filter(
                entity =>
                    entity?.id !==
                    id
            );


        if(
            world.entities.length ===
            before
        ){
            return false;
        }


        world.updatedAt =
            Date.now();


        this.save();


        this.emit(
            "world.entity.removed",
            {
                worldId:
                    world.id,

                entityId:
                    id,

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

        const world =
            this.get(
                worldId
            );


        if(
            !world ||
            !Array.isArray(
                world.entities
            )
        ){
            return false;
        }


        const id =
            String(
                entityId ?? ""
            ).trim();


        return world.entities.some(
            entity =>
                entity?.id ===
                id
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


        if(
            !world ||
            !Array.isArray(
                world.entities
            )
        ){
            return null;
        }


        const id =
            String(
                entityId ?? ""
            ).trim();


        return (
            world.entities.find(
                entity =>
                    entity?.id ===
                    id
            ) ||
            null
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


        /*
         * VAERO root world silinemez veya arşivlenemez.
         */

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


        if(world.archived){
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


        this.save();


        this.emit(
            "world.archived",
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


        if(!world.archived){
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


        this.save();


        this.emit(
            "world.restored",
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
            options.force !== true &&
            Array.isArray(
                world.entities
            ) &&
            world.entities.length > 0
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


        if(index < 0){
            return false;
        }


        this.worlds.splice(
            index,
            1
        );


        this.save();


        this.emit(
            "world.removed",
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


        if(
            options.owner
        ){

            worlds =
                worlds.filter(
                    world =>
                        world?.owner ===
                        options.owner
                );

        }


        if(
            options.type
        ){

            const type =
                String(
                    options.type
                )
                    .trim()
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


        return worlds;

    },


    archived(){

        return this.worlds.filter(
            world =>
                world?.archived ===
                true
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
                query ?? ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        if(!text){

            return this.all(
                options
            );

        }


        return this.all(
            options
        ).filter(
            world => {

                const haystack = [
                    world.id,
                    world.name,
                    world.description,
                    world.type,
                    ...(world.tags || [])
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
                    this.worlds
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


            this.worlds =
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
                    .map(
                        world =>
                            this.normalize(
                                world
                            )
                    );


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

        return {

            total:
                this.worlds.length,

            active:
                this.worlds.filter(
                    world =>
                        world?.archived !==
                            true &&
                        world?.status ===
                            "active"
                ).length,

            archived:
                this.worlds.filter(
                    world =>
                        world?.archived ===
                            true
                ).length,

            entities:
                this.worlds.reduce(
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

            booted:
                this.booted

        };

    }

};


VAERO.register(
    "world",
    World
);


window.World =
    World;
