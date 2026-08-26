/* =========================================================
   VAERO ACTIONS V2
   Engine Interaction / Editors / Brain / Payment Bridge
========================================================= */

const Actions = {

    brainOutsideHandler: null,

    brainSending: false,


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
                `Actions servisi okunamadı: ${name}`,
                error
            );

            return null;

        }

    },


    getEngine(){

        try{

            if(
                typeof VAERO !== "undefined" &&
                VAERO.engine
            ){
                return VAERO.engine;
            }

        } catch(error){

            /* fallback below */

        }


        if(
            typeof window !== "undefined" &&
            window.Engine
        ){
            return window.Engine;
        }


        return null;

    },


    createId(prefix = "item"){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID ===
                "function"
        ){

            return crypto.randomUUID();

        }


        return `${prefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    parseTags(value){

        return [
            ...new Set(
                String(
                    value ?? ""
                )
                    .split(",")
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(Boolean)
            )
        ];

    },


    syncAwareness(
        app,
        metadata = {}
    ){

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


        try{

            awareness.enter(
                app,
                metadata
            );

            return true;

        } catch(error){

            console.warn(
                "Brain Awareness güncellenemedi:",
                error
            );

            return false;

        }

    },


    recordEvolution(
        type,
        description,
        metadata = {}
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

            evolution.record(
                type,
                description,
                metadata
            );

            return true;

        } catch(error){

            console.warn(
                "Evolution kaydı oluşturulamadı:",
                error
            );

            return false;

        }

    },


    /* =====================================================
       RESET TRANSIENT UI STATE
    ===================================================== */

    resetEditorState(){

        const engine =
            this.getEngine();


        if(!engine){
            return false;
        }


        engine.worldEditMode =
            false;

        engine.entityEditMode =
            false;

        engine.entityCreateMode =
            false;

        engine.entityType =
            null;


        return true;

    },


    /* =====================================================
       CORE NAVIGATION
    ===================================================== */

    openHome(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.openHome !==
                "function"
        ){
            return false;
        }


        this.resetEditorState();


        const result =
            engine.openHome();


        if(result !== false){

            this.syncAwareness(
                "home"
            );

        }


        return result;

    },


    openIdentity(){

        const engine =
            this.getEngine();


        if(!engine){
            return false;
        }


        this.resetEditorState();


        const entity =
            engine.rootEntity ||
            engine.currentEntity;


        if(!entity){
            return false;
        }


        engine.currentOpenedEntity =
            entity;

        engine.currentEntityPage =
            "identity";


        const result =
            engine.setView(
                "identity",
                {
                    entity,
                    page:
                        "identity",
                    world:
                        null,
                    entityCreateMode:
                        false,
                    entityType:
                        null
                }
            );


        if(result !== false){

            this.syncAwareness(
                "identity",
                {
                    entityId:
                        entity.id ||
                        null
                }
            );

        }


        return result;

    },


    openProfile(){

        const engine =
            this.getEngine();


        if(!engine){
            return false;
        }


        this.resetEditorState();


        const entity =
            engine.rootEntity ||
            engine.currentEntity;


        if(!entity){
            return false;
        }


        engine.currentOpenedEntity =
            entity;

        engine.currentEntityPage =
            "profile";


        const result =
            engine.setView(
                "profile",
                {
                    entity,
                    page:
                        "profile",
                    world:
                        null,
                    entityCreateMode:
                        false,
                    entityType:
                        null
                }
            );


        if(result !== false){

            this.syncAwareness(
                "profile",
                {
                    entityId:
                        entity.id ||
                        null
                }
            );

        }


        return result;

    },


    openCreate(){

        const engine =
            this.getEngine();


        if(!engine){
            return false;
        }


        this.resetEditorState();


        const result =
            engine.setView(
                "create",
                {
                    entity:
                        null,
                    page:
                        null,
                    world:
                        null,
                    entityCreateMode:
                        false,
                    entityType:
                        null
                }
            );


        if(result !== false){

            this.syncAwareness(
                "create"
            );

        }


        return result;

    },


    openWorlds(){

        const engine =
            this.getEngine();


        if(!engine){
            return false;
        }


        this.resetEditorState();


        const result =
            engine.setView(
                "worlds",
                {
                    entity:
                        null,
                    page:
                        null,
                    world:
                        null,
                    entityCreateMode:
                        false,
                    entityType:
                        null
                }
            );


        if(result !== false){

            this.syncAwareness(
                "worlds"
            );

        }


        return result;

    },


    openEntities(){

        const worldService =
            this.getService(
                "world"
            );


        let worlds = [];


        try{

            worlds =
                worldService &&
                typeof worldService.all ===
                    "function"
                    ? worldService.all() || []
                    : [];

        } catch(error){

            worlds = [];

        }


        const engine =
            this.getEngine();


        if(!engine){
            return false;
        }


        const targetWorld =
            engine.currentWorld ||
            worlds.find(
                world =>
                    world?.status ===
                        "active" &&
                    world?.archived !==
                        true
            ) ||
            worlds[0] ||
            null;


        if(!targetWorld){

            return this.openWorlds();

        }


        return this.openWorld(
            targetWorld.id
        );

    },


    openWorld(worldId){

        const worldService =
            this.getService(
                "world"
            );


        const engine =
            this.getEngine();


        if(
            !worldService ||
            !engine
        ){
            return false;
        }


        let world =
            null;


        try{

            if(
                typeof worldService.get ===
                    "function"
            ){

                world =
                    worldService.get(
                        worldId
                    );

            } else if(
                typeof worldService.all ===
                    "function"
            ){

                world =
                    (
                        worldService.all({
                            includeArchived:true
                        }) ||
                        []
                    ).find(
                        item =>
                            item?.id ===
                            worldId
                    ) ||
                    null;

            }

        } catch(error){

            console.error(
                "World açılamadı:",
                error
            );

            return false;

        }


        if(
            !world ||
            world.archived ===
                true
        ){

            console.warn(
                "World bulunamadı veya arşivlenmiş:",
                worldId
            );

            return false;

        }


        if(
            !Array.isArray(
                world.entities
            )
        ){

            world.entities =
                [];

        }


        this.resetEditorState();


        const result =
            engine.setView(
                "world",
                {
                    world,
                    entity:
                        null,
                    page:
                        null,
                    entityCreateMode:
                        false,
                    entityType:
                        null
                }
            );


        if(result !== false){

            this.syncAwareness(
                "world",
                {
                    worldId:
                        world.id ||
                        null
                }
            );

        }


        return result;

    },


    backToWorld(){

        const engine =
            this.getEngine();


        const world =
            engine?.currentWorld ||
            null;


        if(!world){

            return this.openWorlds();

        }


        this.resetEditorState();


        engine.currentOpenedEntity =
            null;

        engine.currentEntityPage =
            null;


        const result =
            engine.setView(
                "world",
                {
                    world,
                    entity:
                        null,
                    page:
                        null,
                    entityCreateMode:
                        false,
                    entityType:
                        null
                }
            );


        if(result !== false){

            this.syncAwareness(
                "world",
                {
                    worldId:
                        world.id ||
                        null
                }
            );

        }


        return result;

    },


    /* =====================================================
       WORLD CREATION
    ===================================================== */

    createWorld(){

        const engine =
            this.getEngine();


        if(!engine){
            return false;
        }


        const nameInput =
            document.getElementById(
                "worldNameInput"
            );


        const descriptionInput =
            document.getElementById(
                "worldDescriptionInput"
            );


        const tagsInput =
            document.getElementById(
                "worldTagsInput"
            );


        const name =
            String(
                nameInput?.value ||
                ""
            ).trim();


        if(!name){

            nameInput?.focus();

            return false;

        }


        const worldService =
            this.getService(
                "world"
            );


        if(
            !worldService ||
            typeof worldService.create !==
                "function"
        ){

            return false;

        }


        const tags =
            this.parseTags(
                tagsInput?.value
            );


        let world =
            null;


        try{

            world =
                worldService.create({
                    id:
                        this.createId(
                            "world"
                        ),

                    name,

                    description:
                        String(
                            descriptionInput?.value ||
                            ""
                        ).trim(),

                    tags,

                    type:
                        "custom-world",

                    owner:
                        engine.rootEntity?.id ||
                        engine.currentEntity?.id ||
                        null,

                    entities:
                        [],

                    status:
                        "active"
                });

        } catch(error){

            console.error(
                "World oluşturulamadı:",
                error
            );

            return false;

        }


        if(!world){
            return false;
        }


        this.recordEvolution(
            "milestone",
            `${name} dünyası oluşturuldu`,
            {
                title:
                    `${name} dünyası oluşturuldu`,

                source:
                    "world",

                status:
                    "completed",

                importance:
                    "medium",

                relatedWorldId:
                    world.id,

                tags:[
                    "world",
                    "creation",
                    ...tags
                ]
            }
        );


        this.resetEditorState();


        const result =
            engine.setView(
                "world",
                {
                    world,
                    entity:
                        null,
                    page:
                        null,
                    entityCreateMode:
                        false,
                    entityType:
                        null
                }
            );


        if(result !== false){

            this.syncAwareness(
                "world",
                {
                    worldId:
                        world.id
                }
            );

        }


        return result;

    },


    /* =====================================================
       WORLD EDITOR
    ===================================================== */

    openWorldEditor(){

        const engine =
            this.getEngine();


        const world =
            engine?.currentWorld ||
            null;


        if(
            !engine ||
            !world ||
            world.archived ===
                true
        ){
            return false;
        }


        engine.worldEditMode =
            true;

        engine.entityEditMode =
            false;

        engine.entityCreateMode =
            false;

        engine.entityType =
            null;


        return engine.setView(
            "world",
            {
                world,
                entity:
                    null,
                page:
                    null,
                entityCreateMode:
                    false,
                entityType:
                    null
            }
        );

    },


    cancelWorldEditor(){

        const engine =
            this.getEngine();


        if(!engine){
            return false;
        }


        engine.worldEditMode =
            false;


        return engine.setView(
            "world",
            {
                world:
                    engine.currentWorld ||
                    null,
                entity:
                    null,
                page:
                    null,
                entityCreateMode:
                    false,
                entityType:
                    null
            }
        );

    },


    saveWorldEditor(){

        const engine =
            this.getEngine();


        const world =
            engine?.currentWorld ||
            null;


        if(
            !engine ||
            !world
        ){
            return false;
        }


        const nameInput =
            document.getElementById(
                "worldEditNameInput"
            );


        const descriptionInput =
            document.getElementById(
                "worldEditDescriptionInput"
            );


        const tagsInput =
            document.getElementById(
                "worldEditTagsInput"
            );


        const statusInput =
            document.getElementById(
                "worldEditStatusInput"
            );


        const name =
            String(
                nameInput?.value ||
                ""
            ).trim();


        if(!name){

            nameInput?.focus();

            return false;

        }


        const worldService =
            this.getService(
                "world"
            );


        if(
            !worldService ||
            typeof worldService.update !==
                "function"
        ){
            return false;
        }


        let updated =
            null;


        try{

            updated =
                worldService.update(
                    world.id,
                    {
                        name,

                        description:
                            String(
                                descriptionInput?.value ||
                                ""
                            ).trim(),

                        tags:
                            this.parseTags(
                                tagsInput?.value
                            ),

                        status:
                            String(
                                statusInput?.value ||
                                "active"
                            )
                    }
                );

        } catch(error){

            console.error(
                "World güncellenemedi:",
                error
            );

            return false;

        }


        if(!updated){
            return false;
        }


        engine.currentWorld =
            updated;

        engine.worldEditMode =
            false;


        this.recordEvolution(
            "life-event",
            `${updated.name} dünyası güncellendi`,
            {
                title:
                    `${updated.name} dünyası güncellendi`,

                source:
                    "world",

                status:
                    "completed",

                importance:
                    "low",

                relatedWorldId:
                    updated.id,

                tags:[
                    "world",
                    "update"
                ]
            }
        );


        return engine.setView(
            "world",
            {
                world:
                    updated,
                entity:
                    null,
                page:
                    null,
                entityCreateMode:
                    false,
                entityType:
                    null
            }
        );

    },


    archiveWorld(){

        const engine =
            this.getEngine();


        const world =
            engine?.currentWorld ||
            null;


        if(
            !world ||
            world.id ===
                "vaero-world"
        ){
            return false;
        }


        const worldService =
            this.getService(
                "world"
            );


        if(
            !worldService ||
            typeof worldService.archive !==
                "function"
        ){
            return false;
        }


        let archived =
            false;


        try{

            archived =
                worldService.archive(
                    world.id
                );

        } catch(error){

            console.error(
                "World arşivlenemedi:",
                error
            );

            return false;

        }


        if(!archived){
            return false;
        }


        this.recordEvolution(
            "life-event",
            `${world.name} dünyası arşivlendi`,
            {
                title:
                    `${world.name} dünyası arşivlendi`,

                source:
                    "world",

                relatedWorldId:
                    world.id,

                status:
                    "completed",

                importance:
                    "medium",

                tags:[
                    "world",
                    "archive"
                ]
            }
        );


        engine.currentWorld =
            null;

        engine.worldEditMode =
            false;


        return this.openWorlds();

    },


    /* =====================================================
       ENTITY CREATION
    ===================================================== */

    startEntityCreate(){

        const engine =
            this.getEngine();


        const world =
            engine?.currentWorld ||
            null;


        if(!world){

            return this.openWorlds();

        }


        engine.worldEditMode =
            false;

        engine.entityEditMode =
            false;


        return engine.setView(
            "world",
            {
                world,
                entity:
                    null,
                page:
                    null,
                entityCreateMode:
                    true,
                entityType:
                    null
            }
        );

    },


    selectEntityType(type){

        const engine =
            this.getEngine();


        if(
            !engine ||
            !type
        ){
            return false;
        }


        return engine.setView(
            "world",
            {
                world:
                    engine.currentWorld ||
                    null,

                entity:
                    null,

                page:
                    null,

                entityCreateMode:
                    true,

                entityType:
                    type
            }
        );

    },


    clearEntityType(){

        const engine =
            this.getEngine();


        if(!engine){
            return false;
        }


        return engine.setView(
            "world",
            {
                world:
                    engine.currentWorld ||
                    null,

                entity:
                    null,

                page:
                    null,

                entityCreateMode:
                    true,

                entityType:
                    null
            }
        );

    },


    cancelEntityCreate(){

        const engine =
            this.getEngine();


        if(!engine){
            return false;
        }


        engine.entityCreateMode =
            false;

        engine.entityType =
            null;


        return engine.setView(
            "world",
            {
                world:
                    engine.currentWorld ||
                    null,

                entity:
                    null,

                page:
                    null,

                entityCreateMode:
                    false,

                entityType:
                    null
            }
        );

    },


    createEntity(){

        const engine =
            this.getEngine();


        const world =
            engine?.currentWorld ||
            null;


        if(!world){
            return false;
        }


        const nameInput =
            document.getElementById(
                "entityNameInput"
            );


        const descriptionInput =
            document.getElementById(
                "entityDescriptionInput"
            );


        const tagsInput =
            document.getElementById(
                "entityTagsInput"
            );


        const name =
            String(
                nameInput?.value ||
                ""
            ).trim();


        const type =
            engine.entityType;


        if(!name){

            nameInput?.focus();

            return false;

        }


        if(!type){
            return false;
        }


        const entityManager =
            this.getService(
                "entityManager"
            );


        const identityService =
            this.getService(
                "identity"
            );


        const profileService =
            this.getService(
                "profile"
            );


        const worldService =
            this.getService(
                "world"
            );


        if(
            !entityManager ||
            !worldService ||
            typeof entityManager.create !==
                "function"
        ){
            return false;
        }


        const tags =
            this.parseTags(
                tagsInput?.value
            );


        let entity =
            null;


        try{

            entity =
                entityManager.create({
                    id:
                        this.createId(
                            "entity"
                        ),

                    name,

                    type,

                    description:
                        String(
                            descriptionInput?.value ||
                            ""
                        ).trim(),

                    tags,

                    status:
                        "active",

                    organs:
                        [],

                    bridges:
                        [],

                    permissions:
                        [],

                    capabilities:
                        []
                });


            if(!entity){
                return false;
            }


            if(
                identityService &&
                typeof identityService.create ===
                    "function"
            ){

                entity.identity =
                    identityService.create(
                        entity
                    );

            }


            if(
                profileService &&
                typeof profileService.create ===
                    "function"
            ){

                entity.profile =
                    profileService.create(
                        entity
                    );

            }


            if(
                typeof worldService.addEntity ===
                    "function"
            ){

                worldService.addEntity(
                    world.id,
                    entity
                );

            } else {

                if(
                    !Array.isArray(
                        world.entities
                    )
                ){
                    world.entities = [];
                }


                world.entities.push(
                    entity
                );


                worldService.save?.();

            }

        } catch(error){

            console.error(
                "Entity oluşturulamadı:",
                error
            );

            return false;

        }


        this.recordEvolution(
            "milestone",
            `${name} varlığı oluşturuldu`,
            {
                title:
                    `${name} varlığı oluşturuldu`,

                source:
                    "entity",

                status:
                    "completed",

                importance:
                    "medium",

                relatedEntityId:
                    entity.id,

                relatedWorldId:
                    world.id,

                tags:[
                    "entity",
                    "creation",
                    ...tags
                ],

                organs:[
                    "identity",
                    "profile"
                ]
            }
        );


        engine.currentOpenedEntity =
            entity;

        engine.entityCreateMode =
            false;

        engine.entityType =
            null;

        engine.entityEditMode =
            false;


        const result =
            engine.setView(
                "entity",
                {
                    world,
                    entity,
                    page:
                        null,
                    entityCreateMode:
                        false,
                    entityType:
                        null
                }
            );


        if(result !== false){

            this.syncAwareness(
                "entity",
                {
                    entityId:
                        entity.id,

                    worldId:
                        world.id
                }
            );

        }


        return result;

    },

   /* =====================================================
       ENTITY OPEN / EDIT / ARCHIVE
    ===================================================== */

    openEntity(entityId){

        const engine =
            this.getEngine();


        const world =
            engine?.currentWorld ||
            null;


        if(
            !world ||
            !Array.isArray(
                world.entities
            )
        ){
            return false;
        }


        const savedEntity =
            world.entities.find(
                item =>
                    item?.id ===
                        entityId &&
                    item?.archived !==
                        true
            );


        if(!savedEntity){
            return false;
        }


        const entityManager =
            this.getService(
                "entityManager"
            );


        let entity =
            savedEntity;


        try{

            if(
                entityManager &&
                typeof entityManager.hydrate ===
                    "function"
            ){

                entity =
                    entityManager.hydrate(
                        savedEntity
                    );

            }

        } catch(error){

            entity =
                savedEntity;

        }


        engine.currentOpenedEntity =
            entity;

        engine.currentEntityPage =
            null;

        engine.entityEditMode =
            false;

        engine.worldEditMode =
            false;


        const result =
            engine.setView(
                "entity",
                {
                    world,
                    entity,
                    page:
                        null,
                    entityCreateMode:
                        false,
                    entityType:
                        null
                }
            );


        if(result !== false){

            this.syncAwareness(
                "entity",
                {
                    entityId:
                        entity.id ||
                        null,

                    worldId:
                        world.id ||
                        null
                }
            );

        }


        return result;

    },


    openEntityEditor(){

        const engine =
            this.getEngine();


        const entity =
            engine?.currentOpenedEntity ||
            engine?.currentEntity ||
            null;


        if(
            !engine ||
            !entity ||
            entity.archived ===
                true
        ){
            return false;
        }


        engine.entityEditMode =
            true;

        engine.worldEditMode =
            false;

        engine.currentEntityPage =
            null;


        return engine.setView(
            "entity",
            {
                world:
                    engine.currentWorld ||
                    null,

                entity,

                page:
                    null,

                entityCreateMode:
                    false,

                entityType:
                    null
            }
        );

    },


    cancelEntityEditor(){

        const engine =
            this.getEngine();


        const entity =
            engine?.currentOpenedEntity ||
            engine?.currentEntity ||
            null;


        if(
            !engine ||
            !entity
        ){
            return false;
        }


        engine.entityEditMode =
            false;


        return engine.setView(
            "entity",
            {
                world:
                    engine.currentWorld ||
                    null,

                entity,

                page:
                    null,

                entityCreateMode:
                    false,

                entityType:
                    null
            }
        );

    },


    saveEntityEditor(){

        const engine =
            this.getEngine();


        const entity =
            engine?.currentOpenedEntity ||
            engine?.currentEntity ||
            null;


        if(
            !engine ||
            !entity
        ){
            return false;
        }


        const nameInput =
            document.getElementById(
                "entityEditNameInput"
            );


        const descriptionInput =
            document.getElementById(
                "entityEditDescriptionInput"
            );


        const tagsInput =
            document.getElementById(
                "entityEditTagsInput"
            );


        const statusInput =
            document.getElementById(
                "entityEditStatusInput"
            );


        const name =
            String(
                nameInput?.value ||
                ""
            ).trim();


        if(!name){

            nameInput?.focus();

            return false;

        }


        const entityManager =
            this.getService(
                "entityManager"
            );


        const worldService =
            this.getService(
                "world"
            );


        if(
            !entityManager ||
            typeof entityManager.update !==
                "function"
        ){
            return false;
        }


        let updated =
            null;


        try{

            updated =
                entityManager.update(
                    entity.id,
                    {
                        name,

                        description:
                            String(
                                descriptionInput?.value ||
                                ""
                            ).trim(),

                        tags:
                            this.parseTags(
                                tagsInput?.value
                            ),

                        status:
                            String(
                                statusInput?.value ||
                                "active"
                            )
                    }
                );

        } catch(error){

            console.error(
                "Entity güncellenemedi:",
                error
            );

            return false;

        }


        if(!updated){
            return false;
        }


        /*
         * World localStorage içinde entity snapshot tutulduğu için
         * güncel Entity instance'ını tekrar o World üyeliğine yazıyoruz.
         */

        const world =
            engine.currentWorld ||
            null;


        if(
            world &&
            Array.isArray(
                world.entities
            )
        ){

            const index =
                world.entities.findIndex(
                    item =>
                        item?.id ===
                        updated.id
                );


            if(index >= 0){

                world.entities[index] =
                    updated;

            }


            if(
                worldService &&
                typeof worldService.save ===
                    "function"
            ){

                worldService.save();

            }

        }


        engine.currentOpenedEntity =
            updated;

        engine.entityEditMode =
            false;


        this.recordEvolution(
            "life-event",
            `${updated.name} varlığı güncellendi`,
            {
                title:
                    `${updated.name} varlığı güncellendi`,

                source:
                    "entity",

                status:
                    "completed",

                importance:
                    "low",

                relatedEntityId:
                    updated.id,

                relatedWorldId:
                    world?.id ||
                    null,

                tags:[
                    "entity",
                    "update"
                ]
            }
        );


        return engine.setView(
            "entity",
            {
                world,
                entity:
                    updated,
                page:
                    null,
                entityCreateMode:
                    false,
                entityType:
                    null
            }
        );

    },


    archiveEntity(){

        const engine =
            this.getEngine();


        const entity =
            engine?.currentOpenedEntity ||
            engine?.currentEntity ||
            null;


        const world =
            engine?.currentWorld ||
            null;


        if(
            !entity ||
            entity.id ===
                engine?.rootEntity?.id
        ){
            return false;
        }


        const entityManager =
            this.getService(
                "entityManager"
            );


        const worldService =
            this.getService(
                "world"
            );


        if(
            !entityManager ||
            typeof entityManager.archive !==
                "function"
        ){
            return false;
        }


        let archived =
            false;


        try{

            archived =
                entityManager.archive(
                    entity.id
                );

        } catch(error){

            console.error(
                "Entity arşivlenemedi:",
                error
            );

            return false;

        }


        if(!archived){
            return false;
        }


        if(
            world &&
            Array.isArray(
                world.entities
            )
        ){

            const index =
                world.entities.findIndex(
                    item =>
                        item?.id ===
                        entity.id
                );


            if(index >= 0){

                world.entities[index] =
                    entity;

            }


            worldService?.save?.();

        }


        this.recordEvolution(
            "life-event",
            `${entity.name} varlığı arşivlendi`,
            {
                title:
                    `${entity.name} varlığı arşivlendi`,

                source:
                    "entity",

                status:
                    "completed",

                importance:
                    "medium",

                relatedEntityId:
                    entity.id,

                relatedWorldId:
                    world?.id ||
                    null,

                tags:[
                    "entity",
                    "archive"
                ]
            }
        );


        engine.currentOpenedEntity =
            null;

        engine.currentEntityPage =
            null;

        engine.entityEditMode =
            false;


        return this.backToWorld();

    },


    /* =====================================================
       ENTITY PAGES
    ===================================================== */

    openEntityPage(page){

        const allowedPages = [
            "identity",
            "profile",
            "organs",
            "timeline",
            "memory",
            "bridge",
            "evolution",
            "settings",
            "discovery"
        ];


        if(
            !allowedPages.includes(
                page
            )
        ){
            return false;
        }


        const engine =
            this.getEngine();


        if(!engine){
            return false;
        }


        const entity =
            engine.currentOpenedEntity ||
            engine.rootEntity ||
            engine.currentEntity;


        if(!entity){
            return false;
        }


        engine.currentOpenedEntity =
            entity;

        engine.currentEntityPage =
            page;

        engine.entityEditMode =
            false;

        engine.worldEditMode =
            false;


        let view =
            "entity";


        if(
            entity.id ===
                engine.rootEntity?.id &&
            page ===
                "identity"
        ){

            view =
                "identity";

        }


        if(
            entity.id ===
                engine.rootEntity?.id &&
            page ===
                "profile"
        ){

            view =
                "profile";

        }


        const opened =
            engine.setView(
                view,
                {
                    entity,
                    page,
                    entityCreateMode:
                        false,
                    entityType:
                        null
                }
            );


        if(opened !== false){

            this.syncAwareness(
                page,
                {
                    entityId:
                        entity.id ||
                        null
                }
            );


            this.trackBrainSession(
                page
            );

        }


        return opened;

    },


    openEntityDashboard(){

        const engine =
            this.getEngine();


        const entity =
            engine?.currentOpenedEntity ||
            null;


        if(!entity){

            return this.openIdentity();

        }


        engine.currentEntityPage =
            null;

        engine.entityEditMode =
            false;


        return engine.setView(
            "entity",
            {
                world:
                    engine.currentWorld ||
                    null,

                entity,

                page:
                    null,

                entityCreateMode:
                    false,

                entityType:
                    null
            }
        );

    },


    /* =====================================================
       PROFILE
    ===================================================== */

    saveProfile(){

        const nameInput =
            document.getElementById(
                "profileNameInput"
            );


        const descriptionInput =
            document.getElementById(
                "profileDescriptionInput"
            );


        const name =
            String(
                nameInput?.value ||
                ""
            ).trim();


        if(!name){

            nameInput?.focus();

            return false;

        }


        const description =
            String(
                descriptionInput?.value ||
                ""
            ).trim();


        const engine =
            this.getEngine();


        const entity =
            engine?.currentOpenedEntity ||
            engine?.rootEntity ||
            null;


        if(!entity){
            return false;
        }


        const isRoot =
            entity.id ===
            engine.rootEntity?.id;


        try{

            if(isRoot){

                const userProfile = {

                    name,

                    description,

                    updatedAt:
                        Date.now()

                };


                localStorage.setItem(
                    "vaero:user:profile:v1",
                    JSON.stringify(
                        userProfile
                    )
                );


                if(entity.profile){

                    entity.profile.name =
                        name;

                    entity.profile.description =
                        description;

                    entity.profile.updatedAt =
                        Date.now();

                }

            } else {

                const entityManager =
                    this.getService(
                        "entityManager"
                    );


                if(
                    entityManager &&
                    typeof entityManager.update ===
                        "function"
                ){

                    entityManager.update(
                        entity.id,
                        {
                            name,
                            description
                        }
                    );

                } else if(
                    typeof entity.update ===
                        "function"
                ){

                    entity.update({
                        name,
                        description
                    });

                } else {

                    entity.name =
                        name;

                    entity.description =
                        description;

                }


                const profileService =
                    this.getService(
                        "profile"
                    );


                if(
                    profileService &&
                    entity.profile &&
                    typeof profileService.update ===
                        "function"
                ){

                    profileService.update(
                        entity.profile,
                        {
                            name,
                            description
                        }
                    );

                }


                this.getService(
                    "world"
                )?.save?.();

            }

        } catch(error){

            console.error(
                "Profil kaydedilemedi:",
                error
            );

            return false;

        }


        const feedback =
            document.getElementById(
                "profileSaveFeedback"
            );


        if(feedback){

            feedback.textContent =
                "Profil kaydedildi.";

        }


        return true;

    },


    /* =====================================================
       DISCOVERY
    ===================================================== */

    restartDiscovery(){

        try{

            localStorage.removeItem(
                "vaero:discovery:completed"
            );

            localStorage.removeItem(
                "vaero:discovery:draft:v2"
            );

        } catch(error){

            console.warn(
                "Discovery state temizlenemedi:",
                error
            );

        }


        const engineRoot =
            document.getElementById(
                "engine"
            );


        if(
            engineRoot &&
            window.DiscoveryApp &&
            typeof window.DiscoveryApp.render ===
                "function"
        ){

            window.DiscoveryApp.currentStep =
                0;

            window.DiscoveryApp.answers =
                {};

            window.DiscoveryApp.render(
                engineRoot
            );


            this.syncAwareness(
                "discovery"
            );


            return true;

        }


        return false;

    },


    /* =====================================================
       SYSTEM APPLICATIONS
    ===================================================== */

    openVaeroApp(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.openSystemPage !==
                "function"
        ){
            return false;
        }


        this.resetEditorState();


        const opened =
            engine.openSystemPage(
                "vaero"
            );


        if(opened){

            this.syncAwareness(
                "vaero"
            );

        }


        return opened;

    },


    openApplicationsApp(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.openSystemPage !==
                "function"
        ){
            return false;
        }


        this.resetEditorState();


        const opened =
            engine.openSystemPage(
                "applications"
            );


        if(opened){

            this.syncAwareness(
                "applications"
            );

        }


        return opened;

    },


    /* =====================================================
       VAERO PAYMENT CORE
    ===================================================== */

    getVaeroPaymentCore(){

        if(
            typeof window !==
                "undefined" &&
            window.VaeroApp
        ){

            if(
                window.VaeroApp
                    .paymentCore
            ){

                return window.VaeroApp
                    .paymentCore;

            }


            if(
                window.VaeroApp.core
            ){

                return window.VaeroApp
                    .core;

            }


            if(
                typeof window.VaeroApp
                    .getPaymentCore ===
                        "function"
            ){

                try{

                    return window.VaeroApp
                        .getPaymentCore();

                } catch(error){

                    return null;

                }

            }

        }


        return (
            this.getService(
                "paymentCore"
            ) ||
            null
        );

    },


    createVaeroPaymentIntent(
        payload = {}
    ){

        const core =
            this.getVaeroPaymentCore();


        if(
            !core ||
            typeof core.createIntent !==
                "function"
        ){

            console.warn(
                "VAERO Payment Core intent API bulunamadı."
            );

            return false;

        }


        try{

            const intent =
                core.createIntent(
                    payload
                );


            if(!intent){
                return false;
            }


            const engine =
                this.getEngine();


            if(engine){

                engine.currentVaeroPaymentIntent =
                    intent;

                engine.mount(
                    engine.currentEntity
                );

            }


            return intent;

        } catch(error){

            console.error(
                "Payment intent oluşturulamadı:",
                error
            );

            return false;

        }

    },


    selectVaeroPaymentMethod(method){

        const core =
            this.getVaeroPaymentCore();


        const engine =
            this.getEngine();


        const intent =
            engine?.currentVaeroPaymentIntent ||
            null;


        if(
            !core ||
            !intent ||
            !method
        ){
            return false;
        }


        try{

            if(
                typeof core.setMethod ===
                    "function"
            ){

                const result =
                    core.setMethod(
                        intent.id,
                        method
                    );


                engine.currentVaeroPaymentIntent =
                    result ||
                    intent;


                engine.mount(
                    engine.currentEntity
                );


                return result !== false;

            }


            if(
                typeof core.selectMethod ===
                    "function"
            ){

                const result =
                    core.selectMethod(
                        intent.id,
                        method
                    );


                engine.currentVaeroPaymentIntent =
                    result ||
                    intent;


                engine.mount(
                    engine.currentEntity
                );


                return result !== false;

            }

        } catch(error){

            console.error(
                "Payment method seçilemedi:",
                error
            );

        }


        return false;

    },


    selectVaeroPaymentProvider(provider){

        const core =
            this.getVaeroPaymentCore();


        const engine =
            this.getEngine();


        const intent =
            engine?.currentVaeroPaymentIntent ||
            null;


        if(
            !core ||
            !intent ||
            !provider
        ){
            return false;
        }


        try{

            if(
                typeof core.setProvider ===
                    "function"
            ){

                const result =
                    core.setProvider(
                        intent.id,
                        provider
                    );


                engine.currentVaeroPaymentIntent =
                    result ||
                    intent;


                engine.mount(
                    engine.currentEntity
                );


                return result !== false;

            }


            if(
                typeof core.selectProvider ===
                    "function"
            ){

                const result =
                    core.selectProvider(
                        intent.id,
                        provider
                    );


                engine.currentVaeroPaymentIntent =
                    result ||
                    intent;


                engine.mount(
                    engine.currentEntity
                );


                return result !== false;

            }

        } catch(error){

            console.error(
                "Payment provider seçilemedi:",
                error
            );

        }


        return false;

    },


    startVaeroPayment(){

        const core =
            this.getVaeroPaymentCore();


        const engine =
            this.getEngine();


        const intent =
            engine?.currentVaeroPaymentIntent ||
            null;


        if(
            !core ||
            !intent
        ){
            return false;
        }


        try{

            if(
                typeof core.start ===
                    "function"
            ){

                return core.start(
                    intent.id
                );

            }


            if(
                typeof core.startIntent ===
                    "function"
            ){

                return core.startIntent(
                    intent.id
                );

            }

        } catch(error){

            console.error(
                "Payment başlatılamadı:",
                error
            );

        }


        return false;

    },


    cancelVaeroPayment(){

        const core =
            this.getVaeroPaymentCore();


        const engine =
            this.getEngine();


        const intent =
            engine?.currentVaeroPaymentIntent ||
            null;


        if(
            !core ||
            !intent
        ){
            return false;
        }


        try{

            if(
                typeof core.cancel ===
                    "function"
            ){

                return core.cancel(
                    intent.id
                );

            }


            if(
                typeof core.cancelIntent ===
                    "function"
            ){

                return core.cancelIntent(
                    intent.id
                );

            }

        } catch(error){

            console.error(
                "Payment iptal edilemedi:",
                error
            );

        }


        return false;

    },


    refundVaeroPayment(transactionId){

        const core =
            this.getVaeroPaymentCore();


        if(
            !core ||
            !transactionId
        ){
            return false;
        }


        try{

            if(
                typeof core.refund ===
                    "function"
            ){

                return core.refund(
                    transactionId
                );

            }

        } catch(error){

            console.error(
                "Refund işlemi başlatılamadı:",
                error
            );

        }


        return false;

    },


    /* =====================================================
       BRAIN STORAGE
    ===================================================== */

    getBrainStorageKey(){

        return "vaero:brain:global";

    },


    getBrainDayKey(
        timestamp = Date.now()
    ){

        const date =
            new Date(
                timestamp
            );


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );


        return `${year}-${month}-${day}`;

    },


    normalizeBrainSessions(sessions){

        if(
            !Array.isArray(
                sessions
            )
        ){
            return [];
        }


        return sessions
            .filter(
                session =>
                    session &&
                    typeof session ===
                        "object"
            )
            .map(
                session => {

                    const startedAt =
                        Number(
                            session.startedAt
                        ) ||
                        Number(
                            session.updatedAt
                        ) ||
                        Date.now();


                    const updatedAt =
                        Number(
                            session.updatedAt
                        ) ||
                        startedAt;


                    const actions =
                        Array.isArray(
                            session.actions
                        )
                            ? session.actions
                                .map(
                                    action => {

                                        if(
                                            typeof action ===
                                                "string"
                                        ){

                                            return {
                                                id:
                                                    this.createId(
                                                        "brain-action"
                                                    ),

                                                role:
                                                    "user",

                                                type:
                                                    "message",

                                                content:
                                                    action,

                                                createdAt:
                                                    updatedAt,

                                                context:
                                                    null,

                                                appLinks:
                                                    []
                                            };

                                        }


                                        if(
                                            !action ||
                                            typeof action !==
                                                "object"
                                        ){
                                            return null;
                                        }


                                        const content =
                                            String(
                                                action.content ||
                                                action.fullContent ||
                                                action.text ||
                                                action.message ||
                                                ""
                                            ).trim();


                                        if(!content){
                                            return null;
                                        }


                                        return {

                                            ...action,

                                            id:
                                                action.id ||
                                                this.createId(
                                                    "brain-action"
                                                ),

                                            content,

                                            createdAt:
                                                Number(
                                                    action.createdAt
                                                ) ||
                                                updatedAt,

                                            appLinks:
                                                Array.isArray(
                                                    action.appLinks
                                                )
                                                    ? action.appLinks
                                                    : []

                                        };

                                    }
                                )
                                .filter(Boolean)
                            : [];


                    return {

                        id:
                            session.id ||
                            this.createId(
                                "brain-session"
                            ),

                        title:
                            String(
                                session.title ||
                                "Brain Sohbeti · Bugün"
                            ),

                        kind:
                            "conversation",

                        target:
                            null,

                        status:
                            session.status ===
                                "error"
                                ? "error"
                                : (
                                    session.status ===
                                        "done" ||
                                    session.status ===
                                        "closed"
                                )
                                    ? "done"
                                    : "progress",

                        startedAt,

                        updatedAt,

                        actions,

                        favorite:
                            Boolean(
                                session.favorite
                            ),

                        summary:
                            session.summary ||
                            null,

                        topic:
                            session.topic ||
                            "daily-brain",

                        dayKey:
                            session.dayKey ||
                            this.getBrainDayKey(
                                startedAt
                            )

                    };

                }
            )
            .sort(
                (a,b) =>
                    b.updatedAt -
                    a.updatedAt
            );

    },


    loadBrainState(){

        const brain =
            this.getService(
                "brain"
            );


        if(!brain){
            return false;
        }


        let saved =
            null;


        try{

            saved =
                localStorage.getItem(
                    this.getBrainStorageKey()
                );

        } catch(error){

            return false;

        }


        if(!saved){

            brain.sessions = [];

            brain.resumePoint =
                null;

            return true;

        }


        try{

            const parsed =
                JSON.parse(
                    saved
                );


            brain.sessions =
                this.normalizeBrainSessions(
                    parsed.sessions
                );


            brain.resumePoint =
                parsed.resumePoint ||
                null;


            return true;

        } catch(error){

            console.error(
                "Brain geçmişi okunamadı:",
                error
            );


            brain.sessions = [];

            brain.resumePoint =
                null;


            return false;

        }

    },


    saveBrainState(){

        const brain =
            this.getService(
                "brain"
            );


        if(!brain){
            return false;
        }


        try{

            localStorage.setItem(
                this.getBrainStorageKey(),
                JSON.stringify({
                    sessions:
                        Array.isArray(
                            brain.sessions
                        )
                            ? brain.sessions
                            : [],

                    resumePoint:
                        brain.resumePoint ||
                        null,

                    savedAt:
                        Date.now()
                })
            );


            return true;

        } catch(error){

            console.error(
                "Brain geçmişi kaydedilemedi:",
                error
            );


            return false;

        }

    },


    getTodayBrainConversationSession(brain){

        if(
            !brain ||
            !Array.isArray(
                brain.sessions
            )
        ){
            return null;
        }


        const todayKey =
            this.getBrainDayKey();


        return (
            brain.sessions.find(
                session =>
                    session.kind ===
                        "conversation" &&
                    session.dayKey ===
                        todayKey
            ) ||
            null
        );

    },


    createTodayBrainConversation(brain){

        const now =
            Date.now();


        const session = {

            id:
                this.createId(
                    "brain-session"
                ),

            title:
                "Brain Sohbeti · Bugün",

            kind:
                "conversation",

            target:
                null,

            status:
                "progress",

            startedAt:
                now,

            updatedAt:
                now,

            actions:
                [],

            favorite:
                false,

            summary:
                null,

            topic:
                "daily-brain",

            dayKey:
                this.getBrainDayKey(
                    now
                )

        };


        brain.sessions.unshift(
            session
        );


        return session;

    },


    trackBrainSession(page){

        const brain =
            this.getService(
                "brain"
            );


        if(!brain){
            return false;
        }


        if(
            !Array.isArray(
                brain.sessions
            )
        ){

            brain.sessions = [];

        }


        const labels = {

            profile:
                "Profil ekranı açıldı",

            identity:
                "Kimlik ekranı açıldı",

            organs:
                "Organlar ekranı açıldı",

            timeline:
                "Zaman Çizelgesi açıldı",

            memory:
                "Hafıza ekranı açıldı",

            bridge:
                "Köprü ekranı açıldı",

            evolution:
                "Evrim ekranı açıldı",

            settings:
                "Ayarlar ekranı açıldı",

            discovery:
                "Discovery ekranı açıldı"

        };


        const content =
            labels[page];


        if(!content){
            return false;
        }


        const session =
            this.getTodayBrainConversationSession(
                brain
            ) ||
            this.createTodayBrainConversation(
                brain
            );


        const now =
            Date.now();


        session.actions.push({

            id:
                this.createId(
                    "brain-action"
                ),

            role:
                "system",

            type:
                "navigation",

            content,

            createdAt:
                now,

            target:
                page,

            context:{
                page
            },

            appLinks:
                []

        });


        session.updatedAt =
            now;


        this.saveBrainState();

        this.renderBrainHistory();


        return true;

    },

   /* =====================================================
       BRAIN PANEL
    ===================================================== */

    openBrain(){

        this.loadBrainState();


        let panel =
            document.getElementById(
                "brainPanel"
            );


        if(!panel){

            if(
                !window.BrainApp ||
                typeof window.BrainApp.render !==
                    "function"
            ){
                return false;
            }


            document.body.insertAdjacentHTML(
                "beforeend",
                window.BrainApp.render()
            );


            panel =
                document.getElementById(
                    "brainPanel"
                );

        }


        if(!panel){
            return false;
        }


        panel.classList.remove(
            "is-expanded"
        );

        panel.classList.add(
            "is-compact"
        );

        panel.style.display =
            "flex";


        const contextService =
            this.getService(
                "brainContext"
            );


        let context =
            null;


        try{

            context =
                contextService &&
                typeof contextService.build ===
                    "function"
                    ? contextService.build()
                    : null;

        } catch(error){

            context = null;

        }


        const contextKey =
            context?.page ||
            context?.screen ||
            context?.app ||
            "home";


        const names = {

            home:
                "Ana Ekran",

            identity:
                "Kimlik",

            profile:
                "Profil",

            create:
                "Yarat",

            worlds:
                "Dünyalar",

            world:
                "Dünya",

            entity:
                "Varlık",

            organs:
                "Organlar",

            timeline:
                "Zaman Çizelgesi",

            memory:
                "Hafıza",

            bridge:
                "Köprü",

            evolution:
                "Evrim",

            settings:
                "Ayarlar",

            discovery:
                "Discovery",

            applications:
                "Applications",

            vaero:
                "VAERO"

        };


        const suggestions = {

            home:
                "Dünyalarını açabilir, Applications'a geçebilir veya yeni bir yapı oluşturabilirsin.",

            identity:
                "Kimlik bilgilerini inceleyebilir veya Profil ekranına geçebilirsin.",

            profile:
                "Profil bilgilerini yönetebilir veya Discovery yönünü inceleyebilirsin.",

            create:
                "Yeni dünyanın amacını belirleyerek başlayabilirsin.",

            worlds:
                "Mevcut dünyalarını açabilir veya yeni bir dünya oluşturabilirsin.",

            world:
                "Bu dünyadaki varlıkları inceleyebilir, düzenleyebilir veya yeni bir varlık oluşturabilirsin.",

            entity:
                "Varlığın Kimlik, Profil, Hafıza, Timeline, Bridge ve Organlar katmanlarını yönetebilirsin.",

            memory:
                "Geçmiş kayıtlarını ve önemli bağlamlarını inceleyebilirsin.",

            timeline:
                "Geçmiş olaylarının zaman içindeki akışını inceleyebilirsin.",

            evolution:
                "Gelişimini ve yaşam olaylarının etkisini inceleyebilirsin.",

            applications:
                "Engine'e bağlı uygulamaları keşfedebilir ve yönetebilirsin.",

            vaero:
                "Engine hizmetlerini ve ödeme altyapısını yönetebilirsin."

        };


        const contextText =
            document.getElementById(
                "brainContextText"
            );


        if(contextText){

            contextText.textContent =
                `Şu an ${
                    names[contextKey] ||
                    contextKey
                } ekranındasın.`;

        }


        const suggestion =
            document.getElementById(
                "brainSuggestion"
            );


        if(suggestion){

            suggestion.textContent =
                suggestions[contextKey] ||
                "Bir ekran açabilir veya ne yapmak istediğini yazabilirsin.";

        }


        const input =
            document.getElementById(
                "brainInput"
            );


        input?.addEventListener(
            "focus",
            () => {

                panel.classList.remove(
                    "is-compact"
                );

                panel.classList.add(
                    "is-expanded"
                );

            },
            {
                once:true
            }
        );


        if(
            this.brainOutsideHandler
        ){

            document.removeEventListener(
                "pointerdown",
                this.brainOutsideHandler
            );

        }


        this.brainOutsideHandler =
            event => {

                const currentPanel =
                    document.getElementById(
                        "brainPanel"
                    );


                if(
                    !currentPanel ||
                    currentPanel.contains(
                        event.target
                    ) ||
                    event.target.closest(
                        '[data-action="brain:open"]'
                    )
                ){
                    return;
                }


                currentPanel.classList.remove(
                    "is-expanded"
                );

                currentPanel.classList.add(
                    "is-compact"
                );

            };


        document.addEventListener(
            "pointerdown",
            this.brainOutsideHandler
        );


        this.syncAwareness(
            "brain",
            {
                source:
                    "panel"
            }
        );


        this.renderBrainHistory();


        return true;

    },


    closeBrain(){

        this.saveBrainState();


        if(
            this.brainOutsideHandler
        ){

            document.removeEventListener(
                "pointerdown",
                this.brainOutsideHandler
            );


            this.brainOutsideHandler =
                null;

        }


        document
            .querySelectorAll(
                "#brainPanel"
            )
            .forEach(
                panel =>
                    panel.remove()
            );


        return true;

    },


    /* =====================================================
       BRAIN APP LINKS
    ===================================================== */

    getBrainAppDefinitions(){

        return [

            {
                id:"profile",
                label:"Profil",
                words:[
                    "profil",
                    "profile"
                ]
            },

            {
                id:"identity",
                label:"Kimlik",
                words:[
                    "kimlik",
                    "identity"
                ]
            },

            {
                id:"memory",
                label:"Hafıza",
                words:[
                    "hafıza",
                    "hafiza",
                    "memory"
                ]
            },

            {
                id:"timeline",
                label:"Zaman Çizelgesi",
                words:[
                    "timeline",
                    "zaman çizelgesi",
                    "zaman cizelgesi"
                ]
            },

            {
                id:"bridge",
                label:"Köprü",
                words:[
                    "köprü",
                    "kopru",
                    "bridge"
                ]
            },

            {
                id:"evolution",
                label:"Evrim",
                words:[
                    "evrim",
                    "evolution"
                ]
            },

            {
                id:"organs",
                label:"Organlar",
                words:[
                    "organ",
                    "organlar"
                ]
            },

            {
                id:"settings",
                label:"Ayarlar",
                words:[
                    "ayar",
                    "ayarlar",
                    "settings"
                ]
            }

        ];

    },


    extractBrainAppMentions(text){

        const normalized =
            String(
                text ||
                ""
            )
                .toLocaleLowerCase(
                    "tr-TR"
                );


        return this
            .getBrainAppDefinitions()
            .filter(
                app =>
                    app.words.some(
                        word =>
                            normalized.includes(
                                word
                            )
                    )
            )
            .map(
                app => ({
                    app:
                        app.id,

                    label:
                        app.label
                })
            );

    },


    /* =====================================================
       BRAIN SEND
    ===================================================== */

    async sendBrainMessage(){

        if(this.brainSending){
            return false;
        }


        const input =
            document.getElementById(
                "brainInput"
            );


        if(!input){
            return false;
        }


        const text =
            String(
                input.value ||
                ""
            ).trim();


        if(!text){
            return false;
        }


        const brain =
            this.getService(
                "brain"
            );


        if(!brain){
            return false;
        }


        if(
            !Array.isArray(
                brain.sessions
            )
        ){

            brain.sessions = [];

        }


        const contextService =
            this.getService(
                "brainContext"
            );


        let context =
            null;


        try{

            context =
                contextService &&
                typeof contextService.build ===
                    "function"
                    ? contextService.build({
                        message:text
                    })
                    : null;

        } catch(error){

            context = null;

        }


        const session =
            this.getTodayBrainConversationSession(
                brain
            ) ||
            this.createTodayBrainConversation(
                brain
            );


        const now =
            Date.now();


        session.actions.push({

            id:
                this.createId(
                    "brain-action"
                ),

            role:
                "user",

            type:
                "message",

            content:
                text,

            createdAt:
                now,

            context:{
                page:
                    context?.page ||
                    context?.screen ||
                    null
            },

            appLinks:
                this.extractBrainAppMentions(
                    text
                )

        });


        session.updatedAt =
            now;


        input.value =
            "";

        this.brainSending =
            true;

        input.disabled =
            true;


        this.renderBrainHistory();


        let replyText =
            "";


        try{

            if(
                typeof brain.ask ===
                    "function"
            ){

                const response =
                    await brain.ask(
                        text,
                        {
                            context:
                                context ||
                                {}
                        }
                    );


                replyText =
                    typeof response ===
                        "string"
                        ? response
                        : (
                            response?.reply ||
                            response?.message ||
                            response?.text ||
                            ""
                        );

            } else if(
                typeof brain.receive ===
                    "function"
            ){

                const response =
                    brain.receive(
                        text,
                        context ||
                        {}
                    );


                replyText =
                    typeof response ===
                        "string"
                        ? response
                        : (
                            response?.reply ||
                            response?.message ||
                            response?.text ||
                            ""
                        );

            }

        } catch(error){

            console.error(
                "Brain mesajı işlenemedi:",
                error
            );


            replyText =
                "Brain isteği şu anda tamamlanamadı.";

        } finally {

            this.brainSending =
                false;

            input.disabled =
                false;

        }


        if(replyText){

            session.actions.push({

                id:
                    this.createId(
                        "brain-action"
                    ),

                role:
                    "brain",

                type:
                    "reply",

                content:
                    String(
                        replyText
                    ),

                createdAt:
                    Date.now(),

                context:{
                    page:
                        context?.page ||
                        context?.screen ||
                        null
                },

                appLinks:
                    this.extractBrainAppMentions(
                        replyText
                    )

            });

        }


        session.updatedAt =
            Date.now();


        this.updateBrainConversationSummary(
            session
        );


        this.saveBrainState();

        this.renderBrainHistory();


        const panel =
            document.getElementById(
                "brainPanel"
            );


        if(panel){

            panel.classList.remove(
                "is-compact"
            );

            panel.classList.add(
                "is-expanded"
            );

        }


        input.focus();


        return true;

    },


    updateBrainConversationSummary(session){

        if(
            !session ||
            !Array.isArray(
                session.actions
            )
        ){
            return false;
        }


        const messages =
            session.actions
                .filter(
                    action =>
                        action?.role ===
                            "user" &&
                        action.content
                )
                .map(
                    action =>
                        String(
                            action.content
                        ).trim()
                )
                .filter(Boolean)
                .slice(-3);


        const summary =
            messages.join(
                " · "
            );


        session.summary =
            summary.length > 160
                ? `${summary
                    .slice(
                        0,
                        160
                    )
                    .trim()}…`
                : (
                    summary ||
                    null
                );


        return true;

    },


    /* =====================================================
       RESUME POINT
    ===================================================== */

    saveBrainResumePoint(note){

        const brain =
            this.getService(
                "brain"
            );


        const contextService =
            this.getService(
                "brainContext"
            );


        if(!brain){
            return false;
        }


        let context =
            null;


        try{

            context =
                contextService &&
                typeof contextService.build ===
                    "function"
                    ? contextService.build()
                    : null;

        } catch(error){

            context = null;

        }


        brain.resumePoint = {

            id:
                this.createId(
                    "resume"
                ),

            app:
                context?.app ||
                null,

            screen:
                context?.screen ||
                null,

            page:
                context?.page ||
                null,

            worldId:
                context?.world?.id ||
                null,

            entityId:
                context?.entity?.id ||
                null,

            note:
                String(
                    note ||
                    ""
                ),

            savedAt:
                Date.now()

        };


        this.saveBrainState();

        this.renderBrainHistory();


        return true;

    },


    restoreBrainResumePoint(){

        const brain =
            this.getService(
                "brain"
            );


        const point =
            brain?.resumePoint ||
            null;


        if(!point){
            return false;
        }


        if(point.worldId){

            const opened =
                this.openWorld(
                    point.worldId
                );


            if(
                opened &&
                point.entityId
            ){

                this.openEntity(
                    point.entityId
                );

            }


            if(
                point.page &&
                point.entityId
            ){

                this.openEntityPage(
                    point.page
                );

            }


            return true;

        }


        if(point.page){

            return this.openEntityPage(
                point.page
            );

        }


        if(
            point.screen ===
                "create"
        ){

            return this.openCreate();

        }


        if(
            point.screen ===
                "worlds"
        ){

            return this.openWorlds();

        }


        return this.openHome();

    },


    /* =====================================================
       BRAIN HISTORY
    ===================================================== */

    getBrainActionText(action){

        if(
            typeof action ===
                "string"
        ){
            return action;
        }


        if(
            action &&
            typeof action ===
                "object"
        ){

            return String(
                action.content ||
                action.text ||
                action.message ||
                ""
            );

        }


        return "";

    },


    escapeBrainHTML(value){

        return String(
            value ?? ""
        )
            .replaceAll("&","&amp;")
            .replaceAll("<","&lt;")
            .replaceAll(">","&gt;")
            .replaceAll('"',"&quot;")
            .replaceAll("'","&#039;");

    },


    renderBrainHistory(){

        const history =
            document.getElementById(
                "brainHistory"
            );


        const miniHistory =
            document.getElementById(
                "brainMiniHistory"
            );


        const brain =
            this.getService(
                "brain"
            );


        if(
            !history ||
            !brain
        ){
            return false;
        }


        history.innerHTML =
            "";


        if(miniHistory){

            miniHistory.innerHTML =
                "";

        }


        const todaySession =
            this.getTodayBrainConversationSession(
                brain
            );


        const actions =
            Array.isArray(
                todaySession?.actions
            )
                ? [
                    ...todaySession.actions
                ]
                    .filter(
                        action =>
                            this
                                .getBrainActionText(
                                    action
                                )
                                .trim()
                    )
                    .sort(
                        (a,b) =>
                            (
                                a?.createdAt ||
                                0
                            ) -
                            (
                                b?.createdAt ||
                                0
                            )
                    )
                : [];


        const flow =
            document.createElement(
                "div"
            );


        flow.className =
            "brain-chat-flow";


        if(actions.length === 0){

            flow.innerHTML = `
                <div class="brain-chat-empty">
                    <strong>
                        Bugünün sohbeti
                    </strong>

                    <span>
                        Brain’e bir şey yazarak başlayabilirsin.
                    </span>
                </div>
            `;

        } else {

            actions.forEach(
                action => {

                    const content =
                        this.getBrainActionText(
                            action
                        );


                    const time =
                        new Date(
                            action.createdAt ||
                            Date.now()
                        ).toLocaleTimeString(
                            "tr-TR",
                            {
                                hour:
                                    "2-digit",

                                minute:
                                    "2-digit"
                            }
                        );


                    if(
                        action.role ===
                            "system" ||
                        action.type ===
                            "navigation"
                    ){

                        const systemRow =
                            document.createElement(
                                "div"
                            );


                        systemRow.className =
                            "brain-chat-system";


                        systemRow.innerHTML = `
                            <span class="brain-chat-system-time">
                                ${this.escapeBrainHTML(time)}
                            </span>

                            <span>
                                ${this.escapeBrainHTML(content)}
                            </span>
                        `;


                        flow.appendChild(
                            systemRow
                        );


                        return;

                    }


                    const message =
                        document.createElement(
                            "div"
                        );


                    message.className =
                        action.role ===
                            "user"
                            ? "brain-chat-message brain-chat-user"
                            : "brain-chat-message brain-chat-brain";


                    const links =
                        Array.isArray(
                            action.appLinks
                        )
                            ? action.appLinks
                                .filter(
                                    (
                                        link,
                                        index,
                                        all
                                    ) =>
                                        link?.app &&
                                        all.findIndex(
                                            item =>
                                                item?.app ===
                                                link.app
                                        ) === index
                                )
                            : [];


                    message.innerHTML = `
                        <div class="brain-chat-meta">
                            <span>
                                ${this.escapeBrainHTML(time)}
                            </span>

                            ${
                                action?.context?.page
                                    ? `
                                        <span class="brain-chat-context">
                                            ${this.escapeBrainHTML(
                                                action.context.page
                                            )}
                                        </span>
                                      `
                                    : ""
                            }
                        </div>

                        <div class="brain-chat-content">
                            ${this.escapeBrainHTML(content)}

                            ${
                                links.length
                                    ? `
                                        <span class="brain-message-app-links">
                                            ${links
                                                .map(
                                                    link => `
                                                        <button
                                                            type="button"
                                                            class="brain-message-app-link"
                                                            data-brain-app="${this.escapeBrainHTML(
                                                                link.app
                                                            )}"
                                                        >
                                                            ${this.escapeBrainHTML(
                                                                link.label
                                                            )}
                                                        </button>
                                                    `
                                                )
                                                .join("")}
                                        </span>
                                      `
                                    : ""
                            }
                        </div>
                    `;


                    flow.appendChild(
                        message
                    );

                }
            );

        }


        history.appendChild(
            flow
        );


        history
            .querySelectorAll(
                "[data-brain-app]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const app =
                                button.dataset
                                    .brainApp;


                            this.closeBrain();

                            this.openEntityPage(
                                app
                            );

                        }
                    );

                }
            );


        if(miniHistory){

            const recent =
                actions
                    .filter(
                        action =>
                            action.role ===
                                "user" ||
                            action.role ===
                                "brain"
                    )
                    .slice(-3);


            const miniFlow =
                document.createElement(
                    "div"
                );


            miniFlow.className =
                "brain-mini-chat-flow";


            recent.forEach(
                action => {

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "brain-mini-chat-message";


                    row.innerHTML = `
                        <strong>
                            ${
                                action.role ===
                                    "user"
                                    ? "Sen:"
                                    : "Brain:"
                            }
                        </strong>

                        <span>
                            ${this.escapeBrainHTML(
                                this.getBrainActionText(
                                    action
                                )
                            )}
                        </span>
                    `;


                    miniFlow.appendChild(
                        row
                    );

                }
            );


            miniFlow.addEventListener(
                "click",
                () => {

                    const panel =
                        document.getElementById(
                            "brainPanel"
                        );


                    if(panel){

                        panel.classList.remove(
                            "is-compact"
                        );

                        panel.classList.add(
                            "is-expanded"
                        );

                    }

                }
            );


            miniHistory.appendChild(
                miniFlow
            );

        }


        requestAnimationFrame(
            () => {

                history.scrollTop =
                    history.scrollHeight;

            }
        );


        return true;

    },


    /* =====================================================
       EVOLUTION ACTIONS
    ===================================================== */

    handleEvolutionAction(
        action,
        button
    ){

        const engine =
            this.getEngine();


        if(
            action ===
                "evolution:filter" &&
            window.EvolutionApp &&
            typeof window.EvolutionApp
                .setFilter ===
                "function"
        ){

            window.EvolutionApp
                .setFilter(
                    button.dataset.filter
                );


            engine?.mount();


            return true;

        }


        if(
            action ===
                "evolution:event:open" &&
            window.EvolutionApp &&
            typeof window.EvolutionApp
                .selectEvent ===
                "function"
        ){

            window.EvolutionApp
                .selectEvent(
                    button.dataset
                        .eventId
                );


            engine?.mount();


            return true;

        }


        if(
            action ===
                "evolution:event:close" &&
            window.EvolutionApp &&
            typeof window.EvolutionApp
                .clearSelectedEvent ===
                "function"
        ){

            window.EvolutionApp
                .clearSelectedEvent();


            engine?.mount();


            return true;

        }


        if(
            action ===
                "evolution:linked:open"
        ){

            const target =
                String(
                    button.dataset.target ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            if(
                target !==
                    "timeline" &&
                target !==
                    "memory"
            ){
                return false;
            }


            if(
                window.EvolutionApp &&
                typeof window.EvolutionApp
                    .clearSelectedEvent ===
                    "function"
            ){

                window.EvolutionApp
                    .clearSelectedEvent();

            }


            return this.openEntityPage(
                target
            );

        }


        return false;

    }

};


/* =========================================================
   CLICK ROUTER
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if(!button){
            return;
        }


        const action =
            button.dataset.action;


        if(
            [
                "world:create:submit",
                "world:edit:submit",
                "entity:create:submit",
                "entity:edit:submit"
            ].includes(action)
        ){

            event.preventDefault();

        }


        switch(action){

            case "home:open":

                Actions.openHome();
                break;


            case "identity:open":

                Actions.openIdentity();
                break;


            case "profile:open":

                Actions.openProfile();
                break;


            case "create:open":

                Actions.openCreate();
                break;


            case "worlds:open":

                Actions.openWorlds();
                break;


            case "entities:open":

                Actions.openEntities();
                break;


            case "world:open":

                Actions.openWorld(
                    button.dataset
                        .worldId
                );

                break;


            case "world:create:submit":

                Actions.createWorld();
                break;


            case "world:edit:open":

                Actions.openWorldEditor();
                break;


            case "world:edit:cancel":

                Actions.cancelWorldEditor();
                break;


            case "world:edit:submit":

                Actions.saveWorldEditor();
                break;


            case "world:archive":

                Actions.archiveWorld();
                break;


            case "world:back":

                Actions.backToWorld();
                break;


            case "entity:create:first":

                Actions.startEntityCreate();
                break;


            case "entity:type:select":

                Actions.selectEntityType(
                    button.dataset
                        .entityType
                );

                break;


            case "entity:type:clear":

                Actions.clearEntityType();
                break;


            case "entity:create:cancel":

                Actions.cancelEntityCreate();
                break;


            case "entity:create:submit":

                Actions.createEntity();
                break;


            case "entity:open":

                Actions.openEntity(
                    button.dataset
                        .entityId
                );

                break;


            case "entity:edit:open":

                Actions.openEntityEditor();
                break;


            case "entity:edit:cancel":

                Actions.cancelEntityEditor();
                break;


            case "entity:edit:submit":

                Actions.saveEntityEditor();
                break;


            case "entity:archive":

                Actions.archiveEntity();
                break;


            case "entity:dashboard":

                Actions.openEntityDashboard();
                break;


            case "entity:identity":

                Actions.openEntityPage(
                    "identity"
                );

                break;


            case "entity:profile":

                Actions.openEntityPage(
                    "profile"
                );

                break;


            case "entity:organs":

                Actions.openEntityPage(
                    "organs"
                );

                break;


            case "entity:timeline":

                Actions.openEntityPage(
                    "timeline"
                );

                break;


            case "entity:memory":

                Actions.openEntityPage(
                    "memory"
                );

                break;


            case "entity:bridge":

                Actions.openEntityPage(
                    "bridge"
                );

                break;


            case "entity:evolution":

                Actions.openEntityPage(
                    "evolution"
                );

                break;


            case "entity:settings":

                Actions.openEntityPage(
                    "settings"
                );

                break;


            case "entity:discovery":

                Actions.openEntityPage(
                    "discovery"
                );

                break;


            case "profile:save":

                Actions.saveProfile();
                break;


            case "discovery:restart":

                Actions.restartDiscovery();
                break;


            /* ---------------------------------------------
               SYSTEM APPLICATIONS
            --------------------------------------------- */

            case "app:applications":

                Actions.openApplicationsApp();
                break;


            case "app:vaero":

                Actions.openVaeroApp();
                break;


            /* ---------------------------------------------
               PAYMENT CORE
            --------------------------------------------- */

            case "vaero:payment:method":

                Actions.selectVaeroPaymentMethod(
                    button.dataset
                        .paymentMethod
                );

                break;


            case "vaero:payment:provider":

                Actions.selectVaeroPaymentProvider(
                    button.dataset
                        .paymentProvider
                );

                break;


            case "vaero:payment:start":

                Actions.startVaeroPayment();
                break;


            case "vaero:payment:cancel":

                Actions.cancelVaeroPayment();
                break;


            case "vaero:payment:refund":

                Actions.refundVaeroPayment(
                    button.dataset
                        .transactionId
                );

                break;


            /* ---------------------------------------------
               BRAIN
            --------------------------------------------- */

            case "brain:open":

                Actions.openBrain();
                break;


            case "brain:close":

                Actions.closeBrain();
                break;


            case "brain:send":

                Actions.sendBrainMessage();
                break;


            default:

                Actions.handleEvolutionAction(
                    action,
                    button
                );

        }

    }
);


/* =========================================================
   ENGINE FORMS
========================================================= */

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target.closest(
                "[data-engine-form]"
            );


        if(!form){
            return;
        }


        event.preventDefault();


        switch(
            form.dataset
                .engineForm
        ){

            case "world-create":

                Actions.createWorld();
                break;


            case "world-edit":

                Actions.saveWorldEditor();
                break;


            case "entity-create":

                Actions.createEntity();
                break;


            case "entity-edit":

                Actions.saveEntityEditor();
                break;

        }

    }
);


/* =========================================================
   BRAIN KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if(
            event.target.id !==
                "brainInput" ||
            event.key !==
                "Enter" ||
            event.shiftKey
        ){
            return;
        }


        event.preventDefault();


        Actions.sendBrainMessage();

    }
);


/* =========================================================
   REGISTER
========================================================= */

VAERO.register(
    "actions",
    Actions
);


window.Actions =
    Actions;
