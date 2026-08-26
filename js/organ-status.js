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
            Array.isArray(
                value
            )
        ){

            return [
                ...new Set(
                    value
                        .map(
                            item =>
                                String(
                                    item ??
                                    ""
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
                            item ??
                            ""
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

            ready:
                "active",

            active:
                "active",

            installed:
                "inactive",

            idle:
                "inactive",

            stopped:
                "inactive",

            inactive:
                "inactive",

            paused:
                "paused",

            disabled:
                "disabled",

            missing:
                "missing",

            unavailable:
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
            "inactive"
        );

    },


    normalizeHealth(value){

        const numeric =
            Number(
                value
            );


        if(
            !Number.isFinite(
                numeric
            )
        ){

            return null;

        }


        return Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    numeric
                )
            )
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
                options ===
                    undefined

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
       APP REGISTRY
    ===================================================== */

    getAppRegistry(){

        return (
            this.getService(
                "appRegistry"
            ) ||

            this.getService(
                "applicationRegistry"
            ) ||

            (
                typeof AppRegistry !==
                    "undefined"

                    ? AppRegistry

                    : null
            ) ||

            this.getService(
                "organRegistry"
            ) ||

            (
                typeof OrganRegistry !==
                    "undefined"

                    ? OrganRegistry

                    : null
            ) ||

            null
        );

    },


    getRegistryRecord(id){

        const target =
            String(
                id ||
                ""
            ).trim();


        if(!target){

            return null;

        }


        const registry =
            this.getAppRegistry();


        if(!registry){

            return null;

        }


        try{

            if(
                typeof registry.find ===
                    "function"
            ){

                const result =
                    registry.find(
                        target
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
                        target
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
                    registry.all({
                        includeDisabled:
                            true
                    });


                if(
                    Array.isArray(
                        records
                    )
                ){

                    return (
                        records.find(
                            record =>
                                record?.id ===
                                    target ||
                                record?.slug ===
                                    target
                        ) ||
                        null
                    );

                }

            }

        } catch(error){

            try{

                const records =
                    registry.all();


                if(
                    Array.isArray(
                        records
                    )
                ){

                    return (
                        records.find(
                            record =>
                                record?.id ===
                                    target ||
                                record?.slug ===
                                    target
                        ) ||
                        null
                    );

                }

            } catch(secondError){

                return null;

            }

        }


        return null;

    },


    /* =====================================================
       ORGAN SYSTEM
    ===================================================== */

    getOrganSystem(){

        return (
            this.getService(
                "organSystem"
            ) ||

            this.getService(
                "organ"
            ) ||

            window.OrganSystem ||

            (
                typeof Organ !==
                    "undefined"

                    ? Organ

                    : null
            ) ||

            null
        );

    },


    getRuntimeOrgan(id){

        const target =
            String(
                id ||
                ""
            ).trim();


        if(!target){

            return null;

        }


        const organSystem =
            this.getOrganSystem();


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
                        target
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
                        target
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
                typeof organSystem.findBySlug ===
                    "function"
            ){

                const result =
                    organSystem.findBySlug(
                        target
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

                const direct =
                    organSystem.organs.get(
                        target
                    );


                if(direct){

                    return direct;

                }


                return (
                    [
                        ...organSystem
                            .organs
                            .values()
                    ]
                        .find(
                            organ =>
                                organ?.slug ===
                                target
                        ) ||
                    null
                );

            }

        } catch(error){

            return null;

        }


        return null;

    },


    getRuntimeOrgans(){

        const organSystem =
            this.getOrganSystem();


        if(!organSystem){

            return [];

        }


        try{

            if(
                typeof organSystem.all ===
                    "function"
            ){

                const organs =
                    organSystem.all();


                if(
                    Array.isArray(
                        organs
                    )
                ){

                    return organs
                        .filter(Boolean);

                }

            }

        } catch(error){

            /* map fallback */

        }


        if(
            organSystem.organs instanceof
                Map
        ){

            return [
                ...organSystem
                    .organs
                    .values()
            ]
                .filter(Boolean);

        }


        return [];

    },


    /* =====================================================
       SERVICE REPORT
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
       INSTALL STATE
    ===================================================== */

    resolveInstalled(
        registry,
        runtime,
        service
    ){

        if(
            runtime?.installed !==
            undefined
        ){

            return (
                runtime.installed ===
                true
            );

        }


        if(
            registry?.distribution ===
                "built-in" ||
            registry?.system ===
                true
        ){

            return true;

        }


        if(
            registry?.installed !==
            undefined
        ){

            return (
                registry.installed ===
                true
            );

        }


        return Boolean(
            service
        );

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

        const installed =
            this.resolveInstalled(
                registry,
                runtime,
                service
            );


        if(!installed){

            return "missing";

        }


        const candidates = [

            report?.status,

            runtime?.status,

            registry?.status

        ];


        for(
            const candidate of
            candidates
        ){

            if(
                candidate ===
                undefined ||
            candidate ===
                null ||
            candidate ===
                ""
            ){

                continue;

            }


            return this.normalizeStatus(
                candidate
            );

        }


        if(
            service ||
            runtime
        ){

            return "active";

        }


        return "inactive";

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

        const directCandidates = [

            report?.healthScore,

            report?.health,

            runtime?.healthScore,

            runtime?.health,

            registry?.healthScore,

            registry?.health

        ];


        for(
            const candidate of
            directCandidates
        ){

            const normalized =
                this.normalizeHealth(
                    candidate
                );


            if(
                normalized !==
                null
            ){

                return normalized;

            }

        }


        if(
            !service &&
            !runtime &&
            status ===
                "missing"
        ){

            return 0;

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

        if(
            score >=
            90
        ){

            return "healthy";

        }


        if(
            score >=
            70
        ){

            return "stable";

        }


        if(
            score >=
            40
        ){

            return "degraded";

        }


        if(
            score >
            0
        ){

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
        service = null
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


        const installed =
            this.resolveInstalled(
                registry,
                runtime,
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
                report?.capabilities ||
                []
            );


        const permissions =
            this.normalizeList(
                runtime?.permissions ||
                registry?.permissions ||
                report?.permissions ||
                []
            );


        const requestedPermissions =
            this.normalizeList(
                runtime
                    ?.metadata
                    ?.requestedPermissions ||
                registry
                    ?.requestedPermissions ||
                registry
                    ?.metadata
                    ?.requestedPermissions ||
                []
            );


        const dependencies =
            this.normalizeList(
                runtime?.dependencies ||
                runtime?.dependsOn ||
                registry?.dependencies ||
                report?.dependencies ||
                []
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
                    service ||
                    runtime
                ),

            registered:
                Boolean(
                    registry
                ),

            runtimeAttached:
                Boolean(
                    runtime
                ),

            installed,

            trusted:
                runtime?.trusted !==
                    undefined

                    ? Boolean(
                        runtime.trusted
                    )

                    : registry?.trusted !==
                        undefined

                        ? Boolean(
                            registry.trusted
                        )

                        : (
                            registry?.system ===
                                true ||
                            registry?.distribution ===
                                "built-in"

                                ? true

                                : null
                        ),

            protected:
                runtime?.protected !==
                    undefined

                    ? Boolean(
                        runtime.protected
                    )

                    : null,

            version:
                runtime?.version ||
                registry?.version ||
                null,

            source:
                runtime?.source ||
                registry?.distribution ||
                registry?.source ||
                null,

            permissions,

            requestedPermissions,

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
       GENERIC RUNTIME SNAPSHOT
    ===================================================== */

    buildRuntimeStatus(organ){

        if(!organ){

            return null;

        }


        const id =
            String(
                organ.id ||
                organ.slug ||
                ""
            ).trim();


        if(!id){

            return null;

        }


        const registry =
            this.getRegistryRecord(
                id
            );


        const status =
            this.normalizeStatus(
                organ.status ||
                (
                    organ.installed
                        ? "inactive"
                        : "missing"
                )
            );


        const health =
            this.resolveHealthScore({
                service:
                    null,
                status,
                registry,
                runtime:
                    organ,
                report:
                    null
            });


        return {

            id,

            label:
                String(
                    registry?.title ||
                    organ.title ||
                    organ.name ||
                    id
                ),

            status,

            health,

            healthLabel:
                this.resolveHealthLabel(
                    health
                ),

            available:
                true,

            registered:
                Boolean(
                    registry
                ),

            runtimeAttached:
                true,

            installed:
                organ.installed ===
                    true,

            trusted:
                organ.trusted ===
                    true,

            protected:
                organ.protected ===
                    true,

            version:
                organ.version ||
                registry?.version ||
                null,

            source:
                organ.source ||
                registry?.distribution ||
                null,

            permissions:
                this.normalizeList(
                    organ.permissions
                ),

            requestedPermissions:
                this.normalizeList(
                    organ
                        ?.metadata
                        ?.requestedPermissions ||
                    registry
                        ?.requestedPermissions ||
                    []
                ),

            capabilities:
                this.normalizeList(
                    organ.capabilities
                ),

            dependencies:
                this.normalizeList(
                    organ.dependencies ||
                    organ.dependsOn
                ),

            metadata:{
                ...this.normalizeObject(
                    registry?.metadata
                ),
                ...this.normalizeObject(
                    organ.metadata
                )
            },

            report:
                typeof organ.report ===
                    "function"

                    ? (
                        (() => {

                            try{

                                return organ.report();

                            } catch(error){

                                return null;

                            }

                        })()
                    )

                    : null,

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
            ) ||
            this.getService(
                "memory"
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
                        includeArchived:
                            true
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
       CORE SNAPSHOT
    ===================================================== */

    getCoreStatuses(){

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
       ALL
    ===================================================== */

    all(){

        const snapshot =
            [];


        const seen =
            new Set();


        this.getCoreStatuses()
            .forEach(
                status => {

                    if(
                        !status ||
                        !status.id
                    ){

                        return;

                    }


                    snapshot.push(
                        status
                    );


                    seen.add(
                        status.id
                    );

                }
            );


        this.getRuntimeOrgans()
            .forEach(
                organ => {

                    const id =
                        String(
                            organ?.id ||
                            organ?.slug ||
                            ""
                        ).trim();


                    if(
                        !id ||
                        seen.has(
                            id
                        )
                    ){

                        return;

                    }


                    const status =
                        this.buildRuntimeStatus(
                            organ
                        );


                    if(!status){

                        return;

                    }


                    snapshot.push(
                        status
                    );


                    seen.add(
                        id
                    );

                }
            );


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


        const installedOrgans =
            organs.filter(
                organ =>
                    organ.installed !==
                    false
            );


        const problematic =
            installedOrgans.filter(
                organ =>
                    organ.status !==
                        "active" ||
                    organ.health <
                        70
            );


        const critical =
            installedOrgans.filter(
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
            problematic.length >
            0
        ){

            status =
                "degraded";

        }


        if(
            critical.length >
            0
        ){

            status =
                "critical";

        }


        const averageHealth =
            installedOrgans.length

                ? Math.round(
                    installedOrgans.reduce(
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
                    installedOrgans.length
                )

                : 0;


        return {

            status,

            averageHealth,

            total:
                organs.length,

            installed:
                installedOrgans.length,

            active:
                installedOrgans.filter(
                    organ =>
                        organ.status ===
                            "active"
                ).length,

            inactive:
                installedOrgans
                    .filter(
                        organ =>
                            organ.status ===
                                "inactive"
                    )
                    .map(
                        organ =>
                            organ.id
                    ),

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

            installing:
                organs
                    .filter(
                        organ =>
                            organ.status ===
                                "installing"
                    )
                    .map(
                        organ =>
                            organ.id
                    ),

            updating:
                organs
                    .filter(
                        organ =>
                            organ.status ===
                                "updating"
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
                            organ.installed !==
                                false &&
                            organ.trusted ===
                                false
                    )
                    .map(
                        organ =>
                            organ.id
                    ),

            permissionReview:
                organs
                    .filter(
                        organ => {

                            if(
                                !organ.installed
                            ){

                                return false;

                            }


                            if(
                                !organ.requestedPermissions
                                    ?.length
                            ){

                                return false;

                            }


                            const granted =
                                this.normalizeList(
                                    organ.permissions
                                )
                                    .map(
                                        item =>
                                            item.toLowerCase()
                                    );


                            return organ
                                .requestedPermissions
                                .some(
                                    permission =>
                                        !granted.includes(
                                            String(
                                                permission
                                            )
                                                .toLowerCase()
                                        )
                                );

                        }
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

            installed:
                health.installed,

            active:
                health.active,

            inactive:
                health.inactive.length,

            problematic:
                health.problematic.length,

            missing:
                health.missing.length,

            error:
                health.error.length,

            disabled:
                health.disabled.length,

            paused:
                health.paused.length,

            installing:
                health.installing.length,

            updating:
                health.updating.length,

            untrusted:
                health.untrusted.length,

            permissionReview:
                health.permissionReview.length,

            checkedAt:
                health.checkedAt

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
            "organStatus",
            OrganStatus
        );

    }

} catch(error){

    console.warn(
        "OrganStatus VAERO register başarısız:",
        error
    );

}


window.OrganStatus =
    OrganStatus;
