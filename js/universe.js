/* =========================================================
   VAERO UNIVERSE CORE
   Root Universe / World Registry / Topology Container
========================================================= */

const Universe = {

    id:
        "vaero-universe",

    name:
        "VAERO Universe",

    type:
        "root-universe",

    worlds:
        [],

    owner:
        null,

    booted:
        false,

    createdAt:
        null,

    updatedAt:
        null,


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
                `Universe event gönderilemedi: ${name}`,
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
                `Universe event fallback gönderilemedi: ${name}`,
                error
            );

        }


        return false;

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
        maxLength = 500
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


    normalizeWorldId(value){

        if(
            typeof value ===
                "object" &&
            value !==
                null
        ){

            return this.normalizeId(
                value.id ||
                value.worldId
            );

        }


        return this.normalizeId(
            value
        );

    },


    normalizeWorldList(value){

        if(
            !Array.isArray(
                value
            )
        ){

            return [];

        }


        const seen =
            new Set();


        return value
            .map(
                item =>
                    this.normalizeWorldId(
                        item
                    )
            )
            .filter(
                id => {

                    if(!id){

                        return false;

                    }


                    if(
                        seen.has(
                            id
                        )
                    ){

                        return false;

                    }


                    seen.add(
                        id
                    );


                    return true;

                }
            );

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


        const events =
            this.getService(
                "events"
            );


        if(
            !events ||
            typeof events.on !==
                "function"
        ){

            console.warn(
                "Universe boot: Events service hazır değil."
            );


            return false;

        }


        const now =
            Date.now();


        if(
            !this.createdAt
        ){

            this.createdAt =
                now;

        }


        this.updatedAt =
            now;


        /*
         * Existing worlds can be hydrated before
         * event listeners begin.
         */

        this.hydrateWorlds();


        const handleEngineStarted =
            data => {

                const ownerId =
                    this.normalizeId(
                        data?.entityId ||
                        data?.rootEntityId ||
                        data?.ownerId
                    );


                if(ownerId){

                    this.owner =
                        ownerId;

                }


                this.updatedAt =
                    Date.now();


                const payload = {

                    id:
                        this.id,

                    name:
                        this.name,

                    type:
                        this.type,

                    owner:
                        this.owner,

                    worlds:[
                        ...this.worlds
                    ],

                    createdAt:
                        this.createdAt,

                    updatedAt:
                        this.updatedAt

                };


                /*
                 * Legacy Graph listener.
                 */

                try{

                    events.emit(
                        "universe.created",
                        payload
                    );

                } catch(error){

                    console.warn(
                        "Universe legacy created event gönderilemedi.",
                        error
                    );

                }


                /*
                 * Modern alias.
                 */

                try{

                    events.emit(
                        "universe:created",
                        payload
                    );

                } catch(error){

                    console.warn(
                        "Universe created event gönderilemedi.",
                        error
                    );

                }

            };


        const handleWorldCreated =
            data => {

                const worldId =
                    this.normalizeWorldId(
                        data
                    );


                if(!worldId){

                    return;

                }


                this.addWorld(
                    worldId,
                    {
                        emit:
                            false
                    }
                );

            };


        const handleWorldRemoved =
            data => {

                const worldId =
                    this.normalizeWorldId(
                        data
                    );


                if(!worldId){

                    return;

                }


                this.removeWorld(
                    worldId,
                    {
                        emit:
                            false
                    }
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


            events.on(
                "world.created",
                handleWorldCreated
            );


            events.on(
                "world:created",
                handleWorldCreated
            );


            events.on(
                "world.removed",
                handleWorldRemoved
            );


            events.on(
                "world:removed",
                handleWorldRemoved
            );

        } catch(error){

            console.warn(
                "Universe event listeners kurulamadı.",
                error
            );


            return false;

        }


        this.booted =
            true;


        this.emit(
            "universe:ready",
            {
                id:
                    this.id,

                owner:
                    this.owner,

                worlds:
                    this.worlds.length,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       WORLD HYDRATION
    ===================================================== */

    hydrateWorlds(){

        const worldService =
            this.getService(
                "world"
            );


        if(
            !worldService ||
            typeof worldService.all !==
                "function"
        ){

            this.worlds =
                this.normalizeWorldList(
                    this.worlds
                );


            return this.worlds;

        }


        try{

            const worlds =
                worldService.all({
                    includeArchived:
                        true
                }) ||
                [];


            if(
                Array.isArray(
                    worlds
                )
            ){

                this.worlds =
                    this.normalizeWorldList([
                        ...this.worlds,
                        ...worlds
                    ]);

            }

        } catch(error){

            this.worlds =
                this.normalizeWorldList(
                    this.worlds
                );

        }


        return this.worlds;

    },


    /* =====================================================
       WORLD REGISTRY
    ===================================================== */

    addWorld(
        worldOrId,
        options = {}
    ){

        const worldId =
            this.normalizeWorldId(
                worldOrId
            );


        if(!worldId){

            return false;

        }


        if(
            this.worlds.includes(
                worldId
            )
        ){

            return true;

        }


        this.worlds.push(
            worldId
        );


        this.worlds =
            this.normalizeWorldList(
                this.worlds
            );


        this.updatedAt =
            Date.now();


        if(
            options.emit !==
                false
        ){

            this.emit(
                "universe:world:added",
                {
                    universeId:
                        this.id,

                    worldId,

                    time:
                        this.updatedAt
                }
            );

        }


        return true;

    },


    removeWorld(
        worldOrId,
        options = {}
    ){

        const worldId =
            this.normalizeWorldId(
                worldOrId
            );


        if(!worldId){

            return false;

        }


        const before =
            this.worlds.length;


        this.worlds =
            this.worlds.filter(
                id =>
                    id !==
                        worldId
            );


        if(
            this.worlds.length ===
                before
        ){

            return false;

        }


        this.updatedAt =
            Date.now();


        if(
            options.emit !==
                false
        ){

            this.emit(
                "universe:world:removed",
                {
                    universeId:
                        this.id,

                    worldId,

                    time:
                        this.updatedAt
                }
            );

        }


        return true;

    },


    hasWorld(worldOrId){

        const worldId =
            this.normalizeWorldId(
                worldOrId
            );


        if(!worldId){

            return false;

        }


        return this.worlds.includes(
            worldId
        );

    },


    worldIds(){

        return [
            ...this.worlds
        ];

    },


    /* =====================================================
       WORLD RESOLUTION
    ===================================================== */

    getWorld(worldId){

        const id =
            this.normalizeWorldId(
                worldId
            );


        if(
            !id ||
            !this.hasWorld(
                id
            )
        ){

            return null;

        }


        const worldService =
            this.getService(
                "world"
            );


        if(!worldService){

            return null;

        }


        const methods = [
            "get",
            "find",
            "getById"
        ];


        for(
            const method of methods
        ){

            if(
                typeof worldService[
                    method
                ] !==
                    "function"
            ){

                continue;

            }


            try{

                const world =
                    worldService[
                        method
                    ](
                        id
                    );


                if(world){

                    return world;

                }

            } catch(error){

                /* next resolver */

            }

        }


        if(
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


                if(
                    Array.isArray(
                        worlds
                    )
                ){

                    return (
                        worlds.find(
                            world =>
                                world?.id ===
                                    id
                        ) ||
                        null
                    );

                }

            } catch(error){

                /* unresolved */

            }

        }


        return null;

    },


    resolvedWorlds(){

        return this.worlds
            .map(
                worldId =>
                    this.getWorld(
                        worldId
                    )
            )
            .filter(Boolean);

    },


    /* =====================================================
       OWNER
    ===================================================== */

    setOwner(entityId){

        const id =
            this.normalizeId(
                entityId
            );


        if(!id){

            return false;

        }


        const before =
            this.owner;


        this.owner =
            id;


        this.updatedAt =
            Date.now();


        if(
            before !==
                id
        ){

            this.emit(
                "universe:owner:updated",
                {
                    universeId:
                        this.id,

                    owner:
                        id,

                    previousOwner:
                        before,

                    time:
                        this.updatedAt
                }
            );

        }


        return true;

    },


    /* =====================================================
       QUERY
    ===================================================== */

    all(){

        return {

            id:
                this.id,

            name:
                this.name,

            type:
                this.type,

            owner:
                this.owner,

            worlds:[
                ...this.worlds
            ],

            createdAt:
                this.createdAt,

            updatedAt:
                this.updatedAt

        };

    },


    snapshot(){

        return this.all();

    },


    /* =====================================================
       STATS
    ===================================================== */

    stats(){

        const resolved =
            this.resolvedWorlds();


        return {

            worlds:
                this.worlds.length,

            resolvedWorlds:
                resolved.length,

            unresolvedWorlds:
                Math.max(
                    0,
                    this.worlds.length -
                    resolved.length
                ),

            owner:
                this.owner

        };

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const stats =
            this.stats();


        return {

            booted:
                this.booted,

            id:
                this.id,

            name:
                this.name,

            type:
                this.type,

            owner:
                this.owner,

            ...stats

        };

    },


    /* =====================================================
       CLEAR REGISTRY

       Does NOT delete World data.
       Universe only owns the registry relationship.
    ===================================================== */

    clear(){

        const count =
            this.worlds.length;


        this.worlds =
            [];


        this.updatedAt =
            Date.now();


        this.emit(
            "universe:cleared",
            {
                count,

                time:
                    this.updatedAt
            }
        );


        return true;

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
            "universe",
            Universe
        );

    }

} catch(error){

    console.error(
        "Universe register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.Universe =
        Universe;

}
