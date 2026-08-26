/* =========================================================
   VAERO APPLICATIONS
   Engine Application Discovery / Management Center
========================================================= */

const ApplicationsApp = {

    searchQuery: "",
    category: "all",
    selectedAppId: null,


    /* =====================================================
       SAFE SERVICE ACCESS
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
            ){
                return null;
            }

            return VAERO.get(name) || null;

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

            return null;

        }

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

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    },


    /* =====================================================
       REGISTRY
    ===================================================== */

    getRegistry(){

        return (
            this.getService(
                "organRegistry"
            ) ||
            window.OrganRegistry ||
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


    getApps(){

        const registry =
            this.getRegistry();


        if(
            !registry ||
            typeof registry.all !==
                "function"
        ){
            return [];
        }


        let apps = [];


        try{

            apps =
                registry.all({
                    includeDisabled:true
                });

        } catch(error){

            return [];

        }


        if(
            !Array.isArray(apps)
        ){
            return [];
        }


        return apps.filter(
            app => {

                if(
                    app.enabled ===
                    false
                ){
                    return false;
                }


                if(
                    this.category !==
                        "all" &&
                    app.category !==
                        this.category
                ){
                    return false;
                }


                const query =
                    this.searchQuery
                        .trim()
                        .toLocaleLowerCase(
                            "tr-TR"
                        );


                if(!query){
                    return true;
                }


                const searchable = [
                    app.id,
                    app.title,
                    app.subtitle,
                    app.description,
                    app.developer,
                    app.category,
                    ...(app.tags || [])
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

    },


    getAppState(app){

        const organSystem =
            this.getOrganSystem();


        let organ =
            null;


        if(
            organSystem &&
            typeof organSystem.findBySlug ===
                "function"
        ){

            try{

                organ =
                    organSystem.findBySlug(
                        app.id
                    );

            } catch(error){

                organ = null;

            }

        }


        const builtIn =
            app.distribution ===
                "built-in" ||
            app.system === true;


        return {

            installed:
                builtIn ||
                organ?.installed ===
                    true,

            status:
                organ?.status ||
                (
                    builtIn
                        ? "active"
                        : "not-installed"
                ),

            trusted:
                app.trusted ===
                    true,

            organ

        };

    },


    /* =====================================================
       CATEGORY
    ===================================================== */

    getCategories(){

        const registry =
            this.getRegistry();


        if(
            !registry ||
            typeof registry.categories !==
                "function"
        ){

            return [];

        }


        try{

            const categories =
                registry.categories();


            return Array.isArray(
                categories
            )
                ? categories
                : [];

        } catch(error){

            return [];

        }

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

            other:
                "Diğer"

        };


        return (
            labels[id] ||
            id
        );

    },


    /* =====================================================
       CATALOG CARD
    ===================================================== */

    renderAppCard(app){

        const state =
            this.getAppState(
                app
            );


        const trusted =
            app.trusted ===
            true;


        const pricing =
            app.pricing || {
                model:"free"
            };


        let actionLabel =
            "İncele";


        if(state.installed){

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
                data-app-id="${this.escapeHTML(app.id)}"
            >

                <div class="applications-card-icon">
                    ${this.escapeHTML(
                        app.icon || "◌"
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
                            trusted
                                ? `
                                    <span class="applications-trusted">
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

                    </div>

                </div>

                <div class="applications-card-actions">

                    <button
                        type="button"
                        class="applications-more-btn"
                        data-applications-command="details"
                        data-app-id="${this.escapeHTML(app.id)}"
                    >
                        Bilgi
                    </button>

                    ${
                        state.installed
                            ? `
                                <button
                                    type="button"
                                    class="primary-btn applications-main-btn"
                                    data-action="${this.escapeHTML(
                                        app.action
                                    )}"
                                >
                                    ${actionLabel}
                                </button>
                              `
                            : `
                                <button
                                    type="button"
                                    class="primary-btn applications-main-btn"
                                    data-applications-command="install"
                                    data-app-id="${this.escapeHTML(app.id)}"
                                >
                                    ${actionLabel}
                                </button>
                              `
                    }

                </div>

            </article>
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


        const permissions =
            Array.isArray(
                app.requestedPermissions
            )
                ? app.requestedPermissions
                : [];


        const capabilities =
            Array.isArray(
                app.capabilities
            )
                ? app.capabilities
                : [];


        return `
            <div class="applications-detail-overlay">

                <section class="applications-detail">

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
                                    app.trusted
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
                            <span>Geliştirici</span>
                            <strong>
                                ${this.escapeHTML(
                                    app.developer ||
                                    "VAERO"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Sürüm</span>
                            <strong>
                                ${this.escapeHTML(
                                    app.version ||
                                    "1.0.0"
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Durum</span>
                            <strong>
                                ${
                                    state.installed
                                        ? "Yüklü"
                                        : "Yüklü değil"
                                }
                            </strong>
                        </div>

                        <div>
                            <span>Dağıtım</span>
                            <strong>
                                ${this.escapeHTML(
                                    app.distribution ||
                                    "built-in"
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
                                                        ${this.escapeHTML(item)}
                                                    </span>
                                                `
                                            )
                                            .join("")}

                                    </div>
                                  `
                                : `
                                    <p class="applications-muted">
                                        Özel yetenek tanımlanmamış.
                                    </p>
                                  `
                        }

                    </div>

                    <div class="applications-detail-section">

                        <div class="eyebrow">
                            İSTENEN İZİNLER
                        </div>

                        ${
                            permissions.length
                                ? `
                                    <div class="applications-chip-row">

                                        ${permissions
                                            .map(
                                                item => `
                                                    <span>
                                                        ${this.escapeHTML(item)}
                                                    </span>
                                                `
                                            )
                                            .join("")}

                                    </div>
                                  `
                                : `
                                    <p class="applications-muted">
                                        Özel izin istemiyor.
                                    </p>
                                  `
                        }

                    </div>

                    ${
                        !app.trusted
                            ? `
                                <div class="applications-security-warning">

                                    <strong>
                                        Güven doğrulaması gerekli
                                    </strong>

                                    <span>
                                        Bu uygulama doğrulanmadan VAERO sistem kaynaklarına erişemez.
                                    </span>

                                </div>
                              `
                            : ""
                    }

                </section>

            </div>
        `;

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(){

        const apps =
            this.getApps();


        const categories =
            this.getCategories();


        const registry =
            this.getRegistry();


        const catalog =
            registry &&
            typeof registry.catalog ===
                "function"
                ? registry.catalog()
                : null;


        const selectedApp =
            this.selectedAppId &&
            registry &&
            typeof registry.find ===
                "function"
                ? registry.find(
                    this.selectedAppId
                )
                : null;


        return `
            <section class="applications-app">

                <header class="applications-header">

                    <div>

                        <div class="eyebrow">
                            VAERO APPLICATIONS
                        </div>

                        <h1>
                            Uygulamalar
                        </h1>

                        <p>
                            Engine'ini yeni yeteneklerle genişlet.
                        </p>

                    </div>

                    <div class="applications-header-stat">

                        <strong>
                            ${catalog?.total || apps.length}
                        </strong>

                        <span>
                            uygulama
                        </span>

                    </div>

                </header>

                <div class="applications-toolbar">

                    <label class="applications-search">

                        <span>
                            ⌕
                        </span>

                        <input
                            type="search"
                            id="applicationsSearch"
                            placeholder="Uygulama ara"
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
                                category => `
                                    <button
                                        type="button"
                                        class="${
                                            this.category ===
                                                category.id
                                                ? "is-active"
                                                : ""
                                        }"
                                        data-applications-command="category"
                                        data-category="${this.escapeHTML(
                                            category.id
                                        )}"
                                    >
                                        ${this.escapeHTML(
                                            this.getCategoryLabel(
                                                category.id
                                            )
                                        )}
                                    </button>
                                `
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
                                        Uygulama bulunamadı
                                    </strong>

                                    <span>
                                        Arama veya kategori filtresini değiştir.
                                    </span>

                                </div>
                              `
                    }

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


        engine.mount(
            engine.currentEntity
        );


        return true;

    },


    /* =====================================================
       INSTALL SECURITY GATE
    ===================================================== */

    install(appId){

        const registry =
            this.getRegistry();


        const organSystem =
            this.getOrganSystem();


        const app =
            registry &&
            typeof registry.find ===
                "function"
                ? registry.find(
                    appId
                )
                : null;


        if(
            !app ||
            !organSystem
        ){
            return false;
        }


        /*
         * Built-in uygulamalar zaten Engine'in
         * parçasıdır.
         */

        if(
            app.system ||
            app.distribution ===
                "built-in"
        ){
            return false;
        }


        /*
         * Güven doğrulaması olmadan third-party
         * uygulama kurulmaz.
         */

        if(
            app.trusted !== true
        ){

            console.warn(
                "Applications install blocked: app is not trusted.",
                app.id
            );

            return false;
        }


        /*
         * Ücretli uygulamalar gerçek provider/backend
         * ödeme doğrulaması olmadan kurulmaz.
         */

        if(
            app.pricing?.model &&
            app.pricing.model !==
                "free"
        ){

            console.warn(
                "Applications install waiting for verified payment.",
                app.id
            );

            return false;
        }


        /*
         * Gerçek remote package download henüz yok.
         * Registry'de mevcut ve doğrulanmış uygulama
         * OrganSystem'e kurulabilir.
         */

        const existing =
            typeof organSystem.findBySlug ===
                "function"
                ? organSystem.findBySlug(
                    app.id
                )
                : null;


        if(existing){

            return organSystem.install(
                existing.id
            );

        }


        const organ =
            organSystem.create(
                app.title,
                "active",
                {
                    id:
                        app.id,

                    slug:
                        app.id,

                    version:
                        app.version,

                    type:
                        "application",

                    source:
                        app.distribution,

                    developer:
                        app.developer,

                    trusted:
                        app.trusted,

                    signature:
                        app.signature,

                    permissions:
                        [],

                    capabilities:
                        app.capabilities,

                    installed:
                        true,

                    removable:
                        app.removable
                }
            );


        return Boolean(
            organ
        );

    },


    /* =====================================================
       COMMANDS
    ===================================================== */

    handleCommand(
        command,
        element
    ){

        switch(command){

            case "details":

                this.selectedAppId =
                    element.dataset
                        .appId ||
                    null;

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


            case "install": {

                const installed =
                    this.install(
                        element.dataset
                            .appId
                    );


                if(installed){

                    return this.remount();

                }


                return false;

            }


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


        const command =
            target.dataset
                .applicationsCommand;


        ApplicationsApp.handleCommand(
            command,
            target
        );

    }
);


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
            event.target.value;


        clearTimeout(
            ApplicationsApp
                .searchTimer
        );


        ApplicationsApp.searchTimer =
            setTimeout(
                () => {

                    ApplicationsApp.remount();

                },
                120
            );

    }
);


window.ApplicationsApp =
    ApplicationsApp;
