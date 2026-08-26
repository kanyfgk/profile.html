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
                `Runtime event gönderilemedi: ${eventName}`,
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


        /*
         * Kernel henüz registry'ye bağlı değilse
         * Runtime çökmemeli.
         */

        if(
            !kernel ||
            typeof kernel.health !==
                "function"
        ){

            const fallback = {

                status:
                    "unknown",

                securityReady:
                    false,

                checkedAt:
                    Date.now(),

                reason:
                    "kernel-health-unavailable"

            };


            this.lastHealth =
                fallback;


            return fallback;

        }


        try{

            const health =
                kernel.health();


            this.lastHealth =
                health;


            return health;

        } catch(error){

            const failed = {

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


            this.lastHealth =
                failed;


            return failed;

        }

    },


    /* =====================================================
       SECURITY SIGNAL
    ===================================================== */

    inspectSecurity(health){

        if(!health){
            return;
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
                            ? health.criticalMissing
                            : [],

                    time:
                        Date.now()
                }
            );

        }

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


            this.startedAt =
                Date.now();


            this.stoppedAt =
                null;


            this.lastTickAt =
                null;


            this.ticks =
                0;


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
                            health?.securityReady
                        )
                }
            );


            /*
             * İlk heartbeat anında çalışır.
             */

            this.tick();


            /*
             * Sonraki heartbeat'ler kontrollü
             * interval üzerinden devam eder.
             */

            this.timer =
                setInterval(
                    () => {

                        this.tick();

                    },
                    this.heartbeatInterval
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


        this.ticks += 1;


        this.lastTickAt =
            now;


        const health =
            this.checkHealth();


        this.inspectSecurity(
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
                    this.startedAt
                        ? now -
                          this.startedAt
                        : 0,

                health:
                    health?.status ||
                    "unknown",

                securityReady:
                    Boolean(
                        health?.securityReady
                    )
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
                    Date.now()
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
                    this.ticks
            }
        );


        this.tick();


        this.timer =
            setInterval(
                () => {

                    this.tick();

                },
                this.heartbeatInterval
            );


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
                    this.startedAt
                        ? this.stoppedAt -
                          this.startedAt
                        : 0
            }
        );


        return true;

    },


    /* =====================================================
       TIMER
    ===================================================== */

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


        /*
         * Frontend runtime'ın aşırı sık tick
         * üretmesini engelliyoruz.
         */

        if(
            !Number.isFinite(
                value
            ) ||
            value < 5000 ||
            value > 300000
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

            this.clearTimer();


            this.timer =
                setInterval(
                    () => {

                        this.tick();

                    },
                    this.heartbeatInterval
                );

        }


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
                this.lastHealth

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

        this.booting =
            false;


        return this.report();

    }

};


VAERO.register(
    "runtime",
    Runtime
);


window.Runtime =
    Runtime;
