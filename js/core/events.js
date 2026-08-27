/* =========================================================
   VAERO EVENT SYSTEM
   Core Synchronous Event Bus
========================================================= */

class EventSystem {

    constructor(){

        this.events =
            new Map();


        this.emitted =
            0;


        this.delivered =
            0;


        this.errors =
            0;


        this.createdAt =
            Date.now();


        this.lastEvent =
            null;


        this.maxListenersPerEvent =
            100;


        console.log(
            "VAERO EventSystem Ready"
        );

    }


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

    }


    /* =====================================================
       REGISTER LISTENER
    ===================================================== */

    on(
        name,
        callback
    ){

        const eventName =
            this.normalizeName(
                name
            );


        if(
            !eventName ||
            typeof callback !==
                "function"
        ){

            return () => false;

        }


        if(
            !this.events.has(
                eventName
            )
        ){

            this.events.set(
                eventName,
                []
            );

        }


        const listeners =
            this.events.get(
                eventName
            );


        /*
         * Aynı callback aynı event'e yanlışlıkla
         * iki kez bağlanmasın.
         */

        if(
            listeners.some(
                listener =>
                    listener.callback ===
                        callback
            )
        ){

            return () =>
                this.off(
                    eventName,
                    callback
                );

        }


        if(
            listeners.length >=
                this.maxListenersPerEvent
        ){

            console.warn(
                `Event listener limit reached: ${eventName}`
            );


            return () => false;

        }


        listeners.push({

            callback,

            once:
                false,

            createdAt:
                Date.now()

        });


        /*
         * on() unsubscribe function döndürür.
         * Eski kullanım biçimini bozmaz.
         */

        return () =>
            this.off(
                eventName,
                callback
            );

    }


    /* =====================================================
       ONCE
    ===================================================== */

    once(
        name,
        callback
    ){

        const eventName =
            this.normalizeName(
                name
            );


        if(
            !eventName ||
            typeof callback !==
                "function"
        ){

            return () => false;

        }


        if(
            !this.events.has(
                eventName
            )
        ){

            this.events.set(
                eventName,
                []
            );

        }


        const listeners =
            this.events.get(
                eventName
            );


        if(
            listeners.length >=
                this.maxListenersPerEvent
        ){

            console.warn(
                `Event listener limit reached: ${eventName}`
            );


            return () => false;

        }


        listeners.push({

            callback,

            once:
                true,

            createdAt:
                Date.now()

        });


        return () =>
            this.off(
                eventName,
                callback
            );

    }


    /* =====================================================
       REMOVE LISTENER
    ===================================================== */

    off(
        name,
        callback
    ){

        const eventName =
            this.normalizeName(
                name
            );


        if(
            !eventName ||
            !this.events.has(
                eventName
            )
        ){

            return false;

        }


        /*
         * Callback verilmezse event'in bütün
         * listener'ları kaldırılır.
         */

        if(
            callback ===
                undefined
        ){

            this.events.delete(
                eventName
            );


            return true;

        }


        if(
            typeof callback !==
                "function"
        ){

            return false;

        }


        const listeners =
            this.events.get(
                eventName
            );


        const next =
            listeners.filter(
                listener =>
                    listener.callback !==
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

            this.events.delete(
                eventName
            );

        }

        else {

            this.events.set(
                eventName,
                next
            );

        }


        return true;

    }


    /* =====================================================
       EMIT
    ===================================================== */

    emit(
        name,
        data = {}
    ){

        const eventName =
            this.normalizeName(
                name
            );


        if(!eventName){

            return {

                emitted:
                    false,

                delivered:
                    0,

                errors:
                    0

            };

        }


        const now =
            Date.now();


        this.emitted +=
            1;


        this.lastEvent = {

            name:
                eventName,

            time:
                now

        };


        const listeners =
            this.events.get(
                eventName
            );


        /*
         * Listener olmaması hata değildir.
         * Event tabanlı sistemde bazı event'lerin
         * dinleyicisi olmayabilir.
         */

        if(
            !listeners ||
            listeners.length ===
                0
        ){

            return {

                emitted:
                    true,

                delivered:
                    0,

                errors:
                    0

            };

        }


        /*
         * Snapshot kullanılır.
         * Listener callback içinde listener ekler/
         * kaldırırsa mevcut emit döngüsü bozulmaz.
         */

        const snapshot =
            [
                ...listeners
            ];


        let delivered =
            0;


        let errors =
            0;


        snapshot.forEach(
            listener => {

                if(
                    !listener ||
                    typeof listener.callback !==
                        "function"
                ){

                    return;

                }


                try{

                    listener.callback(
                        data
                    );


                    delivered +=
                        1;


                    this.delivered +=
                        1;

                } catch(error){

                    errors +=
                        1;


                    this.errors +=
                        1;


                    /*
                     * Bir listener'ın hatası diğer
                     * VAERO servislerinin event'i
                     * almasını engellemez.
                     */

                    console.error(
                        `Event listener failed: ${eventName}`,
                        error
                    );

                }


                if(
                    listener.once ===
                        true
                ){

                    this.off(
                        eventName,
                        listener.callback
                    );

                }

            }
        );


        return {

            emitted:
                true,

            delivered,

            errors

        };

    }


    /* =====================================================
       LISTENER QUERY
    ===================================================== */

    has(name){

        const eventName =
            this.normalizeName(
                name
            );


        if(!eventName){

            return false;

        }


        const listeners =
            this.events.get(
                eventName
            );


        return Boolean(
            listeners &&
            listeners.length >
                0
        );

    }


    listenerCount(name){

        const eventName =
            this.normalizeName(
                name
            );


        if(!eventName){

            return 0;

        }


        return (
            this.events.get(
                eventName
            )?.length ||
            0
        );

    }


    eventNames(){

        return [
            ...this.events.keys()
        ];

    }


    /* =====================================================
       CLEAR
    ===================================================== */

    clear(name = null){

        if(
            name !==
                null &&
            name !==
                undefined
        ){

            const eventName =
                this.normalizeName(
                    name
                );


            if(!eventName){

                return false;

            }


            return this.events.delete(
                eventName
            );

        }


        this.events.clear();


        return true;

    }


    /* =====================================================
       CONFIG
    ===================================================== */

    setMaxListeners(value){

        const amount =
            Number(
                value
            );


        if(
            !Number.isInteger(
                amount
            ) ||
            amount <
                10 ||
            amount >
                1000
        ){

            return false;

        }


        this.maxListenersPerEvent =
            amount;


        return true;

    }


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const listeners =
            {};


        let totalListeners =
            0;


        this.events.forEach(
            (
                items,
                name
            ) => {

                const count =
                    Array.isArray(
                        items
                    )
                        ? items.length
                        : 0;


                listeners[
                    name
                ] =
                    count;


                totalListeners +=
                    count;

            }
        );


        return {

            events:
                this.events.size,

            listeners:
                totalListeners,

            emitted:
                this.emitted,

            delivered:
                this.delivered,

            errors:
                this.errors,

            maxListenersPerEvent:
                this.maxListenersPerEvent,

            createdAt:
                this.createdAt,

            lastEvent:
                this.lastEvent
                    ? {
                        ...this.lastEvent
                    }
                    : null,

            subscriptions:
                listeners

        };

    }

}


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
            "events",
            new EventSystem()
        );

    }

} catch(error){

    console.error(
        "EventSystem register edilemedi:",
        error
    );

}
