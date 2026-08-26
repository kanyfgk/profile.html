/* =========================================================
   VAERO ORGAN REGISTRY
   Application / Organ Catalog & Manifest Registry
========================================================= */

const OrganRegistry = (() => {

    /*
     * Built-in yetkisi registry dışından erişilemeyen
     * private token ile verilir.
     *
     * Böylece dış manifest:
     *
     * distribution: "built-in"
     * system: true
     * trusted: true
     *
     * yazsa bile kendisini VAERO sistem uygulaması
     * olarak kaydedemez.
     */

    const BUILT_IN_TOKEN =
        Symbol(
            "VAERO_INTERNAL_BUILT_IN"
        );


    const Registry = {

        apps: [],

        manifestVersion:
            1,


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
                    "system"
                )
                    .trim()
                    .toLowerCase();


            const allowed = [

                "system",
                "identity",
                "productivity",
                "knowledge",
                "social",
                "development",
                "utility",
                "service",
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
                    ""
                )
                    .trim()
                    .toLowerCase();


            const model =
                allowedModels.includes(
                    requestedModel
                )
                    ? requestedModel
                    : "free";


            const amount =
                Number(
                    pricing.amount
                );


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
                    Number.isFinite(
                        amount
                    ) &&
                    amount >= 0
                        ? amount
                        : 0,

                currency:
                    pricing.currency
                        ? String(
                            pricing.currency
                        )
                            .trim()
                            .toUpperCase()
                        : null,

                interval

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

                    valid:
                        false,

                    reason:
                        "App manifest geçerli bir object değil."

                };

            }


            const id =
                this.normalizeId(
                    app.id
                );


            if(!id){

                return {

                    valid:
                        false,

                    reason:
                        "App id eksik."

                };

            }


            if(
                !/^[a-z0-9][a-z0-9:_\-.]*$/.test(
                    id
                )
            ){

                return {

                    valid:
                        false,

                    reason:
                        "App id formatı geçersiz."

                };

            }


            if(
                id.length >
                100
            ){

                return {

                    valid:
                        false,

                    reason:
                        "App id çok uzun."

                };

            }


            const title =
                this.normalizeText(
                    app.title,
                    id
                );


            if(!title){

                return {

                    valid:
                        false,

                    reason:
                        "App title eksik."

                };

            }


            if(
                title.length >
                120
            ){

                return {

                    valid:
                        false,

                    reason:
                        "App title çok uzun."

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

                    valid:
                        false,

                    reason:
                        "App action formatı geçersiz."

                };

            }


            return {

                valid:
                    true,

                id

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
                    "Organ kaydedilemedi:",
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


            /*
             * Built-in dağıtım değeri yalnız private
             * internal token ile atanabilir.
             */

            const distribution =
                isBuiltIn
                    ? "built-in"
                    : this.normalizeDistribution(
                        app.distribution
                    );


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
                    this.normalizeText(
                        app.action,
                        `entity:${id}`
                    ),

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

                /*
                 * system ve trusted dış manifestten
                 * asla alınmaz.
                 */

                system:
                    isBuiltIn,

                trusted:
                    isBuiltIn,

                removable:
                    !isBuiltIn &&
                    app.removable ===
                        true,

                installable:
                    !isBuiltIn &&
                    app.installable ===
                        true,

                updateable:
                    app.updateable !==
                    false,

                /*
                 * Signature burada yalnız manifest
                 * metadata'sıdır.
                 *
                 * "signature var" = "signature doğrulandı"
                 * anlamına gelmez.
                 */

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
                    this.normalizePricing(
                        app.pricing
                    ),

                minEngineVersion:
                    app.minEngineVersion
                        ? this.normalizeText(
                            app.minEngineVersion
                        )
                        : null,

                tags:
                    this.normalizeArray(
                        app.tags
                    ),

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
                 * Mevcut built-in uygulama dış manifest
                 * tarafından overwrite edilemez.
                 */

                if(
                    existing.system ===
                        true &&
                    !isBuiltIn
                ){

                    console.warn(
                        "Built-in application manifest cannot be overwritten:",
                        id
                    );


                    return this.cloneApp(
                        existing
                    );

                }


                /*
                 * Dış uygulama sonradan kendisini built-in
                 * yapamaz.
                 */

                if(
                    existing.system !==
                        true &&
                    isBuiltIn !==
                        true
                ){

                    normalizedApp.system =
                        false;

                    normalizedApp.trusted =
                        false;

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


            /*
             * Built-in VAERO uygulamaları runtime
             * sırasında registry'den kaldırılamaz.
             */

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
                            app.enabled
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
                options.trusted ===
                true
            ){

                apps =
                    apps.filter(
                        app =>
                            app.trusted ===
                            true
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

        search(query){

            const text =
                String(
                    query ??
                    ""
                )
                    .trim()
                    .toLocaleLowerCase(
                        "tr-TR"
                    );


            if(!text){

                return this.all();

            }


            return this.all()
                .filter(
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
                );

        },


        /* =====================================================
           APPLICATIONS CATALOG SNAPSHOT
        ===================================================== */

        catalog(){

            const apps =
                this.all({
                    includeDisabled:
                        true
                });


            return {

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
                            app.distribution ===
                            "built-in"
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

                trusted:
                    apps.filter(
                        app =>
                            app.trusted ===
                            true
                    ).length,

                paid:
                    apps.filter(
                        app =>
                            app.pricing?.model !==
                            "free"
                    ).length,

                categories:
                    this.categories(),

                apps

            };

        }

    };


    /* =========================================================
       BUILT-IN VAERO APPLICATIONS
    ========================================================= */

    const builtInApplications = [

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
                "VAERO kimlik kaydını ve varlık kimliği bağlamını yönetir.",

            action:
                "entity:identity",

            category:
                "identity",

            capabilities:[
                "identity.read"
            ]
        },


        {
            id:
                "profile",

            icon:
                "👤",

            title:
                "Profil",

            subtitle:
                "Profilini ve yönünü görüntüle",

            description:
                "Görünen profil bilgilerini ve kişisel yönünü yönetir.",

            action:
                "entity:profile",

            category:
                "identity",

            capabilities:[
                "profile.read",
                "profile.manage"
            ]
        },


        {
            id:
                "memory",

            icon:
                "◫",

            title:
                "Hafıza",

            subtitle:
                "Kalıcı kayıtlarını görüntüle",

            description:
                "VAERO içindeki kalıcı bağlamları ve önemli kayıtları yönetir.",

            action:
                "entity:memory",

            category:
                "knowledge",

            capabilities:[
                "memory.read"
            ]
        },


        {
            id:
                "timeline",

            icon:
                "◷",

            title:
                "Zaman Çizelgesi",

            subtitle:
                "Geçmiş olaylarını görüntüle",

            description:
                "Olayları ve değişimleri kronolojik bir yaşam akışında gösterir.",

            action:
                "entity:timeline",

            category:
                "knowledge",

            capabilities:[
                "timeline.read"
            ]
        },


        {
            id:
                "bridge",

            icon:
                "⌁",

            title:
                "Köprü",

            subtitle:
                "Bağlantılarını yönet",

            description:
                "VAERO varlıkları ve sistem bağlamları arasındaki ilişkileri temsil eder.",

            action:
                "entity:bridge",

            category:
                "social",

            capabilities:[
                "bridge.read"
            ]
        },


        {
            id:
                "evolution",

            icon:
                "⌬",

            title:
                "Evrim",

            subtitle:
                "Gelişim olaylarını incele",

            description:
                "Kararların, başarıların ve yaşam olaylarının zaman içindeki etkisini gösterir.",

            action:
                "entity:evolution",

            category:
                "development",

            capabilities:[
                "evolution.read"
            ]
        },


        {
            id:
                "settings",

            icon:
                "⚙️",

            title:
                "Ayarlar",

            subtitle:
                "Sistem tercihlerini yönet",

            description:
                "VAERO görünümünü, davranışlarını ve kullanıcı tercihlerini yönetir.",

            action:
                "entity:settings",

            category:
                "system",

            capabilities:[
                "settings.read"
            ]
        },


        {
            id:
                "discovery",

            icon:
                "◇",

            title:
                "Discovery",

            subtitle:
                "Keşif cevaplarını yeniden değerlendir",

            description:
                "Hedefleri, ilgi alanlarını, güçlü yönleri ve kişisel yönü değerlendirir.",

            action:
                "entity:discovery",

            category:
                "development",

            capabilities:[
                "discovery.read"
            ]
        },


        {
            id:
                "applications",

            icon:
                "▦",

            title:
                "Applications",

            subtitle:
                "Engine'ini yeni uygulamalarla genişlet",

            description:
                "VAERO uygulamalarını keşfet, incele, yükle ve yönet.",

            action:
                "app:applications",

            category:
                "system",

            capabilities:[
                "applications.catalog",
                "applications.manage",
                "permissions.request"
            ]
        },


        {
            id:
                "vaero",

            icon:
                "◉",

            title:
                "VAERO",

            subtitle:
                "Engine hizmetlerini yönet",

            description:
                "Engine hizmetleri, abonelik ve merkezi ödeme altyapısına erişim sağlar.",

            action:
                "app:vaero",

            category:
                "system",

            capabilities:[
                "engine.services",
                "payment.intent"
            ]
        }

    ];


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
            "organRegistry",
            OrganRegistry
        );

    }

} catch(error){

    console.warn(
        "OrganRegistry VAERO registry'ye eklenemedi:",
        error
    );

}


/* =========================================================
   GLOBAL
========================================================= */

window.OrganRegistry =
    OrganRegistry;
