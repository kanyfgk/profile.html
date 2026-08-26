/* =========================================================
   VAERO APPLICATIONS
   Application Discovery / Installation / Permissions / Updates
========================================================= */

const ApplicationsApp = {

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

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !==
                    "function"
            ){
                return null;
            }


            return (
                VAERO.get(name) ||
                null
            );

        } catch(error){

            console.warn(
                `Applications service lookup failed: ${name}`,
                error
            );


            return null;

        }

    },


    getEngine(){

        try{

            return (
                VAERO?.engine ||
                window.Engine ||
                null
            );

        } catch(error){

            return (
                window.Engine ||
                null
            );

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


    escapeHTML(value){

        if(
            window.UI &&
            typeof UI.escapeHTML ===
                "function"
        ){

            return UI.escapeHTML(
                value
            );

        }


        return String(
            value ?? ""
        )
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

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


            awareness?.enter?.(
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
                        this.selectedAppId
                }
            );

        } catch(error){

            console.warn(
                "Applications Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       APPLICATION REGISTRY
    ===================================================== */

    getRegistry(){

        return (
            this.getService(
                "appRegistry"
            ) ||
            this.getService(
                "applicationRegistry"
            ) ||
            (
                typeof AppRegistry !==
                    "undefined"
                    ? AppRegistry
                    : null
            ) ||
            (
                typeof OrganRegistry !==
                    "undefined"
                    ? OrganRegistry
                    : null
            ) ||
            null
        );

    },


    getOrganSystem(){

        return (
            this.getService(
                "organSystem"
            ) ||
            window.OrganSystem ||
            null
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


        return [
            ...new Set(
                value
                    .map(
                        item =>
                            String(
                                item ?? ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ];

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


        return (
            model !== "free"
        );

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
                    includeDisabled:true
                });


            return Array.isArray(
                apps
            )
                ? apps.filter(Boolean)
                : [];

        } catch(error){

            try{

                const apps =
                    registry.all();


                return Array.isArray(
                    apps
                )
                    ? apps.filter(Boolean)
                    : [];

            } catch(secondError){

                return [];

            }

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


        try{

            if(
                registry &&
                typeof registry.find ===
                    "function"
            ){

                const app =
                    registry.find(
                        id
                    );


                if(app){
                    return app;
                }

            }

        } catch(error){

            /* catalog fallback */
        }


        return (
            this.getCatalogApps()
                .find(
                    app =>
                        app?.id ===
                        id
                ) ||
            null
        );

    },


    /* =====================================================
       ORGAN LOOKUP
    ===================================================== */

    getInstalledOrgan(app){

        if(!app){
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

            /* slug fallback */
        }


        try{

            if(
                typeof organSystem.findBySlug ===
                    "function"
            ){

                return (
                    organSystem.findBySlug(
                        app.id
                    ) ||
                    null
                );

            }

        } catch(error){

            return null;

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
                    .split(".")
                    .map(
                        part =>
                            Number(
                                String(
                                    part
                                ).replace(
                                    /[^0-9]/g,
                                    ""
                                )
                            ) ||
                            0
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
                installed[index] ||
                0;


            const currentCatalog =
                catalog[index] ||
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


    getAppState(app){

        const builtIn =
            this.isBuiltIn(
                app
            );


        const organ =
            this.getInstalledOrgan(
                app
            );


        const installed =
            builtIn ||
            organ?.installed ===
                true;


        const updateAvailable =
            Boolean(
                installed &&
                organ &&
                app.version &&
                organ.version &&
                this.compareVersions(
                    organ.version,
                    app.version
                ) === 1
            );


        return {

            builtIn,

            installed,

            updateAvailable,

            status:
                organ?.status ||
                (
                    builtIn
                        ? "active"
                        : "not-installed"
                ),

            trusted:
                builtIn
                    ? true
                    : organ?.trusted ===
                        true,

            organ

        };

    },


    /* =====================================================
       VISIBLE CATALOG
    ===================================================== */

    getApps(){

        let apps =
            this.getCatalogApps()
                .filter(
                    app =>
                        app.enabled !==
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
                        app.category ===
                        this.category
                );

        }


        const query =
            this.searchQuery
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        if(query){

            apps =
                apps.filter(
                    app => {

                        const searchable = [

                            app.id,
                            app.title,
                            app.subtitle,
                            app.description,
                            app.developer,
                            app.category,
                            ...(app.tags || []),
                            ...(app.capabilities || []),
                            ...(app.requestedPermissions || [])

                        ]
                            .join(" ")
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


        const ids =
            [
                ...new Set(
                    this.getCatalogApps()
                        .map(
                            app =>
                                String(
                                    app?.category ||
                                    "other"
                                )
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
            labels[id] ||
            id
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


        if(!entity?.id){
            return defaults;
        }


        try{

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


            return {
                ...defaults,
                ...(
                    parsed
                        ?.applications ||
                    {}
                )
            };

        } catch(error){

            return defaults;

        }

    },


    /* =====================================================
       VERIFIER
    ===================================================== */

    verifyPackage(app){

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
                app?.id
            );


            return null;

        }


        try{

            const result =
                verifier.verify(
                    app
                );


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                console.warn(
                    "Applications install blocked: async verification is not wired yet.",
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
                result.appId !==
                    app.id
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
            typeof paymentCore.hasVerifiedEntitlement !==
                "function"
        ){

            console.warn(
                "Applications install blocked: verified entitlement unavailable.",
                app.id
            );


            return false;

        }


        try{

            return (
                paymentCore
                    .hasVerifiedEntitlement(
                        app.id
                    ) === true
            );

        } catch(error){

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

        const guardian =
            this.getService(
                "guardian"
            );


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
                        operation,

                        appId:
                            app.id,

                        distribution:
                            app.distribution
                    }
                );


            return !(
                validation ===
                    false ||
                validation?.valid ===
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
                "Applications install blocked: external applications disabled in Settings."
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


        if(existing){

            if(
                existing.installed ===
                    true
            ){

                return true;

            }


            if(
                typeof organSystem.install !==
                    "function"
            ){
                return false;
            }


            return (
                organSystem.install(
                    existing.id
                ) === true
            );

        }


        const organ =
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

                    metadata:{
                        applicationId:
                            app.id,

                        requestedPermissions:
                            this.normalizeList(
                                app.requestedPermissions
                            ),

                        verification:{
                            verified:true,

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


        if(!organ){
            return false;
        }


        if(
            typeof organSystem.setTrusted !==
                "function"
        ){

            organSystem.remove?.(
                organ.id,
                {
                    force:true
                }
            );


            return false;

        }


        const trustResult =
            organSystem.setTrusted(
                organ.id,
                true,
                {
                    verified:true,

                    verification
                }
            );


        if(
            trustResult !==
                true
        ){

            organSystem.remove?.(
                organ.id,
                {
                    force:true
                }
            );


            return false;

        }


        const requestedPermissions =
            this.normalizeList(
                app.requestedPermissions
            );


        if(
            requestedPermissions.length ===
                0
        ){

            organSystem.setStatus?.(
                organ.id,
                "active"
            );

        } else {

            organSystem.setStatus?.(
                organ.id,
                "inactive"
            );

        }


        this.emitLifecycle(
            "installed",
            app,
            organ
        );


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
            !state.trusted
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


        if(
            !requested
                .map(
                    item =>
                        item.toLowerCase()
                )
                .includes(
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


        const result =
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


        if(result !== true){
            return false;
        }


        return this.remount();

    },


    revokePermission(
        appId,
        permission
    ){

        const app =
            this.findApp(
                appId
            );


        const organ =
            app
                ? this.getInstalledOrgan(
                    app
                )
                : null;


        const organSystem =
            this.getOrganSystem();


        if(
            !organ ||
            !organSystem ||
            typeof organSystem.revokePermission !==
                "function"
        ){
            return false;
        }


        const result =
            organSystem.revokePermission(
                organ.id,
                permission
            );


        if(result !== true){
            return false;
        }


        return this.remount();

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


        if(
            this.isBuiltIn(
                app
            )
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


        const updated =
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
                        app.icon,

                    action:
                        app.action,

                    capabilities:
                        this.normalizeList(
                            app.capabilities
                        ),

                    dependencies:
                        this.normalizeList(
                            app.dependencies
                        ),

                    metadata:{
                        ...(
                            state.organ.metadata ||
                            {}
                        ),

                        requestedPermissions:
                            this.normalizeList(
                                app.requestedPermissions
                            ),

                        verification:{
                            verified:true,

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


        if(!updated){
            return false;
        }


        this.emitLifecycle(
            "updated",
            app,
            updated,
            {
                previousVersion,
                version:
                    app.version
            }
        );


        return this.remount();

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


        const organSystem =
            this.getOrganSystem();


        if(
            !organSystem ||
            typeof organSystem.uninstall !==
                "function"
        ){
            return false;
        }


        const result =
            organSystem.uninstall(
                state.organ.id
            );


        if(result !== true){
            return false;
        }


        this.emitLifecycle(
            "removed",
            app,
            state.organ
        );


        this.selectedAppId =
            null;


        return this.remount();

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

        const payload = {

            appId:
                app?.id ||
                null,

            organId:
                organ?.id ||
                null,

            action,

            ...extra,

            time:
                Date.now()

        };


        try{

            VAERO?.emit?.(
                `application:${action}`,
                payload
            );

        } catch(error){

            /* non-fatal */
        }


        try{

            this.getService(
                "events"
            )?.emit?.(
                `application:${action}`,
                payload
            );

        } catch(error){

            /* non-fatal */
        }

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


        if(!state.installed){
            return false;
        }


        if(
            !state.builtIn &&
            state.trusted !==
                true
        ){

            return false;

        }


        try{

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.dataset.action =
                app.action;

            button.style.display =
                "none";


            document.body.appendChild(
                button
            );


            button.click();

            button.remove();


            return true;

        } catch(error){

            console.warn(
                "Application açılamadı:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       APP CARD
    ===================================================== */

    renderAppCard(app){

        const state =
            this.getAppState(
                app
            );


        const pricing =
            app.pricing || {
                model:"free"
            };


        let actionLabel =
            "İncele";


        if(
            state.updateAvailable
        ){

            actionLabel =
                "Güncelle";

        } else if(
            state.installed
        ){

            actionLabel =
                "Aç";

        } else if(
            pricing.model ===
                "free"
        ){

            actionLabel =
                "Yükle";

        } else {

            actionLabel =
                "Al";

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
                                app.title
                            )}
                        </h3>


                        ${
                            state.trusted ||
                            state.builtIn
                                ? `
                                    <span
                                        class="applications-trusted"
                                        title="Güvenilir kaynak"
                                    >
                                        ✓
                                    </span>
                                  `
                                : ""
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
                        data-applications-command="${
                            state.updateAvailable
                                ? "update"
                                : state.installed
                                    ? "open"
                                    : "install"
                        }"
                        data-app-id="${this.escapeHTML(
                            app.id
                        )}"
                    >
                        ${actionLabel}
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
                app.requestedPermissions
            );


        if(!requested.length){

            return `
                <p class="applications-muted">
                    Özel izin istemiyor.
                </p>
            `;

        }


        const granted =
            this.normalizeList(
                state.organ
                    ?.permissions
            )
                .map(
                    item =>
                        item.toLowerCase()
                );


        return `
            <div class="applications-permission-list">

                ${requested
                    .map(
                        permission => {

                            const normalized =
                                permission
                                    .toLowerCase();


                            const isGranted =
                                granted.includes(
                                    normalized
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
                                        state.installed &&
                                        !state.builtIn &&
                                        state.trusted
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
                    .join("")}

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
            app.pricing || {
                model:"free"
            };


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
                >

                    <button
                        type="button"
                        class="secondary-btn applications-detail-close"
                        data-applications-command="close-details"
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
                                        ? "VAERO SYSTEM APPLICATION"
                                        : state.trusted
                                            ? "DOĞRULANMIŞ UYGULAMA"
                                            : "UYGULAMA"
                                }

                            </div>


                            <h2>
                                ${this.escapeHTML(
                                    app.title
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
                                ${
                                    state.installed
                                        ? state.updateAvailable
                                            ? "Güncelleme mevcut"
                                            : "Yüklü"
                                        : "Yüklü değil"
                                }
                            </strong>

                        </div>


                        <div>

                            <span>
                                Dağıtım
                            </span>

                            <strong>
                                ${this.escapeHTML(
                                    app.distribution ||
                                    "built-in"
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
                                            .join("")}

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
                        !state.builtIn &&
                        !state.trusted
                            ? `
                                <div class="applications-security-warning">

                                    <strong>
                                        Güven doğrulaması gerekli
                                    </strong>

                                    <span>
                                        Manifest içindeki trusted değeri tek başına güven kanıtı değildir. Paket doğrulaması ve VAERO trust sonucu olmadan sistem kaynaklarına erişemez.
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
                                : state.installed
                                    ? `
                                        <button
                                            type="button"
                                            class="primary-btn"
                                            data-applications-command="open"
                                            data-app-id="${this.escapeHTML(
                                                app.id
                                            )}"
                                        >
                                            Aç
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

            ["discover","Keşfet"],

            ["installed","Yüklü"],

            ["updates","Güncellemeler"]

        ];


        return `
            <div class="applications-view-nav">

                ${views
                    .map(
                        ([id,label]) => `
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
                            >
                                ${label}
                            </button>
                        `
                    )
                    .join("")}

            </div>
        `;

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(){

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


        const selectedApp =
            this.selectedAppId
                ? this.findApp(
                    this.selectedAppId
                )
                : null;


        return `
            <section class="engine-page applications-app">

                <div class="applications-shell">

                    <div class="engine-page-toolbar">

                        <button
                            type="button"
                            class="engine-back-btn"
                            data-action="home"
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

                            <span>
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
                            >

                        </label>


                        <div class="applications-categories">

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
                                                : category.id;


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
                                .join("")}

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
                                            .join("")}

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
                                                    : this.view ===
                                                        "installed"
                                                        ? "Yüklü uygulama bulunamadı"
                                                        : "Uygulama bulunamadı"
                                            }
                                        </strong>

                                        <span>
                                            ${
                                                this.searchQuery ||
                                                this.category !==
                                                    "all"
                                                    ? "Arama veya kategori filtresini değiştir."
                                                    : this.view ===
                                                        "updates"
                                                        ? "Kurulu uygulamalar güncel."
                                                        : "Application Registry şu anda eşleşen bir uygulama döndürmedi."
                                            }
                                        </span>

                                    </div>
                                  `
                        }

                    </div>


                    ${UI.brainPanel()}

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
       REMOUNT
    ===================================================== */

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


        return engine.mount(
            engine.currentEntity
        );

    },


    /* =====================================================
       COMMANDS
    ===================================================== */

    handleCommand(
        command,
        element
    ){

        const appId =
            element?.dataset
                ?.appId ||
            null;


        switch(command){

            case "details":

                this.selectedAppId =
                    appId;


                return this.remount();


            case "close-details":

                this.selectedAppId =
                    null;


                return this.remount();


            case "category":

                this.category =
                    element.dataset
                        .category ||
                    "all";


                this.selectedAppId =
                    null;


                return this.remount();


            case "view":

                this.view =
                    [
                        "discover",
                        "installed",
                        "updates"
                    ].includes(
                        element.dataset
                            .view
                    )
                        ? element.dataset
                            .view
                        : "discover";


                this.selectedAppId =
                    null;


                return this.remount();


            case "install":{

                const installed =
                    this.install(
                        appId
                    );


                if(installed){

                    this.selectedAppId =
                        appId;


                    return this.remount();

                }


                return false;

            }


            case "open":

                return this.open(
                    this.findApp(
                        appId
                    )
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

                return this.grantRequestedPermission(
                    appId,
                    element.dataset
                        .permission
                );


            case "permission:revoke":

                return this.revokePermission(
                    appId,
                    element.dataset
                        .permission
                );


            default:

                return false;

        }

    }

};


/* =========================================================
   EVENT DELEGATION
========================================================= */

document.addEventListener(
    "click",
    event => {

        const target =
            event.target.closest(
                "[data-applications-command]"
            );


        if(!target){
            return;
        }


        event.preventDefault();


        ApplicationsApp.handleCommand(
            target.dataset
                .applicationsCommand,
            target
        );

    }
);


/* =========================================================
   SEARCH
========================================================= */

document.addEventListener(
    "input",
    event => {

        if(
            event.target.id !==
                "applicationsSearch"
        ){
            return;
        }


        ApplicationsApp.searchQuery =
            String(
                event.target.value ||
                ""
            );


        clearTimeout(
            ApplicationsApp.searchTimer
        );


        ApplicationsApp.searchTimer =
            setTimeout(
                () => {

                    ApplicationsApp.selectedAppId =
                        null;


                    ApplicationsApp.remount();

                },
                120
            );

    }
);


window.ApplicationsApp =
    ApplicationsApp;
