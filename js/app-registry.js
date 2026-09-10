/* =========================================================
   VAERO APPLICATION REGISTRY
   Application Catalog / Manifest Authority
   Built-In + External Application Manifests
========================================================= */

const AppRegistry = (() => {

    /* =====================================================
       PRIVATE BUILT-IN AUTHORITY
    ===================================================== */

    const BUILT_IN_TOKEN =
        Symbol(
            "VAERO_INTERNAL_BUILT_IN"
        );


    const Registry = {

        version:
            "3.0.0",

        manifestVersion:
            4,

        apps: [],


        /* =====================================================
           NORMALIZATION
        ===================================================== */

        normalizeId(id){

            return String(
                id ??
                ""
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


            const seen =
                new Set();


            const result =
                [];


            value.forEach(
                item => {

                    const normalized =
                        String(
                            item ??
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    if(!normalized){

                        return;

                    }


                    if(
                        seen.has(
                            normalized
                        )
                    ){

                        return;

                    }


                    seen.add(
                        normalized
                    );


                    result.push(
                        normalized
                    );

                }
            );


            return result;

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
                "commerce",
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
                numericAmount >=
                    0
                    ? numericAmount
                    : 0;


            let currency =
                null;


            if(
                model !==
                    "free"
            ){

                const requestedCurrency =
                    String(
                        pricing.currency ||
                        ""
                    )
                        .trim()
                        .toUpperCase();


                currency =
                    requestedCurrency ||
                    null;

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

                    minEngineVersion:
                        null,

                    maxEngineVersion:
                        null

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


        normalizeMetadata(value){

            if(
                !value ||
                typeof value !==
                    "object" ||
                Array.isArray(
                    value
                )
            ){

                return {};

            }


            return {
                ...value
            };

        },


        /* =====================================================
           INTERACTION NETWORK MANIFEST
        ===================================================== */

        normalizeTrustRequirements(value){

            if(
                !value ||
                typeof value !==
                    "object" ||
                Array.isArray(
                    value
                )
            ){

                return {

                    level:
                        null,

                    verifiedIdentity:
                        false,

                    stepUpActions:
                        [],

                    evidence:
                        []

                };

            }


            const level =
                value.level
                    ? String(
                        value.level
                    )
                        .trim()
                        .toLowerCase()
                    : null;


            return {

                level,

                verifiedIdentity:
                    value.verifiedIdentity ===
                        true,

                stepUpActions:
                    this.normalizeArray(
                        value.stepUpActions
                    ),

                evidence:
                    this.normalizeArray(
                        value.evidence
                    )

            };

        },


        normalizeNetworkManifest(app){

            const legacyCapabilities =
                this.normalizeArray(
                    app.capabilities
                );


            const requestedCapabilities =
                this.normalizeArray(
                    app.capabilitiesRequested
                );


            const capabilities =
                requestedCapabilities.length >
                    0
                    ? requestedCapabilities
                    : legacyCapabilities;


            return {

                objectTypes:
                    this.normalizeArray(
                        app.objectTypes
                    ),

                nativeVerbs:
                    this.normalizeArray(
                        app.nativeVerbs
                    ),

                outcomeTypes:
                    this.normalizeArray(
                        app.outcomeTypes
                    ),

                capabilitiesRequested:
                    capabilities,

                contextInputs:
                    this.normalizeArray(
                        app.contextInputs
                    ),

                contextOutputs:
                    this.normalizeArray(
                        app.contextOutputs
                    ),

                trustRequirements:
                    this.normalizeTrustRequirements(
                        app.trustRequirements
                    )

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

                requestedPermissions: [
                    ...(
                        app.requestedPermissions ||
                        []
                    )
                ],

                capabilities: [
                    ...(
                        app.capabilities ||
                        []
                    )
                ],

                capabilitiesRequested: [
                    ...(
                        app.capabilitiesRequested ||
                        []
                    )
                ],

                objectTypes: [
                    ...(
                        app.objectTypes ||
                        []
                    )
                ],

                nativeVerbs: [
                    ...(
                        app.nativeVerbs ||
                        []
                    )
                ],

                outcomeTypes: [
                    ...(
                        app.outcomeTypes ||
                        []
                    )
                ],

                contextInputs: [
                    ...(
                        app.contextInputs ||
                        []
                    )
                ],

                contextOutputs: [
                    ...(
                        app.contextOutputs ||
                        []
                    )
                ],

                trustRequirements: {

                    ...(
                        app.trustRequirements ||
                        {}
                    ),

                    stepUpActions: [
                        ...(
                            app
                                .trustRequirements
                                ?.stepUpActions ||
                            []
                        )
                    ],

                    evidence: [
                        ...(
                            app
                                .trustRequirements
                                ?.evidence ||
                            []
                        )
                    ]

                },

                dependencies: [
                    ...(
                        app.dependencies ||
                        []
                    )
                ],

                tags: [
                    ...(
                        app.tags ||
                        []
                    )
                ],

                pricing: {
                    ...(
                        app.pricing ||
                        {}
                    )
                },

                compatibility: {
                    ...(
                        app.compatibility ||
                        {}
                    )
                },

                metadata: {
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

                    valid:
                        false,

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

                    valid:
                        false,

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

                    valid:
                        false,

                    reason:
                        "Application id formatı geçersiz."

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

                    valid:
                        false,

                    reason:
                        "Application title eksik."

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
                        "Application title çok uzun."

                };

            }


            const action =
                this.normalizeText(
                    app.action
                );


            if(!action){

                return {

                    valid:
                        false,

                    reason:
                        "Application action eksik."

                };

            }


            if(
                !/^[a-z0-9:_\-.]+$/i.test(
                    action
                )
            ){

                return {

                    valid:
                        false,

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

                    valid:
                        false,

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

                    valid:
                        false,

                    reason:
                        "Subscription application için interval gerekli."

                };

            }


            return {

                valid:
                    true,

                id,

                title,

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


            const networkManifest =
                this.normalizeNetworkManifest(
                    app
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
                    validation.title,

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
                    isBuiltIn
                        ? false
                        : app.updateable !==
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

                /*
                 * Legacy compatibility.
                 *
                 * EngineSession currently reads capabilities.
                 * The canonical manifest field going forward
                 * is capabilitiesRequested.
                 */

                capabilities: [
                    ...networkManifest
                        .capabilitiesRequested
                ],

                capabilitiesRequested: [
                    ...networkManifest
                        .capabilitiesRequested
                ],

                objectTypes:
                    networkManifest
                        .objectTypes,

                nativeVerbs:
                    networkManifest
                        .nativeVerbs,

                outcomeTypes:
                    networkManifest
                        .outcomeTypes,

                contextInputs:
                    networkManifest
                        .contextInputs,

                contextOutputs:
                    networkManifest
                        .contextOutputs,

                trustRequirements:
                    networkManifest
                        .trustRequirements,

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
                    this.normalizeMetadata(
                        app.metadata
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


            if(
                existingIndex >=
                    0
            ){

                const existing =
                    this.apps[
                        existingIndex
                    ];


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

                    normalizedApp.updateable =
                        false;

                    normalizedApp.signature =
                        null;

                }
                else {

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


            this.apps.push(
                normalizedApp
            );


            return this.cloneApp(
                normalizedApp
            );

        },


        /* =====================================================
           EXTERNAL MANIFEST
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


            if(!normalizedId){

                return false;

            }


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


            if(!normalizedId){

                return false;

            }


            const app =
                this.apps.find(
                    item =>
                        item.id ===
                        normalizedId
                );


            if(!app){

                return false;

            }


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


            if(!normalizedId){

                return null;

            }


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


            if(!normalizedId){

                return false;

            }


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

            const safeOptions =
                (
                    options &&
                    typeof options ===
                        "object" &&
                    !Array.isArray(
                        options
                    )
                )
                    ? options
                    : {};


            const includeDisabled =
                safeOptions.includeDisabled ===
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
                safeOptions.category
            ){

                const category =
                    this.normalizeCategory(
                        safeOptions.category
                    );


                apps =
                    apps.filter(
                        app =>
                            app.category ===
                            category
                    );

            }


            if(
                safeOptions.installable ===
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
                safeOptions.system ===
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
                safeOptions.external ===
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
                safeOptions.firstParty ===
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
                safeOptions.thirdParty ===
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
                safeOptions.paid ===
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


            if(
                safeOptions.interactionReady ===
                    true
            ){

                apps =
                    apps.filter(
                        app =>
                            (
                                app.objectTypes
                                    ?.length >
                                0
                            ) ||
                            (
                                app.nativeVerbs
                                    ?.length >
                                0
                            ) ||
                            (
                                app.outcomeTypes
                                    ?.length >
                                0
                            )
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
                            app.capabilitiesRequested ||
                            []
                        ),

                        ...(
                            app.requestedPermissions ||
                            []
                        ),

                        ...(
                            app.objectTypes ||
                            []
                        ),

                        ...(
                            app.nativeVerbs ||
                            []
                        ),

                        ...(
                            app.outcomeTypes ||
                            []
                        ),

                        ...(
                            app.contextInputs ||
                            []
                        ),

                        ...(
                            app.contextOutputs ||
                            []
                        )

                    ]
                        .filter(
                            value =>
                                value !==
                                    null &&
                                value !==
                                    undefined
                        )
                        .join(
                            " "
                        )
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
                            current +
                            1
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
                    includeDisabled:
                        true
                });


            const interactionReady =
                apps.filter(
                    app =>
                        (
                            app.objectTypes
                                ?.length >
                            0
                        ) ||
                        (
                            app.nativeVerbs
                                ?.length >
                            0
                        ) ||
                        (
                            app.outcomeTypes
                                ?.length >
                            0
                        )
                ).length;


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

                interactionReady,

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

                version:
                    this.version,

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

                interactionReady:
                    catalog.interactionReady,

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
                "3.0.0",

            capabilities: [
                "identity.read",
                "identity.manage",
                "identity.verification.request"
            ],

            objectTypes: [
                "identity",
                "verification",
                "evidence"
            ],

            nativeVerbs: [
                "view",
                "manage",
                "verify"
            ],

            outcomeTypes: [
                "verified",
                "completed"
            ],

            contextInputs: [
                "entity-ref",
                "identity-ref"
            ],

            contextOutputs: [
                "identity-ref",
                "verification-ref",
                "outcome-ref"
            ],

            trustRequirements: {

                level:
                    "engine-trusted",

                verifiedIdentity:
                    false,

                stepUpActions: [
                    "identity.verify"
                ]

            },

            tags: [
                "identity",
                "va-id",
                "verification"
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
                "Kendini VAERO içinde ifade et",

            description:
                "Görünen isim, bio, yetenekler, ilgi alanları ve Discovery sunumunu yönetir.",

            action:
                "entity:profile",

            category:
                "identity",

            version:
                "3.0.0",

            capabilities: [
                "profile.read",
                "profile.manage",
                "profile.discovery"
            ],

            objectTypes: [
                "profile",
                "identity",
                "preference"
            ],

            nativeVerbs: [
                "view",
                "edit",
                "present"
            ],

            outcomeTypes: [
                "created",
                "progressed"
            ],

            contextInputs: [
                "entity-ref",
                "identity-ref"
            ],

            contextOutputs: [
                "profile-ref",
                "context-ref"
            ],

            trustRequirements: {

                level:
                    "engine-trusted",

                verifiedIdentity:
                    false

            },

            tags: [
                "profile",
                "discovery",
                "presentation"
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
                "Kalıcı bağlamlarını yönet",

            description:
                "Notları, kararları, fikirleri, olayları ve önemli bağlamları merkezi Memory System üzerinden yönetir.",

            action:
                "entity:memory",

            category:
                "knowledge",

            version:
                "3.0.0",

            capabilities: [
                "memory.read",
                "memory.create",
                "memory.manage",
                "memory.search"
            ],

            objectTypes: [
                "memory-event",
                "decision",
                "conversation",
                "outcome",
                "collaboration",
                "learned-preference",
                "active-context"
            ],

            nativeVerbs: [
                "remember",
                "search",
                "correct",
                "forget",
                "link"
            ],

            outcomeTypes: [
                "learned",
                "organised",
                "progressed"
            ],

            contextInputs: [
                "context-ref",
                "entity-ref",
                "conversation-ref",
                "decision-ref",
                "outcome-ref"
            ],

            contextOutputs: [
                "memory-ref",
                "context-ref",
                "outcome-ref"
            ],

            trustRequirements: {

                level:
                    "engine-trusted",

                verifiedIdentity:
                    false,

                stepUpActions: [
                    "memory.forget"
                ]

            },

            tags: [
                "memory",
                "knowledge",
                "context"
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
                "Yaşam ve sistem akışını gör",

            description:
                "Memory, Evolution ve sistem olaylarını tek kronolojik görünümde birleştirir.",

            action:
                "entity:timeline",

            category:
                "knowledge",

            version:
                "3.0.0",

            capabilities: [
                "timeline.read",
                "timeline.search",
                "timeline.link"
            ],

            objectTypes: [
                "memory-event",
                "outcome",
                "task",
                "decision",
                "conversation"
            ],

            nativeVerbs: [
                "view",
                "resume",
                "respond",
                "complete",
                "link"
            ],

            outcomeTypes: [
                "progressed",
                "completed"
            ],

            contextInputs: [
                "entity-ref",
                "memory-ref",
                "outcome-ref",
                "task-ref"
            ],

            contextOutputs: [
                "context-ref",
                "task-ref",
                "outcome-ref"
            ],

            trustRequirements: {

                level:
                    "engine-trusted",

                verifiedIdentity:
                    false

            },

            tags: [
                "timeline",
                "history",
                "events",
                "continuation"
            ]
        },


        {
            id:
                "bridge",

            icon:
                "⌁",

            title:
                "Bağlantılar",

            subtitle:
                "İlişkilerini ve bağlantılarını yönet",

            description:
                "Varlıkların ve dünyaların birbiriyle nasıl bağlantı kurduğunu tek yerde gör ve yönet.",

            action:
                "entity:bridge",

            category:
                "social",

            version:
                "3.0.0",

            capabilities: [
                "bridge.read",
                "bridge.create",
                "bridge.manage",
                "bridge.search"
            ],

            objectTypes: [
                "entity",
                "relation",
                "conversation",
                "collaboration",
                "community"
            ],

            nativeVerbs: [
                "connect",
                "follow",
                "fan",
                "converse",
                "collaborate"
            ],

            outcomeTypes: [
                "organised",
                "progressed",
                "completed"
            ],

            contextInputs: [
                "entity-ref",
                "relation-ref",
                "world-ref"
            ],

            contextOutputs: [
                "relation-ref",
                "conversation-ref",
                "collaboration-ref"
            ],

            trustRequirements: {

                level:
                    "engine-trusted",

                verifiedIdentity:
                    false

            },

            tags: [
                "bridge",
                "connections",
                "network",
                "relationships"
            ]
        },


        {
            id:
                "evolution",

            icon:
                "⌬",

            title:
                "Gelişim",

            subtitle:
                "İlerlemeni ve hedeflerini takip et",

            description:
                "Hedeflerini, kararlarını, başarılarını ve önemli gelişmeleri tek bir ilerleme akışında takip et.",

            action:
                "entity:evolution",

            category:
                "development",

            version:
                "3.0.0",

            capabilities: [
                "evolution.read",
                "evolution.create",
                "evolution.manage",
                "evolution.goals"
            ],

            objectTypes: [
                "goal",
                "decision",
                "task",
                "outcome",
                "evidence"
            ],

            nativeVerbs: [
                "plan",
                "track",
                "decide",
                "complete",
                "verify"
            ],

            outcomeTypes: [
                "decided",
                "progressed",
                "completed",
                "verified"
            ],

            contextInputs: [
                "goal-ref",
                "decision-ref",
                "task-ref",
                "outcome-ref"
            ],

            contextOutputs: [
                "decision-ref",
                "task-ref",
                "outcome-ref",
                "evidence-ref"
            ],

            trustRequirements: {

                level:
                    "engine-trusted",

                verifiedIdentity:
                    false

            },

            tags: [
                "evolution",
                "goals",
                "progress",
                "life-events"
            ]
        },


        {
            id:
                "organs",

            icon:
                "⬡",

            title:
                "Varlık Sistemleri",

            subtitle:
                "Varlığının temel işlevlerini yönet",

            description:
                "Kimlik, hafıza, bağlantılar ve diğer temel işlevlerin durumunu tek yerde gör ve yönet.",

            action:
                "entity:organs",

            category:
                "system",

            version:
                "3.0.0",

            capabilities: [
                "organs.read",
                "organs.status",
                "organs.inspect",
                "organs.navigate"
            ],

            objectTypes: [
                "organ",
                "capability",
                "permission",
                "grant"
            ],

            nativeVerbs: [
                "inspect",
                "manage",
                "authorise",
                "revoke"
            ],

            outcomeTypes: [
                "organised",
                "verified"
            ],

            contextInputs: [
                "entity-ref",
                "application-ref",
                "organ-ref"
            ],

            contextOutputs: [
                "organ-ref",
                "permission-ref",
                "grant-ref"
            ],

            trustRequirements: {

                level:
                    "engine-trusted",

                verifiedIdentity:
                    false,

                stepUpActions: [
                    "permission.authorise",
                    "permission.revoke"
                ]

            },

            tags: [
                "organs",
                "system",
                "entity",
                "status"
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
                "Engine tercihlerini yönet",

            description:
                "Privacy, Brain, Memory, Notifications, Applications, Security ve görünüm tercihlerini yönetir.",

            action:
                "entity:settings",

            category:
                "system",

            version:
                "3.0.0",

            capabilities: [
                "settings.read",
                "settings.manage",
                "privacy.manage"
            ],

            objectTypes: [
                "preference",
                "privacy",
                "security",
                "notification"
            ],

            nativeVerbs: [
                "view",
                "configure",
                "authorise",
                "revoke"
            ],

            outcomeTypes: [
                "organised",
                "verified"
            ],

            contextInputs: [
                "identity-ref",
                "application-ref",
                "context-ref"
            ],

            contextOutputs: [
                "preference-ref",
                "permission-ref"
            ],

            trustRequirements: {

                level:
                    "engine-trusted",

                verifiedIdentity:
                    false,

                stepUpActions: [
                    "security.change",
                    "permission.revoke"
                ]

            },

            tags: [
                "settings",
                "privacy",
                "security"
            ]
        },


        {
            id:
                "discovery",

            icon:
                "◇",

            title:
                "Keşif",

            subtitle:
                "Sana uygun yönleri keşfet",

            description:
                "Amaç, ilgi, güçlü yön, hedef ve bağlantı sinyallerinden kişisel başlangıç yönünü oluşturur.",

            action:
                "entity:discovery",

            category:
                "development",

            version:
                "3.0.0",

            capabilities: [
                "discovery.read",
                "discovery.analyse",
                "discovery.personalise"
            ],

            objectTypes: [
                "intent",
                "person",
                "application",
                "product",
                "community",
                "recommendation",
                "comparison"
            ],

            nativeVerbs: [
                "discover",
                "compare",
                "recommend",
                "follow",
                "fan"
            ],

            outcomeTypes: [
                "learned",
                "decided",
                "progressed"
            ],

            contextInputs: [
                "intent-ref",
                "identity-ref",
                "preference-ref",
                "context-ref"
            ],

            contextOutputs: [
                "recommendation-ref",
                "comparison-ref",
                "application-ref",
                "person-ref",
                "product-ref"
            ],

            trustRequirements: {

                level:
                    "engine-trusted",

                verifiedIdentity:
                    false

            },

            tags: [
                "discovery",
                "direction",
                "personalisation",
                "recommendations"
            ]
        },


        {
            id:
                "applications",

            icon:
                "▦",

            title:
                "Uygulamalar",

            subtitle:
                "VAERO'daki araçlarını keşfet",

            description:
                "Engine içindeki uygulamaları keşfet, izinleri incele, kurulu uygulamaları yönet ve güncellemeleri takip et.",

            action:
                "app:applications",

            category:
                "system",

            version:
                "3.0.0",

            capabilities: [
                "applications.catalog",
                "applications.install",
                "applications.manage",
                "applications.update",
                "permissions.review"
            ],

            objectTypes: [
                "application",
                "app-entity",
                "person",
                "conversation",
                "comparison",
                "decision",
                "outcome",
                "community"
            ],

            nativeVerbs: [
                "discover",
                "open",
                "compare",
                "recommend",
                "follow",
                "fan",
                "converse",
                "install",
                "manage"
            ],

            outcomeTypes: [
                "decided",
                "created",
                "completed",
                "progressed"
            ],

            contextInputs: [
                "intent-ref",
                "entity-ref",
                "world-ref",
                "context-ref"
            ],

            contextOutputs: [
                "application-ref",
                "comparison-ref",
                "decision-ref",
                "context-ref"
            ],

            trustRequirements: {

                level:
                    "engine-trusted",

                verifiedIdentity:
                    false,

                stepUpActions: [
                    "application.install",
                    "permission.grant"
                ]

            },

            tags: [
                "applications",
                "catalog",
                "permissions",
                "updates",
                "application-network"
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
                "Kişisel Atmosfer Sistemin",

            description:
                "VAERO cihazlarını, atmosferlerini, ürün deneyimini, Care hizmetlerini ve VAERO'nun fiziksel dünya katmanlarını tek resmi uygulamada yönetir.",

            action:
                "app:vaero",

            category:
                "service",

            version:
                "3.0.0",

            requestedPermissions: [

                "data.read",
                "data.write"

            ],

            capabilities: [

                "vaero.products",
                "vaero.atmospheres",
                "vaero.purchase",
                "vaero.care",
                "vaero.vision"

            ],

            objectTypes: [

                "product",
                "atmosphere",
                "device",
                "care-request",
                "vision",
                "payment-intent",
                "outcome"

            ],

            nativeVerbs: [

                "discover",
                "compare",
                "buy",
                "create",
                "request",
                "verify"

            ],

            outcomeTypes: [

                "bought",
                "created",
                "verified",
                "progressed",
                "completed"

            ],

            contextInputs: [

                "intent-ref",
                "product-ref",
                "vision-ref",
                "entity-ref",
                "context-ref"

            ],

            contextOutputs: [

                "product-ref",
                "vision-ref",
                "payment-intent-ref",
                "outcome-ref",
                "context-ref"

            ],

            trustRequirements: {

                level:
                    "engine-trusted",

                verifiedIdentity:
                    false,

                stepUpActions: [

                    "purchase.confirm",
                    "payment.confirm"

                ],

                evidence: [

                    "payment-provider",
                    "commerce-source"

                ]

            },

            tags: [
                "vaero",
                "atmosphere",
                "device",
                "care",
                "vision",
                "physical-world"
            ],

            metadata: {

                firstPartyProductApp:
                    true,

                engineCore:
                    false,

                interactionNetwork:
                    true

            }
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

        VAERO.register(
            "appRegistry",
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

if(
    typeof window !==
        "undefined"
){

    window.AppRegistry =
        AppRegistry;

}
   
