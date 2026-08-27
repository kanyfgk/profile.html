/* =========================================================
   VAERO KERNEL
   Core Service Registry / Boot Orchestration /
   Integrity / Security State
========================================================= */

const Kernel = {

    services:
        {},

    booted:
        false,

    booting:
        false,

    bootedAt:
        null,

    bootId:
        null,

    lastReport:
        null,

    lastHealth:
        null,

    serviceBootState:
        {},


    /* =====================================================
       CORE SERVICES
    ===================================================== */

    serviceList: [

        "dna",
        "events",

        "entityManager",
        "identity",
        "profile",

        "bridge",
        "graph",

        "universe",
        "world",

        "runtime",

        "organSystem",
        "organStatus",

        "memorySystem",
        "timeline",

        "guardian",
        "evolution",

        "brain",

        "components",
        "renderer"

    ],


    /* =====================================================
       BRAIN FOUNDATION
    ===================================================== */

    brainServiceList: [

        "brainContext",
        "brainAwareness",
        "brainIntent",
        "brainActionPolicy",
        "brainActions",
        "brainSkills",
        "brainMode",
        "brainService",
        "brainCore"

    ],


    /* =====================================================
       CRITICAL SERVICES

       Missing one of these means core integrity cannot
       be considered healthy.
    ===================================================== */

    criticalServices: [

        "dna",
        "events",
        "entityManager",
        "identity",
        "guardian"

    ],


    /* =====================================================
       BOOT ORDER

       Only services whose exact boot contract is known
       are orchestrated here.

       Runtime is intentionally last because it observes
       Kernel + Organ health after the rest is ready.
    ===================================================== */

    bootOrder: [

        "organSystem",

        "identity",
        "profile",

        "world",
        "universe",

        "bridge",
        "graph",

        "memorySystem",
        "timeline",

        "brain",

        "runtime"

    ],


    /* =====================================================
       SAFE VAERO ACCESS
    ===================================================== */

    getRegisteredService(name){

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

            console.error(
                `Kernel service lookup failed: ${serviceName}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       EVENT
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
                `Kernel event gönderilemedi: ${name}`,
                error
            );

        }


        const events =
            this.service(
                "events"
            );


        if(
            !events ||
            typeof events.emit !==
                "function"
        ){

            return false;

        }


        try{

            events.emit(
                name,
                payload
            );


            return true;

        } catch(error){

            console.warn(
                `Kernel event fallback gönderilemedi: ${name}`,
                error
            );


            return false;

        }

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
       ID
    ===================================================== */

    createId(prefix = "kernel"){

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

            /* fallback below */

        }


        return `${prefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       LOAD
    ===================================================== */

    load(name){

        const serviceName =
            String(
                name ??
                    ""
            ).trim();


        if(!serviceName){

            return null;

        }


        const service =
            this.getRegisteredService(
                serviceName
            );


        if(!service){

            delete this.services[
                serviceName
            ];


            return null;

        }


        this.services[
            serviceName
        ] =
            service;


        return service;

    },


    loadAll(){

        const names =
            [
                ...new Set([
                    ...this.serviceList,
                    ...this.brainServiceList
                ])
            ];


        names.forEach(
            name => {

                this.load(
                    name
                );

            }
        );


        return this.services;

    },


    /* =====================================================
       SERVICE ACCESS
    ===================================================== */

    service(name){

        const serviceName =
            String(
                name ??
                    ""
            ).trim();


        if(!serviceName){

            return null;

        }


        if(
            !this.services[
                serviceName
            ]
        ){

            return this.load(
                serviceName
            );

        }


        return this.services[
            serviceName
        ];

    },


    has(name){

        return Boolean(
            this.service(
                name
            )
        );

    },


    /* =====================================================
       SERVICE BOOT STATE
    ===================================================== */

    setBootState(
        name,
        state,
        details = {}
    ){

        const serviceName =
            String(
                name ??
                    ""
            ).trim();


        if(!serviceName){

            return false;

        }


        this.serviceBootState[
            serviceName
        ] = {

            service:
                serviceName,

            state:
                String(
                    state ||
                    "unknown"
                ),

            ...(
                details &&
                typeof details ===
                    "object" &&
                !Array.isArray(
                    details
                )
                    ? details
                    : {}
            ),

            updatedAt:
                Date.now()

        };


        return true;

    },


    getBootState(name){

        const serviceName =
            String(
                name ??
                    ""
            ).trim();


        if(!serviceName){

            return null;

        }


        return (
            this.serviceBootState[
                serviceName
            ] ||
            null
        );

    },


    /* =====================================================
       CORE INTEGRITY
    ===================================================== */

    inspectServices(
        list = this.serviceList
    ){

        const result =
            {};


        list.forEach(
            name => {

                result[
                    name
                ] =
                    this.has(
                        name
                    )
                        ? "OK"
                        : "MISSING";

            }
        );


        return result;

    },


    getMissing(
        list = this.serviceList
    ){

        return list.filter(
            name =>
                !this.has(
                    name
                )
        );

    },


    getCriticalMissing(){

        return this.getMissing(
            this.criticalServices
        );

    },


    /* =====================================================
       DNA STATE
    ===================================================== */

    dnaHealth(){

        const dna =
            this.service(
                "dna"
            );


        if(!dna){

            return {

                status:
                    "critical",

                valid:
                    false,

                reason:
                    "dna-missing"

            };

        }


        if(
            typeof dna.validate !==
                "function"
        ){

            return {

                status:
                    "degraded",

                valid:
                    true,

                reason:
                    "dna-validation-unavailable"

            };

        }


        try{

            const validation =
                dna.validate();


            return {

                status:
                    validation?.valid ===
                        true
                        ? "healthy"
                        : "critical",

                valid:
                    validation?.valid ===
                        true,

                issues:
                    Array.isArray(
                        validation?.issues
                    )
                        ? [
                            ...validation.issues
                        ]
                        : [],

                checkedAt:
                    validation?.checkedAt ||
                    Date.now()

            };

        } catch(error){

            return {

                status:
                    "critical",

                valid:
                    false,

                reason:
                    error?.message ||
                    "dna-validation-error"

            };

        }

    },


    /* =====================================================
       SECURITY STATE
    ===================================================== */

    security(){

        const guardian =
            this.service(
                "guardian"
            );


        const criticalMissing =
            this.getCriticalMissing();


        const dna =
            this.dnaHealth();


        let guardianStatus =
            null;


        if(
            guardian &&
            typeof guardian.status ===
                "function"
        ){

            try{

                guardianStatus =
                    guardian.status();

            } catch(error){

                guardianStatus = {

                    error:
                        true,

                    reason:
                        error?.message ||
                        "guardian-status-error"

                };

            }

        }


        const guardianReady =
            Boolean(
                guardian
            );


        const guardianCritical =
            Number(
                guardianStatus
                    ?.criticalViolations ||
                0
            ) >
            0;


        const criticalReady =
            criticalMissing.length ===
                0;


        const dnaReady =
            dna.valid ===
                true;


        return {

            ready:
                guardianReady &&
                criticalReady &&
                dnaReady &&
                !guardianCritical,

            guardian:
                guardianReady
                    ? "OK"
                    : "MISSING",

            guardianCritical,

            criticalReady,

            criticalMissing,

            dna,

            guardianStatus,

            checkedAt:
                Date.now()

        };

    },


    /* =====================================================
       BRAIN STATE
    ===================================================== */

    brainHealth(){

        const services =
            this.inspectServices(
                this.brainServiceList
            );


        const missing =
            Object.entries(
                services
            )
                .filter(
                    (
                        [
                            ,
                            status
                        ]
                    ) =>
                        status ===
                            "MISSING"
                )
                .map(
                    (
                        [
                            name
                        ]
                    ) =>
                        name
                );


        const loaded =
            this.brainServiceList.filter(
                name =>
                    this.has(
                        name
                    )
            );


        return {

            status:
                missing.length ===
                    0
                    ? "healthy"
                    : "degraded",

            services,

            missing,

            loaded,

            total:
                this.brainServiceList.length,

            ready:
                loaded.length

        };

    },


    /* =====================================================
       ORGAN STATE
    ===================================================== */

    organHealth(){

        const organStatus =
            this.service(
                "organStatus"
            );


        if(!organStatus){

            return {

                status:
                    "unknown",

                reason:
                    "organ-status-unavailable"

            };

        }


        try{

            if(
                typeof organStatus.health ===
                    "function"
            ){

                return (
                    organStatus.health() ||
                    {
                        status:
                            "unknown"
                    }
                );

            }


            if(
                typeof organStatus.report ===
                    "function"
            ){

                return (
                    organStatus.report() ||
                    {
                        status:
                            "unknown"
                    }
                );

            }

        } catch(error){

            return {

                status:
                    "error",

                reason:
                    error?.message ||
                    "organ-health-error"

            };

        }


        return {

            status:
                "unknown"

        };

    },


    /* =====================================================
       HEALTH
    ===================================================== */

    health(){

        /*
         * Always refresh registry before calculating health.
         */

        this.loadAll();


        const missing =
            this.getMissing(
                this.serviceList
            );


        const criticalMissing =
            this.getCriticalMissing();


        const security =
            this.security();


        const brain =
            this.brainHealth();


        const organs =
            this.organHealth();


        const dna =
            security.dna;


        let status =
            "healthy";


        if(
            criticalMissing.length >
                0 ||
            !security.ready ||
            dna.status ===
                "critical" ||
            organs?.status ===
                "critical" ||
            organs?.status ===
                "error"
        ){

            status =
                "critical";

        }

        else if(
            missing.length >
                0 ||
            brain.status !==
                "healthy" ||
            organs?.status ===
                "degraded"
        ){

            status =
                "degraded";

        }


        const result = {

            status,

            booted:
                this.booted,

            booting:
                this.booting,

            securityReady:
                security.ready,

            missing,

            criticalMissing,

            loaded:
                Object.keys(
                    this.services
                ),

            total:
                Object.keys(
                    this.services
                ).length,

            security,

            dna,

            brain,

            organs,

            checkedAt:
                Date.now()

        };


        this.lastHealth =
            result;


        return result;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        this.loadAll();


        const coreServices =
            this.inspectServices(
                this.serviceList
            );


        const brain =
            this.brainHealth();


        const security =
            this.security();


        const totalCore =
            this.serviceList.length;


        const readyCore =
            this.serviceList.filter(
                name =>
                    this.has(
                        name
                    )
            ).length;


        const integrity =
            totalCore >
                0
                ? Math.round(
                    readyCore /
                    totalCore *
                    100
                )
                : 0;


        const result = {

            booted:
                this.booted,

            booting:
                this.booting,

            bootId:
                this.bootId,

            bootedAt:
                this.bootedAt,

            integrity:
                `${integrity}%`,

            integrityPercent:
                integrity,

            core:{

                ready:
                    readyCore,

                total:
                    totalCore,

                missing:
                    this.getMissing(
                        this.serviceList
                    ),

                services:
                    coreServices

            },

            brain,

            security,

            bootState:{
                ...this.serviceBootState
            },

            loaded:
                Object.keys(
                    this.services
                ),

            generatedAt:
                Date.now()

        };


        this.lastReport =
            result;


        return result;

    },


    /* =====================================================
       ASSERT SECURITY
    ===================================================== */

    assertSecurity(){

        const security =
            this.security();


        if(
            !security.ready
        ){

            console.error(
                "VAERO Kernel security integrity failed.",
                security
            );


            return false;

        }


        return true;

    },


    /* =====================================================
       BOOT ONE SERVICE
    ===================================================== */

    bootService(name){

        const serviceName =
            String(
                name ??
                    ""
            ).trim();


        if(!serviceName){

            return false;

        }


        const service =
            this.service(
                serviceName
            );


        if(!service){

            this.setBootState(
                serviceName,
                "missing"
            );


            return false;

        }


        /*
         * Evolution initializes itself when its script
         * loads, therefore no generic init() guessing here.
         */

        if(
            typeof service.boot !==
                "function"
        ){

            this.setBootState(
                serviceName,
                "not-required"
            );


            return true;

        }


        try{

            this.setBootState(
                serviceName,
                "booting"
            );


            const result =
                service.boot();


            /*
             * A service explicitly returning false means
             * its boot requirements were not satisfied.
             */

            if(
                result ===
                    false
            ){

                this.setBootState(
                    serviceName,
                    "failed",
                    {
                        reason:
                            "service-returned-false"
                    }
                );


                return false;

            }


            this.setBootState(
                serviceName,
                "ready"
            );


            return true;

        } catch(error){

            this.setBootState(
                serviceName,
                "error",
                {
                    reason:
                        error?.message ||
                        "service-boot-error"
                }
            );


            console.error(
                `Kernel service boot failed: ${serviceName}`,
                error
            );


            return false;

        }

    },


    /* =====================================================
       BOOT CORE SERVICES
    ===================================================== */

    bootCoreServices(){

        const results =
            {};


        this.bootOrder.forEach(
            name => {

                results[
                    name
                ] =
                    this.bootService(
                        name
                    );

            }
        );


        return results;

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(
            this.booted
        ){

            /*
             * Boot is idempotent.
             * Refresh registry and return current state.
             */

            this.loadAll();


            return this.report();

        }


        if(this.booting){

            return this.report();

        }


        this.booting =
            true;


        this.bootId =
            this.createId(
                "kernel-boot"
            );


        const startedAt =
            Date.now();


        try{

            /*
             * DNA is the absolute architectural boundary.
             */

            const dna =
                this.getRegisteredService(
                    "dna"
                );


            if(!dna){

                throw new Error(
                    "VAERO DNA not found."
                );

            }


            this.loadAll();


            /*
             * Events are required before boot orchestration
             * because almost every living core service
             * subscribes to the central event layer.
             */

            if(
                !this.has(
                    "events"
                )
            ){

                throw new Error(
                    "VAERO Events service not found."
                );

            }


            if(
                !this.has(
                    "guardian"
                )
            ){

                console.error(
                    "VAERO Guardian not found. Security state is critical."
                );

            }


            /*
             * Kernel itself is considered initialized before
             * child service boot begins. Runtime health can
             * therefore inspect Kernel safely.
             */

            this.booted =
                true;


            this.bootedAt =
                Date.now();


            const bootResults =
                this.bootCoreServices();


            const health =
                this.health();


            const payload = {

                bootId:
                    this.bootId,

                bootedAt:
                    this.bootedAt,

                duration:
                    Date.now() -
                    startedAt,

                health:
                    health.status,

                securityReady:
                    health.securityReady,

                bootResults,

                time:
                    Date.now()

            };


            this.emitAliases(
                [
                    "kernel.ready",
                    "kernel:ready"
                ],
                payload
            );


            return this.report();

        } catch(error){

            this.booted =
                false;


            this.emitAliases(
                [
                    "kernel.error",
                    "kernel:error"
                ],
                {
                    bootId:
                        this.bootId,

                    reason:
                        error?.message ||
                        "kernel-boot-error",

                    time:
                        Date.now()
                }
            );


            console.error(
                "VAERO Kernel boot failed:",
                error
            );


            throw error;

        } finally {

            this.booting =
                false;

        }

    },


    /* =====================================================
       REFRESH
    ===================================================== */

    refresh(){

        this.loadAll();


        return this.health();

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
            "kernel",
            Kernel
        );

    }

} catch(error){

    console.error(
        "Kernel register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.Kernel =
        Kernel;

}
