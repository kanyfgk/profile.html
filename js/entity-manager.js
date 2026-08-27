/* =========================================================
   VAERO ENTITY MANAGER
   Entity Lifecycle / Registry / Archive / Query
========================================================= */

const EntityManager = {

    entities:
        {},


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

            return null;

        }

    },


    /* =====================================================
       SAFE EVENT
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
                `EntityManager event failed: ${name}`,
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
                `EntityManager event fallback failed: ${name}`,
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


        [
            ...new Set(
                names
                    .map(
                        name =>
                            String(
                                name ??
                                    ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ].forEach(
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
       ID NORMALIZATION
    ===================================================== */

    normalizeId(id){

        const value =
            String(
                id ??
                    ""
            )
                .trim()
                .slice(
                    0,
                    200
                );


        return (
            value ||
            null
        );

    },


    /* =====================================================
       ENTITY VALIDATION
    ===================================================== */

    validateEntity(entity){

        if(
            !entity ||
            typeof entity !==
                "object"
        ){

            return {

                valid:
                    false,

                issues:[
                    "entity-invalid"
                ]

            };

        }


        if(
            typeof entity.validate ===
                "function"
        ){

            try{

                return entity.validate();

            } catch(error){

                return {

                    valid:
                        false,

                    issues:[
                        error?.message ||
                        "entity-validation-error"
                    ]

                };

            }

        }


        const issues =
            [];


        if(
            !this.normalizeId(
                entity.id
            )
        ){

            issues.push(
                "entity-id-missing"
            );

        }


        if(
            !entity.type
        ){

            issues.push(
                "entity-type-missing"
            );

        }


        return {

            valid:
                issues.length ===
                    0,

            issues

        };

    },


    /* =====================================================
       CREATE
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

            console.warn(
                "Entity create rejected: invalid data."
            );


            return null;

        }


        const requestedId =
            this.normalizeId(
                data.id
            );


        if(
            requestedId &&
            this.entities[
                requestedId
            ]
        ){

            return this.entities[
                requestedId
            ];

        }


        let entity =
            null;


        try{

            entity =
                new Entity(
                    data
                );

        } catch(error){

            console.error(
                "Entity creation failed:",
                error
            );


            return null;

        }


        const validation =
            this.validateEntity(
                entity
            );


        if(
            validation.valid !==
                true
        ){

            console.warn(
                "Entity create rejected: validation failed.",
                validation
            );


            return null;

        }


        if(
            this.entities[
                entity.id
            ]
        ){

            return this.entities[
                entity.id
            ];

        }


        this.entities[
            entity.id
        ] =
            entity;


        const payload = {

            entity,

            entityId:
                entity.id,

            id:
                entity.id,

            type:
                entity.type,

            time:
                Date.now()

        };


        this.emitAliases(
            [
                "entity.created",
                "entity:created"
            ],
            payload
        );


        return entity;

    },


    /* =====================================================
       HYDRATE
    ===================================================== */

    hydrate(data = {}){

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


        if(
            data instanceof
                Entity
        ){

            const validation =
                this.validateEntity(
                    data
                );


            if(
                validation.valid !==
                    true
            ){

                return null;

            }


            const existing =
                this.get(
                    data.id
                );


            if(existing){

                const existingUpdated =
                    Number(
                        existing.updatedAt ||
                        existing.createdAt ||
                        0
                    );


                const incomingUpdated =
                    Number(
                        data.updatedAt ||
                        data.createdAt ||
                        0
                    );


                if(
                    incomingUpdated >
                        existingUpdated
                ){

                    this.entities[
                        data.id
                    ] =
                        data;


                    return data;

                }


                return existing;

            }


            this.entities[
                data.id
            ] =
                data;


            return data;

        }


        const id =
            this.normalizeId(
                data.id
            );


        const existing =
            id
                ? this.get(
                    id
                )
                : null;


        if(existing){

            const existingUpdated =
                Number(
                    existing.updatedAt ||
                    existing.createdAt ||
                    0
                );


            const incomingUpdated =
                Number(
                    data.updatedAt ||
                    data.createdAt ||
                    0
                );


            if(
                incomingUpdated <=
                    existingUpdated
            ){

                return existing;

            }

        }


        try{

            const entity =
                new Entity(
                    data
                );


            const validation =
                this.validateEntity(
                    entity
                );


            if(
                validation.valid !==
                    true
            ){

                return existing ||
                    null;

            }


            this.entities[
                entity.id
            ] =
                entity;


            return entity;

        } catch(error){

            console.error(
                "Entity hydration failed:",
                error
            );


            return existing ||
                null;

        }

    },


    /* =====================================================
       GET
    ===================================================== */

    get(id){

        const normalizedId =
            this.normalizeId(
                id
            );


        if(!normalizedId){

            return null;

        }


        return (
            this.entities[
                normalizedId
            ] ||
            null
        );

    },


    find(id){

        return this.get(
            id
        );

    },


    getById(id){

        return this.get(
            id
        );

    },


    has(id){

        return Boolean(
            this.get(
                id
            )
        );

    },


    /* =====================================================
       LIST
    ===================================================== */

    all(options = {}){

        let entities =
            Object.values(
                this.entities
            );


        if(
            options.includeArchived !==
                true
        ){

            entities =
                entities.filter(
                    entity =>
                        entity?.archived !==
                            true
                );

        }


        if(options.type){

            const type =
                String(
                    options.type
                )
                    .trim()
                    .toLocaleLowerCase(
                        "tr-TR"
                    );


            entities =
                entities.filter(
                    entity =>
                        String(
                            entity?.type ||
                                ""
                        )
                            .trim()
                            .toLocaleLowerCase(
                                "tr-TR"
                            ) ===
                        type
                );

        }


        if(options.status){

            const status =
                String(
                    options.status
                )
                    .trim()
                    .toLocaleLowerCase(
                        "tr-TR"
                    );


            entities =
                entities.filter(
                    entity =>
                        String(
                            entity?.status ||
                                ""
                        )
                            .trim()
                            .toLocaleLowerCase(
                                "tr-TR"
                            ) ===
                        status
                );

        }


        if(options.tag){

            const tag =
                String(
                    options.tag
                )
                    .trim()
                    .toLocaleLowerCase(
                        "tr-TR"
                    );


            entities =
                entities.filter(
                    entity =>
                        Array.isArray(
                            entity?.tags
                        ) &&
                        entity.tags.some(
                            item =>
                                String(
                                    item
                                )
                                    .trim()
                                    .toLocaleLowerCase(
                                        "tr-TR"
                                    ) ===
                                tag
                        )
                );

        }


        return entities.sort(
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

    },


    archived(){

        return Object.values(
            this.entities
        )
            .filter(
                entity =>
                    entity?.archived ===
                        true
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        b?.updatedAt ||
                        0
                    ) -
                    Number(
                        a?.updatedAt ||
                        0
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


        const entities =
            this.all(
                options
            );


        if(!text){

            return entities;

        }


        return entities.filter(
            entity => {

                const haystack = [

                    entity?.id,
                    entity?.type,
                    entity?.name,
                    entity?.description,
                    entity?.status,
                    ...(entity?.tags || [])

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
       UPDATE
    ===================================================== */

    update(
        id,
        patch = {}
    ){

        const entity =
            this.get(
                id
            );


        if(!entity){

            return null;

        }


        if(
            !patch ||
            typeof patch !==
                "object" ||
            Array.isArray(
                patch
            )
        ){

            return entity;

        }


        if(
            typeof entity.update !==
                "function"
        ){

            return null;

        }


        const before =
            typeof entity.toJSON ===
                "function"
                ? entity.toJSON()
                : {
                    ...entity
                };


        entity.update(
            patch
        );


        const validation =
            this.validateEntity(
                entity
            );


        if(
            validation.valid !==
                true
        ){

            console.warn(
                "Entity update produced invalid state.",
                entity.id,
                validation
            );

        }


        this.emitAliases(
            [
                "entity.updated",
                "entity:updated"
            ],
            {
                entity,

                entityId:
                    entity.id,

                id:
                    entity.id,

                before,

                time:
                    Date.now()
            }
        );


        return entity;

    },


    /* =====================================================
       ARCHIVE
    ===================================================== */

    archive(id){

        const entity =
            this.get(
                id
            );


        if(
            !entity ||
            typeof entity.archive !==
                "function"
        ){

            return false;

        }


        if(
            this.isRootEntity(
                entity
            )
        ){

            console.warn(
                "Root entity cannot be archived."
            );


            return false;

        }


        const alreadyArchived =
            entity.archived ===
                true;


        const result =
            entity.archive();


        if(
            result &&
            !alreadyArchived
        ){

            this.emitAliases(
                [
                    "entity.archived",
                    "entity:archived"
                ],
                {
                    entity,

                    entityId:
                        entity.id,

                    id:
                        entity.id,

                    time:
                        Date.now()
                }
            );

        }


        return result;

    },


    /* =====================================================
       RESTORE
    ===================================================== */

    restore(
        id,
        status = "active"
    ){

        const entity =
            this.get(
                id
            );


        if(
            !entity ||
            typeof entity.restore !==
                "function"
        ){

            return false;

        }


        const wasArchived =
            entity.archived ===
                true;


        const result =
            entity.restore(
                status
            );


        if(
            result &&
            wasArchived
        ){

            this.emitAliases(
                [
                    "entity.restored",
                    "entity:restored"
                ],
                {
                    entity,

                    entityId:
                        entity.id,

                    id:
                        entity.id,

                    time:
                        Date.now()
                }
            );

        }


        return result;

    },


    /* =====================================================
       ROOT ENTITY
    ===================================================== */

    isRootEntity(entityOrId){

        const entity =
            typeof entityOrId ===
                "object"
                ? entityOrId
                : this.get(
                    entityOrId
                );


        if(!entity){

            return false;

        }


        try{

            const engine =
                typeof VAERO !==
                    "undefined"
                    ? VAERO.engine
                    : null;


            if(
                engine?.rootEntity?.id &&
                engine.rootEntity.id ===
                    entity.id
            ){

                return true;

            }

        } catch(error){

            /* fallback checks below */

        }


        if(
            entity.metadata?.system ===
                true &&
            entity.metadata?.removable ===
                false
        ){

            return true;

        }


        return false;

    },


    /* =====================================================
       RELATION CHECK
    ===================================================== */

    hasRelations(id){

        const entity =
            this.get(
                id
            );


        if(!entity){

            return false;

        }


        if(
            Array.isArray(
                entity.bridges
            ) &&
            entity.bridges.length >
                0
        ){

            return true;

        }


        const bridge =
            this.getService(
                "bridge"
            );


        if(
            bridge &&
            typeof bridge.forEntity ===
                "function"
        ){

            try{

                const links =
                    bridge.forEntity(
                        entity.id
                    );


                if(
                    Array.isArray(
                        links
                    ) &&
                    links.length >
                        0
                ){

                    return true;

                }

            } catch(error){

                /* local snapshot fallback below */

            }

        }


        return Object.values(
            this.entities
        ).some(
            candidate => {

                if(
                    !candidate ||
                    candidate.id ===
                        entity.id ||
                    !Array.isArray(
                        candidate.bridges
                    )
                ){

                    return false;

                }


                return candidate.bridges.some(
                    bridgeItem => {

                        const values = [

                            bridgeItem?.entityId,
                            bridgeItem?.sourceId,
                            bridgeItem?.targetId,
                            bridgeItem?.from,
                            bridgeItem?.to

                        ]
                            .filter(Boolean)
                            .map(
                                value =>
                                    String(
                                        value
                                    )
                            );


                        return values.includes(
                            entity.id
                        );

                    }
                );

            }
        );

    },


    /* =====================================================
       WORLD MEMBERSHIP CHECK
    ===================================================== */

    worldsForEntity(id){

        const entityId =
            this.normalizeId(
                id
            );


        if(!entityId){

            return [];

        }


        const world =
            this.getService(
                "world"
            );


        if(!world){

            return [];

        }


        if(
            typeof world.worldsForEntity ===
                "function"
        ){

            try{

                return (
                    world.worldsForEntity(
                        entityId,
                        {
                            includeArchived:
                                true
                        }
                    ) ||
                    []
                );

            } catch(error){

                /* fallback below */

            }

        }


        if(
            typeof world.all ===
                "function"
        ){

            try{

                const worlds =
                    world.all({
                        includeArchived:
                            true
                    }) ||
                    [];


                if(
                    Array.isArray(
                        worlds
                    )
                ){

                    return worlds.filter(
                        item =>
                            Array.isArray(
                                item?.entities
                            ) &&
                            item.entities.some(
                                entity =>
                                    entity?.id ===
                                        entityId
                            )
                    );

                }

            } catch(error){

                return [];

            }

        }


        return [];

    },


    /* =====================================================
       HARD REMOVE
       Use only after explicit authorization.
    ===================================================== */

    remove(
        id,
        options = {}
    ){

        const entity =
            this.get(
                id
            );


        if(!entity){

            return false;

        }


        if(
            this.isRootEntity(
                entity
            )
        ){

            console.warn(
                "Root entity cannot be removed."
            );


            return false;

        }


        const relations =
            this.hasRelations(
                entity.id
            );


        const worlds =
            this.worldsForEntity(
                entity.id
            );


        if(
            options.force !==
                true &&
            relations
        ){

            console.warn(
                "Entity remove blocked: entity still has relations.",
                entity.id
            );


            return false;

        }


        if(
            options.force !==
                true &&
            worlds.length >
                0
        ){

            console.warn(
                "Entity remove blocked: entity still belongs to world(s).",
                entity.id
            );


            return false;

        }


        /*
         * Forced removal also detaches known World
         * membership snapshots before registry deletion.
         */

        if(
            options.force ===
                true &&
            worlds.length >
                0
        ){

            const worldService =
                this.getService(
                    "world"
                );


            if(
                worldService &&
                typeof worldService.removeEntity ===
                    "function"
            ){

                worlds.forEach(
                    world => {

                        try{

                            worldService.removeEntity(
                                world.id,
                                entity.id
                            );

                        } catch(error){

                            console.warn(
                                "Entity World detach failed:",
                                world?.id,
                                entity.id,
                                error
                            );

                        }

                    }
                );

            }

        }


        delete this.entities[
            entity.id
        ];


        this.emitAliases(
            [
                "entity.removed",
                "entity:removed"
            ],
            {
                entity,

                entityId:
                    entity.id,

                id:
                    entity.id,

                forced:
                    options.force ===
                        true,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       CLEAR
    ===================================================== */

    clear(options = {}){

        const ids =
            Object.keys(
                this.entities
            );


        let removed =
            0;


        ids.forEach(
            id => {

                const entity =
                    this.get(
                        id
                    );


                if(
                    !entity ||
                    this.isRootEntity(
                        entity
                    )
                ){

                    return;

                }


                if(
                    options.includeArchivedOnly ===
                        true &&
                    entity.archived !==
                        true
                ){

                    return;

                }


                if(
                    this.remove(
                        id,
                        {
                            force:
                                options.force ===
                                    true
                        }
                    )
                ){

                    removed +=
                        1;

                }

            }
        );


        return removed;

    },


    /* =====================================================
       COUNT
    ===================================================== */

    count(options = {}){

        return this.all(
            options
        ).length;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const allEntities =
            Object.values(
                this.entities
            );


        const types =
            {};


        allEntities.forEach(
            entity => {

                const type =
                    String(
                        entity?.type ||
                            "unknown"
                    )
                        .trim()
                        .toLowerCase();


                types[
                    type
                ] =
                    (
                        types[
                            type
                        ] ||
                        0
                    ) +
                    1;

            }
        );


        return {

            total:
                allEntities.length,

            active:
                allEntities.filter(
                    entity =>
                        entity?.archived !==
                            true &&
                        entity?.status ===
                            "active"
                ).length,

            inactive:
                allEntities.filter(
                    entity =>
                        entity?.archived !==
                            true &&
                        entity?.status ===
                            "inactive"
                ).length,

            paused:
                allEntities.filter(
                    entity =>
                        entity?.archived !==
                            true &&
                        entity?.status ===
                            "paused"
                ).length,

            disabled:
                allEntities.filter(
                    entity =>
                        entity?.archived !==
                            true &&
                        entity?.status ===
                            "disabled"
                ).length,

            error:
                allEntities.filter(
                    entity =>
                        entity?.archived !==
                            true &&
                        entity?.status ===
                            "error"
                ).length,

            archived:
                allEntities.filter(
                    entity =>
                        entity?.archived ===
                            true
                ).length,

            types,

            typeNames:
                Object.keys(
                    types
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
            "entityManager",
            EntityManager
        );

    }

} catch(error){

    console.error(
        "EntityManager register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.EntityManager =
        EntityManager;

}
