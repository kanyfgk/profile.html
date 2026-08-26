/* =========================================================
   VAERO ORGAN STATUS
   Central Organ Health / Runtime / Registry Snapshot
========================================================= */

const OrganStatus = {

    lastSnapshotAt:
        null,


    /* =====================================================
       SAFE SERVICE ACCESS
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !==
                    "function"
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
       NORMALIZATION
    ===================================================== */

    normalizeList(value){

        if(
            Array.isArray(value)
        ){

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

        }


        if(
            value instanceof Set
        ){

            return [
                ...value
            ]
                .map(
                    item =>
                        String(
                            item ?? ""
                        ).trim()
                )
                .filter(Boolean);

        }


        return [];

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


    normalizeStatus(value){

        const status =
            String(
                value ||
                ""
            )
                .trim()
                .toLowerCase();


        const map = {

            healthy:
                "active",

            online:
                "active",

            running:
                "active",

            started:
                "active",

            installed:
                "active",

            ready:
                "active",

            active:
                "active",

            idle:
                "inactive",

            inactive:
                "inactive",

            paused:
                "paused",

            disabled:
                "disabled",

            missing:
                "missing",

            "not-installed":
                "missing",

            error:
                "error",

            failed:
                "error",

            installing:
                "installing",

            updating:
                "updating"

        };


        return (
            map[status] ||
            "active"
        );

    },


    /* =====================================================
       SAFE ALL
    ===================================================== */

    safeAll(
        service,
        options = undefined
    ){

        if(
            !service ||
            typeof service.all !==
                "function"
        ){
            return [];
        }


        try{

            const result =
                options === undefined
                    ? service.all()
                    : service.all(
                        options
                    );


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
       REGISTRY
    ===================================================== */

    getRegistry(){

        try{

            if(
                typeof OrganRegistry !==
                    "undefined"
            ){
                return OrganRegistry;
            }

        } catch(error){

            /* service fallback */
        }


        return (
            this.getService(
                "organRegistry"
            ) ||
            null
        );

    },


    getRegistryRecord(slug){

        const id =
            String(
                slug ||
                ""
            ).trim();


        if(!id){
            return null;
        }


        const registry =
            this.getRegistry();


        if(registry){

            try{

                if(
                    typeof registry.find ===
                        "function"
                ){

                    const result =
                        registry.find(
                            id
                        );


                    if(result){
                        return result;
                    }

                }

            } catch(error){

                /* continue */
            }


            try{

                if(
                    typeof registry.findBySlug ===
                        "function"
                ){

                    const result =
                        registry.findBySlug(
                            id
                        );


                    if(result){
                        return result;
                    }

                }

            } catch(error){

                /* continue */
            }


            try{

                if(
                    typeof registry.all ===
                        "function"
                ){

                    const records =
                        registry.all();


                    if(
                        Array.isArray(
                            records
                        )
                    ){

                        const result =
                            records.find(
                                organ =>
                                    organ?.id ===
                                        id ||
                                    organ?.slug ===
                                        id
                            );


                        if(result){
                            return result;
                        }

                    }

                }

            } catch(error){

                /* continue */
            }

        }


        /*
         * Compatibility with OrganSystem.
         */

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

                const result =
                    organSystem.findBySlug(
                        id
                    );


                if(result){
                    return result;
                }

            }

        } catch(error){

            /* continue */
        }


        try{

            if(
                typeof organSystem.all ===
                    "function"
            ){

                const records =
                    organSystem.all();


                if(
                    Array.isArray(
                        records
                    )
                ){

                    return (
                        records.find(
                            organ =>
                                organ?.id ===
                                    id ||
                                organ?.slug ===
                                    id
                        ) ||
                        null
                    );

                }

            }

        } catch(error){

            return null;

        }


        return null;

    },


    /* =====================================================
       RUNTIME ORGAN
    ===================================================== */

    getRuntimeOrgan(id){

        const organSystem =
            this.getService(
                "organSystem"
            ) ||
            this.getService(
                "organ"
            ) ||
            (
                typeof Organ !==
                    "undefined"
                    ? Organ
                    : null
            );


        if(!organSystem){
            return null;
        }


        try{

            if(
                typeof organSystem.get ===
                    "function"
            ){

                const result =
                    organSystem.get(
                        id
                    );


                if(result){
                    return result;
                }

            }

        } catch(error){

            /* continue */
        }


        try{

            if(
                typeof organSystem.find ===
                    "function"
            ){

                const result =
                    organSystem.find(
                        id
                    );


                if(result){
                    return result;
                }

            }

        } catch(error){

            /* continue */
        }


        try{

            if(
                organSystem.organs instanceof
                    Map
            ){

                return (
                    organSystem.organs.get(
                        id
                    ) ||
                    null
                );

            }

        } catch(error){

            /* continue */
        }


        try{

            if(
                organSystem.registry instanceof
                    Map
            ){

                return (
                    organSystem.registry.get(
                        id
                    ) ||
                    null
                );

            }

        } catch(error){

            /* continue */
        }


        return null;

    },


    /* =====================================================
       SERVICE HEALTH
    ===================================================== */

    getServiceReport(service){

        if(!service){
            return null;
        }


        try{

            if(
                typeof service.report ===
                    "function"
            ){

                const report =
                    service.report();


                if(
                    report &&
                    typeof report ===
                        "object"
                ){

                    return report;

                }

            }

        } catch(error){

            /* health fallback */
        }


        try{

            if(
                typeof service.health ===
                    "function"
            ){

                const health =
                    service.health();


                if(
                    health &&
                    typeof health ===
                        "object"
                ){

                    return health;

                }

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
        registry,
        runtime,
        report
    ){

        if(!service){

            return "missing";

        }


        if(
            registry?.installed ===
                false
        ){

            return "missing";

        }


        const candidates = [

            report?.status,

            runtime?.status,

            registry?.status

        ];


        for(
            const candidate of candidates
        ){

            if(!candidate){
                continue;
            }


            const normalized =
                this.normalizeStatus(
                    candidate
                );


            if(
                normalized !==
                    "active"
            ){

                return normalized;

            }

        }


        return "active";

    },


    /* =====================================================
       HEALTH SCORE
    ===================================================== */

    resolveHealthScore({
        service,
        status,
        registry,
        runtime,
        report
    }){

        if(!service){
            return 0;
        }


        const directCandidates = [

            report?.healthScore,

            report?.health,

            runtime?.healthScore,

            runtime?.health,

            registry?.healthScore,

            registry?.health

        ];


        for(
            const candidate of directCandidates
        ){

            const numeric =
                Number(
                    candidate
                );


            if(
                Number.isFinite(
                    numeric
                )
            ){

                return Math.max(
                    0,
                    Math.min(
                        100,
                        Math.round(
                            numeric
                        )
                    )
                );

            }

        }


        switch(status){

            case "active":
                return 100;


            case "inactive":
                return 70;


            case "paused":
                return 60;


            case "installing":
            case "updating":
                return 75;


            case "disabled":
                return 40;


            case "error":
                return 15;


            case "missing":
                return 0;


            default:
                return 80;

        }

    },


    resolveHealthLabel(score){

        if(score >= 90){
            return "healthy";
        }


        if(score >= 70){
            return "stable";
        }


        if(score >= 40){
            return "degraded";
        }


        if(score > 0){
            return "critical";
        }


        return "offline";

    },


    /* =====================================================
       BASE SNAPSHOT
    ===================================================== */

    buildBaseStatus({
        id,
        label,
        service
    }){

        const registry =
            this.getRegistryRecord(
                id
            );


        const runtime =
            this.getRuntimeOrgan(
                id
            );


        const report =
            this.getServiceReport(
                service
            );


        const status =
            this.resolveStatus(
                service,
                registry,
                runtime,
                report
            );


        const health =
            this.resolveHealthScore({
                service,
                status,
                registry,
                runtime,
                report
            });


        const capabilities =
            this.normalizeList(
                runtime?.capabilities ||
                registry?.capabilities ||
                report?.capabilities
            );


        const permissions =
            this.normalizeList(
                runtime?.permissions ||
                registry?.permissions ||
                report?.permissions
            );


        const dependencies =
            this.normalizeList(
                runtime?.dependencies ||
                runtime?.dependsOn ||
                registry?.dependencies ||
                report?.dependencies
            );


        const metadata = {
            ...this.normalizeObject(
                registry?.metadata
            ),
            ...this.normalizeObject(
                runtime?.metadata
            )
        };


        return {

            id,

            label,

            status,

            health,

            healthLabel:
                this.resolveHealthLabel(
                    health
                ),

            available:
                Boolean(
                    service
                ),

            registered:
                Boolean(
                    registry
                ),

            runtimeAttached:
                Boolean(
                    runtime
                ),

            installed:
                registry
                    ? registry.installed !==
                        false
                    : Boolean(
                        service
                    ),

            trusted:
                registry?.trusted !==
                    undefined
                    ? Boolean(
                        registry.trusted
                    )
                    : null,

            version:
                registry?.version ||
                runtime?.version ||
                null,

            source:
                registry?.source ||
                runtime?.source ||
                null,

            permissions,

            capabilities,

            dependencies,

            metadata,

            report:
                report ||
                null,

            checkedAt:
                Date.now()

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


        const base =
            this.buildBaseStatus({
                id:
                    "identity",

                label:
                    "Kimlik",

                service:
                    identity
            });


        let total =
            null;

        let verified =
            null;

        let pending =
            null;


        try{

            const report =
                identity?.report?.();


            if(report){

                total =
                    Number.isFinite(
                        Number(
                            report.total
                        )
                    )
                        ? Number(
                            report.total
                        )
                        : null;


                verified =
                    Number.isFinite(
                        Number(
                            report.verified
                        )
                    )
                        ? Number(
                            report.verified
                        )
                        : null;


                pending =
                    Number.isFinite(
                        Number(
                            report.pending
                        )
                    )
                        ? Number(
                            report.pending
                        )
                        : null;

            }

        } catch(error){

            /* optional metrics */
        }


        return {
            ...base,
            total,
            verified,
            pending
        };

    },


    /* =====================================================
       PROFILE
    ===================================================== */

    getProfileStatus(){

        const profile =
            this.getService(
                "profile"
            );


        const base =
            this.buildBaseStatus({
                id:
                    "profile",

                label:
                    "Profil",

                service:
                    profile
            });


        let total =
            null;

        let discoverable =
            null;


        try{

            const report =
                profile?.report?.();


            if(report){

                total =
                    Number.isFinite(
                        Number(
                            report.total
                        )
                    )
                        ? Number(
                            report.total
                        )
                        : null;


                discoverable =
                    Number.isFinite(
                        Number(
                            report.discoverable
                        )
                    )
                        ? Number(
                            report.discoverable
                        )
                        : null;

            }

        } catch(error){

            /* optional metrics */
        }


        return {
            ...base,
            total,
            discoverable
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


        const records =
            this.safeAll(
                memory
            );


        const base =
            this.buildBaseStatus({
                id:
                    "memory",

                label:
                    "Hafıza",

                service:
                    memory
            });


        return {

            ...base,

            total:
                records.length,

            lifeEvents:
                records.filter(
                    record =>
                        record?.type ===
                            "life-event" ||
                        record?.category ===
                            "life-event"
                ).length,

            important:
                records.filter(
                    record =>
                        record?.important ===
                            true
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


        const events =
            this.safeAll(
                timeline
            );


        const base =
            this.buildBaseStatus({
                id:
                    "timeline",

                label:
                    "Zaman Çizelgesi",

                service:
                    timeline
            });


        return {

            ...base,

            total:
                events.length,

            lifeEvents:
                events.filter(
                    event =>
                        event?.type ===
                            "life-event"
                ).length,

            critical:
                events.filter(
                    event =>
                        event?.importance ===
                            "critical"
                ).length

        };

    },


    /* =====================================================
       BRIDGE
    ===================================================== */

    getBridgeStatus(){

        const bridge =
            this.getService(
                "bridge"
            );


        const links =
            this.safeAll(
                bridge
            );


        const base =
            this.buildBaseStatus({
                id:
                    "bridge",

                label:
                    "Köprü",

                service:
                    bridge
            });


        return {

            ...base,

            total:
                links.length,

            favorites:
                links.filter(
                    link =>
                        link?.favorite ===
                            true
                ).length,

            archived:
                this.safeAll(
                    bridge,
                    {
                        includeArchived:true
                    }
                )
                    .filter(
                        link =>
                            link?.archived ===
                                true
                    )
                    .length

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


        const history =
            this.safeAll(
                evolution
            );


        const base =
            this.buildBaseStatus({
                id:
                    "evolution",

                label:
                    "Evolution",

                service:
                    evolution
            });


        return {

            ...base,

            total:
                history.length,

            important:
                history.filter(
                    event =>
                        event?.importance ===
                            "high" ||
                        event?.importance ===
                            "critical"
                ).length,

            activeGoals:
                history.filter(
                    event =>
                        event?.type ===
                            "goal" &&
                        event?.status !==
                            "completed" &&
                        event?.status !==
                            "cancelled"
                ).length

        };

    },


    /* =====================================================
       ALL
    ===================================================== */

    all(){

        const snapshot = [

            this.getIdentityStatus(),

            this.getProfileStatus(),

            this.getMemoryStatus(),

            this.getTimelineStatus(),

            this.getBridgeStatus(),

            this.getEvolutionStatus()

        ];


        this.lastSnapshotAt =
            Date.now();


        return snapshot;

    },


    /* =====================================================
       GET
    ===================================================== */

    get(id){

        const organId =
            String(
                id ||
                ""
            ).trim();


        if(!organId){
            return null;
        }


        return (
            this.all()
                .find(
                    organ =>
                        organ.id ===
                        organId
                ) ||
            null
        );

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
                        "active" ||
                    organ.health <
                        70
            );


        const critical =
            organs.filter(
                organ =>
                    organ.status ===
                        "missing" ||
                    organ.status ===
                        "error" ||
                    organ.health <
                        40
            );


        let status =
            "healthy";


        if(
            problematic.length > 0
        ){

            status =
                "degraded";

        }


        if(
            critical.length > 0
        ){

            status =
                "critical";

        }


        const averageHealth =
            organs.length
                ? Math.round(
                    organs.reduce(
                        (
                            total,
                            organ
                        ) =>
                            total +
                            (
                                Number(
                                    organ.health
                                ) ||
                                0
                            ),
                        0
                    ) /
                    organs.length
                )
                : 0;


        return {

            status,

            averageHealth,

            total:
                organs.length,

            active:
                organs.filter(
                    organ =>
                        organ.status ===
                            "active"
                ).length,

            missing:
                organs
                    .filter(
                        organ =>
                            organ.status ===
                                "missing"
                    )
                    .map(
                        organ =>
                            organ.id
                    ),

            disabled:
                organs
                    .filter(
                        organ =>
                            organ.status ===
                                "disabled"
                    )
                    .map(
                        organ =>
                            organ.id
                    ),

            paused:
                organs
                    .filter(
                        organ =>
                            organ.status ===
                                "paused"
                    )
                    .map(
                        organ =>
                            organ.id
                    ),

            error:
                organs
                    .filter(
                        organ =>
                            organ.status ===
                                "error"
                    )
                    .map(
                        organ =>
                            organ.id
                    ),

            untrusted:
                organs
                    .filter(
                        organ =>
                            organ.registered &&
                            organ.trusted ===
                                false
                    )
                    .map(
                        organ =>
                            organ.id
                    ),

            problematic:
                problematic.map(
                    organ =>
                        organ.id
                ),

            checkedAt:
                this.lastSnapshotAt,

            organs

        };

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const health =
            this.health();


        return {

            status:
                health.status,

            averageHealth:
                health.averageHealth,

            total:
                health.total,

            active:
                health.active,

            problematic:
                health.problematic.length,

            missing:
                health.missing.length,

            error:
                health.error.length,

            disabled:
                health.disabled.length,

            untrusted:
                health.untrusted.length,

            checkedAt:
                health.checkedAt

        };

    }

};


VAERO.register(
    "organStatus",
    OrganStatus
);


window.OrganStatus =
    OrganStatus;
