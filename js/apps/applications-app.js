/* =========================================================
   VAERO APPLICATIONS
   Application Discovery / Installation / Permissions /
   Updates / Built-In Safety
========================================================= */

const ApplicationsApp = {

    version:
        "3.0.0",

    searchQuery:
        "",

    category:
        "all",

    view:
        "discover",

    selectedAppId:
        null,

    searchTimer:
        null,


    /* =====================================================
       SAFE SERVICE ACCESS
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

            console.warn(
                `Applications service lookup failed: ${serviceName}`,
                error
            );


            return null;

        }

    },


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


    remount(){

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
                "Applications remount failed:",
                error
            );


            return false;

        }

    },


    escapeHTML(value){

        try{

            if(
                typeof window !==
                    "undefined" &&
                window.UI &&
                typeof window.UI.escapeHTML ===
                    "function"
            ){

                return window.UI.escapeHTML(
                    value
                );

            }

        } catch(error){

            /* local fallback */

        }


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
       BRAIN CONTEXT
    ===================================================== */

    enterBrainContext(){

        try{

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
                "applications",
                {

                    entityId:
                        this.getCurrentEntity()
                            ?.id ||
                        null,

                    view:
                        this.view,

                    category:
                        this.category,

                    selectedAppId:
                        this.selectedAppId,

                    searchActive:
                        Boolean(
                            String(
                                this.searchQuery ||
                                    ""
                            ).trim()
                        ),

                    source:
                        "applications-app"

                }
            );


            return true;

        } catch(error){

            console.warn(
                "Applications Brain context açılamadı:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       APPLICATION REGISTRY
    ===================================================== */

    getRegistry(){

        const service =
            this.getService(
                "appRegistry"
            ) ||
            this.getService(
                "applicationRegistry"
            );


        if(service){

            return service;

        }


        try{

            if(
                typeof AppRegistry !==
                    "undefined"
            ){

                return AppRegistry;

            }

        } catch(error){

            /* fallback */

        }


        if(
            typeof window !==
                "undefined" &&
            window.AppRegistry
        ){

            return window.AppRegistry;

        }


        return null;

    },


    getOrganSystem(){

        return (
            this.getService(
                "organSystem"
            ) ||
            (
                typeof window !==
                    "undefined"
                    ? window.OrganSystem ||
                      null
                    : null
            )
        );

    },


    /* =====================================================
       MANIFEST HELPERS
    ===================================================== */

    normalizeList(value){

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
                    ).trim();


                if(!normalized){

                    return;

                }


                const key =
                    normalized.toLocaleLowerCase(
                        "tr-TR"
                    );


                if(
                    seen.has(
                        key
                    )
                ){

                    return;

                }


                seen.add(
                    key
                );


                result.push(
                    normalized
                );

            }
        );


        return result;

    },


    isBuiltIn(app){

        return Boolean(
            app?.system ===
                true ||
            app?.distribution ===
                "built-in"
        );

    },


    isPaid(app){

        const model =
            String(
                app?.pricing?.model ||
                    "free"
            )
                .trim()
                .toLowerCase();


        return model !==
            "free";

    },


    /* =====================================================
       CATALOG
    ===================================================== */

    getCatalogApps(){

        const registry =
            this.getRegistry();


        if(
            !registry ||
            typeof registry.all !==
                "function"
        ){

            return [];

        }


        try{

            const apps =
                registry.all({
                    includeDisabled:
                        true
                });


            if(
                Array.isArray(
                    apps
                )
            ){

                return apps.filter(
                    Boolean
                );

            }

        } catch(error){

            /* simple registry fallback */

        }


        try{

            const apps =
                registry.all();


            return Array.isArray(
                apps
            )
                ? apps.filter(
                    Boolean
                )
                : [];

        } catch(error){

            console.warn(
                "Application catalog could not be read:",
                error
            );


            return [];

        }

    },


    findApp(appId){

        const id =
            String(
                appId ||
                    ""
            ).trim();


        if(!id){

            return null;

        }


        const registry =
            this.getRegistry();


        if(
            registry &&
            typeof registry.find ===
                "function"
        ){

            try{

                const app =
                    registry.find(
                        id
                    );


                if(app){

                    return app;

                }

            } catch(error){

                /* catalog fallback */

            }

        }


        return (
            this.getCatalogApps()
                .find(
                    app =>
                        String(
                            app?.id ||
                                ""
                        ) ===
                        id
                ) ||
            null
        );

    },


    /* =====================================================
       ORGAN LOOKUP
    ===================================================== */

    getInstalledOrgan(app){

        if(
            !app ||
            !app.id
        ){

            return null;

        }


        const organSystem =
            this.getOrganSystem();


        if(!organSystem){

            return null;

        }


        try{

            if(
                typeof organSystem.get ===
                    "function"
            ){

                const byId =
                    organSystem.get(
                        app.id
                    );


                if(byId){

                    return byId;

                }

            }

        } catch(error){

            /* fallback */

        }


        try{

            if(
                typeof organSystem.findBySlug ===
                    "function"
            ){

                const bySlug =
                    organSystem.findBySlug(
                        app.id
                    );


                if(bySlug){

                    return bySlug;

                }

            }

        } catch(error){

            /* no compatible lookup */

        }


        return null;

    },


    /* =====================================================
       VERSION
    ===================================================== */

    compareVersions(
        installedVersion,
        catalogVersion
    ){

        const parse =
            value =>
                String(
                    value ||
                        "0"
                )
                    .split(
                        "."
                    )
                    .map(
                        part => {

                            const match =
                                String(
                                    part
                                ).match(
                                    /\d+/
                                );


                            return match
                                ? Number(
                                    match[0]
                                ) ||
                                  0
                                : 0;

                        }
                    );


        const installed =
            parse(
                installedVersion
            );


        const catalog =
            parse(
                catalogVersion
            );


        const length =
            Math.max(
                installed.length,
                catalog.length
            );


        for(
            let index = 0;
            index < length;
            index += 1
        ){

            const currentInstalled =
                installed[
                    index
                ] ||
                0;


            const currentCatalog =
                catalog[
                    index
                ] ||
                0;


            if(
                currentCatalog >
                currentInstalled
            ){

                return 1;

            }


            if(
                currentCatalog <
                currentInstalled
            ){

                return -1;

            }

        }


        return 0;

    },


    /* =====================================================
       APPLICATION STATE
    ===================================================== */

    getAppState(app){

        if(!app){

            return {

                builtIn:
                    false,

                installed:
                    false,

                updateAvailable:
                    false,

                status:
                    "not-installed",

                trusted:
                    false,

                organ:
                    null

            };

        }


        const builtIn =
            this.isBuiltIn(
                app
            );


        const organ =
            this.getInstalledOrgan(
                app
            );


        /*
         * Built-in means bundled with VAERO Engine.
         * It is not evidence that an external package was
         * dynamically installed.
         */
        const installed =
            builtIn ||
            organ?.installed ===
                true;


        const updateAvailable =
            Boolean(
                !builtIn &&
                installed &&
                organ &&
                app.version &&
                organ.version &&
                this.compareVersions(
                    organ.version,
                    app.version
                ) ===
                    1
            );


        /*
         * Built-in applications inherit Engine trust.
         * External applications require OrganSystem trust.
         */
        const trusted =
            builtIn
                ? true
                : organ?.trusted ===
                    true;


        const status =
            builtIn
                ? (
                    organ?.status ||
                    "active"
                )
                : (
                    organ?.status ||
                    (
                        installed
                            ? "inactive"
                            : "not-installed"
                    )
                );


        return {

            builtIn,

            installed,

            updateAvailable,

            status,

            trusted,

            organ

        };

    },


    /* =====================================================
       VISIBLE CATALOG
    ===================================================== */

    normalizeView(value){

        const view =
            String(
                value ||
                    "discover"
            )
                .trim()
                .toLowerCase();


        return [
            "discover",
            "installed",
            "updates"
        ].includes(
            view
        )
            ? view
            : "discover";

    },


    setView(value){

        this.view =
            this.normalizeView(
                value
            );


        this.selectedAppId =
            null;


        return this.view;

    },


    setCategory(value){

        const category =
            String(
                value ||
                    "all"
            )
                .trim()
                .toLowerCase();


        this.category =
            category ||
            "all";


        this.selectedAppId =
            null;


        return this.category;

    },


    setSearchQuery(value){

        this.searchQuery =
            String(
                value ??
                    ""
            ).slice(
                0,
                500
            );


        this.selectedAppId =
            null;


        return this.searchQuery;

    },


    getApps(){

        let apps =
            this.getCatalogApps()
                .filter(
                    app =>
                        app?.enabled !==
                            false
                );


        if(
            this.view ===
                "installed"
        ){

            apps =
                apps.filter(
                    app =>
                        this.getAppState(
                            app
                        ).installed
                );

        }


        if(
            this.view ===
                "updates"
        ){

            apps =
                apps.filter(
                    app =>
                        this.getAppState(
                            app
                        )
                            .updateAvailable
                );

        }


        if(
            this.category !==
                "all"
        ){

            apps =
                apps.filter(
                    app =>
                        String(
                            app?.category ||
                                "other"
                        )
                            .trim()
                            .toLowerCase() ===
                        this.category
                );

        }


        const query =
            String(
                this.searchQuery ||
                    ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        if(query){

            apps =
                apps.filter(
                    app => {

                        const searchable = [

                            app?.id,
                            app?.title,
                            app?.subtitle,
                            app?.description,
                            app?.developer,
                            app?.category,

                            ...this.normalizeList(
                                app?.tags
                            ),

                            ...this.normalizeList(
                                app?.capabilities
                            ),

                            ...this.normalizeList(
                                app?.requestedPermissions
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


                        return searchable.includes(
                            query
                        );

                    }
                );

        }


        return apps;

    },


    /* =====================================================
       CATEGORIES
    ===================================================== */

    getCategories(){

        const registry =
            this.getRegistry();


        if(
            registry &&
            typeof registry.categories ===
                "function"
        ){

            try{

                const categories =
                    registry.categories();


                if(
                    Array.isArray(
                        categories
                    )
                ){

                    return categories;

                }

            } catch(error){

                /* derive below */

            }

        }


        const ids = [
            ...new Set(
                this.getCatalogApps()
                    .map(
                        app =>
                            String(
                                app?.category ||
                                    "other"
                            )
                                .trim()
                                .toLowerCase()
                    )
                    .filter(
                        Boolean
                    )
            )
        ];


        return ids.map(
            id => ({
                id
            })
        );

    },


    getCategoryLabel(id){

        const categoryId =
            String(
                id ||
                    "other"
            )
                .trim()
                .toLowerCase();


        const labels = {

            system:
                "Sistem",

            identity:
                "Kimlik",

            productivity:
                "Üretkenlik",

            knowledge:
                "Bilgi",

            social:
                "Sosyal",

            development:
                "Gelişim",

            utility:
                "Araçlar",

            service:
                "Hizmetler",

            communication:
                "İletişim",

            finance:
                "Finans",

            other:
                "Diğer"

        };


        return (
            labels[
                categoryId
            ] ||
            categoryId
        );

    },


    /* =====================================================
       ENTITY SETTINGS POLICY
    ===================================================== */

    getApplicationPolicy(){

        const entity =
            this.getCurrentEntity();


        const defaults = {

            allowInstall:
                true,

            requirePermissionReview:
                true,

            allowExternalApps:
                false,

            allowBackgroundActivity:
                false

        };


        if(
            !entity ||
            !entity.id
        ){

            return defaults;

        }


        /*
         * Settings App currently owns this persisted policy.
         * Applications only reads it; it does not create
         * another application-settings authority.
         */
        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){

                return defaults;

            }


            const saved =
                localStorage.getItem(
                    `vaero:settings:entity:v2:${entity.id}`
                );


            if(!saved){

                return defaults;

            }


            const parsed =
                JSON.parse(
                    saved
                );


            const applications =
                parsed?.applications;


            if(
                !applications ||
                typeof applications !==
                    "object" ||
                Array.isArray(
                    applications
                )
            ){

                return defaults;

            }


            return {

                allowInstall:
                    applications.allowInstall ===
                        undefined
                        ? defaults.allowInstall
                        : applications.allowInstall ===
                            true,

                requirePermissionReview:
                    applications.requirePermissionReview ===
                        undefined
                        ? defaults.requirePermissionReview
                        : applications.requirePermissionReview ===
                            true,

                allowExternalApps:
                    applications.allowExternalApps ===
                        undefined
                        ? defaults.allowExternalApps
                        : applications.allowExternalApps ===
                            true,

                allowBackgroundActivity:
                    applications.allowBackgroundActivity ===
                        undefined
                        ? defaults.allowBackgroundActivity
                        : applications.allowBackgroundActivity ===
                            true

            };

        } catch(error){

            console.warn(
                "Application policy could not be read:",
                error
            );


            return defaults;

        }

    },


    /* =====================================================
       PACKAGE VERIFIER
    ===================================================== */

    verifyPackage(app){

        if(
            !app ||
            !app.id
        ){

            return null;

        }


        const verifier =
            this.getService(
                "applicationVerifier"
            );


        if(
            !verifier ||
            typeof verifier.verify !==
                "function"
        ){

            console.warn(
                "Applications install blocked: package verifier unavailable.",
                app.id
            );


            return null;

        }


        try{

            const result =
                verifier.verify(
                    app
                );


            /*
             * Current Applications command path is synchronous.
             * An async verifier must not accidentally be treated
             * as an approved package.
             */
            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                console.warn(
                    "Applications install blocked: async verification is not wired into this flow.",
                    app.id
                );


                return null;

            }


            if(
                !result ||
                result.valid !==
                    true
            ){

                return null;

            }


            if(
                result.appId &&
                String(
                    result.appId
                ) !==
                String(
                    app.id
                )
            ){

                return null;

            }


            return result;

        } catch(error){

            console.error(
                "Application verification failed:",
                error
            );


            return null;

        }

    },


    /* =====================================================
       PAYMENT ENTITLEMENT
    ===================================================== */

    hasEntitlement(app){

        if(
            !this.isPaid(
                app
            )
        ){

            return true;

        }


        const paymentCore =
            this.getService(
                "paymentCore"
            );


        if(
            !paymentCore ||
            typeof paymentCore
                .hasVerifiedEntitlement !==
                "function"
        ){

            console.warn(
                "Applications install blocked: verified entitlement unavailable.",
                app?.id
            );


            return false;

        }


        try{

            const result =
                paymentCore
                    .hasVerifiedEntitlement(
                        app.id
                    );


            /*
             * Payment authority must return an explicit,
             * synchronous verified entitlement.
             */
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

            console.warn(
                "Application entitlement check failed:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       GUARDIAN
    ===================================================== */

    guardianAllows(
        app,
        operation
    ){

        if(
            !app ||
            !app.id
        ){

            return false;

        }


        const guardian =
            this.getService(
                "guardian"
            );


        /*
         * Guardian is a security boundary.
         * If the service exists, a failed check blocks.
         * If it has not been registered yet, the installation
         * flow itself still requires verifier + policy + trust.
         */
        if(
            !guardian ||
            typeof guardian.check !==
                "function"
        ){

            return true;

        }


        try{

            const validation =
                guardian.check(
                    app,
                    "application-install",
                    {

                        operation:
                            String(
                                operation ||
                                    ""
                            ),

                        appId:
                            app.id,

                        distribution:
                            app.distribution ||
                            null,

                        builtIn:
                            this.isBuiltIn(
                                app
                            )

                    }
                );


            if(
                validation &&
                typeof validation.then ===
                    "function"
            ){

                return false;

            }


            return !(
                validation ===
                    false ||
                validation?.valid ===
                    false ||
                validation?.allowed ===
                    false
            );

        } catch(error){

            console.error(
                "Applications Guardian check failed:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       OPERATION RESULT
    ===================================================== */

    operationSucceeded(result){

        if(
            result ===
                true
        ){

            return true;

        }


        if(
            !result
        ){

            return false;

        }


        if(
            result &&
            typeof result.then ===
                "function"
        ){

            return false;

        }


        if(
            typeof result ===
                "object"
        ){

            if(
                result.success ===
                    false ||
                result.valid ===
                    false ||
                result.allowed ===
                    false ||
                result.error ===
                    true
            ){

                return false;

            }


            return true;

        }


        return result !==
            false;

    },


    /* =====================================================
       CONTINUE IN PART 2
    ===================================================== */

   /* =====================================================
       INSTALL
    ===================================================== */

    install(appId){

        const app =
            this.findApp(
                appId
            );


        const organSystem =
            this.getOrganSystem();


        if(
            !app ||
            !organSystem
        ){

            return false;

        }


        /*
         * Built-in applications already ship with Engine.
         * They do not enter the external installation flow.
         */
        if(
            this.isBuiltIn(
                app
            )
        ){

            return false;

        }


        const policy =
            this.getApplicationPolicy();


        if(
            policy.allowInstall !==
                true
        ){

            console.warn(
                "Applications install blocked by Entity policy."
            );


            return false;

        }


        if(
            policy.allowExternalApps !==
                true
        ){

            console.warn(
                "Applications install blocked: external applications disabled."
            );


            return false;

        }


        if(
            app.installable !==
                true
        ){

            return false;

        }


        if(
            !this.guardianAllows(
                app,
                "install"
            )
        ){

            return false;

        }


        const verification =
            this.verifyPackage(
                app
            );


        if(!verification){

            return false;

        }


        if(
            !this.hasEntitlement(
                app
            )
        ){

            return false;

        }


        const existing =
            this.getInstalledOrgan(
                app
            );


        /*
         * Existing Organ record may be present but disabled /
         * uninstalled. In that case use OrganSystem.install.
         */
        if(existing){

            if(
                existing.installed ===
                    true
            ){

                this.selectedAppId =
                    app.id;


                return true;

            }


            if(
                typeof organSystem.install !==
                    "function"
            ){

                return false;

            }


            let installResult =
                false;


            try{

                installResult =
                    organSystem.install(
                        existing.id
                    );

            } catch(error){

                console.error(
                    "Existing application could not be installed:",
                    error
                );


                return false;

            }


            if(
                !this.operationSucceeded(
                    installResult
                )
            ){

                return false;

            }


            this.emitLifecycle(
                "installed",
                app,
                existing
            );


            this.selectedAppId =
                app.id;


            this.enterBrainContext();


            this.remount();


            return true;

        }


        if(
            typeof organSystem.create !==
                "function"
        ){

            return false;

        }


        const requestedPermissions =
            this.normalizeList(
                app.requestedPermissions
            );


        let organ =
            null;


        try{

            organ =
                organSystem.create(
                    app.title,
                    "inactive",
                    {

                        id:
                            app.id,

                        slug:
                            app.id,

                        title:
                            app.title,

                        description:
                            app.description ||
                            app.subtitle ||
                            "",

                        icon:
                            app.icon ||
                            "◌",

                        action:
                            app.action ||
                            "",

                        version:
                            app.version ||
                            "1.0.0",

                        type:
                            "application",

                        source:
                            app.distribution ||
                            "external",

                        developer:
                            app.developer ||
                            null,

                        signature:
                            verification.signature ||
                            app.signature ||
                            null,

                        trusted:
                            false,

                        installed:
                            true,

                        removable:
                            app.removable !==
                            false,

                        permissions:
                            [],

                        capabilities:
                            this.normalizeList(
                                app.capabilities
                            ),

                        dependencies:
                            this.normalizeList(
                                app.dependencies
                            ),

                        metadata: {

                            applicationId:
                                app.id,

                            requestedPermissions,

                            permissionReviewRequired:
                                Boolean(
                                    policy.requirePermissionReview &&
                                    requestedPermissions.length
                                ),

                            verification: {

                                verified:
                                    true,

                                verifiedAt:
                                    Date.now(),

                                authority:
                                    verification.authority ||
                                    null,

                                hash:
                                    verification.hash ||
                                    null,

                                reference:
                                    verification.reference ||
                                    null

                            }

                        }

                    }
                );

        } catch(error){

            console.error(
                "Application Organ could not be created:",
                error
            );


            return false;

        }


        if(
            !organ ||
            !organ.id
        ){

            return false;

        }


        /*
         * Manifest trusted=true is never accepted as trust.
         * Trust is granted only after verifier success.
         */
        if(
            typeof organSystem.setTrusted !==
                "function"
        ){

            try{

                organSystem.remove?.(
                    organ.id,
                    {
                        force:
                            true
                    }
                );

            } catch(error){

                /* cleanup best effort */

            }


            return false;

        }


        let trustResult =
            false;


        try{

            trustResult =
                organSystem.setTrusted(
                    organ.id,
                    true,
                    {

                        verified:
                            true,

                        verification

                    }
                );

        } catch(error){

            console.error(
                "Application trust could not be set:",
                error
            );

        }


        if(
            !this.operationSucceeded(
                trustResult
            )
        ){

            try{

                organSystem.remove?.(
                    organ.id,
                    {
                        force:
                            true
                    }
                );

            } catch(error){

                /* cleanup best effort */

            }


            return false;

        }


        /*
         * Apps with no requested permissions may activate
         * immediately. Others remain inactive until every
         * requested permission is reviewed.
         */
        if(
            requestedPermissions.length ===
                0
        ){

            try{

                organSystem.setStatus?.(
                    organ.id,
                    "active"
                );

            } catch(error){

                console.warn(
                    "Application status could not be activated:",
                    error
                );

            }

        }
        else {

            try{

                organSystem.setStatus?.(
                    organ.id,
                    "inactive"
                );

            } catch(error){

                /* already created inactive */

            }

        }


        this.emitLifecycle(
            "installed",
            app,
            organ
        );


        this.selectedAppId =
            app.id;


        this.enterBrainContext();


        this.remount();


        return true;

    },


    /* =====================================================
       PERMISSION CONSENT
    ===================================================== */

    grantRequestedPermission(
        appId,
        permission
    ){

        const app =
            this.findApp(
                appId
            );


        if(!app){

            return false;

        }


        const state =
            this.getAppState(
                app
            );


        const organ =
            state.organ;


        if(
            !organ ||
            !state.installed ||
            state.builtIn ||
            state.trusted !==
                true
        ){

            return false;

        }


        const requested =
            this.normalizeList(
                app.requestedPermissions
            );


        const normalized =
            String(
                permission ||
                    ""
            )
                .trim()
                .toLowerCase();


        if(!normalized){

            return false;

        }


        const requestedNormalized =
            requested.map(
                item =>
                    item.toLowerCase()
            );


        if(
            !requestedNormalized.includes(
                normalized
            )
        ){

            return false;

        }


        const organSystem =
            this.getOrganSystem();


        if(
            !organSystem ||
            typeof organSystem.grantPermission !==
                "function"
        ){

            return false;

        }


        let result =
            false;


        try{

            result =
                organSystem.grantPermission(
                    organ.id,
                    normalized,
                    {

                        source:
                            "applications-consent",

                        confirmed:
                            true

                    }
                );

        } catch(error){

            console.error(
                "Application permission could not be granted:",
                error
            );


            return false;

        }


        if(
            !this.operationSucceeded(
                result
            )
        ){

            return false;

        }


        this.activateWhenPermissionsReviewed(
            app
        );


        this.emitLifecycle(
            "permission-granted",
            app,
            organ,
            {

                permission:
                    normalized

            }
        );


        this.enterBrainContext();


        this.remount();


        return true;

    },


    activateWhenPermissionsReviewed(app){

        if(!app){

            return false;

        }


        const state =
            this.getAppState(
                app
            );


        const organ =
            state.organ;


        if(
            !organ ||
            state.trusted !==
                true
        ){

            return false;

        }


        const requested =
            this.normalizeList(
                app.requestedPermissions
            )
                .map(
                    item =>
                        item.toLowerCase()
                );


        const granted =
            this.normalizeList(
                organ.permissions
            )
                .map(
                    item =>
                        item.toLowerCase()
                );


        const complete =
            requested.every(
                permission =>
                    granted.includes(
                        permission
                    )
            );


        if(!complete){

            return false;

        }


        const organSystem =
            this.getOrganSystem();


        if(
            !organSystem ||
            typeof organSystem.setStatus !==
                "function"
        ){

            return false;

        }


        try{

            const result =
                organSystem.setStatus(
                    organ.id,
                    "active"
                );


            return this.operationSucceeded(
                result
            );

        } catch(error){

            console.warn(
                "Application activation failed:",
                error
            );


            return false;

        }

    },


    revokePermission(
        appId,
        permission
    ){

        const app =
            this.findApp(
                appId
            );


        if(!app){

            return false;

        }


        const state =
            this.getAppState(
                app
            );


        const organ =
            state.organ;


        const organSystem =
            this.getOrganSystem();


        if(
            !organ ||
            state.builtIn ||
            !organSystem ||
            typeof organSystem.revokePermission !==
                "function"
        ){

            return false;

        }


        const normalized =
            String(
                permission ||
                    ""
            )
                .trim()
                .toLowerCase();


        if(!normalized){

            return false;

        }


        let result =
            false;


        try{

            result =
                organSystem.revokePermission(
                    organ.id,
                    normalized
                );

        } catch(error){

            console.error(
                "Application permission could not be revoked:",
                error
            );


            return false;

        }


        if(
            !this.operationSucceeded(
                result
            )
        ){

            return false;

        }


        const requested =
            this.normalizeList(
                app.requestedPermissions
            )
                .map(
                    item =>
                        item.toLowerCase()
                );


        /*
         * Revoking a required permission returns the app to
         * inactive until permission review is complete again.
         */
        if(
            requested.includes(
                normalized
            )
        ){

            try{

                organSystem.setStatus?.(
                    organ.id,
                    "inactive"
                );

            } catch(error){

                console.warn(
                    "Application could not be deactivated after permission revoke:",
                    error
                );

            }

        }


        this.emitLifecycle(
            "permission-revoked",
            app,
            organ,
            {

                permission:
                    normalized

            }
        );


        this.enterBrainContext();


        this.remount();


        return true;

    },


    /* =====================================================
       BRAIN ACTION COMPATIBILITY
    ===================================================== */

    grantPermission(
        appId,
        permission
    ){

        return this.grantRequestedPermission(
            appId,
            permission
        );

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    updateApplication(appId){

        const app =
            this.findApp(
                appId
            );


        if(!app){

            return false;

        }


        const state =
            this.getAppState(
                app
            );


        if(
            !state.installed ||
            !state.organ ||
            !state.updateAvailable
        ){

            return false;

        }


        /*
         * Built-in applications update with Engine releases.
         * Applications Store does not mutate their runtime.
         */
        if(
            state.builtIn
        ){

            return false;

        }


        if(
            !this.guardianAllows(
                app,
                "update"
            )
        ){

            return false;

        }


        const verification =
            this.verifyPackage(
                app
            );


        if(!verification){

            return false;

        }


        if(
            !this.hasEntitlement(
                app
            )
        ){

            return false;

        }


        const organSystem =
            this.getOrganSystem();


        if(
            !organSystem ||
            typeof organSystem.update !==
                "function"
        ){

            return false;

        }


        const previousVersion =
            state.organ.version;


        let updated =
            null;


        try{

            updated =
                organSystem.update(
                    state.organ.id,
                    {

                        version:
                            app.version,

                        title:
                            app.title,

                        description:
                            app.description ||
                            app.subtitle ||
                            "",

                        icon:
                            app.icon ||
                            state.organ.icon ||
                            "◌",

                        action:
                            app.action ||
                            state.organ.action ||
                            "",

                        capabilities:
                            this.normalizeList(
                                app.capabilities
                            ),

                        dependencies:
                            this.normalizeList(
                                app.dependencies
                            ),

                        metadata: {

                            ...(
                                state.organ.metadata ||
                                {}
                            ),

                            applicationId:
                                app.id,

                            requestedPermissions:
                                this.normalizeList(
                                    app.requestedPermissions
                                ),

                            verification: {

                                verified:
                                    true,

                                verifiedAt:
                                    Date.now(),

                                authority:
                                    verification.authority ||
                                    null,

                                hash:
                                    verification.hash ||
                                    null,

                                reference:
                                    verification.reference ||
                                    null

                            }

                        }

                    }
                );

        } catch(error){

            console.error(
                "Application update failed:",
                error
            );


            return false;

        }


        if(
            !this.operationSucceeded(
                updated
            )
        ){

            return false;

        }


        /*
         * Re-check permission completeness because an update
         * may request a different permission set.
         */
        const freshState =
            this.getAppState(
                app
            );


        const requested =
            this.normalizeList(
                app.requestedPermissions
            )
                .map(
                    item =>
                        item.toLowerCase()
                );


        const granted =
            this.normalizeList(
                freshState.organ
                    ?.permissions
            )
                .map(
                    item =>
                        item.toLowerCase()
                );


        const permissionsComplete =
            requested.every(
                permission =>
                    granted.includes(
                        permission
                    )
            );


        try{

            organSystem.setStatus?.(
                state.organ.id,
                permissionsComplete
                    ? "active"
                    : "inactive"
            );

        } catch(error){

            console.warn(
                "Application update status could not be synchronized:",
                error
            );

        }


        this.emitLifecycle(
            "updated",
            app,
            (
                typeof updated ===
                    "object"
                    ? updated
                    : state.organ
            ),
            {

                previousVersion,

                version:
                    app.version

            }
        );


        this.selectedAppId =
            app.id;


        this.enterBrainContext();


        this.remount();


        return true;

    },


    /* =====================================================
       REMOVE
    ===================================================== */

    remove(appId){

        const app =
            this.findApp(
                appId
            );


        if(!app){

            return false;

        }


        const state =
            this.getAppState(
                app
            );


        if(
            state.builtIn ||
            !state.organ
        ){

            return false;

        }


        if(
            app.removable ===
                false
        ){

            return false;

        }


        if(
            !this.guardianAllows(
                app,
                "remove"
            )
        ){

            return false;

        }


        const organSystem =
            this.getOrganSystem();


        if(
            !organSystem ||
            typeof organSystem.uninstall !==
                "function"
        ){

            return false;

        }


        let result =
            false;


        try{

            result =
                organSystem.uninstall(
                    state.organ.id
                );

        } catch(error){

            console.error(
                "Application removal failed:",
                error
            );


            return false;

        }


        if(
            !this.operationSucceeded(
                result
            )
        ){

            return false;

        }


        this.emitLifecycle(
            "removed",
            app,
            state.organ
        );


        this.selectedAppId =
            null;


        this.enterBrainContext();


        this.remount();


        return true;

    },


    removeApplication(appId){

        return this.remove(
            appId
        );

    },


    /* =====================================================
       LIFECYCLE EVENT
    ===================================================== */

    emitLifecycle(
        action,
        app,
        organ,
        extra = {}
    ){

        const normalizedAction =
            String(
                action ||
                    ""
            ).trim();


        if(!normalizedAction){

            return false;

        }


        const payload = {

            appId:
                app?.id ||
                null,

            organId:
                organ?.id ||
                null,

            action:
                normalizedAction,

            ...(
                extra &&
                typeof extra ===
                    "object" &&
                !Array.isArray(
                    extra
                )
                    ? extra
                    : {}
            ),

            time:
                Date.now()

        };


        let emitted =
            false;


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    `application:${normalizedAction}`,
                    payload
                );


                emitted =
                    true;

            }

        } catch(error){

            /* fallback below */

        }


        if(!emitted){

            try{

                const events =
                    this.getService(
                        "events"
                    );


                if(
                    events &&
                    typeof events.emit ===
                        "function"
                ){

                    events.emit(
                        `application:${normalizedAction}`,
                        payload
                    );


                    emitted =
                        true;

                }

            } catch(error){

                /* non-fatal */

            }

        }


        return emitted;

    },


    /* =====================================================
       OPEN
    ===================================================== */

    open(app){

        if(
            !app ||
            !app.action
        ){

            return false;

        }


        const state =
            this.getAppState(
                app
            );


        if(
            !state.installed
        ){

            return false;

        }


        if(
            !state.builtIn &&
            state.trusted !==
                true
        ){

            this.selectedAppId =
                app.id;


            this.remount();


            return false;

        }


        if(
            !state.builtIn &&
            state.status !==
                "active"
        ){

            this.selectedAppId =
                app.id;


            this.remount();


            return false;

        }


        if(
            typeof document ===
                "undefined"
        ){

            return false;

        }


        try{

            /*
             * Reuse Engine's existing delegated data-action
             * routing rather than duplicating route logic here.
             */
            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.dataset.action =
                app.action;


            button.hidden =
                true;


            button.setAttribute(
                "aria-hidden",
                "true"
            );


            document.body.appendChild(
                button
            );


            button.click();


            button.remove();


            this.emitLifecycle(
                "opened",
                app,
                state.organ
            );


            return true;

        } catch(error){

            console.warn(
                "Application could not be opened:",
                error
            );


            return false;

        }

    },


    openApplication(appId){

        const app =
            this.findApp(
                appId
            );


        if(!app){

            return false;

        }


        return this.open(
            app
        );

    },


    /* =====================================================
       CONTINUE IN PART 3
    ===================================================== */

   /* =====================================================
       APP CARD
    ===================================================== */

    renderAppCard(app){

        if(!app){

            return "";

        }


        const state =
            this.getAppState(
                app
            );


        try{

            if(
                typeof window !==
                    "undefined" &&
                window.UI &&
                typeof window.UI.applicationCard ===
                    "function"
            ){

                const result =
                    window.UI.applicationCard(
                        app,
                        state
                    );


                if(
                    typeof result ===
                        "string"
                ){

                    return result;

                }

            }

        } catch(error){

            /* local fallback */

        }


        const pricing =
            app.pricing ||
            {
                model:
                    "free"
            };


        let actionLabel =
            "İncele";


        let command =
            "details";


        if(
            state.updateAvailable
        ){

            actionLabel =
                "Güncelle";


            command =
                "update";

        }
        else if(
            state.installed
        ){

            if(
                !state.builtIn &&
                state.status !==
                    "active"
            ){

                actionLabel =
                    "İzinleri İncele";


                command =
                    "details";

            }
            else {

                actionLabel =
                    "Aç";


                command =
                    "open";

            }

        }
        else if(
            pricing.model ===
                "free"
        ){

            actionLabel =
                "Yükle";


            command =
                "install";

        }
        else {

            actionLabel =
                "Satın Al / Yükle";


            command =
                "install";

        }


        return `
            <article
                class="applications-card"
                data-app-id="${this.escapeHTML(
                    app.id
                )}"
            >

                <div class="applications-card-icon">

                    ${this.escapeHTML(
                        app.icon ||
                        "◌"
                    )}

                </div>

                <div class="applications-card-copy">

                    <div class="applications-card-title-row">

                        <h3>
                            ${this.escapeHTML(
                                app.title ||
                                app.id
                            )}
                        </h3>

                        ${
                            state.builtIn
                                ? `
                                    <span
                                        class="applications-trusted"
                                        title="VAERO Engine ile birlikte gelir"
                                        aria-label="VAERO built-in uygulaması"
                                    >
                                        ✓
                                    </span>
                                `
                                : (
                                    state.trusted
                                        ? `
                                            <span
                                                class="applications-trusted"
                                                title="Paket doğrulaması tamamlandı"
                                                aria-label="Doğrulanmış uygulama"
                                            >
                                                ✓
                                            </span>
                                        `
                                        : ""
                                )
                        }

                    </div>

                    <p>
                        ${this.escapeHTML(
                            app.subtitle ||
                            ""
                        )}
                    </p>

                    <div class="applications-card-meta">

                        <span>
                            ${this.escapeHTML(
                                app.developer ||
                                "VAERO"
                            )}
                        </span>

                        <span>
                            v${this.escapeHTML(
                                app.version ||
                                "1.0.0"
                            )}
                        </span>

                        ${
                            state.updateAvailable
                                ? `
                                    <span>
                                        Güncelleme
                                    </span>
                                `
                                : ""
                        }

                    </div>

                </div>

                <div class="applications-card-actions">

                    <button
                        type="button"
                        class="applications-more-btn"
                        data-applications-command="details"
                        data-app-id="${this.escapeHTML(
                            app.id
                        )}"
                    >
                        Bilgi
                    </button>

                    <button
                        type="button"
                        class="primary-btn applications-main-btn"
                        data-applications-command="${this.escapeHTML(
                            command
                        )}"
                        data-app-id="${this.escapeHTML(
                            app.id
                        )}"
                    >
                        ${this.escapeHTML(
                            actionLabel
                        )}
                    </button>

                </div>

            </article>
        `;

    },


    /* =====================================================
       PERMISSION UI
    ===================================================== */

    renderPermissions(
        app,
        state
    ){

        const requested =
            this.normalizeList(
                app?.requestedPermissions
            );


        if(
            requested.length ===
                0
        ){

            return `
                <p class="applications-muted">
                    Özel izin istemiyor.
                </p>
            `;

        }


        const granted =
            this.normalizeList(
                state?.organ?.permissions
            )
                .map(
                    item =>
                        item.toLowerCase()
                );


        try{

            if(
                typeof window !==
                    "undefined" &&
                window.UI &&
                typeof window.UI.permissionRow ===
                    "function"
            ){

                return `
                    <div class="applications-permission-list">

                        ${requested
                            .map(
                                permission => {

                                    const isGranted =
                                        granted.includes(
                                            permission.toLowerCase()
                                        );


                                    return window.UI.permissionRow(
                                        permission,
                                        {

                                            granted:
                                                isGranted,

                                            appId:
                                                app.id,

                                            editable:
                                                Boolean(
                                                    state.installed &&
                                                    !state.builtIn &&
                                                    state.trusted
                                                )

                                        }
                                    );

                                }
                            )
                            .join(
                                ""
                            )}

                    </div>
                `;

            }

        } catch(error){

            /* fallback */

        }


        return `
            <div class="applications-permission-list">

                ${requested
                    .map(
                        permission => {

                            const normalized =
                                permission.toLowerCase();


                            const isGranted =
                                granted.includes(
                                    normalized
                                );


                            const editable =
                                Boolean(
                                    state.installed &&
                                    !state.builtIn &&
                                    state.trusted
                                );


                            return `
                                <div class="applications-permission-row">

                                    <div>

                                        <strong>
                                            ${this.escapeHTML(
                                                permission
                                            )}
                                        </strong>

                                        <small>
                                            ${
                                                isGranted
                                                    ? "İzin verildi"
                                                    : "İzin verilmedi"
                                            }
                                        </small>

                                    </div>

                                    ${
                                        editable
                                            ? `
                                                <button
                                                    type="button"
                                                    class="secondary-btn"
                                                    data-applications-command="${
                                                        isGranted
                                                            ? "permission:revoke"
                                                            : "permission:grant"
                                                    }"
                                                    data-app-id="${this.escapeHTML(
                                                        app.id
                                                    )}"
                                                    data-permission="${this.escapeHTML(
                                                        permission
                                                    )}"
                                                >
                                                    ${
                                                        isGranted
                                                            ? "Kaldır"
                                                            : "İzin Ver"
                                                    }
                                                </button>
                                            `
                                            : ""
                                    }

                                </div>
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
       DETAILS
    ===================================================== */

    renderDetails(app){

        if(!app){

            return "";

        }


        const state =
            this.getAppState(
                app
            );


        const capabilities =
            this.normalizeList(
                app.capabilities
            );


        const pricing =
            app.pricing ||
            {
                model:
                    "free"
            };


        const requested =
            this.normalizeList(
                app.requestedPermissions
            );


        const granted =
            this.normalizeList(
                state.organ?.permissions
            )
                .map(
                    item =>
                        item.toLowerCase()
                );


        const permissionComplete =
            requested.length ===
                0 ||
            requested.every(
                permission =>
                    granted.includes(
                        permission.toLowerCase()
                    )
            );


        let statusLabel =
            "Yüklü değil";


        if(
            state.installed
        ){

            if(
                state.updateAvailable
            ){

                statusLabel =
                    "Güncelleme mevcut";

            }
            else if(
                state.builtIn
            ){

                statusLabel =
                    "Engine ile birlikte";

            }
            else if(
                state.status ===
                    "active"
            ){

                statusLabel =
                    "Aktif";

            }
            else {

                statusLabel =
                    "İzin incelemesi gerekiyor";

            }

        }


        return `
            <div class="applications-detail-overlay">

                <div
                    class="applications-detail-backdrop"
                    data-applications-command="close-details"
                ></div>

                <section
                    class="applications-detail"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="applicationsDetailTitle"
                >

                    <button
                        type="button"
                        class="secondary-btn applications-detail-close"
                        data-applications-command="close-details"
                        aria-label="Kapat"
                    >
                        ×
                    </button>

                    <div class="applications-detail-head">

                        <div class="applications-detail-icon">

                            ${this.escapeHTML(
                                app.icon ||
                                "◌"
                            )}

                        </div>

                        <div>

                            <div class="eyebrow">
                                ${
                                    state.builtIn
                                        ? "VAERO BUILT-IN APPLICATION"
                                        : (
                                            state.trusted
                                                ? "DOĞRULANMIŞ UYGULAMA"
                                                : "UYGULAMA"
                                        )
                                }
                            </div>

                            <h2 id="applicationsDetailTitle">
                                ${this.escapeHTML(
                                    app.title ||
                                    app.id
                                )}
                            </h2>

                            <p>
                                ${this.escapeHTML(
                                    app.description ||
                                    app.subtitle ||
                                    ""
                                )}
                            </p>

                        </div>

                    </div>

                    <div class="applications-detail-grid">

                        <div>

                            <span>
                                Geliştirici
                            </span>

                            <strong>
                                ${this.escapeHTML(
                                    app.developer ||
                                    "VAERO"
                                )}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Sürüm
                            </span>

                            <strong>
                                ${this.escapeHTML(
                                    app.version ||
                                    "1.0.0"
                                )}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Durum
                            </span>

                            <strong>
                                ${this.escapeHTML(
                                    statusLabel
                                )}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Dağıtım
                            </span>

                            <strong>
                                ${this.escapeHTML(
                                    app.distribution ||
                                    (
                                        state.builtIn
                                            ? "built-in"
                                            : "external"
                                    )
                                )}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Fiyat modeli
                            </span>

                            <strong>
                                ${this.escapeHTML(
                                    pricing.model ||
                                    "free"
                                )}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Runtime
                            </span>

                            <strong>
                                ${this.escapeHTML(
                                    state.status
                                )}
                            </strong>

                        </div>

                    </div>

                    <div class="applications-detail-section">

                        <div class="eyebrow">
                            YETENEKLER
                        </div>

                        ${
                            capabilities.length
                                ? `
                                    <div class="applications-chip-row">

                                        ${capabilities
                                            .map(
                                                item => `
                                                    <span>
                                                        ${this.escapeHTML(
                                                            item
                                                        )}
                                                    </span>
                                                `
                                            )
                                            .join(
                                                ""
                                            )}

                                    </div>
                                `
                                : `
                                    <p class="applications-muted">
                                        Özel capability tanımlanmamış.
                                    </p>
                                `
                        }

                    </div>

                    <div class="applications-detail-section">

                        <div class="eyebrow">
                            İZİNLER
                        </div>

                        ${this.renderPermissions(
                            app,
                            state
                        )}

                    </div>

                    ${
                        state.installed &&
                        requested.length &&
                        !permissionComplete
                            ? `
                                <div class="applications-security-warning">

                                    <strong>
                                        İzin incelemesi tamamlanmadı
                                    </strong>

                                    <span>
                                        Uygulama yalnızca onayladığın izinlerle çalışır ve gerekli izinler tamamlanana kadar aktif hale gelmez.
                                    </span>

                                </div>
                            `
                            : ""
                    }

                    ${
                        !state.builtIn &&
                        state.installed &&
                        !state.trusted
                            ? `
                                <div class="applications-security-warning">

                                    <strong>
                                        Güven doğrulaması tamamlanmadı
                                    </strong>

                                    <span>
                                        Manifest içindeki trusted değeri güven kanıtı değildir. Paket doğrulaması ve OrganSystem trust sonucu olmadan uygulama sistem kaynaklarına erişemez.
                                    </span>

                                </div>
                            `
                            : ""
                    }

                    <div class="applications-detail-actions">

                        ${
                            state.updateAvailable
                                ? `
                                    <button
                                        type="button"
                                        class="primary-btn"
                                        data-applications-command="update"
                                        data-app-id="${this.escapeHTML(
                                            app.id
                                        )}"
                                    >
                                        Güncelle
                                    </button>
                                `
                                : (
                                    state.installed
                                        ? `
                                            <button
                                                type="button"
                                                class="primary-btn"
                                                data-applications-command="${
                                                    !state.builtIn &&
                                                    state.status !==
                                                        "active"
                                                        ? "details"
                                                        : "open"
                                                }"
                                                data-app-id="${this.escapeHTML(
                                                    app.id
                                                )}"
                                                ${
                                                    !state.builtIn &&
                                                    state.status !==
                                                        "active"
                                                        ? "disabled"
                                                        : ""
                                                }
                                            >
                                                ${
                                                    !state.builtIn &&
                                                    state.status !==
                                                        "active"
                                                        ? "İzinleri Tamamla"
                                                        : "Aç"
                                                }
                                            </button>
                                        `
                                        : `
                                            <button
                                                type="button"
                                                class="primary-btn"
                                                data-applications-command="install"
                                                data-app-id="${this.escapeHTML(
                                                    app.id
                                                )}"
                                            >
                                                ${
                                                    this.isPaid(
                                                        app
                                                    )
                                                        ? "Satın Al / Yükle"
                                                        : "Yükle"
                                                }
                                            </button>
                                        `
                                )
                        }

                        ${
                            state.installed &&
                            !state.builtIn &&
                            app.removable !==
                                false
                                ? `
                                    <button
                                        type="button"
                                        class="secondary-btn"
                                        data-applications-command="remove"
                                        data-app-id="${this.escapeHTML(
                                            app.id
                                        )}"
                                    >
                                        Kaldır
                                    </button>
                                `
                                : ""
                        }

                    </div>

                </section>

            </div>
        `;

    },


    /* =====================================================
       NAVIGATION
    ===================================================== */

    renderViewNavigation(){

        const views = [

            [
                "discover",
                "Keşfet"
            ],

            [
                "installed",
                "Yüklü"
            ],

            [
                "updates",
                "Güncellemeler"
            ]

        ];


        return `
            <div
                class="applications-view-nav"
                role="group"
                aria-label="Uygulama görünümü"
            >

                ${views
                    .map(
                        ([
                            id,
                            label
                        ]) => `
                            <button
                                type="button"
                                class="${
                                    this.view ===
                                        id
                                        ? "is-active"
                                        : ""
                                }"
                                data-applications-command="view"
                                data-view="${id}"
                                aria-pressed="${
                                    this.view ===
                                        id
                                        ? "true"
                                        : "false"
                                }"
                            >
                                ${label}
                            </button>
                        `
                    )
                    .join(
                        ""
                    )}

            </div>
        `;

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

            /* optional */

        }


        return "";

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(){

        this.view =
            this.normalizeView(
                this.view
            );


        this.enterBrainContext();


        const apps =
            this.getApps();


        const catalogApps =
            this.getCatalogApps();


        const categories =
            this.getCategories();


        const installedCount =
            catalogApps.filter(
                app =>
                    this.getAppState(
                        app
                    ).installed
            ).length;


        const updatesCount =
            catalogApps.filter(
                app =>
                    this.getAppState(
                        app
                    ).updateAvailable
            ).length;


        let selectedApp =
            this.selectedAppId
                ? this.findApp(
                    this.selectedAppId
                )
                : null;


        if(
            this.selectedAppId &&
            !selectedApp
        ){

            this.selectedAppId =
                null;


            selectedApp =
                null;

        }


        return `
            <section class="engine-page applications-app">

                <div class="applications-shell">

                    <div class="engine-page-toolbar">

                        <button
                            type="button"
                            class="engine-back-btn"
                            data-action="home:open"
                        >
                            ← Engine
                        </button>

                    </div>

                    <header class="applications-header">

                        <div>

                            <div class="eyebrow">
                                VAERO APPLICATIONS
                            </div>

                            <h1>
                                Uygulamalar
                            </h1>

                            <p>
                                Engine'ini yeni yeteneklerle genişlet. Uygulamaları keşfet, izinlerini incele ve kurulu uygulamalarını yönet.
                            </p>

                        </div>

                        <div class="applications-header-stats">

                            <div>

                                <strong>
                                    ${catalogApps.length}
                                </strong>

                                <span>
                                    Katalog
                                </span>

                            </div>

                            <div>

                                <strong>
                                    ${installedCount}
                                </strong>

                                <span>
                                    Yüklü
                                </span>

                            </div>

                            <div>

                                <strong>
                                    ${updatesCount}
                                </strong>

                                <span>
                                    Güncelleme
                                </span>

                            </div>

                        </div>

                    </header>

                    ${this.renderViewNavigation()}

                    <div class="applications-toolbar">

                        <label class="applications-search">

                            <span aria-hidden="true">
                                ⌕
                            </span>

                            <input
                                type="search"
                                id="applicationsSearch"
                                placeholder="Uygulama, yetenek veya geliştirici ara"
                                value="${this.escapeHTML(
                                    this.searchQuery
                                )}"
                                autocomplete="off"
                                enterkeyhint="search"
                                aria-label="Uygulamalarda ara"
                            >

                        </label>

                        <div
                            class="applications-categories"
                            role="group"
                            aria-label="Uygulama kategorileri"
                        >

                            <button
                                type="button"
                                class="${
                                    this.category ===
                                        "all"
                                        ? "is-active"
                                        : ""
                                }"
                                data-applications-command="category"
                                data-category="all"
                                aria-pressed="${
                                    this.category ===
                                        "all"
                                        ? "true"
                                        : "false"
                                }"
                            >
                                Tümü
                            </button>

                            ${categories
                                .map(
                                    category => {

                                        const id =
                                            typeof category ===
                                                "string"
                                                ? category
                                                : category?.id;


                                        if(!id){

                                            return "";

                                        }


                                        return `
                                            <button
                                                type="button"
                                                class="${
                                                    this.category ===
                                                        id
                                                        ? "is-active"
                                                        : ""
                                                }"
                                                data-applications-command="category"
                                                data-category="${this.escapeHTML(
                                                    id
                                                )}"
                                                aria-pressed="${
                                                    this.category ===
                                                        id
                                                        ? "true"
                                                        : "false"
                                                }"
                                            >
                                                ${this.escapeHTML(
                                                    this.getCategoryLabel(
                                                        id
                                                    )
                                                )}
                                            </button>
                                        `;

                                    }
                                )
                                .join(
                                    ""
                                )}

                        </div>

                    </div>

                    <div class="applications-scroll">

                        ${
                            apps.length
                                ? `
                                    <div class="applications-grid">

                                        ${apps
                                            .map(
                                                app =>
                                                    this.renderAppCard(
                                                        app
                                                    )
                                            )
                                            .join(
                                                ""
                                            )}

                                    </div>
                                `
                                : `
                                    <div class="applications-empty">

                                        <div>
                                            ◌
                                        </div>

                                        <strong>
                                            ${
                                                this.view ===
                                                    "updates"
                                                    ? "Bekleyen güncelleme yok"
                                                    : (
                                                        this.view ===
                                                            "installed"
                                                            ? "Yüklü uygulama bulunamadı"
                                                            : "Uygulama bulunamadı"
                                                    )
                                            }
                                        </strong>

                                        <span>
                                            ${
                                                this.searchQuery ||
                                                this.category !==
                                                    "all"
                                                    ? "Arama veya kategori filtresini değiştir."
                                                    : (
                                                        this.view ===
                                                            "updates"
                                                            ? "Kurulu uygulamalar güncel."
                                                            : "Application Registry şu anda eşleşen bir uygulama döndürmedi."
                                                    )
                                            }
                                        </span>

                                    </div>
                                `
                        }

                    </div>

                    ${this.renderBrainPanel()}

                </div>

                ${
                    selectedApp
                        ? this.renderDetails(
                            selectedApp
                        )
                        : ""
                }

            </section>
        `;

    },


    /* =====================================================
       COMMANDS
    ===================================================== */

    handleCommand(
        command,
        element
    ){

        const normalizedCommand =
            String(
                command ||
                    ""
            )
                .trim()
                .toLowerCase();


        const appId =
            element?.dataset
                ?.appId ||
            null;


        switch(
            normalizedCommand
        ){

            case "details":

                if(!appId){

                    return false;

                }


                this.selectedAppId =
                    appId;


                this.enterBrainContext();


                return this.remount();


            case "close-details":

                this.selectedAppId =
                    null;


                this.enterBrainContext();


                return this.remount();


            case "category":

                this.setCategory(
                    element?.dataset
                        ?.category ||
                    "all"
                );


                this.enterBrainContext();


                return this.remount();


            case "view":

                this.setView(
                    element?.dataset
                        ?.view ||
                    "discover"
                );


                this.enterBrainContext();


                return this.remount();


            case "install": {

                const installed =
                    this.install(
                        appId
                    );


                if(!installed){

                    this.selectedAppId =
                        appId;


                    this.enterBrainContext();


                    return this.remount();

                }


                return true;

            }


            case "open":

                return this.openApplication(
                    appId
                );


            case "update":

                return this.updateApplication(
                    appId
                );


            case "remove":

                return this.remove(
                    appId
                );


            case "permission:grant":
            case "permission-grant":

                return this.grantRequestedPermission(
                    appId,
                    element?.dataset
                        ?.permission
                );


            case "permission:revoke":
            case "permission-revoke":

                return this.revokePermission(
                    appId,
                    element?.dataset
                        ?.permission
                );


            default:

                return false;

        }

    },


    /* =====================================================
       SEARCH
    ===================================================== */

    handleSearchInput(value){

        this.setSearchQuery(
            value
        );


        if(
            this.searchTimer !==
                null
        ){

            clearTimeout(
                this.searchTimer
            );

        }


        this.searchTimer =
            setTimeout(
                () => {

                    this.searchTimer =
                        null;


                    this.enterBrainContext();


                    this.remount();

                },
                120
            );


        return true;

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const catalog =
            this.getCatalogApps();


        return {

            version:
                this.version,

            view:
                this.view,

            category:
                this.category,

            searchQuery:
                this.searchQuery,

            selectedAppId:
                this.selectedAppId,

            catalogCount:
                catalog.length,

            installedCount:
                catalog.filter(
                    app =>
                        this.getAppState(
                            app
                        ).installed
                ).length,

            updateCount:
                catalog.filter(
                    app =>
                        this.getAppState(
                            app
                        ).updateAvailable
                ).length,

            externalAppsAllowed:
                this.getApplicationPolicy()
                    .allowExternalApps ===
                true

        };

    }

};


/* =========================================================
   EVENT DELEGATION
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
                    "[data-applications-command]"
                );


            if(!commandTarget){

                return;

            }


            event.preventDefault();


            ApplicationsApp.handleCommand(
                commandTarget.dataset
                    .applicationsCommand,
                commandTarget
            );

        }
    );


    /* =====================================================
       SEARCH
    ===================================================== */

    document.addEventListener(
        "input",
        event => {

            if(
                event.target?.id !==
                    "applicationsSearch"
            ){

                return;

            }


            ApplicationsApp.handleSearchInput(
                event.target.value
            );

        }
    );

}


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
            "applicationsApp",
            ApplicationsApp
        );

    }

} catch(error){

    console.warn(
        "ApplicationsApp VAERO registration failed:",
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

    window.ApplicationsApp =
        ApplicationsApp;

}
