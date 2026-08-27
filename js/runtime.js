/* =========================================================
   VAERO RUNTIME
   Engine Heartbeat / Health Supervisor
========================================================= */

const Runtime = {

    id:
        "vaero-runtime",

    status:
        "idle",

    startedAt:
        null,

    stoppedAt:
        null,

    pausedAt:
        null,

    lastTickAt:
        null,

    ticks:
        0,

    heartbeatInterval:
        15000,

    timer:
        null,

    booting:
        false,

    lastHealth:
        null,

    lastOrganHealth:
        null,

    lastSecurityWarningAt:
        null,

    lastHealthWarningAt:
        null,

    warningCooldown:
        30000,


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
                `Runtime servisi okunamadı: ${serviceName}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       EVENT EMISSION
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
                `Runtime event gönderilemedi: ${name}`,
                error
            );

        }


        const events =
            this.getService(
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
                `Runtime event fallback gönderilemedi: ${name}`,
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


        const unique =
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
            ];


        unique.forEach(
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
       NORMALIZATION
    ===================================================== */

    normalizeStatus(value){

        const status =
            String(
                value ||
                    "unknown"
            )
                .trim()
                .toLowerCase();


        if(
            [
                "healthy",
                "degraded",
                "critical",
                "error",
                "unknown"
            ].includes(
                status
            )
        ){

            return status;

        }


        return "unknown";

    },


    normalizeTimestamp(
        value,
        fallback = null
    ){

        const timestamp =
            Number(
                value
            );


        return (
            Number.isFinite(
                timestamp
            ) &&
            timestamp >
                0
        )
            ? timestamp
            : fallback;

    },


    /* =====================================================
       HEALTH SOURCE
    ===================================================== */

    readKernelHealth(){

        const kernel =
            this.getService(
                "kernel"
            );


        if(
            !kernel ||
            typeof kernel.health !==
                "function"
        ){

            return {

                status:
                    "unknown",

                securityReady:
                    false,

                criticalMissing:
                    [],

                checkedAt:
                    Date.now(),

                reason:
                    "kernel-health-unavailable"

            };

        }


        try{

            const health =
                kernel.health();


            if(
                !health ||
                typeof health !==
                    "object"
            ){

                return {

                    status:
                        "unknown",

                    securityReady:
                        false,

                    criticalMissing:
                        [],

                    checkedAt:
                        Date.now(),

                    reason:
                        "kernel-health-invalid"

                };

            }


            return {

                ...health,

                status:
                    this.normalizeStatus(
                        health.status
                    ),

                securityReady:
                    Boolean(
                        health.securityReady
                    ),

                criticalMissing:
                    Array.isArray(
                        health.criticalMissing
                    )
                        ? [
                            ...health.criticalMissing
                        ]
                        : [],

                checkedAt:
                    Number(
                        health.checkedAt
                    ) ||
                    Date.now()

            };

        } catch(error){

            return {

                status:
                    "error",

                securityReady:
                    false,

                criticalMissing:
                    [],

                checkedAt:
                    Date.now(),

                reason:
                    error?.message ||
                    "kernel-health-error"

            };

        }

    },


    readOrganHealth(){

        const organStatus =
            this.getService(
                "organStatus"
            );


        if(!organStatus){

            return null;

        }


        try{

            if(
                typeof organStatus.health ===
                    "function"
            ){

                const health =
                    organStatus.health();


                if(
                    health &&
                    typeof health ===
                        "object"
                ){

                    return {

                        ...health,

                        status:
                            this.normalizeStatus(
                                health.status
                            ),

                        checkedAt:
                            Number(
                                health.checkedAt
                            ) ||
                            Date.now()

                    };

                }

            }


            if(
                typeof organStatus.report ===
                    "function"
            ){

                const report =
                    organStatus.report();


                if(
                    report &&
                    typeof report ===
                        "object"
                ){

                    const problematic =
                        Array.isArray(
                            report.problematic
                        )
                            ? [
                                ...report.problematic
                            ]
                            : [];


                    const status =
                        report.critical >
                            0
                            ? "critical"
                            : problematic.length >
                                0
                                ? "degraded"
                                : report.total >
                                    0
                                    ? "healthy"
                                    : "unknown";


                    return {

                        status,

                        averageHealth:
                            report.averageHealth ??
                            null,

                        problematic,

                        report,

                        checkedAt:
                            Date.now()

                    };

                }

            }

        } catch(error){

            return {

                status:
                    "error",

                averageHealth:
                    0,

                problematic:
                    [],

                reason:
                    error?.message ||
                    "organ-health-error",

                checkedAt:
                    Date.now()

            };

        }


        return null;

    },


    /* =====================================================
       HEALTH SNAPSHOT
    ===================================================== */

    checkHealth(){

        const kernelHealth =
            this.readKernelHealth();


        const organHealth =
            this.readOrganHealth();


        const kernelStatus =
            this.normalizeStatus(
                kernelHealth?.status
            );


        const organStatus =
            organHealth
                ? this.normalizeStatus(
                    organHealth.status
                )
                : "unknown";


        const critical =
            [
                kernelStatus,
                organStatus
            ].some(
                status =>
                    status ===
                        "critical" ||
                    status ===
                        "error"
            );


        const degraded =
            !critical &&
            [
                kernelStatus,
                organStatus
            ].some(
                status =>
                    status ===
                        "degraded"
            );


        const healthy =
            !critical &&
            !degraded &&
            (
                kernelStatus ===
                    "healthy" ||
                organStatus ===
                    "healthy"
            );


        const overallStatus =
            critical
                ? "critical"
                : degraded
                    ? "degraded"
                    : healthy
                        ? "healthy"
                        : "unknown";


        const health = {

            status:
                overallStatus,

            securityReady:
                Boolean(
                    kernelHealth
                        ?.securityReady
                ),

            kernel:
                kernelHealth,

            organs:
                organHealth,

            criticalMissing:
                Array.isArray(
                    kernelHealth
                        ?.criticalMissing
                )
                    ? [
                        ...kernelHealth
                            .criticalMissing
                    ]
                    : [],

            checkedAt:
                Date.now()

        };


        this.lastHealth =
            health;


        this.lastOrganHealth =
            organHealth;


        return health;

    },


    /* =====================================================
       WARNING THROTTLE
    ===================================================== */

    canEmitWarning(
        type,
        now = Date.now()
    ){

        const last =
            type ===
                "security"
                ? this.lastSecurityWarningAt
                : this.lastHealthWarningAt;


        if(
            !last ||
            now -
                last >=
                this.warningCooldown
        ){

            return true;

        }


        return false;

    },


    markWarning(
        type,
        now = Date.now()
    ){

        if(
            type ===
                "security"
        ){

            this.lastSecurityWarningAt =
                now;

        }

        else {

            this.lastHealthWarningAt =
                now;

        }


        return true;

    },


    /* =====================================================
       SECURITY SIGNAL
    ===================================================== */

    inspectSecurity(health){

        if(!health){

            return false;

        }


        if(
            health.status !==
                "critical" &&
            health.securityReady !==
                false
        ){

            return false;

        }


        const now =
            Date.now();


        if(
            !this.canEmitWarning(
                "security",
                now
            )
        ){

            return false;

        }


        this.markWarning(
            "security",
            now
        );


        const payload = {

            status:
                health.status ||
                "unknown",

            securityReady:
                Boolean(
                    health.securityReady
                ),

            criticalMissing:
                Array.isArray(
                    health.criticalMissing
                )
                    ? [
                        ...health
                            .criticalMissing
                    ]
                    : [],

            kernelStatus:
                health.kernel
                    ?.status ||
                null,

            organStatus:
                health.organs
                    ?.status ||
                null,

            time:
                now

        };


        this.emitAliases(
            [
                "runtime.security.warning",
                "runtime:security:warning"
            ],
            payload
        );


        return true;

    },


    /* =====================================================
       HEALTH SIGNAL
    ===================================================== */

    inspectHealth(health){

        if(!health){

            return false;

        }


        if(
            health.status !==
                "degraded" &&
            health.status !==
                "critical"
        ){

            return false;

        }


        const now =
            Date.now();


        if(
            !this.canEmitWarning(
                "health",
                now
            )
        ){

            return false;

        }


        this.markWarning(
            "health",
            now
        );


        const payload = {

            status:
                health.status,

            kernelStatus:
                health.kernel
                    ?.status ||
                null,

            organStatus:
                health.organs
                    ?.status ||
                null,

            averageOrganHealth:
                health.organs
                    ?.averageHealth ??
                null,

            problematicOrgans:
                Array.isArray(
                    health.organs
                        ?.problematic
                )
                    ? [
                        ...health
                            .organs
                            .problematic
                    ]
                    : [],

            time:
                now

        };


        this.emitAliases(
            [
                "runtime.health.warning",
                "runtime:health:warning"
            ],
            payload
        );


        return true;

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(
            this.status ===
                "running"
        ){

            return this.report();

        }


        if(this.booting){

            return this.report();

        }


        this.booting =
            true;


        try{

            this.clearTimer();


            const now =
                Date.now();


            this.status =
                "running";


            if(
                !this.startedAt
            ){

                this.startedAt =
                    now;

            }


            this.stoppedAt =
                null;


            this.pausedAt =
                null;


            this.lastTickAt =
                null;


            const health =
                this.checkHealth();


            const payload = {

                id:
                    this.id,

                runtimeId:
                    this.id,

                name:
                    "VAERO Runtime",

                status:
                    this.status,

                startedAt:
                    this.startedAt,

                health:
                    health?.status ||
                    "unknown",

                securityReady:
                    Boolean(
                        health
                            ?.securityReady
                    ),

                organHealth:
                    health?.organs
                        ?.status ||
                    null,

                time:
                    now

            };


            this.emitAliases(
                [
                    "runtime.started",
                    "runtime:started"
                ],
                payload
            );


            /*
             * First health pass happens immediately.
             */

            this.tick();


            this.startTimer();


            return this.report();

        } catch(error){

            this.status =
                "error";


            this.clearTimer();


            console.error(
                "VAERO Runtime boot failed:",
                error
            );


            this.emitAliases(
                [
                    "runtime.error",
                    "runtime:error"
                ],
                {
                    id:
                        this.id,

                    reason:
                        error?.message ||
                        "runtime-boot-error",

                    time:
                        Date.now()
                }
            );


            return this.report();

        } finally {

            this.booting =
                false;

        }

    },


    /* =====================================================
       TICK
    ===================================================== */

    tick(){

        if(
            this.status !==
                "running"
        ){

            return false;

        }


        const now =
            Date.now();


        this.ticks +=
            1;


        this.lastTickAt =
            now;


        const health =
            this.checkHealth();


        this.inspectSecurity(
            health
        );


        this.inspectHealth(
            health
        );


        /*
         * Heartbeat is intentionally operational.
         * Memory / Timeline should not record every tick.
         */

        this.emitAliases(
            [
                "runtime.tick",
                "runtime:tick"
            ],
            {
                id:
                    this.id,

                runtimeId:
                    this.id,

                ticks:
                    this.ticks,

                time:
                    now,

                uptime:
                    this.uptime(),

                health:
                    health?.status ||
                    "unknown",

                securityReady:
                    Boolean(
                        health
                            ?.securityReady
                    ),

                kernelHealth:
                    health?.kernel
                        ?.status ||
                    null,

                organHealth:
                    health?.organs
                        ?.status ||
                    null,

                averageOrganHealth:
                    health?.organs
                        ?.averageHealth ??
                    null
            }
        );


        return true;

    },


    /* =====================================================
       PAUSE / RESUME
    ===================================================== */

    pause(){

        if(
            this.status !==
                "running"
        ){

            return false;

        }


        this.status =
            "paused";


        this.pausedAt =
            Date.now();


        this.clearTimer();


        this.emitAliases(
            [
                "runtime.paused",
                "runtime:paused"
            ],
            {
                id:
                    this.id,

                runtimeId:
                    this.id,

                ticks:
                    this.ticks,

                pausedAt:
                    this.pausedAt,

                uptime:
                    this.uptime(),

                time:
                    this.pausedAt
            }
        );


        return true;

    },


    resume(){

        if(
            this.status !==
                "paused"
        ){

            return false;

        }


        const now =
            Date.now();


        this.status =
            "running";


        this.pausedAt =
            null;


        this.emitAliases(
            [
                "runtime.resumed",
                "runtime:resumed"
            ],
            {
                id:
                    this.id,

                runtimeId:
                    this.id,

                resumedAt:
                    now,

                ticks:
                    this.ticks,

                uptime:
                    this.uptime(),

                time:
                    now
            }
        );


        this.tick();


        this.startTimer();


        return true;

    },


    /* =====================================================
       STOP
    ===================================================== */

    stop(){

        if(
            this.status ===
                "idle" ||
            this.status ===
                "stopped"
        ){

            this.clearTimer();


            return true;

        }


        this.clearTimer();


        const now =
            Date.now();


        this.status =
            "stopped";


        this.stoppedAt =
            now;


        this.pausedAt =
            null;


        this.emitAliases(
            [
                "runtime.stopped",
                "runtime:stopped"
            ],
            {
                id:
                    this.id,

                runtimeId:
                    this.id,

                stoppedAt:
                    this.stoppedAt,

                startedAt:
                    this.startedAt,

                ticks:
                    this.ticks,

                uptime:
                    this.uptime(),

                time:
                    now
            }
        );


        return true;

    },


    /* =====================================================
       TIMER
    ===================================================== */

    startTimer(){

        this.clearTimer();


        if(
            this.status !==
                "running"
        ){

            return false;

        }


        if(
            typeof setInterval !==
                "function"
        ){

            return false;

        }


        this.timer =
            setInterval(
                () => {

                    this.tick();

                },
                this.heartbeatInterval
            );


        return true;

    },


    clearTimer(){

        if(this.timer){

            try{

                clearInterval(
                    this.timer
                );

            } catch(error){

                /* timer already invalid */

            }


            this.timer =
                null;

        }


        return true;

    },


    setHeartbeatInterval(
        milliseconds
    ){

        const value =
            Number(
                milliseconds
            );


        if(
            !Number.isFinite(
                value
            ) ||
            value <
                5000 ||
            value >
                300000
        ){

            return false;

        }


        this.heartbeatInterval =
            Math.round(
                value
            );


        if(
            this.status ===
                "running"
        ){

            this.startTimer();

        }


        this.emitAliases(
            [
                "runtime.heartbeat.changed",
                "runtime:heartbeat:changed"
            ],
            {
                heartbeatInterval:
                    this.heartbeatInterval,

                time:
                    Date.now()
            }
        );


        return true;

    },


    setWarningCooldown(
        milliseconds
    ){

        const value =
            Number(
                milliseconds
            );


        if(
            !Number.isFinite(
                value
            ) ||
            value <
                5000 ||
            value >
                600000
        ){

            return false;

        }


        this.warningCooldown =
            Math.round(
                value
            );


        return true;

    },


    /* =====================================================
       UPTIME
    ===================================================== */

    uptime(){

        if(
            !this.startedAt
        ){

            return 0;

        }


        const end =
            this.status ===
                "stopped" &&
            this.stoppedAt
                ? this.stoppedAt
                : Date.now();


        return Math.max(
            0,
            end -
            this.startedAt
        );

    },


    /* =====================================================
       HEALTH REFRESH
    ===================================================== */

    refreshHealth(){

        const health =
            this.checkHealth();


        this.inspectSecurity(
            health
        );


        this.inspectHealth(
            health
        );


        this.emitAliases(
            [
                "runtime.health.checked",
                "runtime:health:checked"
            ],
            {
                health,

                time:
                    Date.now()
            }
        );


        return health;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            id:
                this.id,

            status:
                this.status,

            startedAt:
                this.startedAt,

            stoppedAt:
                this.stoppedAt,

            pausedAt:
                this.pausedAt,

            lastTickAt:
                this.lastTickAt,

            ticks:
                this.ticks,

            uptime:
                this.uptime(),

            heartbeatInterval:
                this.heartbeatInterval,

            heartbeatActive:
                Boolean(
                    this.timer
                ),

            booting:
                this.booting,

            warningCooldown:
                this.warningCooldown,

            lastSecurityWarningAt:
                this.lastSecurityWarningAt,

            lastHealthWarningAt:
                this.lastHealthWarningAt,

            health:
                this.lastHealth,

            organHealth:
                this.lastOrganHealth

        };

    },


    /* =====================================================
       RESET
    ===================================================== */

    reset(){

        this.clearTimer();


        this.status =
            "idle";


        this.startedAt =
            null;


        this.stoppedAt =
            null;


        this.pausedAt =
            null;


        this.lastTickAt =
            null;


        this.ticks =
            0;


        this.lastHealth =
            null;


        this.lastOrganHealth =
            null;


        this.lastSecurityWarningAt =
            null;


        this.lastHealthWarningAt =
            null;


        this.booting =
            false;


        const report =
            this.report();


        this.emitAliases(
            [
                "runtime.reset",
                "runtime:reset"
            ],
            {
                ...report,

                time:
                    Date.now()
            }
        );


        return report;

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
            "runtime",
            Runtime
        );

    }

} catch(error){

    console.warn(
        "Runtime VAERO register başarısız:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.Runtime =
        Runtime;

}
