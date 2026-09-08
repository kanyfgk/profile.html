/* =========================================================
   VAERO PAYMENT SYSTEM
   Engine Payment Intent / Provider Authority

   IMPORTANT
   ---------------------------------------------------------
   Applications do not own payment infrastructure.

   Applications create and manage payment intents through
   VAERO Engine.

   Browser/application state can never self-verify payment.

   Completed / refunded / transaction verification must
   come from trusted VAERO payment infrastructure.
========================================================= */

const PaymentSystem = {

    version:
        "1.1.0",

    booted:
        false,

    bootedAt:
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

            /* fallback */

        }


        const events =
            this.getService(
                "events"
            );


        if(
            events &&
            typeof events.emit ===
                "function"
        ){

            try{

                events.emit(
                    name,
                    payload
                );


                return true;

            } catch(error){

                return false;

            }

        }


        return false;

    },


    /* =====================================================
       CLONE
    ===================================================== */

    clone(value){

        if(
            value ===
                undefined ||
            value ===
                null
        ){

            return value;

        }


        try{

            if(
                typeof structuredClone ===
                    "function"
            ){

                return structuredClone(
                    value
                );

            }

        } catch(error){

            /* fallback */

        }


        try{

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeIdentifier(
        value,
        fallback = ""
    ){

        const normalized =
            String(
                value ??
                fallback
            )
                .trim()
                .toLowerCase()
                .replace(
                    /\s+/g,
                    "-"
                );


        if(
            !normalized ||
            normalized.length >
                120
        ){

            return "";

        }


        if(
            !/^[a-z0-9:_\-.]+$/.test(
                normalized
            )
        ){

            return "";

        }


        return normalized;

    },


    normalizeRecordId(value){

        const id =
            String(
                value ??
                ""
            ).trim();


        if(
            !id ||
            id.length >
                200
        ){

            return "";

        }


        if(
            !/^[a-zA-Z0-9:_\-.]+$/.test(
                id
            )
        ){

            return "";

        }


        return id;

    },


    normalizeMethod(method){

        const value =
            String(
                method ??
                ""
            )
                .trim()
                .toLowerCase();


        return value ||
            null;

    },


    normalizeProvider(provider){

        const value =
            String(
                provider ??
                ""
            )
                .trim()
                .toLowerCase();


        return value ||
            null;

    },


    normalizeStatus(status){

        const value =
            String(
                status ||
                "requires-selection"
            )
                .trim()
                .toLowerCase();


        const allowed = [

            "draft",
            "requires-selection",
            "ready",
            "awaiting-provider",
            "provider-unavailable",
            "cancelled",
            "failed"

        ];


        return allowed.includes(
            value
        )
            ? value
            : "requires-selection";

    },


    createId(){

        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){

                return `payment_${crypto.randomUUID()}`;

            }

        } catch(error){

            /* fallback */

        }


        return `payment_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       APPLICATION AUTHORITY
    ===================================================== */

    getAppManifest(appId){

        const id =
            this.normalizeIdentifier(
                appId
            );


        if(!id){

            return null;

        }


        const registry =
            this.getService(
                "appRegistry"
            );


        if(
            !registry ||
            typeof registry.get !==
                "function"
        ){

            return null;

        }


        try{

            return (
                registry.get(
                    id
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    isTrustedApplication(appId){

        const manifest =
            this.getAppManifest(
                appId
            );


        if(
            !manifest ||
            manifest.enabled ===
                false
        ){

            return false;

        }


        return (
            manifest.system ===
                true &&
            manifest.trusted ===
                true &&
            manifest.distribution ===
                "built-in"
        );

    },


    hasPaymentAccess(appId){

        const manifest =
            this.getAppManifest(
                appId
            );


        if(
            !this.isTrustedApplication(
                appId
            ) ||
            !manifest
        ){

            return false;

        }


        const capabilities =
            Array.isArray(
                manifest.capabilities
            )
                ? manifest.capabilities
                    .map(
                        item =>
                            String(
                                item ||
                                ""
                            )
                                .trim()
                                .toLowerCase()
                    )
                : [];


        const permissions =
            Array.isArray(
                manifest.requestedPermissions
            )
                ? manifest.requestedPermissions
                    .map(
                        item =>
                            String(
                                item ||
                                ""
                            )
                                .trim()
                                .toLowerCase()
                    )
                : [];


        return (

            capabilities.includes(
                "vaero.purchase"
            ) ||

            capabilities.includes(
                "payment.intent"
            ) ||

            permissions.includes(
                "payment.intent"
            )

        );

    },


    /* =====================================================
       ENGINE DATA
    ===================================================== */

    getIntentCollection(appId){

        const id =
            this.normalizeIdentifier(
                appId
            );


        if(
            !id ||
            !this.hasPaymentAccess(
                id
            )
        ){

            return null;

        }


        const data =
            this.getService(
                "data"
            );


        if(
            !data ||
            typeof data.forApp !==
                "function"
        ){

            return null;

        }


        try{

            const client =
                data.forApp(
                    id
                );


            if(
                !client ||
                typeof client.collection !==
                    "function"
            ){

                return null;

            }


            return (
                client.collection(
                    "payment-intents"
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       PROVIDER AUTHORITY
    ===================================================== */

    getProviderRegistry(){

        return (
            this.getService(
                "paymentProviderRegistry"
            ) ||
            this.getService(
                "checkoutProviderRegistry"
            ) ||
            null
        );

    },


    getProvider(providerId){

        const id =
            this.normalizeProvider(
                providerId
            );


        if(!id){

            return null;

        }


        const registry =
            this.getProviderRegistry();


        if(!registry){

            return null;

        }


        try{

            let provider =
                null;


            if(
                typeof registry.get ===
                    "function"
            ){

                provider =
                    registry.get(
                        id
                    ) ||
                    null;

            }

            else if(
                typeof registry.find ===
                    "function"
            ){

                provider =
                    registry.find(
                        id
                    ) ||
                    null;

            }


            if(
                !provider ||
                provider.enabled ===
                    false
            ){

                return null;

            }


            return provider;

        } catch(error){

            return null;

        }

    },


    getAvailableProviders(){

        const registry =
            this.getProviderRegistry();


        if(
            !registry ||
            typeof registry.all !==
                "function"
        ){

            return [];

        }


        try{

            const providers =
                registry.all();


            return Array.isArray(
                providers
            )
                ? providers
                    .filter(
                        provider =>
                            provider &&
                            provider.enabled !==
                                false
                    )
                    .map(
                        provider => {

                            const safe = {

                                id:
                                    provider.id ||
                                    null,

                                title:
                                    provider.title ||
                                    provider.name ||
                                    provider.id ||
                                    "Payment Provider",

                                methods:
                                    Array.isArray(
                                        provider.methods
                                    )
                                        ? [
                                            ...provider.methods
                                        ]
                                        : [],

                                enabled:
                                    provider.enabled !==
                                        false

                            };


                            return safe;

                        }
                    )
                : [];

        } catch(error){

            return [];

        }

    },


    /* =====================================================
       INTENT NORMALIZATION
    ===================================================== */

    normalizeIntent(intent){

        if(
            !intent ||
            typeof intent !==
                "object" ||
            Array.isArray(
                intent
            ) ||
            !intent.id
        ){

            return null;

        }


        const amountValue =
            Number(
                intent.amount
            );


        return {

            id:
                String(
                    intent.id
                ),

            source:
                String(
                    intent.source ||
                    "vaero"
                ),

            productId:
                intent.productId ||
                null,

            title:
                String(
                    intent.title ||
                    "Purchase"
                ),

            amount:
                Number.isFinite(
                    amountValue
                )
                    ? amountValue
                    : null,

            currency:
                intent.currency
                    ? String(
                        intent.currency
                    )
                        .trim()
                        .toUpperCase()
                    : null,

            quantity:
                Math.max(
                    1,
                    Math.floor(
                        Number(
                            intent.quantity
                        ) ||
                        1
                    )
                ),

            method:
                this.normalizeMethod(
                    intent.method
                ),

            provider:
                this.normalizeProvider(
                    intent.provider
                ),

            status:
                this.normalizeStatus(
                    intent.status
                ),

            /*
             * App-scoped browser data is never payment proof.
             */
            verified:
                false,

            transactionId:
                null,

            commerceSnapshot:
                (
                    intent.commerceSnapshot &&
                    typeof intent.commerceSnapshot ===
                        "object" &&
                    !Array.isArray(
                        intent.commerceSnapshot
                    )
                )
                    ? {
                        ...intent.commerceSnapshot
                    }
                    : {},

            providerState:
                (
                    intent.providerState &&
                    typeof intent.providerState ===
                        "object" &&
                    !Array.isArray(
                        intent.providerState
                    )
                )
                    ? {
                        ...intent.providerState
                    }
                    : {},

            metadata:
                (
                    intent.metadata &&
                    typeof intent.metadata ===
                        "object" &&
                    !Array.isArray(
                        intent.metadata
                    )
                )
                    ? {
                        ...intent.metadata
                    }
                    : {},

            createdAt:
                Number(
                    intent.createdAt
                ) ||
                Date.now(),

            updatedAt:
                Number(
                    intent.updatedAt
                ) ||
                Date.now()

        };

    },


    /* =====================================================
       CONTINUE IN PART 2
    ===================================================== */

   /* =====================================================
       READ
    ===================================================== */

    async list(
        appId,
        options = {}
    ){

        const collection =
            this.getIntentCollection(
                appId
            );


        if(
            !collection ||
            typeof collection.list !==
                "function"
        ){

            return [];

        }


        try{

            const records =
                await collection.list({

                    orderBy:
                        "updatedAt",

                    direction:
                        "desc",

                    ...(
                        options &&
                        typeof options ===
                            "object" &&
                        !Array.isArray(
                            options
                        )
                            ? options
                            : {}
                    )

                });


            return (
                Array.isArray(
                    records
                )
                    ? records
                    : []
            )
                .map(
                    record =>
                        this.normalizeIntent(
                            record
                        )
                )
                .filter(Boolean);

        } catch(error){

            console.warn(
                "Payment intents okunamadı:",
                error
            );


            return [];

        }

    },


    async get(
        appId,
        intentId
    ){

        const id =
            this.normalizeRecordId(
                intentId
            );


        const collection =
            this.getIntentCollection(
                appId
            );


        if(
            !id ||
            !collection ||
            typeof collection.get !==
                "function"
        ){

            return null;

        }


        try{

            const intent =
                await collection.get(
                    id
                );


            return this.normalizeIntent(
                intent
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       CREATE
    ===================================================== */

    async createIntent(
        appId,
        payload = {}
    ){

        const collection =
            this.getIntentCollection(
                appId
            );


        if(
            !collection ||
            typeof collection.create !==
                "function"
        ){

            return null;

        }


        const amount =
            Number(
                payload.amount
            );


        const currency =
            String(
                payload.currency ||
                ""
            )
                .trim()
                .toUpperCase();


        const title =
            String(
                payload.title ||
                "Purchase"
            )
                .trim()
                .slice(
                    0,
                    160
                );


        if(
            !Number.isFinite(
                amount
            ) ||
            amount <
                0 ||
            !currency ||
            !title
        ){

            return null;

        }


        const now =
            Date.now();


        const intent = {

            id:
                this.createId(),

            source:
                String(
                    payload.source ||
                    appId ||
                    "vaero"
                )
                    .trim()
                    .toLowerCase(),

            productId:
                payload.productId ||
                null,

            title,

            amount,

            currency,

            quantity:
                Math.max(
                    1,
                    Math.floor(
                        Number(
                            payload.quantity
                        ) ||
                        1
                    )
                ),

            method:
                null,

            provider:
                null,

            status:
                "requires-selection",

            verified:
                false,

            transactionId:
                null,

            commerceSnapshot:
                (
                    payload.commerceSnapshot &&
                    typeof payload.commerceSnapshot ===
                        "object" &&
                    !Array.isArray(
                        payload.commerceSnapshot
                    )
                )
                    ? {
                        ...payload.commerceSnapshot
                    }
                    : {},

            providerState: {

                connected:
                    false,

                reference:
                    null,

                lastAttemptAt:
                    null

            },

            metadata:
                (
                    payload.metadata &&
                    typeof payload.metadata ===
                        "object" &&
                    !Array.isArray(
                        payload.metadata
                    )
                )
                    ? {
                        ...payload.metadata
                    }
                    : {},

            createdAt:
                now,

            updatedAt:
                now

        };


        let created =
            null;


        try{

            created =
                await collection.create(
                    intent
                );

        } catch(error){

            console.warn(
                "Payment intent oluşturulamadı:",
                error
            );


            return null;

        }


        const normalized =
            this.normalizeIntent(
                created
            );


        if(normalized){

            this.emit(
                "payment:intent:created",
                {

                    appId:
                        this.normalizeIdentifier(
                            appId
                        ),

                    intentId:
                        normalized.id,

                    productId:
                        normalized.productId,

                    time:
                        Date.now()

                }
            );

        }


        return normalized;

    },


    /* =====================================================
       SAFE UPDATE
    ===================================================== */

    async updateIntent(
        appId,
        intentId,
        patch = {}
    ){

        const id =
            this.normalizeRecordId(
                intentId
            );


        const collection =
            this.getIntentCollection(
                appId
            );


        if(
            !id ||
            !collection ||
            typeof collection.update !==
                "function"
        ){

            return null;

        }


        const existing =
            await this.get(
                appId,
                id
            );


        if(!existing){

            return null;

        }


        if(
            existing.status ===
                "cancelled"
        ){

            return existing;

        }


        const next = {

            method:
                patch.method !==
                    undefined
                    ? this.normalizeMethod(
                        patch.method
                    )
                    : existing.method,

            provider:
                patch.provider !==
                    undefined
                    ? this.normalizeProvider(
                        patch.provider
                    )
                    : existing.provider,

            status:
                patch.status !==
                    undefined
                    ? this.normalizeStatus(
                        patch.status
                    )
                    : existing.status,

            providerState:
                (
                    patch.providerState &&
                    typeof patch.providerState ===
                        "object" &&
                    !Array.isArray(
                        patch.providerState
                    )
                )
                    ? {
                        ...existing.providerState,
                        ...patch.providerState
                    }
                    : {
                        ...existing.providerState
                    },

            metadata:
                (
                    patch.metadata &&
                    typeof patch.metadata ===
                        "object" &&
                    !Array.isArray(
                        patch.metadata
                    )
                )
                    ? {
                        ...existing.metadata,
                        ...patch.metadata
                    }
                    : {
                        ...existing.metadata
                    },

            verified:
                false,

            transactionId:
                null,

            updatedAt:
                Date.now()

        };


        let updated =
            null;


        try{

            updated =
                await collection.update(
                    id,
                    next
                );

        } catch(error){

            console.warn(
                "Payment intent güncellenemedi:",
                error
            );


            return null;

        }


        const normalized =
            this.normalizeIntent(
                updated
            );


        if(normalized){

            this.emit(
                "payment:intent:updated",
                {

                    appId:
                        this.normalizeIdentifier(
                            appId
                        ),

                    intentId:
                        normalized.id,

                    status:
                        normalized.status,

                    time:
                        Date.now()

                }
            );

        }


        return normalized;

    },


    /* =====================================================
       PAYMENT METHOD
    ===================================================== */

    async selectMethod(
        appId,
        intentId,
        method
    ){

        const existing =
            await this.get(
                appId,
                intentId
            );


        const selectedMethod =
            this.normalizeMethod(
                method
            );


        if(
            !existing ||
            !selectedMethod
        ){

            return null;

        }


        if(
            existing.status ===
                "cancelled"
        ){

            return existing;

        }


        return this.updateIntent(
            appId,
            existing.id,
            {

                method:
                    selectedMethod,

                status:
                    existing.provider
                        ? "ready"
                        : "requires-selection"

            }
        );

    },


    /* =====================================================
       PAYMENT PROVIDER
    ===================================================== */

    async selectProvider(
        appId,
        intentId,
        providerId
    ){

        const existing =
            await this.get(
                appId,
                intentId
            );


        const selectedProvider =
            this.normalizeProvider(
                providerId
            );


        if(
            !existing ||
            !selectedProvider
        ){

            return null;

        }


        if(
            existing.status ===
                "cancelled"
        ){

            return existing;

        }


        const provider =
            this.getProvider(
                selectedProvider
            );


        if(!provider){

            return this.updateIntent(
                appId,
                existing.id,
                {

                    provider:
                        null,

                    status:
                        "provider-unavailable",

                    providerState: {

                        connected:
                            false,

                        reference:
                            null,

                        lastAttemptAt:
                            Date.now()

                    }

                }
            );

        }


        return this.updateIntent(
            appId,
            existing.id,
            {

                provider:
                    selectedProvider,

                status:
                    existing.method
                        ? "ready"
                        : "requires-selection",

                providerState: {

                    connected:
                        true,

                    reference:
                        provider.id ||
                        selectedProvider,

                    lastAttemptAt:
                        null

                }

            }
        );

    },


    /* =====================================================
       START CHECKOUT
    ===================================================== */

    async startIntent(
        appId,
        intentId
    ){

        const existing =
            await this.get(
                appId,
                intentId
            );


        if(!existing){

            return null;

        }


        if(
            existing.status ===
                "cancelled"
        ){

            return existing;

        }


        if(!existing.method){

            return this.updateIntent(
                appId,
                existing.id,
                {

                    status:
                        "requires-selection"

                }
            );

        }


        if(!existing.provider){

            return this.updateIntent(
                appId,
                existing.id,
                {

                    status:
                        "provider-unavailable"

                }
            );

        }


        const provider =
            this.getProvider(
                existing.provider
            );


        if(!provider){

            return this.updateIntent(
                appId,
                existing.id,
                {

                    status:
                        "provider-unavailable",

                    providerState: {

                        connected:
                            false,

                        reference:
                            existing.provider,

                        lastAttemptAt:
                            Date.now()

                    }

                }
            );

        }


        const startCheckout =
            typeof provider.startCheckout ===
                "function"
                ? provider.startCheckout
                : (
                    typeof provider.start ===
                        "function"
                        ? provider.start
                        : null
                );


        if(!startCheckout){

            return this.updateIntent(
                appId,
                existing.id,
                {

                    status:
                        "provider-unavailable",

                    providerState: {

                        connected:
                            true,

                        reference:
                            provider.id ||
                            existing.provider,

                        lastAttemptAt:
                            Date.now()

                    }

                }
            );

        }


        let result =
            null;


        try{

            result =
                await Promise.resolve(
                    startCheckout.call(
                        provider,
                        {

                            intentId:
                                existing.id,

                            productId:
                                existing.productId,

                            title:
                                existing.title,

                            amount:
                                existing.amount,

                            currency:
                                existing.currency,

                            quantity:
                                existing.quantity,

                            method:
                                existing.method,

                            source:
                                existing.source

                        }
                    )
                );

        } catch(error){

            console.error(
                "VAERO payment provider start failed:",
                error
            );


            return this.updateIntent(
                appId,
                existing.id,
                {

                    status:
                        "failed",

                    providerState: {

                        connected:
                            true,

                        reference:
                            provider.id ||
                            existing.provider,

                        lastAttemptAt:
                            Date.now()

                    }

                }
            );

        }


        if(
            result ===
                false ||
            result?.success ===
                false
        ){

            return this.updateIntent(
                appId,
                existing.id,
                {

                    status:
                        "failed",

                    providerState: {

                        connected:
                            true,

                        reference:
                            provider.id ||
                            existing.provider,

                        lastAttemptAt:
                            Date.now()

                    }

                }
            );

        }


        const updated =
            await this.updateIntent(
                appId,
                existing.id,
                {

                    status:
                        "awaiting-provider",

                    providerState: {

                        connected:
                            true,

                        reference:
                            result?.reference ||
                            result?.checkoutId ||
                            provider.id ||
                            existing.provider,

                        lastAttemptAt:
                            Date.now()

                    }

                }
            );


        if(updated){

            this.emit(
                "payment:checkout:started",
                {

                    appId:
                        this.normalizeIdentifier(
                            appId
                        ),

                    intentId:
                        updated.id,

                    provider:
                        updated.provider,

                    time:
                        Date.now()

                }
            );

        }


        return updated;

    },


    /* =====================================================
       CONTINUE IN PART 3
    ===================================================== */

   /* =====================================================
       CANCEL
    ===================================================== */

    async cancelIntent(
        appId,
        intentId
    ){

        const existing =
            await this.get(
                appId,
                intentId
            );


        if(!existing){

            return null;

        }


        if(
            existing.status ===
                "cancelled"
        ){

            return existing;

        }


        return this.updateIntent(
            appId,
            existing.id,
            {

                status:
                    "cancelled"

            }
        );

    },


    /* =====================================================
       REFUND AUTHORITY
    ===================================================== */

    async requestRefund(
        appId,
        transactionId
    ){

        if(
            !this.hasPaymentAccess(
                appId
            )
        ){

            return false;

        }


        const id =
            String(
                transactionId ||
                ""
            ).trim();


        if(!id){

            return false;

        }


        const transactionService =
            this.getService(
                "paymentTransactions"
            ) ||
            this.getService(
                "paymentService"
            ) ||
            null;


        if(
            !transactionService ||
            typeof transactionService
                .requestRefund !==
                    "function"
        ){

            return false;

        }


        try{

            const result =
                await Promise.resolve(
                    transactionService
                        .requestRefund(
                            id
                        )
                );


            if(result){

                this.emit(
                    "payment:refund:requested",
                    {

                        appId:
                            this.normalizeIdentifier(
                                appId
                            ),

                        transactionId:
                            id,

                        time:
                            Date.now()

                    }
                );

            }


            return result ||
                false;

        } catch(error){

            return false;

        }

    },


    /* =====================================================
       VERIFIED ENTITLEMENT
    ===================================================== */

    async hasVerifiedEntitlement(
        appId,
        applicationId
    ){

        if(
            !this.hasPaymentAccess(
                appId
            )
        ){

            return false;

        }


        const targetId =
            String(
                applicationId ||
                ""
            ).trim();


        if(!targetId){

            return false;

        }


        const entitlementService =
            this.getService(
                "entitlementService"
            ) ||
            this.getService(
                "entitlements"
            ) ||
            null;


        if(
            !entitlementService ||
            typeof entitlementService
                .hasVerifiedEntitlement !==
                    "function"
        ){

            return false;

        }


        try{

            const result =
                await Promise.resolve(
                    entitlementService
                        .hasVerifiedEntitlement(
                            targetId
                        )
                );


            return result ===
                true;

        } catch(error){

            return false;

        }

    },


    /* =====================================================
       APPLICATION-SCOPED CLIENT
    ===================================================== */

    forApp(appId){

        const id =
            this.normalizeIdentifier(
                appId
            );


        if(
            !id ||
            !this.hasPaymentAccess(
                id
            )
        ){

            this.emit(
                "payment:client:blocked",
                {

                    appId:
                        id ||
                        null,

                    reason:
                        "application-payment-access-denied",

                    time:
                        Date.now()

                }
            );


            return null;

        }


        const host =
            this;


        return Object.freeze({

            appId:
                id,


            list(options = {}){

                return host.list(
                    id,
                    options
                );

            },


            get(intentId){

                return host.get(
                    id,
                    intentId
                );

            },


            createIntent(payload = {}){

                return host.createIntent(
                    id,
                    payload
                );

            },


            updateIntent(
                intentId,
                patch = {}
            ){

                return host.updateIntent(
                    id,
                    intentId,
                    patch
                );

            },


            setMethod(
                intentId,
                method
            ){

                return host.selectMethod(
                    id,
                    intentId,
                    method
                );

            },


            selectMethod(
                intentId,
                method
            ){

                return host.selectMethod(
                    id,
                    intentId,
                    method
                );

            },


            setProvider(
                intentId,
                providerId
            ){

                return host.selectProvider(
                    id,
                    intentId,
                    providerId
                );

            },


            selectProvider(
                intentId,
                providerId
            ){

                return host.selectProvider(
                    id,
                    intentId,
                    providerId
                );

            },


            getAvailableProviders(){

                return host
                    .getAvailableProviders();

            },


            start(intentId){

                return host.startIntent(
                    id,
                    intentId
                );

            },


            startIntent(intentId){

                return host.startIntent(
                    id,
                    intentId
                );

            },


            cancel(intentId){

                return host.cancelIntent(
                    id,
                    intentId
                );

            },


            cancelIntent(intentId){

                return host.cancelIntent(
                    id,
                    intentId
                );

            },


            refund(transactionId){

                return host.requestRefund(
                    id,
                    transactionId
                );

            },


            hasVerifiedEntitlement(
                applicationId
            ){

                return host
                    .hasVerifiedEntitlement(
                        id,
                        applicationId
                    );

            }

        });

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(this.booted){

            return this.report();

        }


        const data =
            this.getService(
                "data"
            );


        if(
            !data ||
            typeof data.forApp !==
                "function"
        ){

            console.warn(
                "Payment System başlatılamadı: Data System hazır değil."
            );


            return false;

        }


        this.booted =
            true;


        this.bootedAt =
            Date.now();


        this.emit(
            "payment:booted",
            {

                time:
                    this.bootedAt

            }
        );


        return this.report();

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            version:
                this.version,

            booted:
                this.booted,

            bootedAt:
                this.bootedAt,

            dataAvailable:
                Boolean(
                    this.getService(
                        "data"
                    )
                ),

            providerRegistryAvailable:
                Boolean(
                    this.getProviderRegistry()
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
            "payment",
            PaymentSystem
        );

    }

} catch(error){

    console.warn(
        "Payment System VAERO servislerine eklenemedi:",
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

    window.PaymentSystem =
        PaymentSystem;

}
