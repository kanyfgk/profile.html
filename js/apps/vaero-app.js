/* =========================================================
   VAERO APP
   Official VAERO Brand Application

   Product / Atmosphere / Vision / Care / Payment Core

   IMPORTANT
   ---------------------------------------------------------
   VAERO App is NOT the Engine system dashboard.

   It is the official VAERO brand application living
   inside VAERO Engine.

   Archive inspiration:
   • VAERO Device
   • Atmospheres
   • Verified experience
   • VAERO Care
   • "Vizyonunu yarat, dünyaya göster."
========================================================= */

const VaeroApp = {

    id:
        "vaero",

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

    products:[

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

            purchasable:
                true,

            amount:
                2490,

            currency:
                "TRY",

            atmosphere:
                null,

            tags:[
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

            purchasable:
                false,

            amount:
                null,

            currency:
                null,

            atmosphere:
                "clean",

            tags:[
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

            purchasable:
                false,

            amount:
                null,

            currency:
                null,

            atmosphere:
                "fresh",

            tags:[
                "ocean",
                "fresh",
                "open"
            ]
        }

    ],


    /* =====================================================
       ARCHIVE-INSPIRED EXPERIENCE LAYER
    ===================================================== */

    experiences:[

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
            value ?? ""
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


        return (
            window.Engine ||
            null
        );

    },


    getService(name){

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
                    name
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       STORAGE
    ===================================================== */

    storageKeys:{

        vision:
            "vaero:brand:vision:draft:v1",

        payment:
            "vaero:payment:intents:v1",

        entitlements:
            "vaero:payment:entitlements:v1"

    },


    readJSON(
        key,
        fallback
    ){

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

        return (
            this.products.find(
                product =>
                    product.id ===
                    id
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
            )
        ){

            return "Yakında";

        }


        try{

            return new Intl.NumberFormat(
                "tr-TR",
                {
                    style:
                        "currency",

                    currency:
                        currency ||
                        "TRY",

                    maximumFractionDigits:
                        0
                }
            ).format(
                numeric
            );

        } catch(error){

            return `${numeric} ${currency || "TRY"}`;

        }

    },


    /* =====================================================
       BRAIN CONTEXT
    ===================================================== */

    enterBrainContext(
        extra = {}
    ){

        try{

            const engine =
                this.getEngine();


            const awareness =
                this.getService(
                    "brainAwareness"
                );


            awareness?.enter?.(
                "vaero",
                {
                    entityId:
                        engine
                            ?.currentEntity
                            ?.id ||
                        null,

                    worldId:
                        engine
                            ?.currentWorld
                            ?.id ||
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

                    ...extra
                }
            );

        } catch(error){

            console.warn(
                "VAERO Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       VIEW NAVIGATION
    ===================================================== */

    openView(view){

        const allowed = [

            "discover",
            "product",
            "vision",
            "care",
            "payment"

        ];


        if(
            !allowed.includes(
                view
            )
        ){

            return false;

        }


        this.activeView =
            view;


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


        return this.refresh();

    },


    /* =====================================================
       RERENDER
    ===================================================== */

    refresh(){

        const engine =
            this.getEngine();


        if(
            engine &&
            typeof engine.mount ===
                "function"
        ){

            engine.mount(
                engine.currentEntity
            );


            return true;

        }


        return false;

    },


    /* =====================================================
       PAYMENT CORE
    ===================================================== */

    paymentCore:{

        intents:[],


        getHost(){

            return (
                window.VaeroApp ||
                null
            );

        },


        load(){

            const host =
                this.getHost();


            if(!host){

                this.intents =
                    [];

                return;
            }


            const saved =
                host.readJSON(
                    host.storageKeys.payment,
                    []
                );


            this.intents =
                Array.isArray(
                    saved
                )
                    ? saved
                    : [];

        },


        save(){

            const host =
                this.getHost();


            if(!host){

                return false;

            }


            return host.writeJSON(
                host.storageKeys.payment,
                this.intents
            );

        },


        all(){

            return this.intents.map(
                intent => ({
                    ...intent
                })
            );

        },


        get(intentId){

            const intent =
                this.intents.find(
                    item =>
                        item.id ===
                        intentId
                );


            return intent
                ? {
                    ...intent
                }
                : null;

        },


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
                amountValue >= 0
                    ? amountValue
                    : null;


            const intent = {

                id:
                    host.createId(
                        "payment"
                    ),

                source:
                    String(
                        payload.source ||
                        "vaero"
                    ),

                productId:
                    payload.productId ||
                    null,

                title:
                    String(
                        payload.title ||
                        "VAERO Payment"
                    ),

                amount,

                currency:
                    payload.currency
                        ? String(
                            payload.currency
                        )
                            .trim()
                            .toUpperCase()
                        : null,

                quantity:
                    Math.max(
                        1,
                        Number(
                            payload.quantity
                        ) ||
                        1
                    ),

                method:
                    null,

                provider:
                    null,

                status:
                    "draft",

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now(),

                metadata:
                    (
                        payload.metadata &&
                        typeof payload.metadata ===
                            "object"
                    )
                        ? {
                            ...payload.metadata
                        }
                        : {}

            };


            this.intents.unshift(
                intent
            );


            this.save();


            return {
                ...intent
            };

        },


        setMethod(
            intentId,
            method
        ){

            const intent =
                this.intents.find(
                    item =>
                        item.id ===
                        intentId
                );


            if(
                !intent ||
                !method
            ){

                return false;

            }


            intent.method =
                String(
                    method
                )
                    .trim()
                    .toLowerCase();


            intent.status =
                intent.provider
                    ? "ready"
                    : "draft";


            intent.updatedAt =
                Date.now();


            this.save();


            return {
                ...intent
            };

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


        setProvider(
            intentId,
            provider
        ){

            const intent =
                this.intents.find(
                    item =>
                        item.id ===
                        intentId
                );


            if(
                !intent ||
                !provider
            ){

                return false;

            }


            intent.provider =
                String(
                    provider
                )
                    .trim()
                    .toLowerCase();


            intent.status =
                intent.method
                    ? "ready"
                    : "draft";


            intent.updatedAt =
                Date.now();


            this.save();


            return {
                ...intent
            };

        },


        selectProvider(
            intentId,
            provider
        ){

            return this.setProvider(
                intentId,
                provider
            );

        },


        start(intentId){

            const intent =
                this.intents.find(
                    item =>
                        item.id ===
                        intentId
                );


            if(!intent){

                return false;

            }


            /*
             * Gerçek provider henüz bu dosyada
             * taklit edilmez.
             *
             * Kullanıcıdan ödeme alınmış gibi
             * sahte "completed" üretmiyoruz.
             */

            if(
                !intent.method ||
                !intent.provider
            ){

                intent.status =
                    "requires-selection";

                intent.updatedAt =
                    Date.now();


                this.save();


                return {
                    ...intent
                };

            }


            intent.status =
                "awaiting-provider";

            intent.updatedAt =
                Date.now();


            this.save();


            return {
                ...intent
            };

        },


        startIntent(intentId){

            return this.start(
                intentId
            );

        },


        cancel(intentId){

            const intent =
                this.intents.find(
                    item =>
                        item.id ===
                        intentId
                );


            if(!intent){

                return false;

            }


            if(
                intent.status ===
                    "completed" ||
                intent.status ===
                    "refunded"
            ){

                return false;

            }


            intent.status =
                "cancelled";

            intent.updatedAt =
                Date.now();


            this.save();


            return {
                ...intent
            };

        },


        cancelIntent(intentId){

            return this.cancel(
                intentId
            );

        },


        refund(transactionId){

            const intent =
                this.intents.find(
                    item =>
                        item.id ===
                        transactionId
                );


            /*
             * Yalnız doğrulanmış tamamlanmış işlem
             * refund akışına alınabilir.
             */

            if(
                !intent ||
                intent.status !==
                    "completed"
            ){

                return false;

            }


            intent.status =
                "refund-requested";

            intent.updatedAt =
                Date.now();


            this.save();


            return {
                ...intent
            };

        },


        hasVerifiedEntitlement(
            applicationId
        ){

            const host =
                this.getHost();


            if(!host){

                return false;

            }


            const entitlements =
                host.readJSON(
                    host.storageKeys
                        .entitlements,
                    []
                );


            if(
                !Array.isArray(
                    entitlements
                )
            ){

                return false;

            }


            return entitlements.some(
                entitlement =>
                    entitlement
                        ?.applicationId ===
                        applicationId &&
                    entitlement
                        ?.verified ===
                        true &&
                    entitlement
                        ?.revoked !==
                        true
            );

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


        if(
            !product ||
            product.purchasable !==
                true
        ){

            return false;

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
                        product.amount,

                    currency:
                        product.currency,

                    quantity:
                        1,

                    metadata:{
                        productType:
                            product.type,

                        atmosphere:
                            product.atmosphere
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
            paymentIntentId:
                intent.id
        });


        return this.refresh();

    },


    getCurrentPaymentIntent(){

        const engine =
            this.getEngine();


        const current =
            engine
                ?.currentVaeroPaymentIntent;


        if(current?.id){

            const stored =
                this.paymentCore.get(
                    current.id
                );


            if(stored){

                engine.currentVaeroPaymentIntent =
                    stored;


                return stored;

            }

        }


        return null;

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


        const engine =
            this.getEngine();


        if(
            engine &&
            updated
        ){

            engine.currentVaeroPaymentIntent =
                updated;

        }


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


        const engine =
            this.getEngine();


        if(
            engine &&
            updated
        ){

            engine.currentVaeroPaymentIntent =
                updated;

        }


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


        const engine =
            this.getEngine();


        if(
            engine &&
            updated
        ){

            engine.currentVaeroPaymentIntent =
                updated;

        }


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


        const engine =
            this.getEngine();


        if(
            engine &&
            updated
        ){

            engine.currentVaeroPaymentIntent =
                updated;

        }


        this.activeView =
            "product";


        return this.refresh();

    },


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
                ? saved
                : null;


        return this.visionDraft;

    },


    saveVision(){

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
            ).trim();


        const direction =
            String(
                directionInput?.value ||
                ""
            ).trim();


        const description =
            String(
                descriptionInput?.value ||
                ""
            ).trim();


        if(!title){

            titleInput?.focus();

            return false;

        }


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

            createdAt:
                this.visionDraft
                    ?.createdAt ||
                Date.now(),

            updatedAt:
                Date.now()

        };


        this.visionDraft =
            draft;


        this.writeJSON(
            this.storageKeys.vision,
            draft
        );


        this.enterBrainContext({
            visionId:
                draft.id
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

            cancelled:
                "İptal edildi",

            completed:
                "Tamamlandı",

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
                    onclick="VaeroApp.openView('care')"
                >
                    VAERO

                    <span>
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
            <div class="vaero-commerce-actions">

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
                    onclick="VaeroApp.openView('discover')"
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
                    onclick="VaeroApp.openView('vision')"
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
                        product => `
                            <button
                                type="button"
                                class="vaero-cart-item"
                                onclick="VaeroApp.openProduct('${this.escapeHTML(
                                    product.id
                                )}')"
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
                                        product.purchasable
                                            ? `
                                                <strong>
                                                    ${this.escapeHTML(
                                                        this.formatMoney(
                                                            product.amount,
                                                            product.currency
                                                        )
                                                    )}
                                                </strong>
                                              `
                                            : `
                                                <small>
                                                    Keşfet
                                                </small>
                                              `
                                    }

                                </div>

                            </button>
                        `
                    )
                    .join("")}

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
                    onclick="VaeroApp.openProduct('device')"
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
                    Bir atmosfer, ürün veya yaşam fikri oluştur. VAERO bunu zamanla Brain, topluluk ve yaratıcı araçlarla geliştirecek.
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


        return `
            <div class="vaero-commerce-section-head">

                <span>
                    ${this.escapeHTML(
                        product.eyebrow
                    )}
                </span>

                <button
                    type="button"
                    onclick="VaeroApp.backToDiscover()"
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
                            ${
                                product.purchasable
                                    ? "Satışta"
                                    : "Koleksiyon"
                            }
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
                            ${
                                product.amount !==
                                    null
                                    ? this.escapeHTML(
                                        this.formatMoney(
                                            product.amount,
                                            product.currency
                                        )
                                    )
                                    : "—"
                            }
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
                                .join("")}

                        </div>
                      `
                    : ""
            }


            <div class="vaero-commerce-actions">

                ${
                    product.purchasable
                        ? `
                            <button
                                type="button"
                                onclick="VaeroApp.startProductPurchase('${this.escapeHTML(
                                    product.id
                                )}')"
                            >
                                Satın Al
                            </button>
                          `
                        : `
                            <button
                                type="button"
                                onclick="VaeroApp.openView('vision')"
                            >
                                Atmosferden İlham Al
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
                    Eski VAERO vizyonunun yeni Engine karşılığı. Burada fikir önce sana ait bir taslak olarak doğar; ileride Brain ve topluluk katmanlarıyla gelişebilir.
                </small>

            </div>


            <div class="engine-field">

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

            </div>


            <div class="engine-field">

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

            </div>


            <div class="engine-field">

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

            </div>


            <div class="vaero-commerce-actions">

                <button
                    type="button"
                    onclick="VaeroApp.saveVision()"
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
                        Önce bir VAERO ürünü seç.
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


        return `
            <div class="vaero-commerce-section-head">

                <span>
                    SECURE PURCHASE
                </span>

                <button
                    type="button"
                    onclick="VaeroApp.cancelPayment()"
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
                    VAERO Engine ödeme niyeti oluşturuldu.
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
                            ${intent.quantity}
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
                    Kullanacağın yöntemi seç.
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
                        onclick="VaeroApp.selectPaymentMethod('card')"
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
                        onclick="VaeroApp.selectPaymentMethod('bank')"
                    >
                        Banka
                    </button>

                </div>

            </div>


            <div class="vaero-payment-methods">

                <strong>
                    Sağlayıcı
                </strong>

                <small>
                    Gerçek ödeme sağlayıcısı bağlandığında işlem bu katmandan devredilecek.
                </small>


                <div class="vaero-commerce-actions">

                    <button
                        type="button"
                        class="${
                            intent.provider ===
                                "vaero-checkout"
                                ? "is-active"
                                : ""
                        }"
                        onclick="VaeroApp.selectPaymentProvider('vaero-checkout')"
                    >
                        VAERO Checkout
                    </button>

                </div>

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
                    Ödeme sağlayıcısı entegrasyonu tamamlanmadan VAERO bu işlemi başarılı ödeme olarak işaretlemez.
                </small>

            </div>


            <div class="vaero-commerce-actions">

                <button
                    type="button"
                    onclick="VaeroApp.beginPayment()"
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
       RENDER
    ===================================================== */

    render(){

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


                ${UI.brainPanel()}

            </section>
        `;

    }

};


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

window.VaeroApp =
    VaeroApp;
