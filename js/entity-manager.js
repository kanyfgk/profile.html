/* =========================================================
   VAERO ENTITY MANAGER
   Entity Lifecycle / Registry / Archive / Query
========================================================= */

const EntityManager = {

    entities:
        {},


    /* =====================================================
       SAFE EVENT
    ===================================================== */

    emit(
        eventName,
        payload = {}
    ){

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    eventName,
                    payload
                );

                return true;

            }


            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.get ===
                    "function"
            ){

                const events =
                    VAERO.get(
                        "events"
                    );


                if(
                    events &&
                    typeof events.emit ===
                        "function"
                ){

                    events.emit(
                        eventName,
                        payload
                    );

                    return true;

                }

            }

        } catch(error){

            console.warn(
                `EntityManager event failed: ${eventName}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       ID NORMALIZATION
    ===================================================== */

    normalizeId(id){

        return String(
            id ??
            ""
        ).trim();

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


        if(
            !entity ||
            !entity.id
        ){

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
        ] = entity;


        this.emit(
            "entity:created",
            {
                entity,
                entityId:
                    entity.id,
                type:
                    entity.type,
                time:
                    Date.now()
            }
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

            if(!data.id){
                return null;
            }


            this.entities[
                data.id
            ] = data;


            return data;

        }


        const id =
            this.normalizeId(
                data.id
            );


        if(
            id &&
            this.entities[
                id
            ]
        ){

            return this.entities[
                id
            ];

        }


        try{

            const entity =
                new Entity(
                    data
                );


            this.entities[
                entity.id
            ] = entity;


            return entity;

        } catch(error){

            console.error(
                "Entity hydration failed:",
                error
            );

            return null;

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


        if(
            options.type
        ){

            const type =
                String(
                    options.type
                )
                    .trim()
                    .toLowerCase();


            entities =
                entities.filter(
                    entity =>
                        String(
                            entity?.type ||
                            ""
                        )
                            .trim()
                            .toLowerCase() ===
                        type
                );

        }


        if(
            options.status
        ){

            const status =
                String(
                    options.status
                )
                    .trim()
                    .toLowerCase();


            entities =
                entities.filter(
                    entity =>
                        String(
                            entity?.status ||
                            ""
                        )
                            .trim()
                            .toLowerCase() ===
                        status
                );

        }


        return entities;

    },


    archived(){

        return Object.values(
            this.entities
        ).filter(
            entity =>
                entity?.archived ===
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
                query ??
                ""
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
            entity => {

                const haystack = [

                    entity?.id,
                    entity?.type,
                    entity?.name,
                    entity?.description,
                    ...(entity?.tags || [])

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
                : null;


        entity.update(
            patch
        );


        this.emit(
            "entity:updated",
            {
                entity,
                entityId:
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


        const result =
            entity.archive();


        if(result){

            this.emit(
                "entity:archived",
                {
                    entity,
                    entityId:
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

    restore(id){

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


        const result =
            entity.restore();


        if(result){

            this.emit(
                "entity:restored",
                {
                    entity,
                    entityId:
                        entity.id,
                    time:
                        Date.now()
                }
            );

        }


        return result;

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


        const ownBridges =
            Array.isArray(
                entity.bridges
            )
                ? entity.bridges.length
                : 0;


        if(ownBridges > 0){
            return true;
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
                    bridge => {

                        const values = [

                            bridge?.entityId,
                            bridge?.sourceId,
                            bridge?.targetId,
                            bridge?.from,
                            bridge?.to

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


        /*
         * Root entity kesinlikle buradan silinmez.
         */

        const engine =
            typeof VAERO !==
                "undefined"
                ? VAERO.engine
                : null;


        if(
            engine?.rootEntity?.id ===
                entity.id
        ){

            console.warn(
                "Root entity cannot be removed."
            );

            return false;

        }


        /*
         * Relation varsa force olmadan fiziksel silme yok.
         */

        if(
            options.force !==
                true &&
            this.hasRelations(
                entity.id
            )
        ){

            console.warn(
                "Entity remove blocked: entity still has relations.",
                entity.id
            );

            return false;

        }


        delete this.entities[
            entity.id
        ];


        this.emit(
            "entity:removed",
            {
                entity,
                entityId:
                    entity.id,
                time:
                    Date.now()
            }
        );


        return true;

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

            archived:
                allEntities.filter(
                    entity =>
                        entity?.archived ===
                            true
                ).length,

            types:[
                ...new Set(
                    allEntities
                        .map(
                            entity =>
                                entity?.type
                        )
                        .filter(Boolean)
                )
            ]

        };

    }

};


VAERO.register(
    "entityManager",
    EntityManager
);


window.EntityManager =
    EntityManager;
