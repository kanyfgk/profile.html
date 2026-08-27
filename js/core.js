/* =========================================================
   VAERO CORE
   Global Registry / Bootstrap Event Bridge / Root Runtime
========================================================= */

const VAERO = {

    version:
        "2.0",

    engine:
        null,

    renderer:
        null,


    /* =====================================================
       SERVICE REGISTRY
    ===================================================== */

    registry:
        Object.create(
            null
        ),


    /* =====================================================
       BOOTSTRAP EVENTS

       core.js loads before core/events.js.

       Listeners registered before EventSystem exists are
       temporarily stored here and transferred when the
       "events" service is registered.
    ===================================================== */

    events:
        Object.create(
            null
        ),


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeName(name){

        const value =
            String(
                name ??
                    ""
            )
                .trim()
                .slice(
                    0,
                    240
                );


        return (
            value ||
            null
        );

    },


    /* =====================================================
       REGISTER
    ===================================================== */

    register(
        name,
        object
    ){

        const serviceName =
            this.normalizeName(
                name
            );


        if(!serviceName){

            console.warn(
                "VAERO register rejected: invalid service name."
            );


            return null;

        }


        if(
            object ===
                undefined ||
            object ===
                null
        ){

            console.warn(
                `VAERO register rejected: ${serviceName} has no service object.`
            );


            return null;

        }


        const previous =
            this.registry[
                serviceName
            ] ||
            null;


        this.registry[
            serviceName
        ] =
            object;


        /*
         * EventSystem is special because core.js may have
         * collected listeners before core/events.js loaded.
         *
         * As soon as EventSystem becomes available those
         * bootstrap listeners are transferred to it.
         */

        if(
            serviceName ===
                "events"
        ){

            this.attachBootstrapEvents(
                object
            );

        }


        return previous ||
            object;

    },


    /* =====================================================
       GET
    ===================================================== */

    get(name){

        const serviceName =
            this.normalizeName(
                name
            );


        if(!serviceName){

            return null;

        }


        return (
            this.registry[
                serviceName
            ] ||
            null
        );

    },


    has(name){

        return Boolean(
            this.get(
                name
            )
        );

    },


    /* =====================================================
       UNREGISTER
    ===================================================== */

    unregister(
        name,
        expectedObject = null
    ){

        const serviceName =
            this.normalizeName(
                name
            );


        if(!serviceName){

            return false;

        }


        const current =
            this.registry[
                serviceName
            ];


        if(!current){

            return false;

        }


        /*
         * Optional identity guard prevents one subsystem
         * from removing a service instance it does not own.
         */

        if(
            expectedObject !==
                null &&
            expectedObject !==
                current
        ){

            return false;

        }


        /*
         * Central Events service should not be casually
         * removed after the Engine has begun using it.
         */

        if(
            serviceName ===
                "events"
        ){

            console.warn(
                "VAERO Events service cannot be unregistered through the generic registry."
            );


            return false;

        }


        delete this.registry[
            serviceName
        ];


        return true;

    },


    /* =====================================================
       REGISTRY QUERY
    ===================================================== */

    serviceNames(){

        return Object.keys(
            this.registry
        );

    },


    services(){

        return {
            ...this.registry
        };

    },


    /* =====================================================
       BOOTSTRAP EVENT TRANSFER
    ===================================================== */

    attachBootstrapEvents(
        eventSystem
    ){

        if(
            !eventSystem ||
            typeof eventSystem.on !==
                "function"
        ){

            return false;

        }


        const names =
            Object.keys(
                this.events
            );


        names.forEach(
            eventName => {

                const listeners =
                    Array.isArray(
                        this.events[
                            eventName
                        ]
                    )
                        ? [
                            ...this.events[
                                eventName
                            ]
                        ]
                        : [];


                listeners.forEach(
                    callback => {

                        if(
                            typeof callback !==
                                "function"
                        ){

                            return;

                        }


                        try{

                            eventSystem.on(
                                eventName,
                                callback
                            );

                        } catch(error){

                            console.error(
                                `Bootstrap event transfer failed: ${eventName}`,
                                error
                            );

                        }

                    }
                );

            }
        );


        /*
         * Once transferred, bootstrap storage no longer
         * acts as a second event bus.
         */

        this.events =
            Object.create(
                null
            );


        return true;

    },


    /* =====================================================
       ON
    ===================================================== */

    on(
        eventName,
        callback
    ){

        const name =
            this.normalizeName(
                eventName
            );


        if(
            !name ||
            typeof callback !==
                "function"
        ){

            return () => false;

        }


        const eventSystem =
            this.get(
                "events"
            );


        /*
         * EventSystem is authoritative once available.
         */

        if(
            eventSystem &&
            typeof eventSystem.on ===
                "function"
        ){

            try{

                const unsubscribe =
                    eventSystem.on(
                        name,
                        callback
                    );


                return typeof unsubscribe ===
                    "function"
                    ? unsubscribe
                    : () =>
                        this.off(
                            name,
                            callback
                        );

            } catch(error){

                console.error(
                    `VAERO event listener registration failed: ${name}`,
                    error
                );


                return () => false;

            }

        }


        /*
         * EventSystem has not loaded yet.
         * Keep listener in the bootstrap queue.
         */

        if(
            !Array.isArray(
                this.events[
                    name
                ]
            )
        ){

            this.events[
                name
            ] =
                [];

        }


        if(
            !this.events[
                name
            ].includes(
                callback
            )
        ){

            this.events[
                name
            ].push(
                callback
            );

        }


        return () =>
            this.off(
                name,
                callback
            );

    },


    /* =====================================================
       ONCE
    ===================================================== */

    once(
        eventName,
        callback
    ){

        const name =
            this.normalizeName(
                eventName
            );


        if(
            !name ||
            typeof callback !==
                "function"
        ){

            return () => false;

        }


        const eventSystem =
            this.get(
                "events"
            );


        if(
            eventSystem &&
            typeof eventSystem.once ===
                "function"
        ){

            try{

                return eventSystem.once(
                    name,
                    callback
                );

            } catch(error){

                console.error(
                    `VAERO once listener registration failed: ${name}`,
                    error
                );


                return () => false;

            }

        }


        /*
         * Bootstrap-compatible once wrapper.
         */

        const wrapper =
            payload => {

                this.off(
                    name,
                    wrapper
                );


                callback(
                    payload
                );

            };


        return this.on(
            name,
            wrapper
        );

    },


    /* =====================================================
       OFF
    ===================================================== */

    off(
        eventName,
        callback
    ){

        const name =
            this.normalizeName(
                eventName
            );


        if(!name){

            return false;

        }


        const eventSystem =
            this.get(
                "events"
            );


        if(
            eventSystem &&
            typeof eventSystem.off ===
                "function"
        ){

            try{

                return eventSystem.off(
                    name,
                    callback
                );

            } catch(error){

                console.error(
                    `VAERO event listener removal failed: ${name}`,
                    error
                );


                return false;

            }

        }


        const listeners =
            this.events[
                name
            ];


        if(
            !Array.isArray(
                listeners
            )
        ){

            return false;

        }


        if(
            callback ===
                undefined
        ){

            delete this.events[
                name
            ];


            return true;

        }


        if(
            typeof callback !==
                "function"
        ){

            return false;

        }


        const next =
            listeners.filter(
                item =>
                    item !==
                        callback
            );


        if(
            next.length ===
                listeners.length
        ){

            return false;

        }


        if(
            next.length ===
                0
        ){

            delete this.events[
                name
            ];

        }

        else {

            this.events[
                name
            ] =
                next;

        }


        return true;

    },


    /* =====================================================
       EMIT
    ===================================================== */

    emit(
        eventName,
        payload = {}
    ){

        const name =
            this.normalizeName(
                eventName
            );


        if(!name){

            return false;

        }


        const eventSystem =
            this.get(
                "events"
            );


        /*
         * Once EventSystem exists, all events flow through
         * the single authoritative event bus.
         */

        if(
            eventSystem &&
            typeof eventSystem.emit ===
                "function"
        ){

            try{

                eventSystem.emit(
                    name,
                    payload
                );


                return true;

            } catch(error){

                console.error(
                    `VAERO event emission failed: ${name}`,
                    error
                );


                return false;

            }

        }


        /*
         * Bootstrap emission for the very small period
         * between core.js and core/events.js loading.
         */

        const listeners =
            Array.isArray(
                this.events[
                    name
                ]
            )
                ? [
                    ...this.events[
                        name
                    ]
                ]
                : [];


        listeners.forEach(
            callback => {

                if(
                    typeof callback !==
                        "function"
                ){

                    return;

                }


                try{

                    callback(
                        payload
                    );

                } catch(error){

                    /*
                     * A bootstrap listener must never stop
                     * delivery to the remaining listeners.
                     */

                    console.error(
                        `VAERO bootstrap event listener failed: ${name}`,
                        error
                    );

                }

            }
        );


        return true;

    },


    /* =====================================================
       ROOT REFERENCES
    ===================================================== */

    setEngine(engine){

        if(
            !engine ||
            (
                typeof engine !==
                    "object" &&
                typeof engine !==
                    "function"
            )
        ){

            return false;

        }


        this.engine =
            engine;


        return true;

    },


    setRenderer(renderer){

        if(
            !renderer ||
            (
                typeof renderer !==
                    "object" &&
                typeof renderer !==
                    "function"
            )
        ){

            return false;

        }


        this.renderer =
            renderer;


        return true;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const eventSystem =
            this.get(
                "events"
            );


        let eventReport =
            null;


        if(
            eventSystem &&
            typeof eventSystem.report ===
                "function"
        ){

            try{

                eventReport =
                    eventSystem.report();

            } catch(error){

                eventReport = {

                    error:
                        true,

                    reason:
                        error?.message ||
                        "event-report-error"

                };

            }

        }


        return {

            version:
                this.version,

            services:
                this.serviceNames(),

            serviceCount:
                this.serviceNames()
                    .length,

            engine:
                Boolean(
                    this.engine
                ),

            renderer:
                Boolean(
                    this.renderer
                ),

            eventsReady:
                Boolean(
                    eventSystem
                ),

            bootstrapEvents:
                Object.keys(
                    this.events
                ).length,

            eventSystem:
                eventReport

        };

    }

};
