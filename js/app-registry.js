/* =========================================================
   VAERO ORGAN REGISTRY
   Application / Organ Catalog & Manifest Registry
========================================================= */

const OrganRegistry = {

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
            .replace(/\s+/g, "-");

    },


    normalizeText(
        value,
        fallback = ""
    ){

        return String(
            value ?? fallback
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
                                item ?? ""
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
                "built-in"
            )
                .trim()
                .toLowerCase();


        const allowed = [
            "built-in",
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
            Array.isArray(pricing)
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


        const model =
            allowedModels.includes(
                String(
                    pricing.model ||
                    ""
                )
                    .trim()
                    .toLowerCase()
            )
                ? String(
                    pricing.model
                )
                    .trim()
                    .toLowerCase()
                : "free";


        const amount =
            Number(
                pricing.amount
            );


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

            interval:
                model ===
                    "subscription"
                    ? (
                        pricing.interval ||
                        null
                    )
                    : null

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
            Array.isArray(app)
        ){

            return {
                valid:false,
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
                valid:false,
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
                valid:false,
                reason:
                    "App id formatı geçersiz."
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
                    "App title eksik."
            };

        }


        if(
            title.length >
            120
        ){

            return {
                valid:false,
                reason:
                    "App title çok uzun."
            };

        }


        return {
            valid:true,
            id
        };

    },


    /* =====================================================
       REGISTER
    ===================================================== */

    register(app = {}){

        const validation =
            this.validateManifest(
                app
            );


        if(!validation.valid){

            console.warn(
                "Organ kaydedilemedi:",
                validation.reason,
                app
            );

            return null;

        }


        const id =
            validation.id;


        const distribution =
            this.normalizeDistribution(
                app.distribution
            );


        const isBuiltIn =
            distribution ===
                "built-in";


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
                    "VAERO"
                ),

            distribution,

            enabled:
                app.enabled !==
                false,

            system:
                app.system ===
                    true ||
                isBuiltIn,

            removable:
                app.removable ===
                    true &&
                !isBuiltIn,

            installable:
                app.installable ===
                    true &&
                !isBuiltIn,

            updateable:
                app.updateable !==
                    false,

            trusted:
                app.trusted ===
                    true ||
                isBuiltIn,

            signature:
                app.signature ||
                null,

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
                Number(
                    app.createdAt
                ) ||
                Date.now(),

            updatedAt:
                Date.now()

        };


        const existingIndex =
            this.apps.findIndex(
                item =>
                    item.id === id
            );


        if(
            existingIndex >= 0
        ){

            const existing =
                this.apps[
                    existingIndex
                ];


            /*
             * İlk kayıt built-in/system ise
             * sonradan sıradan manifest ile
             * güven seviyesi düşürülemez.
             */

            normalizedApp.system =
                existing.system ||
                normalizedApp.system;


            normalizedApp.trusted =
                existing.trusted ||
                normalizedApp.trusted;


            if(existing.system){

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


            return {
                ...this.apps[
                    existingIndex
                ]
            };

        }


        this.apps.push(
            normalizedApp
        );


        return {
            ...normalizedApp
        };

    },


    /* =====================================================
       REMOVE MANIFEST
    ===================================================== */

    unregister(id){

        const app =
            this.find(
                id
            );


        if(!app){
            return false;
        }


        /*
         * Built-in VAERO uygulamaları
         * registry'den runtime sırasında kaldırılamaz.
         */

        if(app.system){

            return false;

        }


        const index =
            this.apps.findIndex(
                item =>
                    item.id ===
                    app.id
            );


        if(index < 0){
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


        return app
            ? {
                ...app,
                requestedPermissions:[
                    ...app.requestedPermissions
                ],
                capabilities:[
                    ...app.capabilities
                ],
                dependencies:[
                    ...app.dependencies
                ],
                tags:[
                    ...app.tags
                ],
                pricing:{
                    ...app.pricing
                }
            }
            : null;

    },


    has(id){

        return Boolean(
            this.find(
                id
            )
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
                ? this.apps
                : this.apps.filter(
                    app =>
                        app.enabled
                );


        if(options.category){

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
                        app.installable
                );

        }


        if(
            options.system ===
            true
        ){

            apps =
                apps.filter(
                    app =>
                        app.system
                );

        }


        if(
            options.trusted ===
            true
        ){

            apps =
                apps.filter(
                    app =>
                        app.trusted
                );

        }


        return apps.map(
            app => ({
                ...app,

                requestedPermissions:[
                    ...app.requestedPermissions
                ],

                capabilities:[
                    ...app.capabilities
                ],

                dependencies:[
                    ...app.dependencies
                ],

                tags:[
                    ...app.tags
                ],

                pricing:{
                    ...app.pricing
                }
            })
        );

    },


    /* =====================================================
       SEARCH
    ===================================================== */

    search(query){

        const text =
            String(
                query ?? ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        if(!text){

            return this.all();

        }


        return this.all().filter(
            app => {

                const haystack = [

                    app.id,

                    app.title,

                    app.subtitle,

                    app.description,

                    app.developer,

                    app.category,

                    ...app.tags

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


        this.all().forEach(
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
        ].map(
            ([id, total]) => ({
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
                includeDisabled:true
            });


        return {

            total:
                apps.length,

            enabled:
                apps.filter(
                    app =>
                        app.enabled
                ).length,

            builtIn:
                apps.filter(
                    app =>
                        app.distribution ===
                        "built-in"
                ).length,

            installable:
                apps.filter(
                    app =>
                        app.installable
                ).length,

            trusted:
                apps.filter(
                    app =>
                        app.trusted
                ).length,

            paid:
                apps.filter(
                    app =>
                        app.pricing.model !==
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

[
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

        distribution:
            "built-in",

        trusted:
            true,

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

        distribution:
            "built-in",

        trusted:
            true,

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

        distribution:
            "built-in",

        trusted:
            true,

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

        distribution:
            "built-in",

        trusted:
            true,

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

        distribution:
            "built-in",

        trusted:
            true,

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

        distribution:
            "built-in",

        trusted:
            true,

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

        distribution:
            "built-in",

        trusted:
            true,

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

        distribution:
            "built-in",

        trusted:
            true,

        capabilities:[
            "discovery.read"
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

        distribution:
            "built-in",

        trusted:
            true,

        capabilities:[
            "engine.services",
            "payment.intent"
        ]
    }

].forEach(
    app =>
        OrganRegistry.register(
            app
        )
);


/* =========================================================
   REGISTER
========================================================= */

try{

    if(
        typeof VAERO !== "undefined" &&
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


window.OrganRegistry =
    OrganRegistry;
