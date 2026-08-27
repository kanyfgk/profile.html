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

            console.warn(
                `OrganStatus service lookup failed: ${serviceName}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeList(value){

        let source =
            [];


        if(
            Array.isArray(
                value
            )
        ){

            source =
                value;

        }

        else if(
            value instanceof
                Set
        ){

            source =
                [
                    ...value
                ];

        }

        else {

            return [];

        }


        const seen =
            new Set();


        return source
            .map(
                item =>
                    String(
                        item ??
                        ""
                    ).trim()
            )
            .filter(
                item => {

                    if(!item){

                        return false;

                    }


                    const key =
                        item.toLowerCase();


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
            );

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
                value ??
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
                    .filter(Boolean)
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
                id ??
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


        const attempts = [

            () =>
                typeof registry.get ===
                    "function"
                    ? registry.get(
                        target
                    )
                    : null,

            () =>
                typeof registry.find ===
                    "function"
                    ? registry.find(
                        target
                    )
                    : null,

            () =>
                typeof registry.findBySlug ===
                    "function"
                    ? registry.findBySlug(
                        target
                    )
                    : null

        ];


        for(
            const attempt of
            attempts
        ){

            try{

                const result =
                    attempt();


                if(result){

                    return result;

                }

            } catch(error){

                /* continue */

            }

        }


        let records =
            [];


        try{

            if(
                typeof registry.all ===
                    "function"
            ){

                records =
                    registry.all({
                        includeDisabled:
                            true
                    });

            }

        } catch(error){

            try{

                records =
                    registry.all?.() ||
                    [];

            } catch(secondError){

                records =
                    [];

            }

        }


        if(
            !Array.isArray(
                records
            )
        ){

            return null;

        }


        const normalizedTarget =
            target.toLowerCase();


        return (
            records.find(
                record => {

                    const recordId =
                        String(
                            record?.id ??
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const recordSlug =
                        String(
                            record?.slug ??
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        recordId ===
                            normalizedTarget ||
                        recordSlug ===
                            normalizedTarget
                    );

                }
            ) ||
            null
        );

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

            (
                typeof window !==
                    "undefined"
                    ? window.OrganSystem
                    : null
            ) ||

            null
        );

    },


    getRuntimeOrgan(id){

        const target =
            String(
                id ??
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


                const normalizedTarget =
                    target.toLowerCase();


                return (
                    [
                        ...organSystem
                            .organs
                            .values()
                    ]
                        .find(
                            organ =>
                                String(
                                    organ?.slug ??
                                    ""
                                )
                                    .trim()
                                    .toLowerCase() ===
                                    normalizedTarget ||
                                String(
                                    organ?.id ??
                                    ""
                                )
                                    .trim()
                                    .toLowerCase() ===
                                    normalizedTarget
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


        try{

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

        } catch(error){

            /* no-op */

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
                        "object" &&
                    !Array.isArray(
                        report
                    )
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
                        "object" &&
                    !Array.isArray(
                        health
                    )
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
                true ||
            registry?.source ===
                "system" ||
            registry?.source ===
                "built-in"
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
                String(
                    candidate
                ).trim() ===
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

        const health =
            this.normalizeHealth(
                score
            );


        if(
            health ===
                null ||
            health <=
                0
        ){

            return "offline";

        }


        if(
            health >=
                90
        ){

            return "healthy";

        }


        if(
            health >=
                70
        ){

            return "stable";

        }


        if(
            health >=
                40
        ){

            return "degraded";

        }


        return "critical";

    },


    /* =====================================================
       PERMISSION STATE
    ===================================================== */

    permissionsComplete(
        permissions,
        requestedPermissions
    ){

        const granted =
            this.normalizeList(
                permissions
            )
                .map(
                    permission =>
                        permission.toLowerCase()
                );


        const requested =
            this.normalizeList(
                requestedPermissions
            )
                .map(
                    permission =>
                        permission.toLowerCase()
                );


        if(
            requested.length ===
                0
        ){

            return true;

        }


        return requested.every(
            permission =>
                granted.includes(
                    permission
                )
        );

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
                runtime
                    ?.meta
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


        const permissionState =
            this.permissionsComplete(
                permissions,
                requestedPermissions
            );


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
                                "built-in" ||
                            registry?.source ===
                                "system" ||
                            registry?.source ===
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

            permissionsComplete:
                permissionState,

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
                    organ.installed ===
                        true
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


        const permissions =
            this.normalizeList(
                organ.permissions
            );


        const requestedPermissions =
            this.normalizeList(
                organ
                    ?.metadata
                    ?.requestedPermissions ||
                organ
                    ?.meta
                    ?.requestedPermissions ||
                registry
                    ?.requestedPermissions ||
                []
            );


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

            permissions,

            requestedPermissions,

            permissionsComplete:
                this.permissionsComplete(
                    permissions,
                    requestedPermissions
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


        const archived =
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
                .length;


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

            archived

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
                        String(
                            status.id
                        ).toLowerCase()
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


                    if(!id){

                        return;

                    }


                    const key =
                        id.toLowerCase();


                    if(
                        seen.has(
                            key
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
                        key
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
                id ??
                ""
            ).trim();


        if(!organId){

            return null;

        }


        const target =
            organId.toLowerCase();


        return (
            this.all()
                .find(
                    organ =>
                        String(
                            organ.id ??
                            ""
                        )
                            .trim()
                            .toLowerCase() ===
                            target
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
                        70 ||
                    organ.permissionsComplete ===
                        false
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
                                Number.isFinite(
                                    Number(
                                        organ.health
                                    )
                                )
                                    ? Number(
                                        organ.health
                                    )
                                    : 0
                            ),
                        0
                    ) /
                    installedOrgans.length
                )

                : 0;


        const permissionReview =
            organs
                .filter(
                    organ =>
                        organ.installed ===
                            true &&
                        organ.permissionsComplete ===
                            false
                )
                .map(
                    organ =>
                        organ.id
                );


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

            permissionReview,

            problematic:
                problematic.map(
                    organ =>
                        organ.id
                ),

            critical:
                critical.map(
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

            critical:
                health.critical.length,

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


/* =========================================================
   GLOBAL
========================================================= */

window.OrganStatus =
    OrganStatus;
