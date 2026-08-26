/* =========================================================
   VAERO APPLICATION REGISTRY
   Application Catalog / Manifest Authority
========================================================= */

const AppRegistry = (() => {

    /*
     * Built-in yetkisi yalnız bu closure içinde bulunan
     * private token ile verilebilir.
     *
     * Dış bir manifest:
     *
     * system:true
     * trusted:true
     * distribution:"built-in"
     *
     * yazsa bile kendisini sistem uygulaması yapamaz.
     */

    const BUILT_IN_TOKEN =
        Symbol(
            "VAERO_INTERNAL_BUILT_IN"
        );


    const Registry = {

        apps:[],

        manifestVersion:
            2,


        /* =====================================================
           NORMALIZATION
        ===================================================== */

        normalizeId(id){

            return String(
                id ?? ""
            )
                .trim()
                .toLowerCase()
                .replace(
                    /\s+/g,
                    "-"
                );

        },


        normalizeText(
            value,
            fallback = ""
        ){

            return String(
                value ??
                fallback
            ).trim();

        },


        normalizeArray(value){

            if(
                !Array.isArray(
                    value
                )
            ){
                return [];
            }


            return [
                ...new Set(
                    value
                        .map(
                            item =>
                                String(
                                    item ??
                                    ""
                                )
                                    .trim()
                                    .toLowerCase()
                        )
                        .filter(Boolean)
                )
            ];

        },


        normalizeCategory(category){

            const value =
                String(
                    category ||
                    "other"
                )
                    .trim()
                    .toLowerCase();


            const allowed = [

                "system",
                "identity",
                "productivity",
                "knowledge",
                "social",
                "communication",
                "development",
                "utility",
                "service",
                "finance",
                "other"

            ];


            return allowed.includes(
                value
            )
                ? value
                : "other";

        },


        normalizeDistribution(
            distribution
        ){

            const value =
                String(
                    distribution ||
                    "third-party"
                )
                    .trim()
                    .toLowerCase();


            const allowed = [

                "first-party",
                "third-party"

            ];


            return allowed.includes(
                value
            )
                ? value
                : "third-party";

        },


        normalizePricing(pricing){

            if(
                !pricing ||
                typeof pricing !==
                    "object" ||
                Array.isArray(
                    pricing
                )
            ){

                return {

                    model:
                        "free",

                    amount:
                        0,

                    currency:
                        null,

                    interval:
                        null

                };

            }


            const allowedModels = [

                "free",
                "paid",
                "subscription"

            ];


            const requestedModel =
                String(
                    pricing.model ||
                    "free"
                )
                    .trim()
                    .toLowerCase();


            const model =
                allowedModels.includes(
                    requestedModel
                )
                    ? requestedModel
                    : "free";


            const numericAmount =
                Number(
                    pricing.amount
                );


            const amount =
                Number.isFinite(
                    numericAmount
                ) &&
                numericAmount >= 0
                    ? numericAmount
                    : 0;


            let currency =
                null;


            if(
                model !==
                    "free"
            ){

                currency =
                    pricing.currency
                        ? String(
                            pricing.currency
                        )
                            .trim()
                            .toUpperCase()
                        : null;

            }


            let interval =
                null;


            if(
                model ===
                    "subscription"
            ){

                const requestedInterval =
                    String(
                        pricing.interval ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                const allowedIntervals = [

                    "monthly",
                    "yearly"

                ];


                interval =
                    allowedIntervals.includes(
                        requestedInterval
                    )
                        ? requestedInterval
                        : null;

            }


            return {

                model,

                amount:
                    model ===
                        "free"
                        ? 0
                        : amount,

                currency,

                interval

            };

        },


        normalizeCompatibility(value){

            if(
                !value ||
                typeof value !==
                    "object" ||
                Array.isArray(
                    value
                )
            ){

                return {
                    minEngineVersion:null,
                    maxEngineVersion:null
                };

            }


            return {

                minEngineVersion:
                    value.minEngineVersion
                        ? this.normalizeText(
                            value.minEngineVersion
                        )
                        : null,

                maxEngineVersion:
                    value.maxEngineVersion
                        ? this.normalizeText(
                            value.maxEngineVersion
                        )
                        : null

            };

        },


        /* =====================================================
           CLONE
        ===================================================== */

        cloneApp(app){

            if(!app){
                return null;
            }


            return {

                ...app,

                requestedPermissions:[
                    ...(
                        app.requestedPermissions ||
                        []
                    )
                ],

                capabilities:[
                    ...(
                        app.capabilities ||
                        []
                    )
                ],

                dependencies:[
                    ...(
                        app.dependencies ||
                        []
                    )
                ],

                tags:[
                    ...(
                        app.tags ||
                        []
                    )
                ],

                pricing:{
                    ...(
                        app.pricing ||
                        {}
                    )
                },

                compatibility:{
                    ...(
                        app.compatibility ||
                        {}
                    )
                },

                metadata:{
                    ...(
                        app.metadata ||
                        {}
                    )
                }

            };

        },


        /* =====================================================
           MANIFEST VALIDATION
        ===================================================== */

        validateManifest(app){

            if(
                !app ||
                typeof app !==
                    "object" ||
                Array.isArray(
                    app
                )
            ){

                return {

                    valid:false,

                    reason:
                        "Application manifest object değil."

                };

            }


            const id =
                this.normalizeId(
                    app.id
                );


            if(!id){

                return {

                    valid:false,

                    reason:
                        "Application id eksik."

                };

            }


            if(
                !/^[a-z0-9][a-z0-9:_\-.]*$/.test(
                    id
                )
            ){

                return {

                    valid:false,

                    reason:
                        "Application id formatı geçersiz."

                };

            }


            if(
                id.length >
                    100
            ){

                return {

                    valid:false,

                    reason:
                        "Application id çok uzun."

                };

            }


            const title =
                this.normalizeText(
                    app.title,
                    id
                );


            if(!title){

                return {

                    valid:false,

                    reason:
                        "Application title eksik."

                };

            }


            if(
                title.length >
                    120
            ){

                return {

                    valid:false,

                    reason:
                        "Application title çok uzun."

                };

            }


            const action =
                this.normalizeText(
                    app.action,
                    `entity:${id}`
                );


            if(
                !/^[a-z0-9:_\-.]+$/i.test(
                    action
                )
            ){

                return {

                    valid:false,

                    reason:
                        "Application action formatı geçersiz."

                };

            }


            const pricing =
                this.normalizePricing(
                    app.pricing
                );


            if(
                pricing.model !==
                    "free" &&
                !pricing.currency
            ){

                return {

                    valid:false,

                    reason:
                        "Ücretli application için currency gerekli."

                };

            }


            if(
                pricing.model ===
                    "subscription" &&
                !pricing.interval
            ){

                return {

                    valid:false,

                    reason:
                        "Subscription application için interval gerekli."

                };

            }


            return {

                valid:true,

                id,

                action,

                pricing

            };

        },


        /* =====================================================
           REGISTER
        ===================================================== */

        register(
            app = {},
            internalToken = null
        ){

            const validation =
                this.validateManifest(
                    app
                );


            if(
                !validation.valid
            ){

                console.warn(
                    "Application kaydedilemedi:",
                    validation.reason,
                    app
                );


                return null;

            }


            const id =
                validation.id;


            const isBuiltIn =
                internalToken ===
                    BUILT_IN_TOKEN;


            const distribution =
                isBuiltIn
                    ? "built-in"
                    : this.normalizeDistribution(
                        app.distribution
                    );


            const compatibility =
                this.normalizeCompatibility({
                    minEngineVersion:
                        app.minEngineVersion,

                    maxEngineVersion:
                        app.maxEngineVersion
                });


            const normalizedApp = {

                manifestVersion:
                    this.manifestVersion,

                id,

                icon:
                    this.normalizeText(
                        app.icon,
                        "◌"
                    ),

                title:
                    this.normalizeText(
                        app.title,
                        id
                    ),

                subtitle:
                    this.normalizeText(
                        app.subtitle
                    ),

                description:
                    this.normalizeText(
                        app.description ||
                        app.subtitle
                    ),

                action:
                    validation.action,

                category:
                    this.normalizeCategory(
                        app.category
                    ),

                version:
                    this.normalizeText(
                        app.version,
                        "1.0.0"
                    ),

                developer:
                    this.normalizeText(
                        app.developer,
                        isBuiltIn
                            ? "VAERO"
                            : "Unknown Developer"
                    ),

                distribution,

                enabled:
                    app.enabled !==
                        false,

                system:
                    isBuiltIn,

                /*
                 * Registry trusted yalnız built-in için
                 * doğrudan true olabilir.
                 *
                 * External runtime trust OrganSystem +
                 * ApplicationVerifier tarafından tutulur.
                 */

                trusted:
                    isBuiltIn,

                removable:
                    isBuiltIn
                        ? false
                        : app.removable !==
                            false,

                installable:
                    isBuiltIn
                        ? false
                        : app.installable ===
                            true,

                updateable:
                    app.updateable !==
                        false,

                signature:
                    isBuiltIn
                        ? null
                        : (
                            app.signature ||
                            null
                        ),

                requestedPermissions:
                    this.normalizeArray(
                        app.requestedPermissions
                    ),

                capabilities:
                    this.normalizeArray(
                        app.capabilities
                    ),

                dependencies:
                    this.normalizeArray(
                        app.dependencies
                    ),

                pricing:
                    validation.pricing,

                minEngineVersion:
                    compatibility
                        .minEngineVersion,

                maxEngineVersion:
                    compatibility
                        .maxEngineVersion,

                compatibility,

                tags:
                    this.normalizeArray(
                        app.tags
                    ),

                metadata:
                    (
                        app.metadata &&
                        typeof app.metadata ===
                            "object" &&
                        !Array.isArray(
                            app.metadata
                        )
                    )
                        ? {
                            ...app.metadata
                        }
                        : {},

                createdAt:
                    Number.isFinite(
                        Number(
                            app.createdAt
                        )
                    )
                        ? Number(
                            app.createdAt
                        )
                        : Date.now(),

                updatedAt:
                    Date.now()

            };


            const existingIndex =
                this.apps.findIndex(
                    item =>
                        item.id ===
                        id
                );


            /* =================================================
               EXISTING RECORD
            ================================================= */

            if(
                existingIndex >= 0
            ){

                const existing =
                    this.apps[
                        existingIndex
                    ];


                /*
                 * Built-in manifest dış kayıt tarafından
                 * değiştirilemez.
                 */

                if(
                    existing.system ===
                        true &&
                    !isBuiltIn
                ){

                    console.warn(
                        "Built-in application manifest overwrite engellendi:",
                        id
                    );


                    return this.cloneApp(
                        existing
                    );

                }


                if(isBuiltIn){

                    normalizedApp.system =
                        true;

                    normalizedApp.trusted =
                        true;

                    normalizedApp.distribution =
                        "built-in";

                    normalizedApp.removable =
                        false;

                    normalizedApp.installable =
                        false;

                } else {

                    normalizedApp.system =
                        false;

                    normalizedApp.trusted =
                        false;

                }


                normalizedApp.createdAt =
                    existing.createdAt ||
                    normalizedApp.createdAt;


                this.apps[
                    existingIndex
                ] = {

                    ...existing,

                    ...normalizedApp

                };


                return this.cloneApp(
                    this.apps[
                        existingIndex
                    ]
                );

            }


            /* =================================================
               NEW RECORD
            ================================================= */

            this.apps.push(
                normalizedApp
            );


            return this.cloneApp(
                normalizedApp
            );

        },


        /* =====================================================
           REGISTER EXTERNAL MANIFEST
        ===================================================== */

        registerExternal(app = {}){

            return this.register(
                app,
                null
            );

        },


        /* =====================================================
           REMOVE MANIFEST
        ===================================================== */

        unregister(id){

            const normalizedId =
                this.normalizeId(
                    id
                );


            const index =
                this.apps.findIndex(
                    item =>
                        item.id ===
                        normalizedId
                );


            if(
                index <
                    0
            ){
                return false;
            }


            const app =
                this.apps[
                    index
                ];


            if(
                app.system ===
                    true
            ){

                return false;

            }


            this.apps.splice(
                index,
                1
            );


            return true;

        },


        /* =====================================================
           ENABLE / DISABLE CATALOG ENTRY
        ===================================================== */

        setEnabled(
            id,
            enabled
        ){

            const normalizedId =
                this.normalizeId(
                    id
                );


            const app =
                this.apps.find(
                    item =>
                        item.id ===
                        normalizedId
                );


            if(!app){
                return false;
            }


            /*
             * Built-in entry runtime'dan silinmez;
             * ama catalog visibility değiştirilmemeli.
             */

            if(
                app.system ===
                    true &&
                enabled ===
                    false
            ){

                return false;

            }


            app.enabled =
                Boolean(
                    enabled
                );

            app.updatedAt =
                Date.now();


            return true;

        },


        /* =====================================================
           LOOKUP
        ===================================================== */

        find(id){

            const normalizedId =
                this.normalizeId(
                    id
                );


            const app =
                this.apps.find(
                    item =>
                        item.id ===
                        normalizedId
                );


            return this.cloneApp(
                app ||
                null
            );

        },


        get(id){

            return this.find(
                id
            );

        },


        has(id){

            const normalizedId =
                this.normalizeId(
                    id
                );


            return this.apps.some(
                app =>
                    app.id ===
                    normalizedId
            );

        },


        /* =====================================================
           LIST
        ===================================================== */

        all(options = {}){

            const includeDisabled =
                options.includeDisabled ===
                    true;


            let apps =
                includeDisabled
                    ? [
                        ...this.apps
                    ]
                    : this.apps.filter(
                        app =>
                            app.enabled ===
                                true
                    );


            if(
                options.category
            ){

                const category =
                    this.normalizeCategory(
                        options.category
                    );


                apps =
                    apps.filter(
                        app =>
                            app.category ===
                            category
                    );

            }


            if(
                options.installable ===
                    true
            ){

                apps =
                    apps.filter(
                        app =>
                            app.installable ===
                                true
                    );

            }


            if(
                options.system ===
                    true
            ){

                apps =
                    apps.filter(
                        app =>
                            app.system ===
                                true
                    );

            }


            if(
                options.external ===
                    true
            ){

                apps =
                    apps.filter(
                        app =>
                            app.system !==
                                true
                    );

            }


            if(
                options.firstParty ===
                    true
            ){

                apps =
                    apps.filter(
                        app =>
                            app.distribution ===
                                "first-party"
                    );

            }


            if(
                options.thirdParty ===
                    true
            ){

                apps =
                    apps.filter(
                        app =>
                            app.distribution ===
                                "third-party"
                    );

            }


            if(
                options.paid ===
                    true
            ){

                apps =
                    apps.filter(
                        app =>
                            app.pricing
                                ?.model !==
                            "free"
                    );

            }


            return apps.map(
                app =>
                    this.cloneApp(
                        app
                    )
            );

        },


        /* =====================================================
           SEARCH
        ===================================================== */

        search(
            query,
            options = {}
        ){

            const text =
                String(
                    query ??
                    ""
                )
                    .trim()
                    .toLocaleLowerCase(
                        "tr-TR"
                    );


            const apps =
                this.all(
                    options
                );


            if(!text){

                return apps;

            }


            return apps.filter(
                app => {

                    const haystack = [

                        app.id,

                        app.title,

                        app.subtitle,

                        app.description,

                        app.developer,

                        app.category,

                        ...(
                            app.tags ||
                            []
                        ),

                        ...(
                            app.capabilities ||
                            []
                        ),

                        ...(
                            app.requestedPermissions ||
                            []
                        )

                    ]
                        .join(" ")
                        .toLocaleLowerCase(
                            "tr-TR"
                        );


                    return haystack.includes(
                        text
                    );

                }
            );

        },


        /* =====================================================
           CATEGORIES
        ===================================================== */

        categories(){

            const map =
                new Map();


            this.all()
                .forEach(
                    app => {

                        const current =
                            map.get(
                                app.category
                            ) ||
                            0;


                        map.set(
                            app.category,
                            current + 1
                        );

                    }
                );


            return [
                ...map.entries()
            ]
                .map(
                    ([
                        id,
                        total
                    ]) => ({

                        id,

                        total

                    })
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        a.id.localeCompare(
                            b.id
                        )
                );

        },


        /* =====================================================
           CATALOG SNAPSHOT
        ===================================================== */

        catalog(){

            const apps =
                this.all({
                    includeDisabled:true
                });


            return {

                manifestVersion:
                    this.manifestVersion,

                total:
                    apps.length,

                enabled:
                    apps.filter(
                        app =>
                            app.enabled ===
                                true
                    ).length,

                builtIn:
                    apps.filter(
                        app =>
                            app.system ===
                                true
                    ).length,

                firstParty:
                    apps.filter(
                        app =>
                            app.distribution ===
                                "first-party"
                    ).length,

                thirdParty:
                    apps.filter(
                        app =>
                            app.distribution ===
                                "third-party"
                    ).length,

                installable:
                    apps.filter(
                        app =>
                            app.installable ===
                                true
                    ).length,

                free:
                    apps.filter(
                        app =>
                            app.pricing?.model ===
                                "free"
                    ).length,

                paid:
                    apps.filter(
                        app =>
                            app.pricing?.model ===
                                "paid"
                    ).length,

                subscriptions:
                    apps.filter(
                        app =>
                            app.pricing?.model ===
                                "subscription"
                    ).length,

                categories:
                    this.categories(),

                apps

            };

        },


        /* =====================================================
           REPORT
        ===================================================== */

        report(){

            const catalog =
                this.catalog();


            return {

                manifestVersion:
                    catalog.manifestVersion,

                total:
                    catalog.total,

                enabled:
                    catalog.enabled,

                builtIn:
                    catalog.builtIn,

                external:
                    catalog.firstParty +
                    catalog.thirdParty,

                installable:
                    catalog.installable,

                paid:
                    catalog.paid +
                    catalog.subscriptions,

                categories:
                    catalog.categories.length

            };

        }

    };


    /* =========================================================
       BUILT-IN VAERO APPLICATIONS
    ========================================================= */

    const builtInApplications = [

        /* =====================================================
           IDENTITY
        ===================================================== */

        {
            id:
                "identity",

            icon:
                "🪪",

            title:
                "Kimlik",

            subtitle:
                "Dijital kimliğini yönet",

            description:
                "VAERO ID, kimlik görünürlüğü ve doğrulama durumunu yönetir.",

            action:
                "entity:identity",

            category:
                "identity",

            version:
                "2.0.0",

            capabilities:[
                "identity.read",
                "identity.manage",
                "identity.verification.request"
            ],

            tags:[
                "identity",
                "va-id",
                "verification"
            ]
        },


        /* =====================================================
           PROFILE
        ===================================================== */

        {
            id:
                "profile",

            icon:
                "👤",

            title:
                "Profil",

            subtitle:
                "Kendini VAERO içinde ifade et",

            description:
                "Görünen isim, bio, yetenekler, ilgi alanları ve Discovery yönünü yönetir.",

            action:
                "entity:profile",

            category:
                "identity",

            version:
                "2.0.0",

            capabilities:[
                "profile.read",
                "profile.manage",
                "profile.discovery"
            ],

            tags:[
                "profile",
                "discovery",
                "presentation"
            ]
        },


        /* =====================================================
           MEMORY
        ===================================================== */

        {
            id:
                "memory",

            icon:
                "◫",

            title:
                "Hafıza",

            subtitle:
                "Kalıcı bağlamlarını yönet",

            description:
                "Notları, kararları, fikirleri, olayları ve önemli kişisel kayıtları saklar.",

            action:
                "entity:memory",

            category:
                "knowledge",

            version:
                "2.0.0",

            capabilities:[
                "memory.read",
                "memory.create",
                "memory.manage",
                "memory.search"
            ],

            tags:[
                "memory",
                "knowledge",
                "context"
            ]
        },


        /* =====================================================
           TIMELINE
        ===================================================== */

        {
            id:
                "timeline",

            icon:
                "◷",

            title:
                "Zaman Çizelgesi",

            subtitle:
                "Yaşam ve sistem akışını gör",

            description:
                "Memory, Evolution ve sistem olaylarını kronolojik bir akışta birleştirir.",

            action:
                "entity:timeline",

            category:
                "knowledge",

            version:
                "2.0.0",

            capabilities:[
                "timeline.read",
                "timeline.search",
                "timeline.link"
            ],

            tags:[
                "timeline",
                "history",
                "events"
            ]
        },


        /* =====================================================
           BRIDGE
        ===================================================== */

        {
            id:
                "bridge",

            icon:
                "⌁",

            title:
                "Bridge",

            subtitle:
                "Bağlantılarını yönet",

            description:
                "İnsanlar, varlıklar ve dünyalar arasındaki ilişki ağını temsil eder.",

            action:
                "entity:bridge",

            category:
                "social",

            version:
                "2.0.0",

            capabilities:[
                "bridge.read",
                "bridge.create",
                "bridge.manage",
                "bridge.search"
            ],

            tags:[
                "bridge",
                "connections",
                "network"
            ]
        },


        /* =====================================================
           EVOLUTION
        ===================================================== */

        {
            id:
                "evolution",

            icon:
                "⌬",

            title:
                "Evolution",

            subtitle:
                "Gelişimini takip et",

            description:
                "Hedefleri, kararları, başarıları, kilometre taşlarını ve XP gelişimini takip eder.",

            action:
                "entity:evolution",

            category:
                "development",

            version:
                "2.0.0",

            capabilities:[
                "evolution.read",
                "evolution.create",
                "evolution.manage",
                "evolution.goals"
            ],

            tags:[
                "evolution",
                "goals",
                "progress",
                "xp"
            ]
        },


        /* =====================================================
           SETTINGS
        ===================================================== */

        {
            id:
                "settings",

            icon:
                "⚙️",

            title:
                "Ayarlar",

            subtitle:
                "Engine tercihlerini yönet",

            description:
                "Privacy, Brain, Memory, Notifications, Applications, Security ve görünüm tercihlerini yönetir.",

            action:
                "entity:settings",

            category:
                "system",

            version:
                "2.0.0",

            capabilities:[
                "settings.read",
                "settings.manage",
                "privacy.manage"
            ],

            tags:[
                "settings",
                "privacy",
                "security"
            ]
        },


        /* =====================================================
           DISCOVERY
        ===================================================== */

        {
            id:
                "discovery",

            icon:
                "◇",

            title:
                "Discovery",

            subtitle:
                "Kişisel yönünü keşfet",

            description:
                "Amaç, ilgi, güçlü yön, hedef ve bağlantı sinyallerinden kişisel başlangıç yönü üretir.",

            action:
                "entity:discovery",

            category:
                "development",

            version:
                "3.0.0",

            capabilities:[
                "discovery.read",
                "discovery.analyse",
                "discovery.personalise"
            ],

            tags:[
                "discovery",
                "direction",
                "personalisation"
            ]
        },


        /* =====================================================
           APPLICATIONS
        ===================================================== */

        {
            id:
                "applications",

            icon:
                "▦",

            title:
                "Applications",

            subtitle:
                "Engine yeteneklerini genişlet",

            description:
                "Uygulamaları keşfet, kurulu uygulamaları yönet, izinleri incele ve güncellemeleri takip et.",

            action:
                "app:applications",

            category:
                "system",

            version:
                "2.0.0",

            capabilities:[
                "applications.catalog",
                "applications.install",
                "applications.manage",
                "applications.update",
                "permissions.review"
            ],

            tags:[
                "applications",
                "catalog",
                "permissions",
                "updates"
            ]
        },


        /* =====================================================
           VAERO SYSTEM APP
        ===================================================== */

        {
            id:
                "vaero",

            icon:
                "◉",

            title:
                "VAERO",

            subtitle:
                "Living Engine merkezi",

            description:
                "Worlds, Entities, Memory, Evolution, Bridge, Applications, Brain ve Engine durumunu tek sistem bağlamında birleştirir.",

            action:
                "app:vaero",

            category:
                "system",

            version:
                "2.0.0",

            capabilities:[
                "engine.overview",
                "engine.context",
                "engine.health",
                "engine.continuity"
            ],

            tags:[
                "vaero",
                "engine",
                "continuity",
                "system"
            ]
        }

    ];


    /* =========================================================
       INTERNAL BUILT-IN REGISTRATION
    ========================================================= */

    builtInApplications
        .forEach(
            app => {

                Registry.register(
                    app,
                    BUILT_IN_TOKEN
                );

            }
        );


    return Registry;

})();


/* =========================================================
   REGISTER SERVICES
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        /*
         * Doğru servis adı.
         */

        VAERO.register(
            "appRegistry",
            AppRegistry
        );


        /*
         * Eski kodların kırılmaması için compatibility alias.
         *
         * Yeni kod Application katalogları için
         * appRegistry kullanmalı.
         */

        VAERO.register(
            "organRegistry",
            AppRegistry
        );

    }

} catch(error){

    console.warn(
        "AppRegistry VAERO servislerine eklenemedi:",
        error
    );

}


/* =========================================================
   GLOBALS
========================================================= */

window.AppRegistry =
    AppRegistry;


/*
 * Legacy compatibility.
 *
 * Eski OrgansApp / OrganStatus kodu henüz bu globali
 * kullanabiliyor.
 */

window.OrganRegistry =
    AppRegistry;
