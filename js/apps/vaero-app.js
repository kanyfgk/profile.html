/* =========================================================
   VAERO APP
   Official VAERO Brand Application

   Product / Atmosphere / Vision / Care / Payment Intent

   IMPORTANT
   ---------------------------------------------------------
   VAERO App is NOT VAERO Engine.

   VAERO App is an official first-party application
   running inside VAERO Engine.

   Product availability, stock, price and checkout
   information must come from verified runtime sources.
========================================================= */

const VaeroApp = {

    id:
        "vaero",

    version:
        "3.0.0",

    title:
        "VAERO",


    /* =====================================================
       STATE
    ===================================================== */

    activeView:
        "discover",

    activeProductId:
        "device",

    visionDraft:
        null,


    /* =====================================================
       PRODUCT CATALOG
    ===================================================== */

    products: [

        {
            id:
                "device",

            type:
                "device",

            name:
                "VAERO Device",

            eyebrow:
                "PERSONAL ATMOSPHERE SYSTEM",

            subtitle:
                "Atmosferin merkezindeki cihaz",

            description:
                "VAERO Device, bulunduğun ortamda kokuyu sürekli yoğunlaştırmak yerine dengeli ve kontrollü bir atmosfer deneyimi oluşturmak için tasarlanmıştır.",

            featured:
                true,

            commerce: {

                purchasable:
                    null,

                amount:
                    null,

                currency:
                    null,

                availability:
                    "unknown",

                stock:
                    null
            },

            atmosphere:
                null,

            tags: [
                "device",
                "atmosphere",
                "vaero"
            ]
        },


        {
            id:
                "white-tea",

            type:
                "atmosphere",

            name:
                "White Tea",

            eyebrow:
                "ATMOSPHERE 01",

            subtitle:
                "Temiz. Hafif. Dengeli.",

            description:
                "VAERO'nun ilk atmosferi. Ortama baskın bir parfüm hissi vermeden temiz ve dengeli bir karakter oluşturmak için tasarlandı.",

            featured:
                true,

            commerce: {

                purchasable:
                    null,

                amount:
                    null,

                currency:
                    null,

                availability:
                    "unknown",

                stock:
                    null
            },

            atmosphere:
                "clean",

            tags: [
                "white-tea",
                "clean",
                "balanced"
            ]
        },


        {
            id:
                "ocean",

            type:
                "atmosphere",

            name:
                "Ocean",

            eyebrow:
                "ATMOSPHERE 02",

            subtitle:
                "Serin. Açık. Ferah.",

            description:
                "Daha açık ve serin bir atmosfer isteyen kullanıcılar için geliştirilen ikinci VAERO atmosferi.",

            featured:
                false,

            commerce: {

                purchasable:
                    null,

                amount:
                    null,

                currency:
                    null,

                availability:
                    "unknown",

                stock:
                    null
            },

            atmosphere:
                "fresh",

            tags: [
                "ocean",
                "fresh",
                "open"
            ]
        }

    ],


    /* =====================================================
       EXPERIENCE LAYER
    ===================================================== */

    experiences: [

        {
            id:
                "experience-white-tea",

            productId:
                "white-tea",

            type:
                "Deneyim",

            title:
                "White Tea atmosferi",

            description:
                "Temiz, hafif ve dengeli bir atmosfer karakteri."
        },


        {
            id:
                "experience-device",

            productId:
                "device",

            type:
                "Kullanım",

            title:
                "Tek koku değil, sistem",

            description:
                "VAERO Device atmosferi kontrollü şekilde yöneten ana sistemdir."
        },


        {
            id:
                "experience-care",

            productId:
                "device",

            type:
                "VAERO Care",

            title:
                "Satıştan sonra devam eder",

            description:
                "Kurulum, kullanım, bakım ve uygun durumlarda çözüm desteği VAERO Care katmanında devam eder."
        },


        {
            id:
                "experience-ocean",

            productId:
                "ocean",

            type:
                "Atmosfer",

            title:
                "Ocean",

            description:
                "White Tea'den sonra daha serin ve açık bir atmosfer yönü."
        }

    ],


    /* =====================================================
       SAFETY
    ===================================================== */

    escapeHTML(value){

        return String(
            value ??
            ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    },


    /* =====================================================
       ENGINE / SERVICES
    ===================================================== */

    getEngine(){

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                VAERO.engine
            ){

                return VAERO.engine;

            }

        } catch(error){

            /* fallback */

        }


        if(
            typeof window !==
                "undefined"
        ){

            return (
                window.Engine ||
                null
            );

        }


        return null;

    },


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


    getCurrentEntity(){

        const engine =
            this.getEngine();


        return (
            engine?.currentOpenedEntity ||
            engine?.currentEntity ||
            engine?.rootEntity ||
            null
        );

    },


    getCurrentWorld(){

        const engine =
            this.getEngine();


        return (
            engine?.currentWorld ||
            null
        );

    },


    /* =====================================================
       STORAGE
    ===================================================== */

    storageKeys: {

        vision:
            "vaero:brand:vision:draft:v2",

        payment:
            "vaero:payment:intents:v2",

        entitlements:
            "vaero:payment:entitlements:v2"

    },


    readJSON(
        key,
        fallback
    ){

        if(
            typeof localStorage ===
                "undefined"
        ){

            return fallback;

        }


        try{

            const raw =
                localStorage.getItem(
                    key
                );


            if(!raw){

                return fallback;

            }


            return JSON.parse(
                raw
            );

        } catch(error){

            return fallback;

        }

    },


    writeJSON(
        key,
        value
    ){

        if(
            typeof localStorage ===
                "undefined"
        ){

            return false;

        }


        try{

            localStorage.setItem(
                key,
                JSON.stringify(
                    value
                )
            );


            return true;

        } catch(error){

            return false;

        }

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(
        prefix = "vaero"
    ){

        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){

                return `${prefix}_${crypto.randomUUID()}`;

            }

        } catch(error){

            /* fallback */

        }


        return `${prefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       PRODUCT HELPERS
    ===================================================== */

    getProduct(id){

        const productId =
            String(
                id ||
                ""
            ).trim();


        if(!productId){

            return null;

        }


        return (
            this.products.find(
                product =>
                    product.id ===
                    productId
            ) ||
            null
        );

    },


    getActiveProduct(){

        return (
            this.getProduct(
                this.activeProductId
            ) ||
            this.products[0] ||
            null
        );

    },


    getProductExperiences(
        productId
    ){

        return this.experiences.filter(
            item =>
                item.productId ===
                productId
        );

    },


    /* =====================================================
       COMMERCE SOURCE
    ===================================================== */

    getCommerceService(){

        return (
            this.getService(
                "commerce"
            ) ||
            this.getService(
                "commerceCore"
            ) ||
            this.getService(
                "productCatalog"
            ) ||
            null
        );

    },


    getRuntimeCommerce(
        product
    ){

        if(!product){

            return null;

        }


        const commerce =
            this.getCommerceService();


        if(!commerce){

            return null;

        }


        try{

            if(
                typeof commerce.getProduct ===
                    "function"
            ){

                const result =
                    commerce.getProduct(
                        product.id
                    );


                if(
                    result &&
                    typeof result ===
                        "object" &&
                    !Array.isArray(
                        result
                    )
                ){

                    return result;

                }

            }

        } catch(error){

            /* no verified runtime data */

        }


        return null;

    },


    getProductCommerce(product){

        if(!product){

            return {

                purchasable:
                    false,

                known:
                    false,

                amount:
                    null,

                currency:
                    null,

                availability:
                    "unknown",

                stock:
                    null

            };

        }


        const runtime =
            this.getRuntimeCommerce(
                product
            );


        const amountValue =
            Number(
                runtime?.amount
            );


        const amount =
            Number.isFinite(
                amountValue
            ) &&
            amountValue >=
                0
                ? amountValue
                : null;


        const currency =
            runtime?.currency
                ? String(
                    runtime.currency
                )
                    .trim()
                    .toUpperCase()
                : null;


        const purchasable =
            Boolean(
                runtime &&
                runtime.purchasable ===
                    true &&
                amount !==
                    null &&
                currency
            );


        return {

            purchasable,

            known:
                Boolean(
                    runtime
                ),

            amount,

            currency,

            availability:
                runtime?.availability
                    ? String(
                        runtime.availability
                    )
                    : "unknown",

            stock:
                Number.isFinite(
                    Number(
                        runtime?.stock
                    )
                )
                    ? Number(
                        runtime.stock
                    )
                    : null

        };

    },


    formatMoney(
        amount,
        currency
    ){

        const numeric =
            Number(
                amount
            );


        if(
            !Number.isFinite(
                numeric
            ) ||
            !currency
        ){

            return "Fiyat bilgisi bekleniyor";

        }


        try{

            return new Intl.NumberFormat(
                "tr-TR",
                {

                    style:
                        "currency",

                    currency:
                        String(
                            currency
                        )
                            .trim()
                            .toUpperCase(),

                    maximumFractionDigits:
                        2

                }
            ).format(
                numeric
            );

        } catch(error){

            return `${numeric} ${currency}`;

        }

    },


    getAvailabilityLabel(
        commerce
    ){

        if(
            !commerce ||
            commerce.known !==
                true
        ){

            return "Bilgi bekleniyor";

        }


        const status =
            String(
                commerce.availability ||
                "unknown"
            )
                .trim()
                .toLowerCase();


        const labels = {

            available:
                "Satışta",

            preorder:
                "Ön sipariş",

            unavailable:
                "Şu anda satışta değil",

            soldout:
                "Stokta yok",

            "sold-out":
                "Stokta yok",

            unknown:
                "Bilgi bekleniyor"

        };


        return (
            labels[
                status
            ] ||
            "Bilgi bekleniyor"
        );

    },


    /* =====================================================
       BRAIN CONTEXT
    ===================================================== */

    enterBrainContext(
        extra = {}
    ){

        try{

            const entity =
                this.getCurrentEntity();


            const world =
                this.getCurrentWorld();


            const awareness =
                this.getService(
                    "brainAwareness"
                );


            if(
                !awareness ||
                typeof awareness.enter !==
                    "function"
            ){

                return false;

            }


            awareness.enter(
                "vaero",
                {

                    entityId:
                        entity?.id ||
                        null,

                    worldId:
                        world?.id ||
                        null,

                    brand:
                        "VAERO",

                    application:
                        "vaero",

                    view:
                        this.activeView,

                    productId:
                        this.activeProductId ||
                        null,

                    source:
                        "vaero-app",

                    ...(
                        extra &&
                        typeof extra ===
                            "object" &&
                        !Array.isArray(
                            extra
                        )
                            ? extra
                            : {}
                    )

                }
            );


            return true;

        } catch(error){

            console.warn(
                "VAERO Brain context açılamadı:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       VIEW NAVIGATION
    ===================================================== */

    normalizeView(view){

        const normalized =
            String(
                view ||
                "discover"
            )
                .trim()
                .toLowerCase();


        const allowed = [

            "discover",
            "product",
            "vision",
            "care",
            "payment"

        ];


        return allowed.includes(
            normalized
        )
            ? normalized
            : "discover";

    },


    openView(view){

        const normalized =
            this.normalizeView(
                view
            );


        this.activeView =
            normalized;


        this.enterBrainContext();


        return this.refresh();

    },


    openProduct(productId){

        const product =
            this.getProduct(
                productId
            );


        if(!product){

            return false;

        }


        this.activeProductId =
            product.id;


        this.activeView =
            "product";


        this.enterBrainContext({

            productId:
                product.id

        });


        return this.refresh();

    },


    backToDiscover(){

        this.activeView =
            "discover";


        this.enterBrainContext();


        return this.refresh();

    },


    /* =====================================================
       RERENDER
    ===================================================== */

    refresh(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.mount !==
                "function"
        ){

            return false;

        }


        const entity =
            engine.currentOpenedEntity ||
            engine.currentEntity ||
            engine.rootEntity ||
            null;


        if(!entity){

            return false;

        }


        try{

            return (
                engine.mount(
                    entity
                ) !==
                false
            );

        } catch(error){

            console.warn(
                "VAERO App refresh failed:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       CONTINUE IN PART 2
    ===================================================== */

   /* =====================================================
       PAYMENT INTENT CORE
    ===================================================== */

    paymentCore: {

        version:
            "3.0.0",

        intents: [],

        loaded:
            false,


        /* =================================================
           HOST
        ================================================= */

        getHost(){

            if(
                typeof window ===
                    "undefined"
            ){

                return null;

            }


            return (
                window.VaeroApp ||
                null
            );

        },


        getService(name){

            const host =
                this.getHost();


            if(
                !host ||
                typeof host.getService !==
                    "function"
            ){

                return null;

            }


            return host.getService(
                name
            );

        },


        /* =================================================
           NORMALIZATION
        ================================================= */

        normalizeStatus(status){

            const value =
                String(
                    status ||
                    "draft"
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
                "completed",
                "failed",
                "refund-requested",
                "refunded"

            ];


            return allowed.includes(
                value
            )
                ? value
                : "draft";

        },


        normalizeMethod(method){

            const value =
                String(
                    method ||
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
                    provider ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            return value ||
                null;

        },


        cloneIntent(intent){

            if(!intent){

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


        /* =================================================
           LOAD / SAVE
        ================================================= */

        load(){

            if(
                this.loaded ===
                    true
            ){

                return this.all();

            }


            const host =
                this.getHost();


            if(!host){

                this.intents =
                    [];


                this.loaded =
                    true;


                return [];

            }


            const saved =
                host.readJSON(
                    host.storageKeys.payment,
                    []
                );


            if(
                !Array.isArray(
                    saved
                )
            ){

                this.intents =
                    [];


                this.loaded =
                    true;


                return [];

            }


            this.intents =
                saved
                    .filter(
                        intent =>
                            intent &&
                            typeof intent ===
                                "object" &&
                            !Array.isArray(
                                intent
                            ) &&
                            intent.id
                    )
                    .map(
                        intent => ({

                            ...intent,

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
                                    "VAERO Purchase"
                                ),

                            amount:
                                Number.isFinite(
                                    Number(
                                        intent.amount
                                    )
                                )
                                    ? Number(
                                        intent.amount
                                    )
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
                                    Number(
                                        intent.quantity
                                    ) ||
                                    1
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

                            verified:
                                false,

                            transactionId:
                                null,

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
                            },

                            metadata: {
                                ...(
                                    intent.metadata ||
                                    {}
                                )
                            },

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

                        })
                    );


            this.loaded =
                true;


            return this.all();

        },


        save(){

            const host =
                this.getHost();


            if(!host){

                return false;

            }


            const safeIntents =
                this.intents.map(
                    intent => ({

                        id:
                            intent.id,

                        source:
                            intent.source,

                        productId:
                            intent.productId,

                        title:
                            intent.title,

                        amount:
                            intent.amount,

                        currency:
                            intent.currency,

                        quantity:
                            intent.quantity,

                        method:
                            intent.method,

                        provider:
                            intent.provider,

                        status:
                            (
                                intent.status ===
                                    "completed" ||
                                intent.status ===
                                    "refunded"
                            )
                                ? "awaiting-provider"
                                : intent.status,

                        verified:
                            false,

                        transactionId:
                            null,

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
                        },

                        metadata: {
                            ...(
                                intent.metadata ||
                                {}
                            )
                        },

                        createdAt:
                            intent.createdAt,

                        updatedAt:
                            intent.updatedAt

                    })
                );


            return host.writeJSON(
                host.storageKeys.payment,
                safeIntents
            );

        },


        /* =================================================
           READ
        ================================================= */

        all(){

            if(
                this.loaded !==
                    true
            ){

                this.load();

            }


            return this.intents.map(
                intent =>
                    this.cloneIntent(
                        intent
                    )
            );

        },


        get(intentId){

            if(
                this.loaded !==
                    true
            ){

                this.load();

            }


            const id =
                String(
                    intentId ||
                    ""
                ).trim();


            if(!id){

                return null;

            }


            const intent =
                this.intents.find(
                    item =>
                        item.id ===
                        id
                );


            return this.cloneIntent(
                intent
            );

        },


        getMutable(intentId){

            if(
                this.loaded !==
                    true
            ){

                this.load();

            }


            const id =
                String(
                    intentId ||
                    ""
                ).trim();


            if(!id){

                return null;

            }


            return (
                this.intents.find(
                    item =>
                        item.id ===
                        id
                ) ||
                null
            );

        },


        /* =================================================
           CREATE
        ================================================= */

        createIntent(
            payload = {}
        ){

            const host =
                this.getHost();


            if(!host){

                return null;

            }


            const amountValue =
                Number(
                    payload.amount
                );


            const amount =
                Number.isFinite(
                    amountValue
                ) &&
                amountValue >=
                    0
                    ? amountValue
                    : null;


            const currency =
                payload.currency
                    ? String(
                        payload.currency
                    )
                        .trim()
                        .toUpperCase()
                    : null;


            if(
                amount ===
                    null ||
                !currency
            ){

                return null;

            }


            const quantity =
                Math.max(
                    1,
                    Math.floor(
                        Number(
                            payload.quantity
                        ) ||
                        1
                    )
                );


            const intent = {

                id:
                    host.createId(
                        "payment"
                    ),

                source:
                    String(
                        payload.source ||
                        "vaero"
                    )
                        .trim()
                        .toLowerCase(),

                productId:
                    payload.productId ||
                    null,

                title:
                    String(
                        payload.title ||
                        "VAERO Purchase"
                    ).trim(),

                amount,

                currency,

                quantity,

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

                commerceSnapshot: {

                    amount,

                    currency,

                    availability:
                        payload
                            ?.commerceSnapshot
                            ?.availability ||
                        null,

                    capturedAt:
                        Date.now()

                },

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
                    Date.now(),

                updatedAt:
                    Date.now()

            };


            this.intents.unshift(
                intent
            );


            this.save();


            return this.cloneIntent(
                intent
            );

        },


        /* =================================================
           PAYMENT METHOD
        ================================================= */

        setMethod(
            intentId,
            method
        ){

            const intent =
                this.getMutable(
                    intentId
                );


            const normalizedMethod =
                this.normalizeMethod(
                    method
                );


            if(
                !intent ||
                !normalizedMethod
            ){

                return false;

            }


            if(
                [
                    "cancelled",
                    "completed",
                    "refunded"
                ].includes(
                    intent.status
                )
            ){

                return false;

            }


            intent.method =
                normalizedMethod;


            intent.status =
                intent.provider
                    ? "ready"
                    : "requires-selection";


            intent.updatedAt =
                Date.now();


            this.save();


            return this.cloneIntent(
                intent
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


        /* =================================================
           PROVIDER REGISTRY
        ================================================= */

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

                if(
                    typeof registry.get ===
                        "function"
                ){

                    return (
                        registry.get(
                            id
                        ) ||
                        null
                    );

                }


                if(
                    typeof registry.find ===
                        "function"
                ){

                    return (
                        registry.find(
                            id
                        ) ||
                        null
                    );

                }

            } catch(error){

                return null;

            }


            return null;

        },


        getAvailableProviders(){

            const registry =
                this.getProviderRegistry();


            if(!registry){

                return [];

            }


            try{

                if(
                    typeof registry.all ===
                        "function"
                ){

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
                                provider => ({
                                    ...provider
                                })
                            )
                        : [];

                }

            } catch(error){

                return [];

            }


            return [];

        },


        setProvider(
            intentId,
            providerId
        ){

            const intent =
                this.getMutable(
                    intentId
                );


            const normalizedProvider =
                this.normalizeProvider(
                    providerId
                );


            if(
                !intent ||
                !normalizedProvider
            ){

                return false;

            }


            if(
                [
                    "cancelled",
                    "completed",
                    "refunded"
                ].includes(
                    intent.status
                )
            ){

                return false;

            }


            const provider =
                this.getProvider(
                    normalizedProvider
                );


            if(!provider){

                intent.provider =
                    null;


                intent.providerState = {

                    connected:
                        false,

                    reference:
                        null,

                    lastAttemptAt:
                        Date.now()

                };


                intent.status =
                    "provider-unavailable";


                intent.updatedAt =
                    Date.now();


                this.save();


                return false;

            }


            intent.provider =
                normalizedProvider;


            intent.providerState = {

                connected:
                    true,

                reference:
                    provider.id ||
                    normalizedProvider,

                lastAttemptAt:
                    null

            };


            intent.status =
                intent.method
                    ? "ready"
                    : "requires-selection";


            intent.updatedAt =
                Date.now();


            this.save();


            return this.cloneIntent(
                intent
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


        /* =================================================
           PROVIDER EXECUTION
        ================================================= */

        start(intentId){

            const intent =
                this.getMutable(
                    intentId
                );


            if(!intent){

                return false;

            }


            if(
                [
                    "cancelled",
                    "completed",
                    "refunded"
                ].includes(
                    intent.status
                )
            ){

                return false;

            }


            if(
                !intent.method
            ){

                intent.status =
                    "requires-selection";


                intent.updatedAt =
                    Date.now();


                this.save();


                return this.cloneIntent(
                    intent
                );

            }


            if(
                !intent.provider
            ){

                intent.status =
                    "provider-unavailable";


                intent.updatedAt =
                    Date.now();


                this.save();


                return this.cloneIntent(
                    intent
                );

            }


            const provider =
                this.getProvider(
                    intent.provider
                );


            if(!provider){

                intent.status =
                    "provider-unavailable";


                intent.providerState = {

                    connected:
                        false,

                    reference:
                        intent.provider,

                    lastAttemptAt:
                        Date.now()

                };


                intent.updatedAt =
                    Date.now();


                this.save();


                return this.cloneIntent(
                    intent
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

                intent.status =
                    "provider-unavailable";


                intent.providerState = {

                    connected:
                        true,

                    reference:
                        provider.id ||
                        intent.provider,

                    lastAttemptAt:
                        Date.now()

                };


                intent.updatedAt =
                    Date.now();


                this.save();


                return this.cloneIntent(
                    intent
                );

            }


            let result =
                null;


            try{

                result =
                    startCheckout.call(
                        provider,
                        {

                            intentId:
                                intent.id,

                            productId:
                                intent.productId,

                            title:
                                intent.title,

                            amount:
                                intent.amount,

                            currency:
                                intent.currency,

                            quantity:
                                intent.quantity,

                            method:
                                intent.method,

                            source:
                                intent.source

                        }
                    );

            } catch(error){

                console.error(
                    "VAERO payment provider start failed:",
                    error
                );


                intent.status =
                    "failed";


                intent.providerState = {

                    connected:
                        true,

                    reference:
                        provider.id ||
                        intent.provider,

                    lastAttemptAt:
                        Date.now()

                };


                intent.updatedAt =
                    Date.now();


                this.save();


                return this.cloneIntent(
                    intent
                );

            }


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                intent.status =
                    "awaiting-provider";


                intent.providerState = {

                    connected:
                        true,

                    reference:
                        provider.id ||
                        intent.provider,

                    lastAttemptAt:
                        Date.now()

                };


                intent.updatedAt =
                    Date.now();


                this.save();


                return this.cloneIntent(
                    intent
                );

            }


            if(
                result ===
                    false ||
                result?.success ===
                    false
            ){

                intent.status =
                    "failed";


                intent.updatedAt =
                    Date.now();


                this.save();


                return this.cloneIntent(
                    intent
                );

            }


            intent.status =
                "awaiting-provider";


            intent.providerState = {

                connected:
                    true,

                reference:
                    result?.reference ||
                    result?.checkoutId ||
                    provider.id ||
                    intent.provider,

                lastAttemptAt:
                    Date.now()

            };


            intent.updatedAt =
                Date.now();


            this.save();


            return this.cloneIntent(
                intent
            );

        },


        startIntent(intentId){

            return this.start(
                intentId
            );

        },


        /* =================================================
           CANCEL
        ================================================= */

        cancel(intentId){

            const intent =
                this.getMutable(
                    intentId
                );


            if(!intent){

                return false;

            }


            if(
                [
                    "completed",
                    "refunded"
                ].includes(
                    intent.status
                )
            ){

                return false;

            }


            intent.status =
                "cancelled";


            intent.updatedAt =
                Date.now();


            this.save();


            return this.cloneIntent(
                intent
            );

        },


        cancelIntent(intentId){

            return this.cancel(
                intentId
            );

        },


        /* =================================================
           REFUND REQUEST
        ================================================= */

        refund(transactionId){

            const transactionService =
                this.getService(
                    "paymentTransactions"
                ) ||
                this.getService(
                    "paymentService"
                );


            if(
                !transactionService ||
                typeof transactionService
                    .requestRefund !==
                    "function"
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


            try{

                const result =
                    transactionService
                        .requestRefund(
                            id
                        );


                return result ||
                    false;

            } catch(error){

                return false;

            }

        },


        /* =================================================
           VERIFIED ENTITLEMENT
        ================================================= */

        hasVerifiedEntitlement(
            applicationId
        ){

            const appId =
                String(
                    applicationId ||
                    ""
                ).trim();


            if(!appId){

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
                    entitlementService
                        .hasVerifiedEntitlement(
                            appId
                        );


                if(
                    result &&
                    typeof result.then ===
                        "function"
                ){

                    return false;

                }


                return result ===
                    true;

            } catch(error){

                return false;

            }

        },


        /* =================================================
           REPORT
        ================================================= */

        report(){

            const intents =
                this.all();


            return {

                version:
                    this.version,

                total:
                    intents.length,

                draft:
                    intents.filter(
                        intent =>
                            intent.status ===
                                "draft"
                    ).length,

                ready:
                    intents.filter(
                        intent =>
                            intent.status ===
                                "ready"
                    ).length,

                awaitingProvider:
                    intents.filter(
                        intent =>
                            intent.status ===
                                "awaiting-provider"
                    ).length,

                cancelled:
                    intents.filter(
                        intent =>
                            intent.status ===
                                "cancelled"
                    ).length,

                providerRegistryAvailable:
                    Boolean(
                        this.getProviderRegistry()
                    )

            };

        }

    },


    getPaymentCore(){

        return this.paymentCore;

    },


    /* =====================================================
       PRODUCT → PAYMENT INTENT
    ===================================================== */

    startProductPurchase(
        productId
    ){

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
            this.paymentCore
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

    },


    /* =====================================================
       CURRENT PAYMENT INTENT
    ===================================================== */

    getCurrentPaymentIntent(){

        const engine =
            this.getEngine();


        const current =
            engine
                ?.currentVaeroPaymentIntent;


        if(
            current &&
            current.id
        ){

            const stored =
                this.paymentCore.get(
                    current.id
                );


            if(stored){

                if(engine){

                    engine.currentVaeroPaymentIntent =
                        stored;

                }


                return stored;

            }

        }


        return null;

    },


    syncCurrentPaymentIntent(
        updated
    ){

        if(!updated){

            return false;

        }


        const engine =
            this.getEngine();


        if(engine){

            engine.currentVaeroPaymentIntent =
                updated;

        }


        return true;

    },


    selectPaymentMethod(method){

        const intent =
            this.getCurrentPaymentIntent();


        if(!intent){

            return false;

        }


        const updated =
            this.paymentCore
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

    },


    selectPaymentProvider(
        provider
    ){

        const intent =
            this.getCurrentPaymentIntent();


        if(!intent){

            return false;

        }


        const updated =
            this.paymentCore
                .setProvider(
                    intent.id,
                    provider
                );


        if(!updated){

            const latest =
                this.paymentCore.get(
                    intent.id
                );


            if(latest){

                this.syncCurrentPaymentIntent(
                    latest
                );

            }


            return this.refresh();

        }


        this.syncCurrentPaymentIntent(
            updated
        );


        this.enterBrainContext({

            paymentIntentId:
                intent.id,

            paymentProvider:
                updated.provider

        });


        return this.refresh();

    },


    beginPayment(){

        const intent =
            this.getCurrentPaymentIntent();


        if(!intent){

            return false;

        }


        const updated =
            this.paymentCore.start(
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

    },


    cancelPayment(){

        const intent =
            this.getCurrentPaymentIntent();


        if(!intent){

            this.activeView =
                "product";


            return this.refresh();

        }


        const updated =
            this.paymentCore.cancel(
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

    },


    /* =====================================================
       CONTINUE IN PART 3
    ===================================================== */

   /* =====================================================
       VISION STUDIO
    ===================================================== */

    loadVisionDraft(){

        const saved =
            this.readJSON(
                this.storageKeys.vision,
                null
            );


        this.visionDraft =
            (
                saved &&
                typeof saved ===
                    "object" &&
                !Array.isArray(
                    saved
                )
            )
                ? {
                    ...saved
                }
                : null;


        return this.visionDraft;

    },


    saveVision(){

        if(
            typeof document ===
                "undefined"
        ){

            return false;

        }


        const titleInput =
            document.getElementById(
                "vaeroVisionTitle"
            );


        const directionInput =
            document.getElementById(
                "vaeroVisionDirection"
            );


        const descriptionInput =
            document.getElementById(
                "vaeroVisionDescription"
            );


        const title =
            String(
                titleInput?.value ||
                ""
            )
                .trim()
                .slice(
                    0,
                    80
                );


        const direction =
            String(
                directionInput?.value ||
                ""
            )
                .trim()
                .slice(
                    0,
                    100
                );


        const description =
            String(
                descriptionInput?.value ||
                ""
            )
                .trim()
                .slice(
                    0,
                    700
                );


        if(!title){

            titleInput?.focus?.();


            return false;

        }


        const now =
            Date.now();


        const draft = {

            id:
                this.visionDraft?.id ||
                this.createId(
                    "vision"
                ),

            title,

            direction,

            description,

            status:
                "draft",

            source:
                "vaero-vision-studio",

            createdAt:
                this.visionDraft
                    ?.createdAt ||
                now,

            updatedAt:
                now

        };


        this.visionDraft =
            draft;


        this.writeJSON(
            this.storageKeys.vision,
            draft
        );


        this.enterBrainContext({

            visionId:
                draft.id,

            visionStatus:
                "draft"

        });


        return this.refresh();

    },


    /* =====================================================
       VIEW LABELS
    ===================================================== */

    getPaymentStatusLabel(status){

        const labels = {

            draft:
                "Hazırlanıyor",

            ready:
                "Ödemeye hazır",

            "requires-selection":
                "Ödeme yöntemi seç",

            "awaiting-provider":
                "Ödeme sağlayıcısı bekleniyor",

            "provider-unavailable":
                "Ödeme sağlayıcısı bağlı değil",

            cancelled:
                "İptal edildi",

            completed:
                "Tamamlandı",

            failed:
                "İşlem başlatılamadı",

            "refund-requested":
                "İade talebi alındı",

            refunded:
                "İade edildi"

        };


        return (
            labels[
                status
            ] ||
            "Hazırlanıyor"
        );

    },


    /* =====================================================
       HEADER
    ===================================================== */

    renderHeader(){

        return `
            <header class="vaero-commerce-header">

                <div>

                    <span class="vaero-commerce-eyebrow">
                        PERSONAL ATMOSPHERE SYSTEM
                    </span>

                    <h1>
                        VAERO
                    </h1>

                    <p>
                        Bu bir koku değil. Bir atmosfer.
                    </p>

                </div>

                <button
                    type="button"
                    class="vaero-commerce-id-btn"
                    data-vaero-command="view"
data-view="care"
                    aria-label="VAERO Care"
                >
                    VAERO

                    <span aria-hidden="true">
                        V
                    </span>
                </button>

            </header>
        `;

    },


    /* =====================================================
       APP NAVIGATION
    ===================================================== */

    renderNavigation(){

        return `
            <div
                class="vaero-commerce-actions"
                role="group"
                aria-label="VAERO uygulama bölümleri"
            >

                <button
                    type="button"
                    class="${
                        this.activeView ===
                            "discover" ||
                        this.activeView ===
                            "product"
                            ? "is-active"
                            : ""
                    }"
                    data-vaero-command="view"
data-view="discover"
                    aria-pressed="${
                        this.activeView ===
                            "discover" ||
                        this.activeView ===
                            "product"
                            ? "true"
                            : "false"
                    }"
                >
                    Keşfet
                </button>


                <button
                    type="button"
                    class="${
                        this.activeView ===
                            "vision"
                            ? "is-active"
                            : ""
                    }"
                    data-vaero-command="view"
data-view="vision"
                    aria-pressed="${
                        this.activeView ===
                            "vision"
                            ? "true"
                            : "false"
                    }"
                >
                    Vizyon
                </button>


                <button
                    type="button"
                    class="${
                        this.activeView ===
                            "care"
                            ? "is-active"
                            : ""
                    }"
                    onclick="VaeroApp.openView('care')"
                    aria-pressed="${
                        this.activeView ===
                            "care"
                            ? "true"
                            : "false"
                    }"
                >
                    Care
                </button>

            </div>
        `;

    },


    /* =====================================================
       DISCOVER HERO
    ===================================================== */

    renderDiscoverHero(){

        return `
            <div class="vaero-core-status">

                <div>

                    <strong>
                        Kişisel atmosferini oluştur
                    </strong>

                    <small>
                        Cihaz, atmosfer ve yaşam alanın tek VAERO deneyiminde birleşir.
                    </small>

                </div>


                <span class="vaero-commerce-eyebrow">
                    VAERO
                </span>

            </div>
        `;

    },


    /* =====================================================
       PRODUCTS
    ===================================================== */

    renderProducts(){

        return `
            <div class="vaero-cart-items">

                ${this.products
                    .map(
                        product => {

                            const commerce =
                                this.getProductCommerce(
                                    product
                                );


                            const priceLabel =
                                commerce.known ===
                                    true &&
                                commerce.amount !==
                                    null &&
                                commerce.currency
                                    ? this.formatMoney(
                                        commerce.amount,
                                        commerce.currency
                                    )
                                    : null;


                            return `
                                <button
                                    type="button"
                                    class="vaero-cart-item"
                                    data-vaero-command="product"
data-product-id="${this.escapeHTML(
    product.id
)}"
                                >

                                    <div class="vaero-cart-item-copy">

                                        <span class="vaero-product-type">
                                            ${this.escapeHTML(
                                                product.eyebrow
                                            )}
                                        </span>

                                        <strong>
                                            ${this.escapeHTML(
                                                product.name
                                            )}
                                        </strong>

                                        <small>
                                            ${this.escapeHTML(
                                                product.subtitle
                                            )}
                                        </small>

                                    </div>


                                    <div>

                                        ${
                                            priceLabel
                                                ? `
                                                    <strong>
                                                        ${this.escapeHTML(
                                                            priceLabel
                                                        )}
                                                    </strong>
                                                  `
                                                : `
                                                    <small>
                                                        ${this.escapeHTML(
                                                            this.getAvailabilityLabel(
                                                                commerce
                                                            )
                                                        )}
                                                    </small>
                                                  `
                                        }

                                    </div>

                                </button>
                            `;

                        }
                    )
                    .join(
                        ""
                    )}

            </div>
        `;

    },


    /* =====================================================
       DISCOVER
    ===================================================== */

    renderDiscover(){

        return `
            ${this.renderDiscoverHero()}


            <div class="vaero-commerce-section-head">

                <span>
                    ATMOSPHERE COLLECTION
                </span>

                <button
                    type="button"
                    data-vaero-command="product"
data-product-id="device"
                >
                    Cihazı gör
                </button>

            </div>


            ${this.renderProducts()}


            <div class="vaero-payment-intent">

                <strong>
                    Kendi vizyonunu yarat
                </strong>

                <small>
                    Bir atmosfer, ürün veya yaşam fikri oluştur. VAERO Vision Studio bu fikri sana ait bir taslak olarak saklar.
                </small>


                <div class="vaero-commerce-actions">

                    <button
                        type="button"
                        onclick="VaeroApp.openView('vision')"
                    >
                        Vizyon Stüdyosu
                    </button>

                </div>

            </div>
        `;

    },


    /* =====================================================
       PRODUCT DETAIL
    ===================================================== */

    renderProduct(){

        const product =
            this.getActiveProduct();


        if(!product){

            return this.renderDiscover();

        }


        const experiences =
            this.getProductExperiences(
                product.id
            );


        const commerce =
            this.getProductCommerce(
                product
            );


        const priceLabel =
            commerce.known ===
                true &&
            commerce.amount !==
                null &&
            commerce.currency
                ? this.formatMoney(
                    commerce.amount,
                    commerce.currency
                )
                : "—";


        const availabilityLabel =
            this.getAvailabilityLabel(
                commerce
            );


        return `
            <div class="vaero-commerce-section-head">

                <span>
                    ${this.escapeHTML(
                        product.eyebrow
                    )}
                </span>

                <button
                    type="button"
                    data-vaero-command="back-discover"
                >
                    ← Koleksiyon
                </button>

            </div>


            <div class="vaero-payment-intent">

                <strong>
                    ${this.escapeHTML(
                        product.name
                    )}
                </strong>

                <small>
                    ${this.escapeHTML(
                        product.description
                    )}
                </small>


                <div class="vaero-payment-meta">

                    <div>

                        <span>
                            TÜR
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                product.type ===
                                    "device"
                                    ? "Device"
                                    : "Atmosphere"
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            DURUM
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                availabilityLabel
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            MARKA
                        </span>

                        <strong>
                            VAERO
                        </strong>

                    </div>


                    <div>

                        <span>
                            FİYAT
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                priceLabel
                            )}
                        </strong>

                    </div>

                </div>

            </div>


            ${
                experiences.length
                    ? `
                        <div class="vaero-cart-items">

                            ${experiences
                                .map(
                                    experience => `
                                        <div class="vaero-cart-item">

                                            <div class="vaero-cart-item-copy">

                                                <span class="vaero-product-type">
                                                    ${this.escapeHTML(
                                                        experience.type
                                                    )}
                                                </span>

                                                <strong>
                                                    ${this.escapeHTML(
                                                        experience.title
                                                    )}
                                                </strong>

                                                <small>
                                                    ${this.escapeHTML(
                                                        experience.description
                                                    )}
                                                </small>

                                            </div>

                                        </div>
                                    `
                                )
                                .join(
                                    ""
                                )}

                        </div>
                      `
                    : ""
            }


            <div class="vaero-commerce-actions">

                ${
                    commerce.purchasable
                        ? `
                            <button
                                type="button"
                                data-vaero-command="purchase"
data-product-id="${this.escapeHTML(
    product.id
)}"
                            >
                                Satın Al
                            </button>
                          `
                        : `
                            <button
                                type="button"
                                disabled
                                aria-disabled="true"
                            >
                                ${this.escapeHTML(
                                    availabilityLabel
                                )}
                            </button>
                          `
                }


                <button
                    type="button"
                    onclick="VaeroApp.openView('care')"
                >
                    VAERO Care
                </button>

            </div>
        `;

    },


    /* =====================================================
       VISION STUDIO
    ===================================================== */

    renderVision(){

        const draft =
            this.visionDraft ||
            this.loadVisionDraft();


        return `
            <div class="vaero-commerce-section-head">

                <span>
                    VISION STUDIO
                </span>

                <button
                    type="button"
                    onclick="VaeroApp.openView('discover')"
                >
                    ← VAERO
                </button>

            </div>


            <div class="vaero-payment-intent">

                <strong>
                    Vizyonunu yarat, dünyaya göster.
                </strong>

                <small>
                    Fikrini önce sana ait bir taslak olarak oluştur. Bu alan yayınlama, topluluk paylaşımı veya satış işlemi yapmaz.
                </small>

            </div>


            <label class="engine-field">

                <span>
                    Vizyon adı
                </span>

                <input
                    id="vaeroVisionTitle"
                    type="text"
                    maxlength="80"
                    autocomplete="off"
                    placeholder="Örn. Midnight Atmosphere"
                    value="${this.escapeHTML(
                        draft?.title ||
                        ""
                    )}"
                >

            </label>


            <label class="engine-field">

                <span>
                    Yön
                </span>

                <input
                    id="vaeroVisionDirection"
                    type="text"
                    maxlength="100"
                    autocomplete="off"
                    placeholder="Atmosfer, ürün, moda, yaşam..."
                    value="${this.escapeHTML(
                        draft?.direction ||
                        ""
                    )}"
                >

            </label>


            <label class="engine-field">

                <span>
                    Vizyon
                </span>

                <textarea
                    id="vaeroVisionDescription"
                    maxlength="700"
                    rows="4"
                    placeholder="Ne hissettirmeli? Nasıl görünmeli? İnsanların hayatında ne değiştirmeli?"
                >${this.escapeHTML(
                    draft?.description ||
                    ""
                )}</textarea>

            </label>


            <div class="vaero-commerce-actions">

                <button
                    type="button"
                    data-vaero-command="save-vision"
                >
                    Taslağı Kaydet
                </button>

            </div>


            ${
                draft
                    ? `
                        <div class="vaero-payment-status">

                            <strong>
                                Vizyon taslağın kayıtlı
                            </strong>

                            <small>
                                ${this.escapeHTML(
                                    draft.title
                                )}
                            </small>

                        </div>
                      `
                    : ""
            }
        `;

    },


    /* =====================================================
       CARE
    ===================================================== */

    renderCare(){

        return `
            <div class="vaero-commerce-section-head">

                <span>
                    VAERO CARE
                </span>

                <button
                    type="button"
                    onclick="VaeroApp.openView('discover')"
                >
                    ← VAERO
                </button>

            </div>


            <div class="vaero-core-status">

                <div>

                    <strong>
                        Satıştan sonra da VAERO
                    </strong>

                    <small>
                        Cihaz kullanımı, kurulum, bakım ve atmosfer deneyimin için destek katmanı.
                    </small>

                </div>

            </div>


            <div class="vaero-cart-items">

                <div class="vaero-cart-item">

                    <div class="vaero-cart-item-copy">

                        <span class="vaero-product-type">
                            DEVICE
                        </span>

                        <strong>
                            Kurulum
                        </strong>

                        <small>
                            Cihazın ilk kullanım ve yerleşim yönlendirmeleri.
                        </small>

                    </div>

                </div>


                <div class="vaero-cart-item">

                    <div class="vaero-cart-item-copy">

                        <span class="vaero-product-type">
                            ATMOSPHERE
                        </span>

                        <strong>
                            Kullanım
                        </strong>

                        <small>
                            Atmosfer yoğunluğu ve kullanım alışkanlığı konusunda rehberlik.
                        </small>

                    </div>

                </div>


                <div class="vaero-cart-item">

                    <div class="vaero-cart-item-copy">

                        <span class="vaero-product-type">
                            CARE
                        </span>

                        <strong>
                            Destek
                        </strong>

                        <small>
                            Ürün deneyimin devam ederken ihtiyaç duyduğun VAERO desteği.
                        </small>

                    </div>

                </div>

            </div>
        `;

    },


    /* =====================================================
       CONTINUE IN PART 4
    ===================================================== */

   /* =====================================================
       PAYMENT
    ===================================================== */

    renderPayment(){

        const intent =
            this.getCurrentPaymentIntent();


        const product =
            this.getActiveProduct();


        if(
            !intent ||
            !product
        ){

            return `
                <div class="vaero-payment-empty">

                    <strong>
                        Aktif ödeme bulunamadı
                    </strong>

                    <span>
                        Önce satın alınabilir bir VAERO ürünü seç.
                    </span>

                    <div class="vaero-commerce-actions">

                        <button
                            type="button"
                            onclick="VaeroApp.openView('discover')"
                        >
                            Koleksiyona Dön
                        </button>

                    </div>

                </div>
            `;

        }


        const providers =
            this.paymentCore
                .getAvailableProviders();


        return `
            <div class="vaero-commerce-section-head">

                <span>
                    SECURE PURCHASE
                </span>

                <button
                    type="button"
                    data-vaero-command="payment-cancel"
                >
                    İptal
                </button>

            </div>


            <div class="vaero-payment-intent">

                <strong>
                    ${this.escapeHTML(
                        product.name
                    )}
                </strong>

                <small>
                    Satın alma niyeti oluşturuldu. Ödeme yalnız bağlı ve doğrulanmış bir sağlayıcı üzerinden devam edebilir.
                </small>


                <div class="vaero-payment-meta">

                    <div>

                        <span>
                            TUTAR
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                this.formatMoney(
                                    intent.amount,
                                    intent.currency
                                )
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            ADET
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                intent.quantity
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            YÖNTEM
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                intent.method ||
                                "Seçilmedi"
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            DURUM
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                this.getPaymentStatusLabel(
                                    intent.status
                                )
                            )}
                        </strong>

                    </div>

                </div>

            </div>


            <div class="vaero-payment-methods">

                <strong>
                    Ödeme yöntemi
                </strong>

                <small>
                    Kullanacağın ödeme yöntemini seç.
                </small>


                <div class="vaero-commerce-actions">

                    <button
                        type="button"
                        class="${
                            intent.method ===
                                "card"
                                ? "is-active"
                                : ""
                        }"
                        data-vaero-command="payment-method"
data-payment-method="card"
                        aria-pressed="${
                            intent.method ===
                                "card"
                                ? "true"
                                : "false"
                        }"
                    >
                        Kart
                    </button>


                    <button
                        type="button"
                        class="${
                            intent.method ===
                                "bank"
                                ? "is-active"
                                : ""
                        }"
                        data-vaero-command="payment-method"
data-payment-method="card"
                        aria-pressed="${
                            intent.method ===
                                "bank"
                                ? "true"
                                : "false"
                        }"
                    >
                        Banka
                    </button>

                </div>

            </div>


            <div class="vaero-payment-methods">

                <strong>
                    Ödeme sağlayıcısı
                </strong>

                ${
                    providers.length
                        ? `
                            <small>
                                Kullanılabilir doğrulanmış sağlayıcılardan birini seç.
                            </small>

                            <div class="vaero-commerce-actions">

                                ${providers
                                    .map(
                                        provider => {

                                            const providerId =
                                                String(
                                                    provider.id ||
                                                    ""
                                                ).trim();


                                            if(!providerId){

                                                return "";

                                            }


                                            const providerName =
                                                provider.title ||
                                                provider.name ||
                                                providerId;


                                            return `
                                                <button
                                                    type="button"
                                                    class="${
                                                        intent.provider ===
                                                            providerId
                                                            ? "is-active"
                                                            : ""
                                                    }"
                                                    data-vaero-command="payment-provider"
data-payment-provider="${this.escapeHTML(
    providerId
)}"
                                                    aria-pressed="${
                                                        intent.provider ===
                                                            providerId
                                                            ? "true"
                                                            : "false"
                                                    }"
                                                >
                                                    ${this.escapeHTML(
                                                        providerName
                                                    )}
                                                </button>
                                            `;

                                        }
                                    )
                                    .join(
                                        ""
                                    )}

                            </div>
                        `
                        : `
                            <small>
                                Henüz VAERO Engine'e bağlı bir ödeme sağlayıcısı bulunmuyor.
                            </small>
                        `
                }

            </div>


            <div class="vaero-payment-status">

                <strong>
                    ${this.escapeHTML(
                        this.getPaymentStatusLabel(
                            intent.status
                        )
                    )}
                </strong>

                <small>
                    Tarayıcıdaki ödeme niyeti bir ödeme kanıtı değildir. İşlem ancak gerçek ödeme altyapısı tarafından doğrulanabilir.
                </small>

            </div>


            <div class="vaero-commerce-actions">

                <button
                    type="button"
                    data-vaero-command="payment-start"
                    ${
                        !intent.method ||
                        !intent.provider
                            ? "disabled aria-disabled=\"true\""
                            : ""
                    }
                >
                    Ödemeye Devam Et
                </button>


                <button
                    type="button"
                    onclick="VaeroApp.cancelPayment()"
                >
                    Vazgeç
                </button>

            </div>
        `;

    },


    /* =====================================================
       ACTIVE CONTENT
    ===================================================== */

    renderActiveView(){

        switch(
            this.activeView
        ){

            case "product":

                return this.renderProduct();


            case "vision":

                return this.renderVision();


            case "care":

                return this.renderCare();


            case "payment":

                return this.renderPayment();


            case "discover":
            default:

                return this.renderDiscover();

        }

    },


    /* =====================================================
       BRAIN PANEL
    ===================================================== */

    renderBrainPanel(){

        try{

            if(
                typeof window !==
                    "undefined" &&
                window.UI &&
                typeof window.UI.brainPanel ===
                    "function"
            ){

                const result =
                    window.UI.brainPanel();


                return typeof result ===
                    "string"
                    ? result
                    : "";

            }

        } catch(error){

            /* optional UI */

        }


        return "";

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const product =
            this.getActiveProduct();


        const commerce =
            product
                ? this.getProductCommerce(
                    product
                )
                : null;


        const intent =
            this.getCurrentPaymentIntent();


        return {

            id:
                this.id,

            version:
                this.version,

            title:
                this.title,

            activeView:
                this.activeView,

            activeProductId:
                product?.id ||
                null,

            productCount:
                this.products.length,

            visionDraft:
                Boolean(
                    this.visionDraft
                ),

            commerce: {

                known:
                    commerce?.known ===
                    true,

                purchasable:
                    commerce?.purchasable ===
                    true,

                availability:
                    commerce?.availability ||
                    "unknown"

            },

            payment: {

                activeIntentId:
                    intent?.id ||
                    null,

                status:
                    intent?.status ||
                    null,

                provider:
                    intent?.provider ||
                    null

            }

        };

    },

   /* =====================================================
       VAERO INTERNAL COMMAND ROUTER
    ===================================================== */

    handleCommand(
        command,
        element = null
    ){

        const normalized =
            String(
                command ||
                ""
            )
                .trim()
                .toLowerCase();


        switch(normalized){

            case "view":

                return this.openView(
                    element?.dataset
                        ?.view ||
                    "discover"
                );


            case "product":

                return this.openProduct(
                    element?.dataset
                        ?.productId
                );


            case "back-discover":

                return this.backToDiscover();


            case "purchase":

                return this.startProductPurchase(
                    element?.dataset
                        ?.productId
                );


            case "save-vision":

                return this.saveVision();


            case "payment-method":

                return this.selectPaymentMethod(
                    element?.dataset
                        ?.paymentMethod
                );


            case "payment-provider":

                return this.selectPaymentProvider(
                    element?.dataset
                        ?.paymentProvider
                );


            case "payment-start":

                return this.beginPayment();


            case "payment-cancel":

                return this.cancelPayment();


            default:

                return false;

        }

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(){

        this.activeView =
            this.normalizeView(
                this.activeView
            );


        this.paymentCore.load();


        this.loadVisionDraft();


        this.enterBrainContext();


        return `
            <section class="engine-page vaero-commerce-app">

                ${this.renderHeader()}


                <section class="vaero-commerce-section">

                    ${this.renderNavigation()}


                    ${this.renderActiveView()}

                </section>


                ${this.renderBrainPanel()}

            </section>
        `;

    }

};

/* =========================================================
   VAERO APP EVENT DELEGATION
========================================================= */

if(
    typeof document !==
        "undefined"
){

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target;


            if(
                !target ||
                typeof target.closest !==
                    "function"
            ){

                return;

            }


            const commandTarget =
                target.closest(
                    "[data-vaero-command]"
                );


            if(!commandTarget){

                return;

            }


            event.preventDefault();


            VaeroApp.handleCommand(
                commandTarget.dataset
                    .vaeroCommand,
                commandTarget
            );

        }
    );

}


/* =========================================================
   REGISTER VAERO APP
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        VAERO.register(
            "vaeroApp",
            VaeroApp
        );

    }

} catch(error){

    console.warn(
        "VAERO App kaydedilemedi:",
        error
    );

}


/* =========================================================
   REGISTER PAYMENT CORE
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        VAERO.register(
            "paymentCore",
            VaeroApp.paymentCore
        );

    }

} catch(error){

    console.warn(
        "VAERO Payment Core kaydedilemedi:",
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

    window.VaeroApp =
        VaeroApp;

} 
