/* =========================================================
   VAERO RUNTIME
   Engine Heartbeat / Health Supervisor
========================================================= */

const Runtime = {

    status:
        "idle",

    startedAt:
        null,

    stoppedAt:
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
                VAERO.get(
                    name
                ) ||
                null
            );

        } catch(error){

            console.warn(
                `Runtime servisi okunamadı: ${name}`,
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

        let emitted =
            false;


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    eventName,
                    payload
                );


                emitted =
                    true;

            }

        } catch(error){

            console.warn(
                `Runtime event gönderilemedi: ${eventName}`,
                error
            );

        }


        if(emitted){

            return true;

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
                eventName,
                payload
            );


            return true;

        } catch(error){

            console.warn(
                `Runtime event fallback gönderilemedi: ${eventName}`,
                error
            );


            return false;

        }

    },


    /* =====================================================
       HEALTH SNAPSHOT
    ===================================================== */

    checkHealth(){

        const kernel =
            this.getService(
                "kernel"
            );


        const organStatus =
            this.getService(
                "organStatus"
            );


        let kernelHealth =
            null;


        let organHealth =
            null;


        if(
            kernel &&
            typeof kernel.health ===
                "function"
        ){

            try{

                kernelHealth =
                    kernel.health();

            } catch(error){

                kernelHealth = {

                    status:
                        "error",

                    securityReady:
                        false,

                    checkedAt:
                        Date.now(),

                    reason:
                        error?.message ||
                        "kernel-health-error"

                };

            }

        } else {

            kernelHealth = {

                status:
                    "unknown",

                securityReady:
                    false,

                checkedAt:
                    Date.now(),

                reason:
                    "kernel-health-unavailable"

            };

        }


        if(
            organStatus &&
            typeof organStatus.health ===
                "function"
        ){

            try{

                organHealth =
                    organStatus.health();

            } catch(error){

                organHealth = {

                    status:
                        "error",

                    averageHealth:
                        0,

                    reason:
                        error?.message ||
                        "organ-health-error",

                    checkedAt:
                        Date.now()

                };

            }

        }


        const kernelStatus =
            String(
                kernelHealth?.status ||
                "unknown"
            ).toLowerCase();


        const organState =
            String(
                organHealth?.status ||
                "unknown"
            ).toLowerCase();


        const critical =
            kernelStatus ===
                "critical" ||
            kernelStatus ===
                "error" ||
            organState ===
                "critical" ||
            organState ===
                "error";


        const degraded =
            !critical &&
            (
                kernelStatus ===
                    "degraded" ||
                organState ===
                    "degraded"
            );


        const overallStatus =
            critical
                ? "critical"
                : degraded
                    ? "degraded"
                    : kernelStatus ===
                            "healthy" ||
                        organState ===
                            "healthy"
                        ? "healthy"
                        : "unknown";


        const health = {

            status:
                overallStatus,

            securityReady:
                Boolean(
                    kernelHealth?.securityReady
                ),

            kernel:
                kernelHealth,

            organs:
                organHealth,

            criticalMissing:
                Array.isArray(
                    kernelHealth?.criticalMissing
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
       SECURITY SIGNAL
    ===================================================== */

    inspectSecurity(health){

        if(!health){

            return false;

        }


        if(
            health.status ===
                "critical" ||
            health.securityReady ===
                false
        ){

            this.emit(
                "runtime.security.warning",
                {

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
                        health.kernel?.status ||
                        null,

                    organStatus:
                        health.organs?.status ||
                        null,

                    time:
                        Date.now()

                }
            );


            return true;

        }


        return false;

    },


    /* =====================================================
       HEALTH SIGNAL
    ===================================================== */

    inspectHealth(health){

        if(!health){

            return false;

        }


        if(
            health.status ===
                "degraded" ||
            health.status ===
                "critical"
        ){

            this.emit(
                "runtime.health.warning",
                {

                    status:
                        health.status,

                    kernelStatus:
                        health.kernel?.status ||
                        null,

                    organStatus:
                        health.organs?.status ||
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
                        Date.now()

                }
            );


            return true;

        }


        return false;

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


            this.status =
                "running";


            if(!this.startedAt){

                this.startedAt =
                    Date.now();

            }


            this.stoppedAt =
                null;


            this.lastTickAt =
                null;


            const health =
                this.checkHealth();


            this.emit(
                "runtime.started",
                {

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
                        null

                }
            );


            this.tick();


            this.startTimer();


            return this.report();

        } catch(error){

            this.status =
                "error";


            console.error(
                "VAERO Runtime boot failed:",
                error
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


        this.emit(
            "runtime.tick",
            {

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


        this.clearTimer();


        this.emit(
            "runtime.paused",
            {

                ticks:
                    this.ticks,

                pausedAt:
                    Date.now(),

                uptime:
                    this.uptime()

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


        this.status =
            "running";


        this.emit(
            "runtime.resumed",
            {

                resumedAt:
                    Date.now(),

                ticks:
                    this.ticks,

                uptime:
                    this.uptime()

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


        this.status =
            "stopped";


        this.stoppedAt =
            Date.now();


        this.emit(
            "runtime.stopped",
            {

                stoppedAt:
                    this.stoppedAt,

                startedAt:
                    this.startedAt,

                ticks:
                    this.ticks,

                uptime:
                    this.uptime()

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

            clearInterval(
                this.timer
            );


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


        this.emit(
            "runtime.heartbeat.changed",
            {

                heartbeatInterval:
                    this.heartbeatInterval,

                time:
                    Date.now()

            }
        );


        return true;

    },


    /* =====================================================
       UPTIME
    ===================================================== */

    uptime(){

        if(!this.startedAt){

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
       REPORT
    ===================================================== */

    report(){

        return {

            status:
                this.status,

            startedAt:
                this.startedAt,

            stoppedAt:
                this.stoppedAt,

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


        this.lastTickAt =
            null;


        this.ticks =
            0;


        this.lastHealth =
            null;


        this.lastOrganHealth =
            null;


        this.booting =
            false;


        return this.report();

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


window.Runtime =
    Runtime;
