/* =========================================================
   VAERO ACTIONS V2
   Engine Interaction / Editors / Brain Gateway / Payment Bridge
========================================================= */

const Actions = {

    brainOutsideHandler:
        null,

    brainSending:
        false,


    /* =====================================================
       SAFE ACCESS
    ===================================================== */

    getService(name){

        const serviceName =
            String(
                name ||
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
                `Actions servisi okunamadı: ${serviceName}`,
                error
            );


            return null;

        }

    },


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
                "undefined" &&
            window.Engine
        ){

            return window.Engine;

        }


        return null;

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


    getCurrentWorld(){

        const engine =
            this.getEngine();


        return (
            engine?.currentWorld ||
            null
        );

    },


    remount(
        entity = undefined
    ){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.mount !==
                "function"
        ){

            return false;

        }


        const target =
            entity ===
                undefined
                ? (
                    engine.currentOpenedEntity ||
                    engine.currentEntity ||
                    engine.rootEntity ||
                    null
                )
                : entity;


        try{

            return engine.mount(
                target
            );

        } catch(error){

            console.warn(
                "Engine yeniden çizilemedi:",
                error
            );


            return false;

        }

    },


    createId(
        prefix = "item"
    ){

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


        const safePrefix =
            String(
                prefix ||
                "item"
            )
                .trim()
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    "-"
                )
                .slice(
                    0,
                    40
                ) ||
            "item";


        return `${safePrefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    parseTags(value){

        const seen =
            new Set();


        return String(
            value ??
            ""
        )
            .split(",")
            .map(
                item =>
                    item
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


    normalizeText(
        value,
        maxLength = 1000
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


    /* =====================================================
       BRAIN AWARENESS
    ===================================================== */

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

   /* =====================================================
   NOTIFICATION BRIDGE
===================================================== */

notify(
    eventName,
    payload = {}
){

    try{

        const notifications =
            (
                typeof window !==
                    "undefined"
            )
                ? window.NotificationCenter ||
                  null
                : null;


        if(
            !notifications ||
            typeof notifications.handleRuntimeEvent !==
                "function"
        ){

            return false;

        }


        return notifications
            .handleRuntimeEvent(
                eventName,
                payload
            );

    } catch(error){

        console.warn(
            "Bildirim oluşturulamadı:",
            error
        );

        return false;

    }

},


    /* =====================================================
       EVOLUTION RECORD BRIDGE
    ===================================================== */

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


        if(!engine){

            return false;

        }


        this.resetEditorState();


        let result =
            false;


        try{

            if(
                typeof engine.openHome ===
                    "function"
            ){

                result =
                    engine.openHome();

            }

            else if(
                typeof engine.setView ===
                    "function"
            ){

                result =
                    engine.setView(
                        "home",
                        {
                            entity:
                                null,

                            world:
                                null,

                            page:
                                null,

                            entityCreateMode:
                                false,

                            entityType:
                                null
                        }
                    );

            }

        } catch(error){

            console.error(
                "Home açılamadı:",
                error
            );


            return false;

        }


        if(
            result !==
                false
        ){

            this.syncAwareness(
                "home"
            );

        }


        return result;

    },


    openIdentity(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.setView !==
                "function"
        ){

            return false;

        }


        this.resetEditorState();


        const entity =
            engine.rootEntity ||
            engine.currentEntity ||
            null;


        if(!entity){

            return false;

        }


        engine.currentOpenedEntity =
            entity;


        engine.currentEntityPage =
            "identity";


        let result =
            false;


        try{

            result =
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

        } catch(error){

            console.error(
                "Identity açılamadı:",
                error
            );


            return false;

        }


        if(
            result !==
                false
        ){

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


        if(
            !engine ||
            typeof engine.setView !==
                "function"
        ){

            return false;

        }


        this.resetEditorState();


        const entity =
            engine.rootEntity ||
            engine.currentEntity ||
            null;


        if(!entity){

            return false;

        }


        engine.currentOpenedEntity =
            entity;


        engine.currentEntityPage =
            "profile";


        let result =
            false;


        try{

            result =
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

        } catch(error){

            console.error(
                "Profile açılamadı:",
                error
            );


            return false;

        }


        if(
            result !==
                false
        ){

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


        if(
            !engine ||
            typeof engine.setView !==
                "function"
        ){

            return false;

        }


        this.resetEditorState();


        let result =
            false;


        try{

            result =
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

        } catch(error){

            console.error(
                "Create açılamadı:",
                error
            );


            return false;

        }


        if(
            result !==
                false
        ){

            this.syncAwareness(
                "create"
            );

        }


        return result;

    },


    openWorlds(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.setView !==
                "function"
        ){

            return false;

        }


        this.resetEditorState();


        let result =
            false;


        try{

            result =
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

        } catch(error){

            console.error(
                "Worlds açılamadı:",
                error
            );


            return false;

        }


        if(
            result !==
                false
        ){

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


        const engine =
            this.getEngine();


        if(!engine){

            return false;

        }


        let worlds =
            [];


        try{

            if(
                worldService &&
                typeof worldService.all ===
                    "function"
            ){

                const result =
                    worldService.all();


                worlds =
                    Array.isArray(
                        result
                    )
                        ? result
                        : [];

            }

        } catch(error){

            worlds =
                [];

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
            worlds.find(
                world =>
                    world?.archived !==
                        true
            ) ||
            null;


        if(!targetWorld){

            return this.openWorlds();

        }


        return this.openWorld(
            targetWorld.id
        );

    },


    /* =====================================================
       WORLD OPEN
    ===================================================== */

    openWorld(worldId){

        const id =
            this.normalizeText(
                worldId,
                160
            );


        if(!id){

            return false;

        }


        const worldService =
            this.getService(
                "world"
            );


        const engine =
            this.getEngine();


        if(
            !worldService ||
            !engine ||
            typeof engine.setView !==
                "function"
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
                        id
                    );

            }


            if(
                !world &&
                typeof worldService.all ===
                    "function"
            ){

                const worlds =
                    worldService.all({
                        includeArchived:
                            true
                    });


                if(
                    Array.isArray(
                        worlds
                    )
                ){

                    world =
                        worlds.find(
                            item =>
                                String(
                                    item?.id ||
                                    ""
                                ) ===
                                    id
                        ) ||
                        null;

                }

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
                id
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


        engine.currentWorld =
            world;


        engine.currentOpenedEntity =
            null;


        engine.currentEntityPage =
            null;


        let result =
            false;


        try{

            result =
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

        } catch(error){

            console.error(
                "World görünümü açılamadı:",
                error
            );


            return false;

        }


        if(
            result !==
                false
        ){

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


        if(!engine){

            return false;

        }


        const world =
            engine.currentWorld ||
            null;


        if(!world){

            return this.openWorlds();

        }


        this.resetEditorState();


        engine.currentOpenedEntity =
            null;


        engine.currentEntityPage =
            null;


        if(
            typeof engine.setView !==
                "function"
        ){

            return false;

        }


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


        if(
            result !==
                false
        ){

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
            this.normalizeText(
                nameInput?.value,
                120
            );


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

            console.warn(
                "World create API bulunamadı."
            );


            return false;

        }


        const tags =
            this.parseTags(
                tagsInput?.value
            );


        const description =
            this.normalizeText(
                descriptionInput?.value,
                1000
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

                    description,

                    tags,

                    type:
                        "custom-world",

                    owner:
                        engine.rootEntity
                            ?.id ||
                        engine.currentEntity
                            ?.id ||
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

       this.notify(
    "world:created",
    {
        worldId:
            world.id,

        name:
            world.name ||
            name
    }
);


        this.resetEditorState();


        engine.currentWorld =
            world;


        let result =
            false;


        try{

            result =
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

        } catch(error){

            console.error(
                "Yeni World açılamadı:",
                error
            );


            return false;

        }


        if(
            result !==
                false
        ){

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
                true ||
            typeof engine.setView !==
                "function"
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


    /* =====================================================
       WORLD EDITOR COMPATIBILITY API
    ===================================================== */

    openWorldEdit(){

        return this.openWorldEditor();

    },


    startWorldEdit(){

        return this.openWorldEditor();

    },


    archiveCurrentWorld(){

        return this.archiveWorld();

    },


    cancelWorldEditor(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.setView !==
                "function"
        ){

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
            this.normalizeText(
                nameInput?.value,
                120
            );


        if(!name){

            nameInput?.focus();


            return false;

        }


        const status =
            [
                "active",
                "inactive",
                "paused"
            ].includes(
                String(
                    statusInput?.value ||
                    ""
                )
            )
                ? String(
                    statusInput.value
                )
                : (
                    world.status ||
                    "active"
                );


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
                            this.normalizeText(
                                descriptionInput
                                    ?.value,
                                1000
                            ),

                        tags:
                            this.parseTags(
                                tagsInput?.value
                            ),

                        status
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
            !engine ||
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


        engine.currentOpenedEntity =
            null;


        engine.currentEntityPage =
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


        if(
            typeof engine.setView !==
                "function"
        ){

            return false;

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


        const entityType =
            this.normalizeText(
                type,
                80
            );


        if(
            !engine ||
            !entityType ||
            typeof engine.setView !==
                "function"
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

                entityType
            }
        );

    },


    clearEntityType(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.setView !==
                "function"
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
                    null
            }
        );

    },


    cancelEntityCreate(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.setView !==
                "function"
        ){

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
            this.normalizeText(
                nameInput?.value,
                120
            );


        const type =
            this.normalizeText(
                engine.entityType,
                80
            );


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
                        this.normalizeText(
                            descriptionInput
                                ?.value,
                            1000
                        ),

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
                    "function" &&
                !entity.identity
            ){

                entity.identity =
                    identityService.create(
                        entity
                    );

            }


            if(
                profileService &&
                typeof profileService.create ===
                    "function" &&
                !entity.profile
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

            }

            else {

                if(
                    !Array.isArray(
                        world.entities
                    )
                ){

                    world.entities =
                        [];

                }


                const alreadyExists =
                    world.entities.some(
                        item =>
                            item?.id ===
                                entity.id
                    );


                if(!alreadyExists){

                    world.entities.push(
                        entity
                    );

                }


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

       this.notify(
    "entity:created",
    {
        entityId:
            entity.id,

        worldId:
            world.id,

        name:
            entity.name ||
            name
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


        let result =
            false;


        try{

            result =
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

        } catch(error){

            console.error(
                "Yeni Entity açılamadı:",
                error
            );


            return false;

        }


        if(
            result !==
                false
        ){

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
       ENTITY OPEN
    ===================================================== */

    openEntity(entityId){

        const id =
            this.normalizeText(
                entityId,
                160
            );


        if(!id){

            return false;

        }


        const engine =
            this.getEngine();


        if(!engine){

            return false;

        }


        let world =
            engine.currentWorld ||
            null;


        const worldService =
            this.getService(
                "world"
            );


        /*
         * Önce aktif World içinde ara.
         */

        let savedEntity =
            Array.isArray(
                world?.entities
            )
                ? world.entities.find(
                    item =>
                        String(
                            item?.id ||
                            ""
                        ) ===
                            id &&
                        item?.archived !==
                            true
                ) ||
                null
                : null;


        /*
         * Aktif World içinde bulunamadıysa diğer World'lerde
         * arama yap. Böylece Bridge gibi başka bağlamlardan
         * gelen Entity navigasyonu sessizce boşa düşmez.
         */

        if(
            !savedEntity &&
            worldService &&
            typeof worldService.all ===
                "function"
        ){

            try{

                const worlds =
                    worldService.all({
                        includeArchived:
                            false
                    });


                if(
                    Array.isArray(
                        worlds
                    )
                ){

                    const targetWorld =
                        worlds.find(
                            candidate =>
                                candidate
                                    ?.archived !==
                                    true &&
                                Array.isArray(
                                    candidate.entities
                                ) &&
                                candidate.entities.some(
                                    item =>
                                        String(
                                            item?.id ||
                                            ""
                                        ) ===
                                            id &&
                                        item?.archived !==
                                            true
                                )
                        );


                    if(targetWorld){

                        world =
                            targetWorld;


                        savedEntity =
                            targetWorld.entities.find(
                                item =>
                                    String(
                                        item?.id ||
                                        ""
                                    ) ===
                                        id &&
                                    item?.archived !==
                                        true
                            ) ||
                            null;

                    }

                }

            } catch(error){

                /* active world result remains authority */

            }

        }


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
                    ) ||
                    savedEntity;

            }

        } catch(error){

            entity =
                savedEntity;

        }


        engine.currentWorld =
            world;


        engine.currentOpenedEntity =
            entity;


        engine.currentEntityPage =
            null;


        engine.entityEditMode =
            false;


        engine.worldEditMode =
            false;


        if(
            typeof engine.setView !==
                "function"
        ){

            return false;

        }


        let result =
            false;


        try{

            result =
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

        } catch(error){

            console.error(
                "Entity açılamadı:",
                error
            );


            return false;

        }


        if(
            result !==
                false
        ){

            this.syncAwareness(
                "entity",
                {
                    entityId:
                        entity.id ||
                        null,

                    worldId:
                        world?.id ||
                        null
                }
            );

        }


        return result;

    },


    /* =====================================================
       ENTITY EDITOR
    ===================================================== */

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
                true ||
            typeof engine.setView !==
                "function"
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


    /* =====================================================
       ENTITY EDITOR COMPATIBILITY API
    ===================================================== */

    openEntityEdit(){

        return this.openEntityEditor();

    },


    startEntityEdit(){

        return this.openEntityEditor();

    },


    archiveCurrentEntity(){

        return this.archiveEntity();

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
            !entity ||
            typeof engine.setView !==
                "function"
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
            this.normalizeText(
                nameInput?.value,
                120
            );


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


        const requestedStatus =
            String(
                statusInput?.value ||
                ""
            );


        const status =
            [
                "active",
                "inactive",
                "paused"
            ].includes(
                requestedStatus
            )
                ? requestedStatus
                : (
                    entity.status ||
                    "active"
                );


        let updated =
            null;


        try{

            updated =
                entityManager.update(
                    entity.id,
                    {
                        name,

                        description:
                            this.normalizeText(
                                descriptionInput
                                    ?.value,
                                1000
                            ),

                        tags:
                            this.parseTags(
                                tagsInput?.value
                            ),

                        status
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


            if(
                index >=
                    0
            ){

                world.entities[
                    index
                ] =
                    updated;

            }


            try{

                worldService?.save?.();

            } catch(error){

                console.warn(
                    "World Entity snapshot kaydedilemedi:",
                    error
                );

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


        if(
            typeof engine.setView !==
                "function"
        ){

            return false;

        }


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
            !engine ||
            !entity ||
            entity.id ===
                engine.rootEntity?.id
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


            if(
                index >=
                    0
            ){

                if(
                    archived &&
                    typeof archived ===
                        "object"
                ){

                    world.entities[
                        index
                    ] =
                        archived;

                }

                else {

                    world.entities[
                        index
                    ] = {
                        ...entity,

                        archived:
                            true,

                        archivedAt:
                            Date.now()
                    };

                }

            }


            try{

                worldService?.save?.();

            } catch(error){

                console.warn(
                    "Arşivlenen Entity World snapshot'a yazılamadı:",
                    error
                );

            }

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

    getAllowedEntityPages(){

        return [
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

    },


    openEntityPage(page){

        const targetPage =
            String(
                page ||
                ""
            )
                .trim()
                .toLowerCase();


        if(
            !this
                .getAllowedEntityPages()
                .includes(
                    targetPage
                )
        ){

            return false;

        }


        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.setView !==
                "function"
        ){

            return false;

        }


        const entity =
            engine.currentOpenedEntity ||
            engine.rootEntity ||
            engine.currentEntity ||
            null;


        if(!entity){

            return false;

        }


        engine.currentOpenedEntity =
            entity;


        engine.currentEntityPage =
            targetPage;


        engine.entityEditMode =
            false;


        engine.worldEditMode =
            false;


        engine.entityCreateMode =
            false;


        engine.entityType =
            null;


        let view =
            "entity";


        if(
            entity.id ===
                engine.rootEntity?.id &&
            targetPage ===
                "identity"
        ){

            view =
                "identity";

        }


        if(
            entity.id ===
                engine.rootEntity?.id &&
            targetPage ===
                "profile"
        ){

            view =
                "profile";

        }


        let opened =
            false;


        try{

            opened =
                engine.setView(
                    view,
                    {
                        world:
                            engine.currentWorld ||
                            null,

                        entity,

                        page:
                            targetPage,

                        entityCreateMode:
                            false,

                        entityType:
                            null
                    }
                );

        } catch(error){

            console.error(
                `${targetPage} sayfası açılamadı:`,
                error
            );


            return false;

        }


        if(
            opened !==
                false
        ){

            this.syncAwareness(
                targetPage,
                {
                    entityId:
                        entity.id ||
                        null,

                    worldId:
                        engine.currentWorld
                            ?.id ||
                        null
                }
            );


            if(
                typeof this.trackBrainSession ===
                    "function"
            ){

                this.trackBrainSession(
                    targetPage
                );

            }

        }


        return opened;

    },

   openEntityDashboard(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.setView !==
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

            return this.openIdentity();

        }


        engine.currentOpenedEntity =
            entity;


        engine.currentEntityPage =
            null;


        engine.entityEditMode =
            false;


        engine.worldEditMode =
            false;


        engine.entityCreateMode =
            false;


        engine.entityType =
            null;


        let result =
            false;


        try{

            result =
                engine.setView(
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

        } catch(error){

            console.error(
                "Entity dashboard açılamadı:",
                error
            );


            return false;

        }


        if(
            result !==
                false
        ){

            this.syncAwareness(
                "entity",
                {
                    entityId:
                        entity.id ||
                        null,

                    worldId:
                        engine.currentWorld
                            ?.id ||
                        null
                }
            );

        }


        return result;

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
            this.normalizeText(
                nameInput?.value,
                120
            );


        if(!name){

            nameInput?.focus();


            return false;

        }


        const description =
            this.normalizeText(
                descriptionInput?.value,
                1200
            );


        const engine =
            this.getEngine();


        const entity =
            engine?.currentOpenedEntity ||
            engine?.rootEntity ||
            engine?.currentEntity ||
            null;


        if(
            !engine ||
            !entity
        ){

            return false;

        }


        const isRoot =
            entity.id ===
                engine.rootEntity?.id;


        let success =
            false;


        try{

            /*
             * Root Profile ile Entity Identity birbirine
             * karıştırılmaz.
             *
             * Root profil görünüm adı ve açıklaması,
             * mevcut kullanıcı-profile compatibility
             * storage alanında tutulmaya devam eder.
             */

            if(isRoot){

                const currentProfile =
                    entity.profile &&
                    typeof entity.profile ===
                        "object"
                        ? entity.profile
                        : {};


                const userProfile = {

                    name,

                    description,

                    updatedAt:
                        Date.now()

                };


                try{

                    localStorage.setItem(
                        "vaero:user:profile:v1",
                        JSON.stringify(
                            userProfile
                        )
                    );

                } catch(error){

                    console.warn(
                        "Root Profile compatibility kaydı yazılamadı:",
                        error
                    );

                }


                if(
                    entity.profile &&
                    typeof entity.profile ===
                        "object"
                ){

                    entity.profile.name =
                        name;


                    entity.profile.description =
                        description;


                    entity.profile.updatedAt =
                        Date.now();

                }


                const profileService =
                    this.getService(
                        "profile"
                    );


                if(
                    profileService &&
                    typeof profileService.update ===
                        "function" &&
                    entity.profile
                ){

                    const updatedProfile =
                        profileService.update(
                            entity.profile,
                            {
                                name,

                                description,

                                metadata:{
                                    ...(
                                        currentProfile
                                            .metadata ||
                                        {}
                                    )
                                }
                            }
                        );


                    if(
                        updatedProfile &&
                        typeof updatedProfile ===
                            "object"
                    ){

                        entity.profile =
                            updatedProfile;

                    }

                }


                success =
                    true;

            }

            else {

                /*
                 * Non-root Entity profil ekranında,
                 * Entity'nin canonical adı ve açıklaması
                 * değiştirilmez.
                 *
                 * Profile presentation katmanı kendi
                 * profile kaydını günceller.
                 */

                const profileService =
                    this.getService(
                        "profile"
                    );


                if(
                    !profileService ||
                    typeof profileService.update !==
                        "function"
                ){

                    console.warn(
                        "Profile update API bulunamadı."
                    );


                    return false;

                }


                if(!entity.profile){

                    if(
                        typeof profileService.create ===
                            "function"
                    ){

                        entity.profile =
                            profileService.create(
                                entity
                            );

                    }

                }


                if(!entity.profile){

                    return false;

                }


                const updatedProfile =
                    profileService.update(
                        entity.profile,
                        {
                            name,

                            description
                        }
                    );


                if(
                    updatedProfile &&
                    typeof updatedProfile ===
                        "object"
                ){

                    entity.profile =
                        updatedProfile;

                }


                try{

                    this.getService(
                        "world"
                    )?.save?.();

                } catch(error){

                    console.warn(
                        "Profile World snapshot kaydedilemedi:",
                        error
                    );

                }


                success =
                    updatedProfile !==
                        false;

            }

        } catch(error){

            console.error(
                "Profil kaydedilemedi:",
                error
            );


            return false;

        }


        if(!success){

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


        this.syncAwareness(
            "profile",
            {
                entityId:
                    entity.id ||
                    null,

                saved:
                    true
            }
        );


        return true;

    },


    /* =====================================================
       DISCOVERY
    ===================================================== */

    restartDiscovery(){

        const discovery =
            window.DiscoveryApp ||
            null;


        const engineRoot =
            document.getElementById(
                "engine"
            );


        if(
            discovery &&
            typeof discovery.restart ===
                "function"
        ){

            try{

                /*
                 * DiscoveryApp restart() kendi canonical
                 * storage anahtarlarını temizleme yetkisine
                 * sahiptir.
                 */

                if(engineRoot){

                    discovery.container =
                        engineRoot;

                }


                discovery.restart();


                if(
                    engineRoot &&
                    typeof discovery.render ===
                        "function"
                ){

                    discovery.render(
                        engineRoot
                    );

                }


                this.syncAwareness(
                    "discovery"
                );


                return true;

            } catch(error){

                console.error(
                    "Discovery yeniden başlatılamadı:",
                    error
                );

            }

        }


        /*
         * Compatibility fallback.
         */

        try{

            [
                "vaero:discovery:completed",
                "vaero:discovery:completedAt",
                "vaero:discovery:answers",
                "vaero:discovery:draft:v2",
                "vaero:discovery:draft:v3",
                "vaero:discovery:result:v2",
                "vaero:discovery:result:v3",
                "vaero:welcome:completed:v2"
            ]
                .forEach(
                    key =>
                        localStorage.removeItem(
                            key
                        )
                );

        } catch(error){

            console.warn(
                "Discovery state temizlenemedi:",
                error
            );

        }


        if(
            engineRoot &&
            discovery &&
            typeof discovery.render ===
                "function"
        ){

            discovery.currentStep =
                0;


            discovery.answers =
                {};


            discovery.isCompleting =
                false;


            discovery.render(
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


        let opened =
            false;


        try{

            opened =
                engine.openSystemPage(
                    "vaero"
                );

        } catch(error){

            console.error(
                "VAERO uygulaması açılamadı:",
                error
            );


            return false;

        }


        if(
            opened !==
                false
        ){

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


        let opened =
            false;


        try{

            opened =
                engine.openSystemPage(
                    "applications"
                );

        } catch(error){

            console.error(
                "Applications açılamadı:",
                error
            );


            return false;

        }


        if(
            opened !==
                false
        ){

            this.syncAwareness(
                "applications"
            );

        }


        return opened;

    },


    /* =====================================================
       VAERO PAYMENT CORE
       -----------------------------------------------------
       Actions ödeme işlemini kendisi gerçekleştirmez.
       Yalnızca VaeroApp tarafından gerçekten sağlanan
       paymentCore contract'ını yönlendirir.
    ===================================================== */

    getVaeroPaymentCore(){

        const app =
            typeof window !==
                "undefined"
                ? window.VaeroApp
                : null;


        if(app){

            if(
                app.paymentCore &&
                typeof app.paymentCore ===
                    "object"
            ){

                return app.paymentCore;

            }


            if(
                typeof app.getPaymentCore ===
                    "function"
            ){

                try{

                    const core =
                        app.getPaymentCore();


                    if(core){

                        return core;

                    }

                } catch(error){

                    console.warn(
                        "VaeroApp Payment Core okunamadı:",
                        error
                    );

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


    getVaeroPaymentIntent(){

        const engine =
            this.getEngine();


        return (
            engine?.currentVaeroPaymentIntent ||
            null
        );

    },


    refreshVaeroPaymentView(){

        const app =
            window.VaeroApp ||
            null;


        if(
            app &&
            typeof app.refresh ===
                "function"
        ){

            try{

                const result =
                    app.refresh();


                if(
                    result !==
                        false
                ){

                    return result;

                }

            } catch(error){

                console.warn(
                    "VAERO ödeme görünümü App üzerinden yenilenemedi:",
                    error
                );

            }

        }


        return this.remount();

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


        const safePayload =
            payload &&
            typeof payload ===
                "object" &&
            !Array.isArray(
                payload
            )
                ? payload
                : {};


        let intent =
            null;


        try{

            intent =
                core.createIntent(
                    safePayload
                );

        } catch(error){

            console.error(
                "Payment intent oluşturulamadı:",
                error
            );


            return false;

        }


        if(
            !intent ||
            typeof intent !==
                "object"
        ){

            return false;

        }


        const engine =
            this.getEngine();


        if(engine){

            engine.currentVaeroPaymentIntent =
                intent;

        }


        this.refreshVaeroPaymentView();


        return intent;

    },


    selectVaeroPaymentMethod(method){

        const selectedMethod =
            this.normalizeText(
                method,
                80
            );


        if(!selectedMethod){

            return false;

        }


        const core =
            this.getVaeroPaymentCore();


        const engine =
            this.getEngine();


        const intent =
            engine?.currentVaeroPaymentIntent ||
            null;


        if(
            !core ||
            !engine ||
            !intent?.id
        ){

            return false;

        }


        let result =
            false;


        try{

            /*
             * Exact core contract hangisiyse onu kullanır.
             * Olmayan bir payment API üretmez.
             */

            if(
                typeof core.setMethod ===
                    "function"
            ){

                result =
                    core.setMethod(
                        intent.id,
                        selectedMethod
                    );

            }

            else if(
                typeof core.selectMethod ===
                    "function"
            ){

                result =
                    core.selectMethod(
                        intent.id,
                        selectedMethod
                    );

            }

            else {

                console.warn(
                    "Payment method seçim API'si bulunamadı."
                );


                return false;

            }

        } catch(error){

            console.error(
                "Payment method seçilemedi:",
                error
            );


            return false;

        }


        if(
            result &&
            typeof result ===
                "object"
        ){

            engine.currentVaeroPaymentIntent =
                result;

        }

        else if(
            result !==
                false
        ){

            engine.currentVaeroPaymentIntent = {
                ...intent,

                method:
                    selectedMethod
            };

        }


        if(
            result !==
                false
        ){

            this.refreshVaeroPaymentView();

        }


        return result !==
            false;

    },


    selectVaeroPaymentProvider(provider){

        const selectedProvider =
            this.normalizeText(
                provider,
                100
            );


        if(!selectedProvider){

            return false;

        }


        const core =
            this.getVaeroPaymentCore();


        const engine =
            this.getEngine();


        const intent =
            engine?.currentVaeroPaymentIntent ||
            null;


        if(
            !core ||
            !engine ||
            !intent?.id
        ){

            return false;

        }


        let result =
            false;


        try{

            if(
                typeof core.setProvider ===
                    "function"
            ){

                result =
                    core.setProvider(
                        intent.id,
                        selectedProvider
                    );

            }

            else if(
                typeof core.selectProvider ===
                    "function"
            ){

                result =
                    core.selectProvider(
                        intent.id,
                        selectedProvider
                    );

            }

            else {

                console.warn(
                    "Payment provider seçim API'si bulunamadı."
                );


                return false;

            }

        } catch(error){

            console.error(
                "Payment provider seçilemedi:",
                error
            );


            return false;

        }


        if(
            result &&
            typeof result ===
                "object"
        ){

            engine.currentVaeroPaymentIntent =
                result;

        }

        else if(
            result !==
                false
        ){

            engine.currentVaeroPaymentIntent = {
                ...intent,

                provider:
                    selectedProvider
            };

        }


        if(
            result !==
                false
        ){

            this.refreshVaeroPaymentView();

        }


        return result !==
            false;

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
            !engine ||
            !intent?.id
        ){

            return false;

        }


        let result =
            false;


        try{

            if(
                typeof core.start ===
                    "function"
            ){

                result =
                    core.start(
                        intent.id
                    );

            }

            else if(
                typeof core.startIntent ===
                    "function"
            ){

                result =
                    core.startIntent(
                        intent.id
                    );

            }

            else {

                console.warn(
                    "Payment start API bulunamadı."
                );


                return false;

            }

        } catch(error){

            console.error(
                "Payment başlatılamadı:",
                error
            );


            return false;

        }


        if(
            result &&
            typeof result ===
                "object" &&
            typeof result.then !==
                "function"
        ){

            engine.currentVaeroPaymentIntent =
                result;

        }


        if(
            result !==
                false
        ){

            this.refreshVaeroPaymentView();

        }


        return result !==
            false;

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
            !intent?.id
        ){

            return false;

        }


        let result =
            false;


        try{

            if(
                typeof core.cancel ===
                    "function"
            ){

                result =
                    core.cancel(
                        intent.id
                    );

            }

            else if(
                typeof core.cancelIntent ===
                    "function"
            ){

                result =
                    core.cancelIntent(
                        intent.id
                    );

            }

            else {

                console.warn(
                    "Payment cancel API bulunamadı."
                );


                return false;

            }

        } catch(error){

            console.error(
                "Payment iptal edilemedi:",
                error
            );


            return false;

        }


        if(
            result &&
            typeof result ===
                "object" &&
            engine
        ){

            engine.currentVaeroPaymentIntent =
                result;

        }


        if(
            result !==
                false
        ){

            this.refreshVaeroPaymentView();

        }


        return result !==
            false;

    },


    refundVaeroPayment(
        transactionId
    ){

        const id =
            this.normalizeText(
                transactionId,
                180
            );


        if(!id){

            return false;

        }


        const core =
            this.getVaeroPaymentCore();


        if(
            !core ||
            typeof core.refund !==
                "function"
        ){

            console.warn(
                "Payment refund API bulunamadı."
            );


            return false;

        }


        try{

            return core.refund(
                id
            );

        } catch(error){

            console.error(
                "Refund işlemi başlatılamadı:",
                error
            );


            return false;

        }

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

        const value =
            Number(
                timestamp
            );


        const date =
            new Date(
                Number.isFinite(
                    value
                )
                    ? value
                    : Date.now()
            );


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() +
                1
            )
                .padStart(
                    2,
                    "0"
                );


        const day =
            String(
                date.getDate()
            )
                .padStart(
                    2,
                    "0"
                );


        return `${year}-${month}-${day}`;

    },


    normalizeBrainAction(
        action,
        fallbackTimestamp = Date.now()
    ){

        if(
            typeof action ===
                "string"
        ){

            const content =
                action.trim();


            if(!content){

                return null;

            }


            return {
                id:
                    this.createId(
                        "brain-action"
                    ),

                role:
                    "user",

                type:
                    "message",

                content,

                createdAt:
                    fallbackTimestamp,

                context:
                    null,

                appLinks:
                    []
            };

        }


        if(
            !action ||
            typeof action !==
                "object" ||
            Array.isArray(
                action
            )
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


        const allowedRoles =
            [
                "user",
                "brain",
                "assistant",
                "system"
            ];


        let role =
            String(
                action.role ||
                "brain"
            )
                .trim()
                .toLowerCase();


        if(
            role ===
                "assistant"
        ){

            role =
                "brain";

        }


        if(
            !allowedRoles.includes(
                role
            )
        ){

            role =
                "brain";

        }


        const createdAt =
            Number(
                action.createdAt
            );


        return {
            ...action,

            id:
                action.id ||
                this.createId(
                    "brain-action"
                ),

            role,

            type:
                String(
                    action.type ||
                    "message"
                ),

            content,

            createdAt:
                Number.isFinite(
                    createdAt
                )
                    ? createdAt
                    : fallbackTimestamp,

            context:
                action.context &&
                typeof action.context ===
                    "object" &&
                !Array.isArray(
                    action.context
                )
                    ? {
                        ...action.context
                    }
                    : null,

            appLinks:
                Array.isArray(
                    action.appLinks
                )
                    ? action.appLinks
                        .filter(
                            link =>
                                link &&
                                typeof link ===
                                    "object"
                        )
                        .map(
                            link => ({
                                ...link
                            })
                        )
                    : []
        };

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
                        "object" &&
                    !Array.isArray(
                        session
                    )
            )
            .map(
                session => {

                    const startedCandidate =
                        Number(
                            session.startedAt
                        );


                    const updatedCandidate =
                        Number(
                            session.updatedAt
                        );


                    const startedAt =
                        Number.isFinite(
                            startedCandidate
                        )
                            ? startedCandidate
                            : (
                                Number.isFinite(
                                    updatedCandidate
                                )
                                    ? updatedCandidate
                                    : Date.now()
                            );


                    const updatedAt =
                        Number.isFinite(
                            updatedCandidate
                        )
                            ? updatedCandidate
                            : startedAt;


                    const actions =
                        Array.isArray(
                            session.actions
                        )
                            ? session.actions
                                .map(
                                    action =>
                                        this.normalizeBrainAction(
                                            action,
                                            updatedAt
                                        )
                                )
                                .filter(
                                    Boolean
                                )
                            : [];


                    let status =
                        String(
                            session.status ||
                            "progress"
                        )
                            .trim()
                            .toLowerCase();


                    if(
                        status ===
                            "closed"
                    ){

                        status =
                            "done";

                    }


                    if(
                        ![
                            "progress",
                            "done",
                            "error"
                        ].includes(
                            status
                        )
                    ){

                        status =
                            "progress";

                    }


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
                            )
                                .trim()
                                .slice(
                                    0,
                                    140
                                ) ||
                            "Brain Sohbeti · Bugün",

                        kind:
                            "conversation",

                        target:
                            null,

                        status,

                        startedAt,

                        updatedAt,

                        actions,

                        favorite:
                            Boolean(
                                session.favorite
                            ),

                        summary:
                            session.summary
                                ? String(
                                    session.summary
                                )
                                    .trim()
                                    .slice(
                                        0,
                                        200
                                    )
                                : null,

                        topic:
                            String(
                                session.topic ||
                                "daily-brain"
                            )
                                .trim() ||
                            "daily-brain",

                        dayKey:
                            String(
                                session.dayKey ||
                                this.getBrainDayKey(
                                    startedAt
                                )
                            ),

                        pendingConfirmation:
                            session
                                .pendingConfirmation &&
                            typeof session
                                .pendingConfirmation ===
                                "object" &&
                            !Array.isArray(
                                session
                                    .pendingConfirmation
                            )
                                ? {
                                    ...session
                                        .pendingConfirmation
                                }
                                : null
                    };

                }
            )
            .sort(
                (
                    a,
                    b
                ) =>
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

            console.warn(
                "Brain storage okunamadı:",
                error
            );


            return false;

        }


        if(!saved){

            brain.sessions =
                [];


            brain.resumePoint =
                null;


            return true;

        }


        try{

            const parsed =
                JSON.parse(
                    saved
                );


            if(
                !parsed ||
                typeof parsed !==
                    "object" ||
                Array.isArray(
                    parsed
                )
            ){

                brain.sessions =
                    [];


                brain.resumePoint =
                    null;


                return false;

            }


            brain.sessions =
                this.normalizeBrainSessions(
                    parsed.sessions
                );


            brain.resumePoint =
                parsed.resumePoint &&
                typeof parsed.resumePoint ===
                    "object" &&
                !Array.isArray(
                    parsed.resumePoint
                )
                    ? {
                        ...parsed.resumePoint
                    }
                    : null;


            return true;

        } catch(error){

            console.error(
                "Brain geçmişi okunamadı:",
                error
            );


            brain.sessions =
                [];


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


        const sessions =
            this.normalizeBrainSessions(
                brain.sessions
            );


        brain.sessions =
            sessions;


        try{

            localStorage.setItem(
                this.getBrainStorageKey(),
                JSON.stringify({
                    sessions,

                    resumePoint:
                        brain.resumePoint &&
                        typeof brain.resumePoint ===
                            "object"
                            ? brain.resumePoint
                            : null,

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


    getTodayBrainConversationSession(
        brain
    ){

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
                    session?.kind ===
                        "conversation" &&
                    session?.dayKey ===
                        todayKey &&
                    session?.status !==
                        "error"
            ) ||
            null
        );

    },


    createTodayBrainConversation(
        brain
    ){

        if(!brain){

            return null;

        }


        if(
            !Array.isArray(
                brain.sessions
            )
        ){

            brain.sessions =
                [];

        }


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
                ),

            pendingConfirmation:
                null

        };


        brain.sessions.unshift(
            session
        );


        return session;

    },


    trackBrainSession(page){

        const targetPage =
            String(
                page ||
                ""
            )
                .trim()
                .toLowerCase();


        const brain =
            this.getService(
                "brain"
            );


        if(
            !brain ||
            !targetPage
        ){

            return false;

        }


        if(
            !Array.isArray(
                brain.sessions
            )
        ){

            brain.sessions =
                [];

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
            labels[
                targetPage
            ];


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


        if(!session){

            return false;

        }


        /*
         * Aynı navigation olayı art arda birkaç milisaniye
         * içinde iki ayrı router tarafından yazılırsa
         * Brain geçmişini şişirme.
         */

        const lastAction =
            Array.isArray(
                session.actions
            )
                ? session.actions[
                    session.actions.length -
                    1
                ]
                : null;


        const now =
            Date.now();


        if(
            lastAction?.type ===
                "navigation" &&
            lastAction?.target ===
                targetPage &&
            (
                now -
                Number(
                    lastAction.createdAt ||
                    0
                )
            ) <
                500
        ){

            return true;

        }


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
                targetPage,

            context:{
                page:
                    targetPage
            },

            appLinks:
                []
        });


        session.updatedAt =
            now;


        this.saveBrainState();


        if(
            typeof this.renderBrainHistory ===
                "function"
        ){

            this.renderBrainHistory();

        }


        return true;

    },


    /* =====================================================
       BRAIN PANEL ACCESS
    ===================================================== */

    getBrainGateway(){

        return (
            this.getService(
                "brainService"
            ) ||
            window.BrainService ||
            null
        );

    },


    getActiveBrainSession(){

        const brain =
            this.getService(
                "brain"
            );


        if(!brain){

            return null;

        }


        if(
            !Array.isArray(
                brain.sessions
            )
        ){

            brain.sessions =
                [];

        }


        return (
            this.getTodayBrainConversationSession(
                brain
            ) ||
            this.createTodayBrainConversation(
                brain
            )
        );

    },


    getBrainPendingConfirmation(){

        const session =
            this.getActiveBrainSession();


        return (
            session?.pendingConfirmation ||
            null
        );

    },


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


            let markup =
                "";


            try{

                markup =
                    window.BrainApp.render();

            } catch(error){

                console.error(
                    "Brain paneli render edilemedi:",
                    error
                );


                return false;

            }


            if(
                typeof markup ===
                    "string" &&
                markup.trim()
            ){

                document.body.insertAdjacentHTML(
                    "beforeend",
                    markup
                );

            }


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


        try{

            window.BrainApp
                ?.onOpen?.();

        } catch(error){

            /* compatibility */

        }


        try{

            window.BrainApp
                ?.refresh?.();

        } catch(error){

            console.warn(
                "Brain paneli yenilenemedi:",
                error
            );

        }


        const pending =
            this.getBrainPendingConfirmation();


        try{

            window.BrainApp
                ?.refreshConfirmation?.(
                    pending
                );

        } catch(error){

            /* non-fatal */

        }


        const input =
            document.getElementById(
                "brainInput"
            );


        input?.addEventListener(
            "focus",
            () => {

                const currentPanel =
                    document.getElementById(
                        "brainPanel"
                    );


                if(!currentPanel){

                    return;

                }


                currentPanel.classList.remove(
                    "is-compact"
                );


                currentPanel.classList.add(
                    "is-expanded"
                );

            },
            {
                once:
                    true
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


                if(!currentPanel){

                    return;

                }


                if(
                    currentPanel.contains(
                        event.target
                    )
                ){

                    return;

                }


                if(
                    event.target.closest?.(
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
                    "panel",

                screen:
                    this.getEngine()
                        ?.currentView ||
                    "home",

                page:
                    this.getEngine()
                        ?.currentEntityPage ||
                    null
            }
        );


        if(
            typeof this.renderBrainHistory ===
                "function"
        ){

            this.renderBrainHistory();

        }


        requestAnimationFrame(
            () => {

                window.BrainApp
                    ?.focusInput?.();

            }
        );


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
       BRAIN CONFIRMATION
    ===================================================== */

    async confirmBrainAction(
        confirmationId
    ){

        if(
            this.brainSending
        ){

            return false;

        }


        const id =
            this.normalizeText(
                confirmationId,
                180
            );


        if(!id){

            return false;

        }


        const gateway =
            this.getBrainGateway();


        const session =
            this.getActiveBrainSession();


        const pending =
            session?.pendingConfirmation ||
            null;


        if(
            !gateway ||
            typeof gateway.confirm !==
                "function" ||
            !session ||
            !pending ||
            String(
                pending.id ||
                ""
            ) !==
                id
        ){

            return false;

        }


        this.brainSending =
            true;


        try{

            window.BrainApp
                ?.setBusy?.(
                    true,
                    "Onaylanan işlem uygulanıyor..."
                );

        } catch(error){

            /* non-fatal */

        }


        let result =
            null;


        try{

            result =
                await Promise.resolve(
                    gateway.confirm(
                        id,
                        pending.prompt ||
                        "",
                        {
                            context:
                                pending.context &&
                                typeof pending.context ===
                                    "object"
                                    ? {
                                        ...pending.context
                                    }
                                    : {}
                        }
                    )
                );

        } catch(error){

            console.error(
                "Brain confirmation uygulanamadı:",
                error
            );


            result = {
                executed:
                    false,

                error:
                    true,

                message:
                    "Onaylanan işlem uygulanamadı."
            };

        } finally {

            this.brainSending =
                false;


            try{

                window.BrainApp
                    ?.setBusy?.(
                        false
                    );

            } catch(error){

                /* non-fatal */

            }

        }


        const reply =
            result?.actionResult
                ?.message ||
            result?.reply ||
            result?.message ||
            (
                result?.executed
                    ? "İşlem tamamlandı."
                    : "İşlem uygulanamadı."
            );


        if(
            !Array.isArray(
                session.actions
            )
        ){

            session.actions =
                [];

        }


        session.actions.push({
            id:
                this.createId(
                    "brain-action"
                ),

            role:
                "brain",

            type:
                result?.executed
                    ? "action-result"
                    : "action-failed",

            content:
                String(
                    reply ||
                    ""
                ),

            createdAt:
                Date.now(),

            confirmationId:
                id,

            executed:
                Boolean(
                    result?.executed
                ),

            actionType:
                result?.policy
                    ?.actionType ||
                pending.actionType ||
                null,

            context:{
                page:
                    pending.context
                        ?.page ||
                    pending.context
                        ?.screen ||
                    null
            },

            appLinks:
                this.extractBrainAppMentions(
                    reply
                )
        });


        session.pendingConfirmation =
            null;


        session.updatedAt =
            Date.now();


        this.updateBrainConversationSummary(
            session
        );


        this.saveBrainState();


        this.renderBrainHistory();


        try{

            window.BrainApp
                ?.refreshConfirmation?.(
                    null
                );


            window.BrainApp
                ?.refreshStatus?.();


            window.BrainApp
                ?.refreshContext?.();


            window.BrainApp
                ?.focusInput?.();

        } catch(error){

            /* non-fatal */

        }


        return Boolean(
            result?.executed
        );

    },


    cancelBrainConfirmation(
        confirmationId
    ){

        const id =
            this.normalizeText(
                confirmationId,
                180
            );


        if(!id){

            return false;

        }


        const gateway =
            this.getBrainGateway();


        const session =
            this.getActiveBrainSession();


        if(
            !session ||
            String(
                session
                    .pendingConfirmation
                    ?.id ||
                ""
            ) !==
                id
        ){

            return false;

        }


        const pending =
            session.pendingConfirmation;


        let cancelled =
            true;


        if(
            gateway &&
            typeof gateway.cancelConfirmation ===
                "function"
        ){

            try{

                cancelled =
                    gateway.cancelConfirmation(
                        id
                    ) !==
                        false;

            } catch(error){

                console.error(
                    "Brain confirmation iptal edilemedi:",
                    error
                );


                return false;

            }

        }


        if(!cancelled){

            return false;

        }


        if(
            !Array.isArray(
                session.actions
            )
        ){

            session.actions =
                [];

        }


        session.actions.push({
            id:
                this.createId(
                    "brain-action"
                ),

            role:
                "system",

            type:
                "confirmation-cancelled",

            content:
                "İşlem onayı iptal edildi.",

            createdAt:
                Date.now(),

            confirmationId:
                id,

            context:{
                page:
                    pending
                        ?.context
                        ?.page ||
                    null
            },

            appLinks:
                []
        });


        session.pendingConfirmation =
            null;


        session.updatedAt =
            Date.now();


        this.updateBrainConversationSummary(
            session
        );


        this.saveBrainState();


        this.renderBrainHistory();


        try{

            window.BrainApp
                ?.refreshConfirmation?.(
                    null
                );


            window.BrainApp
                ?.refreshStatus?.();


            window.BrainApp
                ?.focusInput?.();

        } catch(error){

            /* non-fatal */

        }


        return true;

    },


    /* =====================================================
       BRAIN APP LINKS
    ===================================================== */

    getBrainAppDefinitions(){

        return [

            {
                id:
                    "applications",

                label:
                    "Applications",

                words:[
                    "applications",
                    "uygulamalar",
                    "uygulama"
                ]
            },


            {
                id:
                    "vaero",

                label:
                    "VAERO",

                words:[
                    "vaero"
                ]
            },


            {
                id:
                    "profile",

                label:
                    "Profil",

                words:[
                    "profil",
                    "profile"
                ]
            },


            {
                id:
                    "identity",

                label:
                    "Kimlik",

                words:[
                    "kimlik",
                    "identity"
                ]
            },


            {
                id:
                    "memory",

                label:
                    "Hafıza",

                words:[
                    "hafıza",
                    "hafiza",
                    "memory"
                ]
            },


            {
                id:
                    "timeline",

                label:
                    "Zaman Çizelgesi",

                words:[
                    "timeline",
                    "zaman çizelgesi",
                    "zaman cizelgesi"
                ]
            },


            {
                id:
                    "bridge",

                label:
                    "Köprü",

                words:[
                    "köprü",
                    "kopru",
                    "bridge"
                ]
            },


            {
                id:
                    "evolution",

                label:
                    "Evrim",

                words:[
                    "evrim",
                    "evolution"
                ]
            },


            {
                id:
                    "organs",

                label:
                    "Organlar",

                words:[
                    "organ",
                    "organlar"
                ]
            },


            {
                id:
                    "settings",

                label:
                    "Ayarlar",

                words:[
                    "ayar",
                    "ayarlar",
                    "settings"
                ]
            },


            {
                id:
                    "discovery",

                label:
                    "Discovery",

                words:[
                    "discovery",
                    "keşif",
                    "kesif"
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


        if(!normalized){

            return [];

        }


        const seen =
            new Set();


        return this
            .getBrainAppDefinitions()
            .filter(
                app => {

                    if(
                        !app ||
                        !app.id ||
                        !Array.isArray(
                            app.words
                        )
                    ){

                        return false;

                    }


                    const matched =
                        app.words.some(
                            word =>
                                normalized.includes(
                                    String(
                                        word ||
                                        ""
                                    )
                                        .toLocaleLowerCase(
                                            "tr-TR"
                                        )
                                )
                        );


                    if(!matched){

                        return false;

                    }


                    if(
                        seen.has(
                            app.id
                        )
                    ){

                        return false;

                    }


                    seen.add(
                        app.id
                    );


                    return true;

                }
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


    openBrainAppLink(app){

        const target =
            String(
                app ||
                ""
            )
                .trim()
                .toLowerCase();


        if(!target){

            return false;

        }


        this.closeBrain();


        if(
            target ===
                "applications"
        ){

            return this.openApplicationsApp();

        }


        if(
            target ===
                "vaero"
        ){

            return this.openVaeroApp();

        }


        if(
            target ===
                "discovery"
        ){

            return this.restartDiscovery();

        }


        if(
            !this
                .getAllowedEntityPages()
                .includes(
                    target
                )
        ){

            return false;

        }


        return this.openEntityPage(
            target
        );

    },


    /* =====================================================
       BRAIN SEND
    ===================================================== */

    async sendBrainMessage(){

        if(
            this.brainSending
        ){

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
            )
                .trim()
                .slice(
                    0,
                    12000
                );


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

            brain.sessions =
                [];

        }


        const gateway =
            this.getBrainGateway();


        const contextService =
            this.getService(
                "brainContext"
            );


        let context =
            null;


        try{

            if(
                contextService &&
                typeof contextService.build ===
                    "function"
            ){

                context =
                    contextService.build({
                        message:
                            text
                    });

            }

        } catch(error){

            console.warn(
                "Brain Context oluşturulamadı:",
                error
            );


            context =
                null;

        }


        const session =
            this.getTodayBrainConversationSession(
                brain
            ) ||
            this.createTodayBrainConversation(
                brain
            );


        if(!session){

            return false;

        }


        if(
            !Array.isArray(
                session.actions
            )
        ){

            session.actions =
                [];

        }


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
                app:
                    context?.app ||
                    null,

                screen:
                    context?.screen ||
                    null,

                page:
                    context?.page ||
                    null,

                entityId:
                    context?.entity
                        ?.id ||
                    context?.entityId ||
                    null,

                worldId:
                    context?.world
                        ?.id ||
                    context?.worldId ||
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


        try{

            window.BrainApp
                ?.setBusy?.(
                    true,
                    "Brain düşünüyor..."
                );

        } catch(error){

            /* non-fatal */

        }


        this.renderBrainHistory();


        let response =
            null;


        try{

            if(
                gateway &&
                typeof gateway.ask ===
                    "function"
            ){

                response =
                    await Promise.resolve(
                        gateway.ask(
                            text,
                            {
                                context:
                                    context ||
                                    {}
                            }
                        )
                    );

            }

            else if(
                typeof brain.ask ===
                    "function"
            ){

                response =
                    await Promise.resolve(
                        brain.ask(
                            text,
                            {
                                context:
                                    context ||
                                    {}
                            }
                        )
                    );

            }

            else if(
                typeof brain.receive ===
                    "function"
            ){

                response =
                    await Promise.resolve(
                        brain.receive(
                            text,
                            context ||
                            {}
                        )
                    );

            }

            else {

                response = {
                    reply:
                        "Brain servis bağlantısı hazır değil.",

                    error:
                        true
                };

            }

        } catch(error){

            console.error(
                "Brain mesajı işlenemedi:",
                error
            );


            response = {
                reply:
                    "Brain isteği şu anda tamamlanamadı.",

                error:
                    true
            };

        } finally {

            this.brainSending =
                false;


            try{

                window.BrainApp
                    ?.setBusy?.(
                        false
                    );

            } catch(error){

                /* non-fatal */

            }

        }


        let replyText =
            "";


        if(
            typeof response ===
                "string"
        ){

            replyText =
                response;

        }

        else if(
            response &&
            typeof response ===
                "object"
        ){

            replyText =
                response.reply ||
                response.message ||
                response.text ||
                "";

        }


        replyText =
            String(
                replyText ||
                ""
            )
                .trim()
                .slice(
                    0,
                    30000
                );


        /*
         * Pending confirmation yalnızca gateway gerçekten
         * confirmation nesnesi döndürdüğünde saklanır.
         */

        if(
            response &&
            typeof response ===
                "object" &&
            response.confirmation &&
            response.confirmation.id
        ){

            session.pendingConfirmation = {
                ...response.confirmation,

                prompt:
                    text,

                context:
                    context &&
                    typeof context ===
                        "object"
                        ? {
                            ...context
                        }
                        : {},

                actionType:
                    response?.policy
                        ?.actionType ||
                    response.confirmation
                        .actionType ||
                    null,

                receivedAt:
                    Date.now()
            };

        }

        else if(
            response?.confirmationApproved ===
                true ||
            response?.executed ===
                true ||
            response?.blocked ===
                true
        ){

            session.pendingConfirmation =
                null;

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
                    response
                        ?.requiresConfirmation &&
                    !response
                        ?.confirmationApproved
                        ? "confirmation-required"
                        : "reply",

                content:
                    replyText,

                createdAt:
                    Date.now(),

                confirmationId:
                    response
                        ?.confirmation
                        ?.id ||
                    null,

                requiresConfirmation:
                    Boolean(
                        response
                            ?.requiresConfirmation
                    ),

                blocked:
                    Boolean(
                        response?.blocked
                    ),

                executed:
                    Boolean(
                        response?.executed
                    ),

                actionType:
                    response
                        ?.policy
                        ?.actionType ||
                    null,

                context:{
                    app:
                        context?.app ||
                        null,

                    screen:
                        context?.screen ||
                        null,

                    page:
                        context?.page ||
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


        try{

            window.BrainApp
                ?.refreshConfirmation?.(
                    session
                        .pendingConfirmation ||
                    null
                );


            window.BrainApp
                ?.refreshContext?.();


            window.BrainApp
                ?.refreshStatus?.();

        } catch(error){

            /* non-fatal */

        }


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


        try{

            window.BrainApp
                ?.focusInput?.();

        } catch(error){

            /* non-fatal */

        }


        return true;

    },


    /* =====================================================
       BRAIN SUMMARY
    ===================================================== */

    updateBrainConversationSummary(
        session
    ){

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
                .filter(
                    Boolean
                )
                .slice(
                    -3
                );


        const summary =
            messages.join(
                " · "
            );


        session.summary =
            summary.length >
                160
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


        /*
         * Kullanıcının ilk mesajlarından kaba bir title
         * üretmek yerine mevcut conversation title
         * authority'sini koruyoruz.
         */

        if(
            !session.title ||
            !String(
                session.title
            ).trim()
        ){

            session.title =
                "Brain Sohbeti · Bugün";

        }


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

            if(
                contextService &&
                typeof contextService.build ===
                    "function"
            ){

                context =
                    contextService.build();

            }

        } catch(error){

            context =
                null;

        }


        const engine =
            this.getEngine();


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
                engine?.currentView ||
                null,

            page:
                context?.page ||
                engine?.currentEntityPage ||
                null,

            worldId:
                context?.world
                    ?.id ||
                context?.worldId ||
                engine?.currentWorld
                    ?.id ||
                null,

            entityId:
                context?.entity
                    ?.id ||
                context?.entityId ||
                engine
                    ?.currentOpenedEntity
                    ?.id ||
                null,

            note:
                this.normalizeText(
                    note,
                    500
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


        if(
            !point ||
            typeof point !==
                "object"
        ){

            return false;

        }


        /*
         * World varsa önce World bağlamı geri yüklenir.
         */

        if(
            point.worldId
        ){

            const openedWorld =
                this.openWorld(
                    point.worldId
                );


            if(
                openedWorld ===
                    false
            ){

                return false;

            }


            if(
                point.entityId
            ){

                const openedEntity =
                    this.openEntity(
                        point.entityId
                    );


                if(
                    openedEntity ===
                        false
                ){

                    return false;

                }


                if(
                    point.page
                ){

                    return this.openEntityPage(
                        point.page
                    );

                }

            }


            return true;

        }


        /*
         * Entity page resume.
         */

        if(
            point.page
        ){

            return this.openEntityPage(
                point.page
            );

        }


        /*
         * System-level screens.
         */

        if(
            point.app ===
                "vaero"
        ){

            return this.openVaeroApp();

        }


        if(
            point.app ===
                "applications"
        ){

            return this.openApplicationsApp();

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
       BRAIN HISTORY HELPERS
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
                action.fullContent ||
                action.text ||
                action.message ||
                ""
            );

        }


        return "";

    },


    escapeBrainHTML(value){

        const ui =
            typeof window !==
                "undefined"
                ? window.UI
                : null;


        if(
            ui &&
            typeof ui.escapeHTML ===
                "function"
        ){

            try{

                return ui.escapeHTML(
                    value
                );

            } catch(error){

                /* fallback */

            }

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
                        (
                            a,
                            b
                        ) =>
                            (
                                Number(
                                    a?.createdAt
                                ) ||
                                0
                            ) -
                            (
                                Number(
                                    b?.createdAt
                                ) ||
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


        if(
            actions.length ===
                0
        ){

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

        }

        else {

            actions.forEach(
                action => {

                    const content =
                        this.getBrainActionText(
                            action
                        );


                    if(!content){

                        return;

                    }


                    const createdAt =
                        Number(
                            action?.createdAt
                        );


                    const date =
                        new Date(
                            Number.isFinite(
                                createdAt
                            )
                                ? createdAt
                                : Date.now()
                        );


                    const time =
                        date.toLocaleTimeString(
                            "tr-TR",
                            {
                                hour:
                                    "2-digit",

                                minute:
                                    "2-digit"
                            }
                        );


                    /*
                     * System/navigation kayıtları
                     * conversation mesajı gibi gösterilmez.
                     */

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
                                ${this.escapeBrainHTML(
                                    time
                                )}
                            </span>

                            <span>
                                ${this.escapeBrainHTML(
                                    content
                                )}
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


                    const role =
                        action.role ===
                            "user"
                            ? "user"
                            : "brain";


                    message.className =
                        role ===
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
                                        ) ===
                                            index
                                )
                            : [];


                    const page =
                        action?.context?.page ||
                        null;


                    const actionType =
                        action?.actionType ||
                        null;


                    message.innerHTML = `
                        <div class="brain-chat-meta">

                            <span>
                                ${this.escapeBrainHTML(
                                    time
                                )}
                            </span>

                            ${
                                page
                                    ? `
                                        <span class="brain-chat-context">
                                            ${this.escapeBrainHTML(
                                                page
                                            )}
                                        </span>
                                      `
                                    : ""
                            }

                            ${
                                actionType
                                    ? `
                                        <span class="brain-chat-context">
                                            ${this.escapeBrainHTML(
                                                actionType
                                            )}
                                        </span>
                                      `
                                    : ""
                            }

                        </div>


                        <div class="brain-chat-content">

                            ${this.escapeBrainHTML(
                                content
                            )}

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

                            this.openBrainAppLink(
                                button.dataset
                                    .brainApp
                            );

                        }
                    );

                }
            );


        /* =================================================
           MINI HISTORY
        ================================================= */

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
                    .slice(
                        -3
                    );


            if(
                window.BrainApp &&
                typeof window.BrainApp
                    .renderMiniHistory ===
                    "function"
            ){

                try{

                    window.BrainApp
                        .renderMiniHistory(
                            recent.map(
                                action => ({
                                    role:
                                        action.role,

                                    message:
                                        this.getBrainActionText(
                                            action
                                        )
                                })
                            )
                        );

                } catch(error){

                    console.warn(
                        "Brain mini history render edilemedi:",
                        error
                    );

                }

            }

            else {

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


                miniHistory.appendChild(
                    miniFlow
                );

            }


            miniHistory.onclick =
                () => {

                    const panel =
                        document.getElementById(
                            "brainPanel"
                        );


                    if(!panel){

                        return;

                    }


                    panel.classList.remove(
                        "is-compact"
                    );


                    panel.classList.add(
                        "is-expanded"
                    );


                    try{

                        window.BrainApp
                            ?.focusInput?.();

                    } catch(error){

                        /* non-fatal */

                    }

                };

        }


        try{

            window.BrainApp
                ?.refreshConfirmation?.(
                    todaySession
                        ?.pendingConfirmation ||
                    null
                );


            window.BrainApp
                ?.refreshContext?.();


            window.BrainApp
                ?.refreshStatus?.();

        } catch(error){

            /* non-fatal */

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
       -----------------------------------------------------
       EvolutionApp owns Evolution UI state.
       Actions only routes generic Engine data-action calls.
    ===================================================== */

    handleEvolutionAction(
        action,
        button
    ){

        const targetAction =
            String(
                action ||
                ""
            )
                .trim();


        if(
    !targetAction
){

    return false;

}


button =
    button &&
    typeof button ===
        "object"
        ? button
        : {
            dataset:{}
        };


if(
    !button.dataset ||
    typeof button.dataset !==
        "object"
){

    button.dataset =
        {};

}


        const app =
            window.EvolutionApp ||
            null;


        if(!app){

            return false;

        }


        /*
         * Filter
         */

        if(
            targetAction ===
                "evolution:filter" &&
            typeof app.setFilter ===
                "function"
        ){

            const filter =
                String(
                    button.dataset
                        .filter ||
                    ""
                );


            app.setFilter(
                filter
            );


            /*
             * EvolutionApp artık kendi remount/render
             * davranışına sahipse onu kullan.
             */

            if(
                typeof app.remount ===
                    "function"
            ){

                app.remount();

            }

            else {

                this.remount();

            }


            return true;

        }


        /*
         * Open event
         */

        if(
            targetAction ===
                "evolution:event:open" &&
            typeof app.selectEvent ===
                "function"
        ){

            const eventId =
                String(
                    button.dataset
                        .eventId ||
                    ""
                )
                    .trim();


            if(!eventId){

                return false;

            }


            app.selectEvent(
                eventId
            );


            if(
                typeof app.remount ===
                    "function"
            ){

                app.remount();

            }

            else {

                this.remount();

            }


            return true;

        }


        /*
         * Close event
         */

        if(
            targetAction ===
                "evolution:event:close" &&
            typeof app.clearSelectedEvent ===
                "function"
        ){

            app.clearSelectedEvent();


            if(
                typeof app.remount ===
                    "function"
            ){

                app.remount();

            }

            else {

                this.remount();

            }


            return true;

        }


        /*
         * Linked Timeline / Memory navigation.
         */

        if(
            targetAction ===
                "evolution:linked:open"
        ){

            const target =
                String(
                    button.dataset
                        .target ||
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
                typeof app.clearSelectedEvent ===
                    "function"
            ){

                app.clearSelectedEvent();

            }


            return this.openEntityPage(
                target
            );

        }


        return false;

    },


    /* =====================================================
       GENERIC ACTION ROUTER HELPERS
    ===================================================== */

    getActionTarget(event){

        if(
            !event ||
            !event.target
        ){

            return null;

        }


        try{

            return event.target.closest(
                "[data-action]"
            );

        } catch(error){

            return null;

        }

    },


    shouldPreventDefaultAction(action){

        return [
            "world:create:submit",
            "world:edit:submit",
            "entity:create:submit",
            "entity:edit:submit"
        ].includes(
            action
        );

    },


    /* =====================================================
       ROUTE GENERIC ACTION
    ===================================================== */

    routeAction(
        action,
        button
    ){

        const targetAction =
            String(
                action ||
                ""
            )
                .trim();


        if(
    !targetAction
){

    return false;

}


button =
    button &&
    typeof button ===
        "object"
        ? button
        : {
            dataset:{}
        };


if(
    !button.dataset ||
    typeof button.dataset !==
        "object"
){

    button.dataset =
        {};

}


        switch(targetAction){

            /* ---------------------------------------------
               CORE NAVIGATION
            --------------------------------------------- */

            case "home:open":

                return this.openHome();


            case "identity:open":

                return this.openIdentity();


            case "profile:open":

                return this.openProfile();


            case "create:open":

                return this.openCreate();


            case "worlds:open":

                return this.openWorlds();


            case "entities:open":

                return this.openEntities();


            /* ---------------------------------------------
               WORLD
            --------------------------------------------- */

            case "world:open":

                return this.openWorld(
                    button.dataset
                        .worldId
                );


            case "world:create:submit":

                return this.createWorld();


            case "world:edit:open":

                return this.openWorldEditor();


            case "world:edit:cancel":

                return this.cancelWorldEditor();


            case "world:edit:submit":

                return this.saveWorldEditor();


            case "world:archive":

                return this.archiveWorld();


            case "world:back":

                return this.backToWorld();


            /* ---------------------------------------------
               ENTITY CREATE
            --------------------------------------------- */

            case "entity:create:first":

                return this.startEntityCreate();


            case "entity:type:select":

                return this.selectEntityType(
                    button.dataset
                        .entityType
                );


            case "entity:type:clear":

                return this.clearEntityType();


            case "entity:create:cancel":

                return this.cancelEntityCreate();


            case "entity:create:submit":

                return this.createEntity();


            /* ---------------------------------------------
               ENTITY
            --------------------------------------------- */

            case "entity:open":

                return this.openEntity(
                    button.dataset
                        .entityId
                );


            case "entity:edit:open":

                return this.openEntityEditor();


            case "entity:edit:cancel":

                return this.cancelEntityEditor();


            case "entity:edit:submit":

                return this.saveEntityEditor();


            case "entity:archive":

                return this.archiveEntity();


            case "entity:dashboard":

                return this.openEntityDashboard();


            /* ---------------------------------------------
               ENTITY PAGES
            --------------------------------------------- */

            case "entity:identity":

                return this.openEntityPage(
                    "identity"
                );


            case "entity:profile":

                return this.openEntityPage(
                    "profile"
                );


            case "entity:organs":

                return this.openEntityPage(
                    "organs"
                );


            case "entity:timeline":

                return this.openEntityPage(
                    "timeline"
                );


            case "entity:memory":

                return this.openEntityPage(
                    "memory"
                );


            case "entity:bridge":

                return this.openEntityPage(
                    "bridge"
                );


            case "entity:evolution":

                return this.openEntityPage(
                    "evolution"
                );


            case "entity:settings":

                return this.openEntityPage(
                    "settings"
                );


            case "entity:discovery":

                return this.openEntityPage(
                    "discovery"
                );


            /* ---------------------------------------------
               PROFILE / DISCOVERY
            --------------------------------------------- */

            case "profile:save":

                return this.saveProfile();


            case "discovery:restart":

                return this.restartDiscovery();


            /* ---------------------------------------------
               SYSTEM APPLICATIONS
            --------------------------------------------- */

            case "app:applications":

                return this.openApplicationsApp();


            case "app:vaero":

                return this.openVaeroApp();


            /* ---------------------------------------------
               PAYMENT
            --------------------------------------------- */

            case "vaero:payment:method":

                return this.selectVaeroPaymentMethod(
                    button.dataset
                        .paymentMethod
                );


            case "vaero:payment:provider":

                return this.selectVaeroPaymentProvider(
                    button.dataset
                        .paymentProvider
                );


            case "vaero:payment:start":

                return this.startVaeroPayment();


            case "vaero:payment:cancel":

                return this.cancelVaeroPayment();


            case "vaero:payment:refund":

                return this.refundVaeroPayment(
                    button.dataset
                        .transactionId
                );


            /* ---------------------------------------------
               BRAIN
            --------------------------------------------- */

            case "brain:open":

                return this.openBrain();


            case "brain:close":

                return this.closeBrain();


            case "brain:send":

                return this.sendBrainMessage();

        }


        /*
         * Evolution generic actions are intentionally
         * delegated here only if no canonical action matched.
         */

        if(
            targetAction.startsWith(
                "evolution:"
            )
        ){

            return this.handleEvolutionAction(
                targetAction,
                button
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
            Actions.getActionTarget(
                event
            );


        if(!button){

            return;

        }


        const action =
            String(
                button.dataset
                    .action ||
                ""
            )
                .trim();


        if(!action){

            return;

        }


        if(
            Actions.shouldPreventDefaultAction(
                action
            )
        ){

            event.preventDefault();

        }


        Actions.routeAction(
            action,
            button
        );

    }
);


/* =========================================================
   BRAIN COMMAND ROUTER
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest?.(
                "[data-brain-command]"
            );


        if(!button){

            return;

        }


        const command =
            String(
                button.dataset
                    .brainCommand ||
                ""
            )
                .trim();


        const confirmationId =
            button.dataset
                .confirmationId ||
            null;


        if(
            command ===
                "confirm"
        ){

            event.preventDefault();


            Actions.confirmBrainAction(
                confirmationId
            );


            return;

        }


        if(
            command ===
                "cancel-confirmation"
        ){

            event.preventDefault();


            Actions.cancelBrainConfirmation(
                confirmationId
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
            event.target.closest?.(
                "[data-engine-form]"
            );


        if(!form){

            return;

        }


        event.preventDefault();


        const formType =
            String(
                form.dataset
                    .engineForm ||
                ""
            )
                .trim();


        switch(formType){

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
            event.target?.id !==
                "brainInput" ||
            event.key !==
                "Enter" ||
            event.shiftKey ||
            event.isComposing
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

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        VAERO.register(
            "actions",
            Actions
        );

    }

} catch(error){

    console.warn(
        "Actions VAERO registry'e kaydedilemedi:",
        error
    );

}


/* =========================================================
   GLOBAL
========================================================= */

window.Actions =
    Actions;

