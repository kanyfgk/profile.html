/* =========================================================
   VAERO KERNEL
   Core Service Registry / Integrity / Security State
========================================================= */

const Kernel = {

    services: {},

    booted: false,

    booting: false,

    bootedAt: null,

    bootId: null,

    lastReport: null,

    lastHealth: null,


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
        "memorySystem",
        "timeline",

        "guardian",
        "evolution",

        "brain",

        "components",
        "renderer"

    ],


    /*
     * Bunlar Brain'in çekirdek alt katmanlarıdır.
     *
     * Ana Engine servis listesinden ayrı tutuluyor.
     * Böylece Kernel report içinde Brain'in hangi
     * organının eksik olduğu ayrıca görülebilir.
     */

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


    /*
     * Bu servisler güvenlik / temel veri bütünlüğü
     * açısından kritik kabul edilir.
     */

    criticalServices: [

        "dna",
        "entityManager",
        "identity",
        "runtime",
        "guardian"

    ],


    /* =====================================================
       SAFE VAERO ACCESS
    ===================================================== */

    getRegisteredService(name){

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

            console.error(
                `Kernel service lookup failed: ${name}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(prefix = "kernel"){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID ===
                "function"
        ){

            return crypto.randomUUID();

        }


        return `${prefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    },


    /* =====================================================
       LOAD
    ===================================================== */

    load(name){

        const serviceName =
            String(
                name ?? ""
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
        ] = service;


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
                name ?? ""
            ).trim();


        if(!serviceName){
            return null;
        }


        /*
         * Kernel cache'de yoksa VAERO registry'yi
         * yeniden kontrol eder.
         *
         * Böylece Kernel boot sonrasında register
         * edilen servisler de erişilebilir.
         */

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
       CORE INTEGRITY
    ===================================================== */

    inspectServices(
        list = this.serviceList
    ){

        const result = {};


        list.forEach(
            name => {

                result[name] =
                    this.has(name)
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
       SECURITY STATE
    ===================================================== */

    security(){

        const guardian =
            this.service(
                "guardian"
            );


        const criticalMissing =
            this.getCriticalMissing();


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
                    error:true
                };

            }

        }


        const guardianReady =
            Boolean(
                guardian
            );


        const criticalReady =
            criticalMissing.length ===
            0;


        return {

            ready:
                guardianReady &&
                criticalReady,

            guardian:
                guardianReady
                    ? "OK"
                    : "MISSING",

            criticalReady,

            criticalMissing,

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
                    ([, status]) =>
                        status ===
                        "MISSING"
                )
                .map(
                    ([name]) =>
                        name
                );


        return {

            status:
                missing.length === 0
                    ? "healthy"
                    : "degraded",

            services,

            missing,

            loaded:
                this.brainServiceList
                    .filter(
                        name =>
                            this.has(
                                name
                            )
                    ),

            total:
                this.brainServiceList
                    .length,

            ready:
                this.brainServiceList
                    .length -
                missing.length

        };

    },


    /* =====================================================
       HEALTH
    ===================================================== */

    health(){

        /*
         * Registry yeniden okunur.
         * Böylece health eski Kernel cache'ine
         * güvenmez.
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


        let status =
            "healthy";


        if(
            criticalMissing.length > 0 ||
            !security.ready
        ){

            status =
                "critical";

        }
        else if(
            missing.length > 0 ||
            brain.status !==
                "healthy"
        ){

            status =
                "degraded";

        }


        const result = {

            status,

            booted:
                this.booted,

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

            brain,

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
            totalCore > 0
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

            core: {

                ready:
                    readyCore,

                total:
                    totalCore,

                services:
                    coreServices

            },

            brain,

            security,

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


        if(!security.ready){

            console.error(
                "VAERO Kernel security integrity failed.",
                security
            );


            return false;

        }


        return true;

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(this.booted){

            /*
             * Tekrar boot etmek yerine registry
             * yenilenir ve mevcut durum döndürülür.
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


        try{

            /*
             * DNA yoksa VAERO temel kimliği yoktur.
             * Mevcut Kernel davranışındaki fatal
             * sınırı koruyoruz.
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


            /*
             * Registry'deki çekirdek ve Brain
             * servislerini Kernel cache'e al.
             */

            this.loadAll();


            /*
             * Guardian yoksa Kernel boot tamamen
             * gizlice başarılı sayılmaz.
             */

            if(
                !this.has(
                    "guardian"
                )
            ){

                console.error(
                    "VAERO Guardian not found. Security state is degraded."
                );

            }


            this.booted =
                true;


            this.bootedAt =
                Date.now();


            const health =
                this.health();


            /*
             * Brain'in kendi boot sistemi varsa
             * burada yalnız Brain'i aktive ediyoruz.
             *
             * Runtime / Renderer gibi servislerde
             * içeriğini görmeden boot() çağırmıyoruz.
             */

            const brain =
                this.service(
                    "brain"
                );


            if(
                brain &&
                typeof brain.boot ===
                    "function"
            ){

                try{

                    brain.boot();

                } catch(error){

                    console.error(
                        "Brain boot failed:",
                        error
                    );

                }

            }


            const events =
                this.service(
                    "events"
                );


            if(
                events &&
                typeof events.emit ===
                    "function"
            ){

                try{

                    events.emit(
                        "kernel.ready",
                        {
                            bootId:
                                this.bootId,

                            bootedAt:
                                this.bootedAt,

                            health:
                                health.status,

                            securityReady:
                                health.securityReady
                        }
                    );

                } catch(error){

                    console.warn(
                        "kernel.ready event could not be emitted:",
                        error
                    );

                }

            }


            return this.report();


        } catch(error){

            this.booted =
                false;


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


VAERO.register(
    "kernel",
    Kernel
);


window.Kernel =
    Kernel;
