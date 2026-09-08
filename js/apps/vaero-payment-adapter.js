/* =========================================================
   VAERO PAYMENT ADAPTER
   VAERO App → VAERO Engine Payment Bridge

   IMPORTANT
   ---------------------------------------------------------
   This adapter belongs to the VAERO application layer.

   It owns no payment persistence and no payment authority.

   Persistent payment state and provider operations are
   delegated to VAERO Engine Payment System.
========================================================= */

const VaeroPaymentAdapter = {

    id:
        "vaero-payment-adapter",

    version:
        "1.1.0",

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


    available(){

        return Boolean(
            this.getClient()
        );

    },


    /* =====================================================
       READ
    ===================================================== */

    async list(options = {}){

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

            return [];

        }

    },


    async get(intentId){

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
                    intentId
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

    async createIntent(
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


    create(payload = {}){

        return this.createIntent(
            payload
        );

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    async update(
        intentId,
        patch = {}
    ){

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
                    intentId,
                    patch
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       METHOD
    ===================================================== */

    async setMethod(
        intentId,
        method
    ){

        const client =
            this.getClient();


        if(
            !client ||
            typeof client.setMethod !==
                "function"
        ){

            return null;

        }


        try{

            return (
                await client.setMethod(
                    intentId,
                    method
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    selectMethod(
        intentId,
        method
    ){

        return this.setMethod(
            intentId,
            method
        );

    },


    /* =====================================================
       PROVIDER
    ===================================================== */

    async setProvider(
        intentId,
        providerId
    ){

        const client =
            this.getClient();


        if(
            !client ||
            typeof client.setProvider !==
                "function"
        ){

            return null;

        }


        try{

            return (
                await client.setProvider(
                    intentId,
                    providerId
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    selectProvider(
        intentId,
        providerId
    ){

        return this.setProvider(
            intentId,
            providerId
        );

    },


    getAvailableProviders(){

        const client =
            this.getClient();


        if(
            !client ||
            typeof client
                .getAvailableProviders !==
                    "function"
        ){

            return [];

        }


        try{

            const providers =
                client
                    .getAvailableProviders();


            return Array.isArray(
                providers
            )
                ? providers
                : [];

        } catch(error){

            return [];

        }

    },


    /* =====================================================
       START
    ===================================================== */

    async start(intentId){

        const client =
            this.getClient();


        if(
            !client ||
            typeof client.start !==
                "function"
        ){

            return null;

        }


        try{

            return (
                await client.start(
                    intentId
                ) ||
                null
            );

        } catch(error){

            console.warn(
                "VAERO ödeme işlemi başlatılamadı:",
                error
            );


            return null;

        }

    },


    startIntent(intentId){

        return this.start(
            intentId
        );

    },


    /* =====================================================
       CANCEL
    ===================================================== */

    async cancel(intentId){

        const client =
            this.getClient();


        if(
            !client ||
            typeof client.cancel !==
                "function"
        ){

            return null;

        }


        try{

            return (
                await client.cancel(
                    intentId
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    cancelIntent(intentId){

        return this.cancel(
            intentId
        );

    },


    /* =====================================================
       REFUND
    ===================================================== */

    async refund(transactionId){

        const client =
            this.getClient();


        if(
            !client ||
            typeof client.refund !==
                "function"
        ){

            return false;

        }


        try{

            return (
                await client.refund(
                    transactionId
                )
            ) || false;

        } catch(error){

            return false;

        }

    },


    /* =====================================================
       VERIFIED ENTITLEMENT
    ===================================================== */

    async hasVerifiedEntitlement(
        applicationId
    ){

        const client =
            this.getClient();


        if(
            !client ||
            typeof client
                .hasVerifiedEntitlement !==
                    "function"
        ){

            return false;

        }


        try{

            return (
                await client
                    .hasVerifiedEntitlement(
                        applicationId
                    )
            ) === true;

        } catch(error){

            return false;

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
                this.available(),

            availableProviders:
                this.getAvailableProviders()
                    .length

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
