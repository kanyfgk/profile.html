/* =========================================================
   VAERO PAYMENT CONTROLLER
   VAERO App Payment Interaction Layer

   IMPORTANT
   ---------------------------------------------------------
   This controller belongs to the VAERO application layer.

   It owns no payment persistence and no payment authority.

   All payment persistence, provider execution and refund
   operations are delegated through VaeroPaymentAdapter to
   VAERO Engine Payment System.
========================================================= */

const VaeroPaymentController = {

    id:
        "vaero-payment-controller",

    version:
        "1.0.0",

    appId:
        "vaero",

    app:
        null,

    intents:
        new Map(),

    loaded:
        false,

    loadPromise:
        null,


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


    getAdapter(){

        if(
            typeof window !==
                "undefined" &&
            window.VaeroPaymentAdapter
        ){

            return window.VaeroPaymentAdapter;

        }


        return (
            this.getService(
                "vaeroPaymentAdapter"
            ) ||
            null
        );

    },


    getApp(){

        if(this.app){

            return this.app;

        }


        if(
            typeof window !==
                "undefined" &&
            window.VaeroApp
        ){

            this.app =
                window.VaeroApp;


            return this.app;

        }


        return null;

    },


    /* =====================================================
       INTENT CACHE

       Runtime/UI state only.
       This cache is not payment authority.
    ===================================================== */

    cloneIntent(intent){

        if(
            !intent ||
            typeof intent !==
                "object" ||
            Array.isArray(
                intent
            )
        ){

            return null;

        }


        return {

            ...intent,

            metadata: {
                ...(
                    intent.metadata ||
                    {}
                )
            },

            commerceSnapshot: {
                ...(
                    intent.commerceSnapshot ||
                    {}
                )
            },

            providerState: {
                ...(
                    intent.providerState ||
                    {}
                )
            }

        };

    },


    cacheIntent(intent){

        const normalized =
            this.cloneIntent(
                intent
            );


        if(
            !normalized ||
            !normalized.id
        ){

            return null;

        }


        this.intents.set(
            String(
                normalized.id
            ),
            normalized
        );


        return this.cloneIntent(
            normalized
        );

    },


    all(){

        return [
            ...this.intents.values()
        ]
            .sort(
                (a,b) =>
                    Number(
                        b?.updatedAt ||
                        0
                    ) -
                    Number(
                        a?.updatedAt ||
                        0
                    )
            )
            .map(
                intent =>
                    this.cloneIntent(
                        intent
                    )
            )
            .filter(Boolean);

    },


    get(intentId){

        const id =
            String(
                intentId ||
                ""
            ).trim();


        if(!id){

            return null;

        }


        return this.cloneIntent(
            this.intents.get(
                id
            ) ||
            null
        );

    },


    /* =====================================================
       HYDRATE FROM ENGINE PAYMENT
    ===================================================== */

    async hydrate(){

        if(this.loaded){

            return this.all();

        }


        if(this.loadPromise){

            return this.loadPromise;

        }


        const adapter =
            this.getAdapter();


        if(
            !adapter ||
            typeof adapter.list !==
                "function"
        ){

            return this.all();

        }


        this.loadPromise =
            (async () => {

                try{

                    const records =
                        await adapter.list({
                            orderBy:
                                "updatedAt",

                            direction:
                                "desc"
                        });


                    if(
                        Array.isArray(
                            records
                        )
                    ){

                        records.forEach(
                            intent => {

                                if(
                                    !intent ||
                                    !intent.id
                                ){

                                    return;

                                }


                                const existing =
                                    this.intents.get(
                                        String(
                                            intent.id
                                        )
                                    ) ||
                                    null;


                                if(
                                    !existing ||
                                    Number(
                                        intent.updatedAt ||
                                        0
                                    ) >=
                                    Number(
                                        existing.updatedAt ||
                                        0
                                    )
                                ){

                                    this.cacheIntent(
                                        intent
                                    );

                                }

                            }
                        );

                    }


                    this.loaded =
                        true;


                    return this.all();

                } catch(error){

                    console.warn(
                        "VAERO Payment Controller hydrate başarısız:",
                        error
                    );


                    return this.all();

                } finally {

                    this.loadPromise =
                        null;

                }

            })();


        const result =
            await this.loadPromise;


        const app =
            this.getApp();


        if(
            this.loaded ===
                true &&
            app?.activeView ===
                "payment"
        ){

            app.refresh?.();

        }


        return result;

    },


    load(){

        if(
            !this.loaded &&
            !this.loadPromise
        ){

            this.hydrate()
                .catch(
                    () => {}
                );

        }


        return this.all();

    },


    /* =====================================================
       PROVIDERS
    ===================================================== */

    getAvailableProviders(){

        const adapter =
            this.getAdapter();


        if(
            !adapter ||
            typeof adapter
                .getAvailableProviders !==
                    "function"
        ){

            return [];

        }


        try{

            const providers =
                adapter
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
       CONTINUE IN PART 2
    ===================================================== */

  /* =====================================================
       CREATE
    ===================================================== */

    async createIntent(
        payload = {}
    ){

        const adapter =
            this.getAdapter();


        if(
            !adapter ||
            typeof adapter.createIntent !==
                "function"
        ){

            return null;

        }


        const intent =
            await adapter.createIntent(
                payload
            );


        return this.cacheIntent(
            intent
        );

    },


    create(payload = {}){

        return this.createIntent(
            payload
        );

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    async setMethod(
        intentId,
        method
    ){

        const adapter =
            this.getAdapter();


        if(
            !adapter ||
            typeof adapter.setMethod !==
                "function"
        ){

            return null;

        }


        const updated =
            await adapter.setMethod(
                intentId,
                method
            );


        return this.cacheIntent(
            updated
        );

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


    async setProvider(
        intentId,
        providerId
    ){

        const adapter =
            this.getAdapter();


        if(
            !adapter ||
            typeof adapter.setProvider !==
                "function"
        ){

            return null;

        }


        const updated =
            await adapter.setProvider(
                intentId,
                providerId
            );


        return this.cacheIntent(
            updated
        );

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


    async start(intentId){

        const adapter =
            this.getAdapter();


        if(
            !adapter ||
            typeof adapter.start !==
                "function"
        ){

            return null;

        }


        const updated =
            await adapter.start(
                intentId
            );


        return this.cacheIntent(
            updated
        );

    },


    startIntent(intentId){

        return this.start(
            intentId
        );

    },


    async cancel(intentId){

        const adapter =
            this.getAdapter();


        if(
            !adapter ||
            typeof adapter.cancel !==
                "function"
        ){

            return null;

        }


        const updated =
            await adapter.cancel(
                intentId
            );


        return this.cacheIntent(
            updated
        );

    },


    cancelIntent(intentId){

        return this.cancel(
            intentId
        );

    },


    async refund(transactionId){

        const adapter =
            this.getAdapter();


        if(
            !adapter ||
            typeof adapter.refund !==
                "function"
        ){

            return false;

        }


        return (
            await adapter.refund(
                transactionId
            )
        ) || false;

    },


    async hasVerifiedEntitlement(
        applicationId
    ){

        const adapter =
            this.getAdapter();


        if(
            !adapter ||
            typeof adapter
                .hasVerifiedEntitlement !==
                    "function"
        ){

            return false;

        }


        return (
            await adapter
                .hasVerifiedEntitlement(
                    applicationId
                )
        ) === true;

    },


    /* =====================================================
       INSTALL INTO VAERO APP
    ===================================================== */

    install(app = null){

        const target =
            app ||
            this.getApp();


        if(
            !target ||
            typeof target !==
                "object"
        ){

            return false;

        }


        this.app =
            target;


        const controller =
            this;


        /*
         * Existing VAERO rendering can keep using
         * paymentCore.load / get / getAvailableProviders.
         *
         * The legacy localStorage core is replaced at
         * runtime by this Engine-backed controller.
         */
        target.paymentCore =
            controller;


        target.getPaymentCore =
            function(){

                return controller;

            };


        target.getCurrentPaymentIntent =
            function(){

                const engine =
                    this.getEngine();


                const current =
                    engine
                        ?.currentVaeroPaymentIntent ||
                    null;


                if(
                    !current ||
                    !current.id
                ){

                    return null;

                }


                return (
                    controller.get(
                        current.id
                    ) ||
                    controller.cloneIntent(
                        current
                    )
                );

            };


        target.startProductPurchase =
            async function(productId){

                const product =
                    this.getProduct(
                        productId
                    );


                if(!product){

                    return false;

                }


                const commerce =
                    this.getProductCommerce(
                        product
                    );


                if(
                    commerce.known !==
                        true ||
                    commerce.purchasable !==
                        true ||
                    commerce.amount ===
                        null ||
                    !commerce.currency
                ){

                    this.activeProductId =
                        product.id;


                    this.activeView =
                        "product";


                    this.enterBrainContext({
                        productId:
                            product.id,

                        commerceAvailable:
                            false
                    });


                    return this.refresh();

                }


                const intent =
                    await controller
                        .createIntent({

                            source:
                                "vaero-product",

                            productId:
                                product.id,

                            title:
                                product.name,

                            amount:
                                commerce.amount,

                            currency:
                                commerce.currency,

                            quantity:
                                1,

                            commerceSnapshot: {

                                availability:
                                    commerce.availability

                            },

                            metadata: {

                                productType:
                                    product.type,

                                atmosphere:
                                    product.atmosphere,

                                runtimeCommerce:
                                    true

                            }

                        });


                if(!intent){

                    return false;

                }


                const engine =
                    this.getEngine();


                if(engine){

                    engine.currentVaeroPaymentIntent =
                        intent;

                }


                this.activeProductId =
                    product.id;


                this.activeView =
                    "payment";


                this.enterBrainContext({

                    productId:
                        product.id,

                    paymentIntentId:
                        intent.id

                });


                return this.refresh();

            };


        target.selectPaymentMethod =
            async function(method){

                const intent =
                    this.getCurrentPaymentIntent();


                if(!intent){

                    return false;

                }


                const updated =
                    await controller
                        .setMethod(
                            intent.id,
                            method
                        );


                if(!updated){

                    return false;

                }


                this.syncCurrentPaymentIntent(
                    updated
                );


                this.enterBrainContext({

                    paymentIntentId:
                        intent.id,

                    paymentMethod:
                        updated.method

                });


                return this.refresh();

            };


        target.selectPaymentProvider =
            async function(provider){

                const intent =
                    this.getCurrentPaymentIntent();


                if(!intent){

                    return false;

                }


                const updated =
                    await controller
                        .setProvider(
                            intent.id,
                            provider
                        );


                if(!updated){

                    return this.refresh();

                }


                this.syncCurrentPaymentIntent(
                    updated
                );


                this.enterBrainContext({

                    paymentIntentId:
                        intent.id,

                    paymentProvider:
                        updated.provider,

                    paymentStatus:
                        updated.status

                });


                return this.refresh();

            };


        target.beginPayment =
            async function(){

                const intent =
                    this.getCurrentPaymentIntent();


                if(!intent){

                    return false;

                }


                const updated =
                    await controller.start(
                        intent.id
                    );


                if(!updated){

                    return false;

                }


                this.syncCurrentPaymentIntent(
                    updated
                );


                this.enterBrainContext({

                    paymentIntentId:
                        intent.id,

                    paymentStatus:
                        updated.status

                });


                return this.refresh();

            };


        target.cancelPayment =
            async function(){

                const intent =
                    this.getCurrentPaymentIntent();


                if(!intent){

                    this.activeView =
                        "product";


                    return this.refresh();

                }


                const updated =
                    await controller.cancel(
                        intent.id
                    );


                if(updated){

                    this.syncCurrentPaymentIntent(
                        updated
                    );

                }


                this.activeView =
                    "product";


                this.enterBrainContext({

                    productId:
                        this.activeProductId,

                    paymentIntentId:
                        intent.id,

                    paymentStatus:
                        updated?.status ||
                        "cancelled"

                });


                return this.refresh();

            };


        this.load();


        return true;

    },


    report(){

        return {

            id:
                this.id,

            version:
                this.version,

            appId:
                this.appId,

            installed:
                Boolean(
                    this.getApp()
                ),

            loaded:
                this.loaded,

            cachedIntents:
                this.intents.size,

            adapterAvailable:
                Boolean(
                    this.getAdapter()
                ),

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
            "vaeroPaymentController",
            VaeroPaymentController
        );

    }

} catch(error){

    console.warn(
        "VAERO Payment Controller kaydedilemedi:",
        error
    );

}


/* =========================================================
   INSTALL
========================================================= */

try{

    if(
        typeof window !==
            "undefined" &&
        window.VaeroApp
    ){

        VaeroPaymentController.install(
            window.VaeroApp
        );

    }

} catch(error){

    console.warn(
        "VAERO Payment Controller kurulamadı:",
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

    window.VaeroPaymentController =
        VaeroPaymentController;

}
