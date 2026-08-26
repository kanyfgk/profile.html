/* =========================================================
   VAERO ORGAN STATUS
   Organ Health / Registry / Service Snapshot
========================================================= */

const OrganStatus = {

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

            return (
                VAERO.get(name) ||
                null
            );

        } catch(error){

            console.warn(
                `OrganStatus service lookup failed: ${name}`,
                error
            );

            return null;

        }

    },


    /* =====================================================
       SAFE ALL
    ===================================================== */

    safeAll(service){

        if(
            !service ||
            typeof service.all !==
                "function"
        ){
            return [];
        }


        try{

            const result =
                service.all();


            return Array.isArray(
                result
            )
                ? result
                : [];

        } catch(error){

            return [];

        }

    },


    /* =====================================================
       REGISTRY LOOKUP
    ===================================================== */

    getRegistryRecord(slug){

        const organSystem =
            this.getService(
                "organSystem"
            );


        if(!organSystem){
            return null;
        }


        try{

            if(
                typeof organSystem.findBySlug ===
                    "function"
            ){

                return (
                    organSystem.findBySlug(
                        slug
                    ) ||
                    null
                );

            }


            if(
                typeof organSystem.all ===
                    "function"
            ){

                return (
                    organSystem
                        .all()
                        .find(
                            organ =>
                                organ?.slug ===
                                slug
                        ) ||
                    null
                );

            }

        } catch(error){

            return null;

        }


        return null;

    },


    /* =====================================================
       STATUS RESOLUTION
    ===================================================== */

    resolveStatus(
        service,
        registry
    ){

        if(!service){
            return "missing";
        }


        if(
            registry &&
            registry.installed ===
                false
        ){
            return "not-installed";
        }


        if(
            registry?.status ===
            "disabled"
        ){
            return "disabled";
        }


        if(
            registry?.status ===
            "error"
        ){
            return "error";
        }


        if(
            registry?.status ===
            "updating"
        ){
            return "updating";
        }


        if(
            registry?.status ===
            "installing"
        ){
            return "installing";
        }


        if(
            registry?.status ===
            "inactive"
        ){
            return "inactive";
        }


        return "active";

    },


    buildBaseStatus({
        id,
        label,
        service,
        registry
    }){

        return {

            id,

            label,

            status:
                this.resolveStatus(
                    service,
                    registry
                ),

            available:
                Boolean(
                    service
                ),

            registered:
                Boolean(
                    registry
                ),

            installed:
                registry
                    ? registry.installed !==
                      false
                    : Boolean(
                        service
                    ),

            trusted:
                registry
                    ? Boolean(
                        registry.trusted
                    )
                    : null,

            version:
                registry?.version ||
                null,

            source:
                registry?.source ||
                null,

            permissions:
                Array.isArray(
                    registry?.permissions
                )
                    ? [
                        ...registry.permissions
                    ]
                    : [],

            capabilities:
                Array.isArray(
                    registry?.capabilities
                )
                    ? [
                        ...registry.capabilities
                    ]
                    : []

        };

    },


    /* =====================================================
       MEMORY
    ===================================================== */

    getMemoryStatus(){

        const memory =
            this.getService(
                "memorySystem"
            );


        const registry =
            this.getRegistryRecord(
                "memory"
            );


        const records =
            this.safeAll(
                memory
            );


        return {

            ...this.buildBaseStatus({
                id:
                    "memory",

                label:
                    "Hafıza",

                service:
                    memory,

                registry
            }),

            total:
                records.length,

            lifeEvents:
                records.filter(
                    record =>
                        record?.type ===
                        "life-event"
                ).length

        };

    },


    /* =====================================================
       TIMELINE
    ===================================================== */

    getTimelineStatus(){

        const timeline =
            this.getService(
                "timeline"
            );


        const registry =
            this.getRegistryRecord(
                "timeline"
            );


        const events =
            this.safeAll(
                timeline
            );


        return {

            ...this.buildBaseStatus({
                id:
                    "timeline",

                label:
                    "Zaman Çizelgesi",

                service:
                    timeline,

                registry
            }),

            total:
                events.length,

            lifeEvents:
                events.filter(
                    event =>
                        event?.type ===
                        "life-event"
                ).length

        };

    },


    /* =====================================================
       EVOLUTION
    ===================================================== */

    getEvolutionStatus(){

        const evolution =
            this.getService(
                "evolution"
            );


        const registry =
            this.getRegistryRecord(
                "evolution"
            );


        const history =
            this.safeAll(
                evolution
            );


        return {

            ...this.buildBaseStatus({
                id:
                    "evolution",

                label:
                    "Evrim",

                service:
                    evolution,

                registry
            }),

            total:
                history.length,

            important:
                history.filter(
                    event =>
                        event?.importance ===
                            "high" ||
                        event?.importance ===
                            "critical"
                ).length

        };

    },


    /* =====================================================
       IDENTITY
    ===================================================== */

    getIdentityStatus(){

        const identity =
            this.getService(
                "identity"
            );


        const registry =
            this.getRegistryRecord(
                "identity"
            );


        return this.buildBaseStatus({
            id:
                "identity",

            label:
                "Kimlik",

            service:
                identity,

            registry
        });

    },


    /* =====================================================
       PROFILE
    ===================================================== */

    getProfileStatus(){

        const profile =
            this.getService(
                "profile"
            );


        const registry =
            this.getRegistryRecord(
                "profile"
            );


        return this.buildBaseStatus({
            id:
                "profile",

            label:
                "Profil",

            service:
                profile,

            registry
        });

    },


    /* =====================================================
       BRIDGE
    ===================================================== */

    getBridgeStatus(){

        const bridge =
            this.getService(
                "bridge"
            );


        const registry =
            this.getRegistryRecord(
                "bridge"
            );


        return this.buildBaseStatus({
            id:
                "bridge",

            label:
                "Köprü",

            service:
                bridge,

            registry
        });

    },


    /* =====================================================
       ALL
    ===================================================== */

    all(){

        return [

            this.getIdentityStatus(),

            this.getProfileStatus(),

            this.getMemoryStatus(),

            this.getTimelineStatus(),

            this.getBridgeStatus(),

            this.getEvolutionStatus()

        ];

    },


    /* =====================================================
       HEALTH
    ===================================================== */

    health(){

        const organs =
            this.all();


        const problematic =
            organs.filter(
                organ =>
                    organ.status !==
                    "active"
            );


        return {

            status:
                problematic.length ===
                0
                    ? "healthy"
                    : "degraded",

            total:
                organs.length,

            active:
                organs.filter(
                    organ =>
                        organ.status ===
                        "active"
                ).length,

            missing:
                organs.filter(
                    organ =>
                        organ.status ===
                        "missing"
                )
                .map(
                    organ =>
                        organ.id
                ),

            disabled:
                organs.filter(
                    organ =>
                        organ.status ===
                        "disabled"
                )
                .map(
                    organ =>
                        organ.id
                ),

            untrusted:
                organs.filter(
                    organ =>
                        organ.registered &&
                        organ.trusted ===
                        false
                )
                .map(
                    organ =>
                        organ.id
                ),

            organs

        };

    }

};


VAERO.register(
    "organStatus",
    OrganStatus
);


window.OrganStatus =
    OrganStatus;
