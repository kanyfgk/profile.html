/* =========================================================
   VAERO PAYMENT ADAPTER
   VAERO App → VAERO Engine Payment Bridge

   IMPORTANT
   ---------------------------------------------------------
   This adapter belongs to the VAERO application layer.

   It does not own payment persistence or payment authority.

   All persistent payment intent operations are delegated
   to VAERO Engine Payment System.
========================================================= */

const VaeroPaymentAdapter = {

    id:
        "vaero-payment-adapter",

    version:
        "1.0.0",

    appId:
        "vaero",


    /* =====================================================
       SERVICE ACCESS
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

            return null;

        }

    },


    /* =====================================================
       ENGINE PAYMENT
    ===================================================== */

    getPaymentSystem(){

        const payment =
            this.getService(
                "payment"
            );


        if(
            !payment ||
            typeof payment.forApp !==
                "function"
        ){

            return null;

        }


        return payment;

    },


    getClient(){

        const payment =
            this.getPaymentSystem();


        if(!payment){

            return null;

        }


        try{

            return (
                payment.forApp(
                    this.appId
                ) ||
                null
            );

        } catch(error){

            console.warn(
                "VAERO Payment client açılamadı:",
                error
            );


            return null;

        }

    },


    /* =====================================================
       AVAILABILITY
    ===================================================== */

    available(){

        const client =
            this.getClient();


        return Boolean(
            client
        );

    },


    /* =====================================================
       LIST
    ===================================================== */

    async list(
        options = {}
    ){

        const client =
            this.getClient();


        if(
            !client ||
            typeof client.list !==
                "function"
        ){

            return [];

        }


        try{

            const result =
                await client.list(
                    options
                );


            return Array.isArray(
                result
            )
                ? result
                : [];

        } catch(error){

            console.warn(
                "VAERO ödeme niyetleri okunamadı:",
                error
            );


            return [];

        }

    },


    /* =====================================================
       GET
    ===================================================== */

    async get(intentId){

        const id =
            String(
                intentId ||
                ""
            ).trim();


        if(!id){

            return null;

        }


        const client =
            this.getClient();


        if(
            !client ||
            typeof client.get !==
                "function"
        ){

            return null;

        }


        try{

            return (
                await client.get(
                    id
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       CREATE
    ===================================================== */

    async create(
        payload = {}
    ){

        const client =
            this.getClient();


        if(
            !client ||
            typeof client.createIntent !==
                "function"
        ){

            return null;

        }


        try{

            return (
                await client.createIntent(
                    payload
                ) ||
                null
            );

        } catch(error){

            console.warn(
                "VAERO ödeme niyeti oluşturulamadı:",
                error
            );


            return null;

        }

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    async update(
        intentId,
        patch = {}
    ){

        const id =
            String(
                intentId ||
                ""
            ).trim();


        if(!id){

            return null;

        }


        const client =
            this.getClient();


        if(
            !client ||
            typeof client.updateIntent !==
                "function"
        ){

            return null;

        }


        try{

            return (
                await client.updateIntent(
                    id,
                    patch
                ) ||
                null
            );

        } catch(error){

            console.warn(
                "VAERO ödeme niyeti güncellenemedi:",
                error
            );


            return null;

        }

    },


    /* =====================================================
       PAYMENT METHOD
    ===================================================== */

    setMethod(
        intentId,
        method
    ){

        const value =
            String(
                method ||
                ""
            )
                .trim()
                .toLowerCase();


        if(!value){

            return Promise.resolve(
                null
            );

        }


        return this.update(
            intentId,
            {

                method:
                    value

            }
        );

    },


    /* =====================================================
       PROVIDER
    ===================================================== */

    setProvider(
        intentId,
        provider
    ){

        const value =
            String(
                provider ||
                ""
            )
                .trim()
                .toLowerCase();


        if(!value){

            return Promise.resolve(
                null
            );

        }


        return this.update(
            intentId,
            {

                provider:
                    value

            }
        );

    },


    /* =====================================================
       STATUS
    ===================================================== */

    setStatus(
        intentId,
        status
    ){

        const value =
            String(
                status ||
                ""
            )
                .trim()
                .toLowerCase();


        if(!value){

            return Promise.resolve(
                null
            );

        }


        return this.update(
            intentId,
            {

                status:
                    value

            }
        );

    },


    /* =====================================================
       CANCEL
    ===================================================== */

    async cancel(intentId){

        const id =
            String(
                intentId ||
                ""
            ).trim();


        if(!id){

            return null;

        }


        const client =
            this.getClient();


        if(
            !client ||
            typeof client.cancelIntent !==
                "function"
        ){

            return null;

        }


        try{

            return (
                await client.cancelIntent(
                    id
                ) ||
                null
            );

        } catch(error){

            console.warn(
                "VAERO ödeme niyeti iptal edilemedi:",
                error
            );


            return null;

        }

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            id:
                this.id,

            version:
                this.version,

            appId:
                this.appId,

            paymentSystemAvailable:
                Boolean(
                    this.getPaymentSystem()
                ),

            clientAvailable:
                this.available()

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
            "vaeroPaymentAdapter",
            VaeroPaymentAdapter
        );

    }

} catch(error){

    console.warn(
        "VAERO Payment Adapter kaydedilemedi:",
        error
    );

}


/* =========================================================
   GLOBAL
========================================================= */

if(
    typeof window !==
        "undefined"
){

    window.VaeroPaymentAdapter =
        VaeroPaymentAdapter;

}
