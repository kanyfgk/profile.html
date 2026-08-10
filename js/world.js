const World = {

    worlds: [],
    booted: false,
    storageKey: "vaero:worlds:v2",

    boot(){

        if(this.booted){
            return;
        }

        this.booted = true;
        this.load();

        const events = VAERO.get("events");

        if(!events){
            console.error("World boot failed: Events service not found.");
            return;
        }

        events.on("engine.started", data => {

            const result = this.ensureRootWorld(
                data.entityId
            );

            if(result.created){
                events.emit(
                    "world.created",
                    result.world
                );
            }

        });

    },

    normalize(world = {}){

        const now = Date.now();

        return {
            id:
                String(
                    world.id ||
                    crypto.randomUUID()
                ),

            name:
                String(
                    world.name ||
                    "İsimsiz Dünya"
                ).trim(),

            type:
                String(
                    world.type ||
                    "custom-world"
                ),

            owner:
                world.owner || null,

            entities:
                Array.isArray(world.entities)
                    ? world.entities
                    : [],

            status:
                world.status === "inactive"
                    ? "inactive"
                    : "active",

            createdAt:
                Number(world.createdAt) ||
                now,

            updatedAt:
                Number(world.updatedAt) ||
                now
        };

    },

    ensureRootWorld(ownerId){

        const existing =
            this.get("vaero-world");

        if(existing){
            return {
                world: existing,
                created: false
            };
        }

        const world = this.create({
            id: "vaero-world",
            name: "VAERO World",
            type: "root-world",
            owner: ownerId,
            entities: []
        });

        return {
            world,
            created: true
        };

    },

    create(world = {}){

        const item =
            this.normalize(world);

        const existing =
            this.get(item.id);

        if(existing){
            return existing;
        }

        this.worlds.push(item);
        this.save();

        return item;

    },

    get(worldId){

        const id =
            String(worldId || "");

        return (
            this.worlds.find(
                world => world.id === id
            ) ||
            null
        );

    },

    update(worldId, changes = {}){

        const world =
            this.get(worldId);

        if(!world){
            return null;
        }

        if(
            typeof changes.name === "string" &&
            changes.name.trim()
        ){
            world.name =
                changes.name.trim();
        }

        if(
            Array.isArray(changes.entities)
        ){
            world.entities =
                changes.entities;
        }

        if(
            changes.status === "active" ||
            changes.status === "inactive"
        ){
            world.status =
                changes.status;
        }

        world.updatedAt =
            Date.now();

        this.save();

        return world;

    },

    addEntity(worldId, entity){

        const world =
            this.get(worldId);

        if(!world || !entity){
            return null;
        }

        if(!Array.isArray(world.entities)){
            world.entities = [];
        }

        const exists =
            world.entities.some(
                item => item.id === entity.id
            );

        if(!exists){
            world.entities.push(entity);
            world.updatedAt = Date.now();
            this.save();
        }

        return entity;

    },

    all(){

        return [...this.worlds];

    },

    save(){

        try {

            localStorage.setItem(
                this.storageKey,
                JSON.stringify(this.worlds)
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

        const saved =
            localStorage.getItem(
                this.storageKey
            );

        if(!saved){
            this.worlds = [];
            return;
        }

        try {

            const parsed =
                JSON.parse(saved);

            this.worlds =
                Array.isArray(parsed)
                    ? parsed.map(
                        world =>
                            this.normalize(world)
                    )
                    : [];

        } catch(error){

            console.error(
                "World data could not be loaded:",
                error
            );

            this.worlds = [];

        }

    }

};

VAERO.register("world", World);
