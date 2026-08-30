/* =========================================================
   VAERO UI KIT
   Shared Engine UI Components
========================================================= */

const UI = {

    /* =====================================================
       SECURITY / ESCAPING
    ===================================================== */

    escapeHTML(value){

        return String(
            value ?? ""
        )
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    },


    escapeAttribute(value){

        return this.escapeHTML(
            String(
                value ?? ""
            )
        );

    },


    safeAction(action){

        const value =
            String(
                action ?? ""
            )
                .trim()
                .toLowerCase();


        return /^[a-z0-9:_\-.]+$/.test(
            value
        )
            ? value
            : "";

    },


    safeId(value){

        const id =
            String(
                value ?? ""
            )
                .trim();


        return /^[a-zA-Z0-9:_\-.]+$/.test(
            id
        )
            ? id
            : "";

    },


    safeClass(value){

        return String(
            value ?? ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /[^a-z0-9_-]/g,
                ""
            );

    },


    /* =====================================================
       THEME ACCESS
    ===================================================== */

    getTheme(){

        try{

            if(
                typeof Theme !==
                    "undefined" &&
                Theme
            ){

                return Theme;

            }


            if(
                typeof window !==
                    "undefined" &&
                window.Theme
            ){

                return window.Theme;

            }

        } catch(error){

            /* optional theme fallback */

        }


        return null;

    },


    cardStyle(){

        const theme =
            this.getTheme();


        return String(
            theme?.card ||
            ""
        );

    },


    /* =====================================================
       APP HEADER
    ===================================================== */

    appHeader(
        title,
        subtitle,
        icon = "◌",
        backAction = "entity:dashboard"
    ){

        const action =
            this.safeAction(
                backAction
            );


        return `
            <div class="ui-app-header">

                <button
                    type="button"
                    class="secondary-btn ui-app-back"
                    data-action="${this.escapeAttribute(action)}"
                    aria-label="Geri dön"
                >
                    ← Geri
                </button>

                <div
                    class="card ui-app-header-card"
                    style="${this.escapeAttribute(
                        this.cardStyle()
                    )}"
                >

                    <div class="ui-app-header-copy">

                        <div class="eyebrow">
                            ${this.escapeHTML(
                                subtitle
                            )}
                        </div>

                        <h2>
                            ${this.escapeHTML(
                                title
                            )}
                        </h2>

                    </div>

                    <div
                        class="ui-app-header-icon"
                        aria-hidden="true"
                    >
                        ${this.escapeHTML(
                            icon
                        )}
                    </div>

                </div>

            </div>
        `;

    },


    /* =====================================================
       GENERIC CARD
    ===================================================== */

    appCard(
        title,
        text
    ){

        return `
            <div
                class="card ui-info-card"
                style="${this.escapeAttribute(
                    this.cardStyle()
                )}"
            >

                <div class="eyebrow">
                    ${this.escapeHTML(
                        title
                    )}
                </div>

                <p>
                    ${this.escapeHTML(
                        text
                    )}
                </p>

            </div>
        `;

    },


    /* =====================================================
       IDENTITY
    ===================================================== */

    identityCard(entity){

        const identityId =
            entity?.identity?.id ||
            entity?.identity?.vaId ||
            entity?.id ||
            "Kimlik bulunamadı";


        const verified =
            entity?.identity
                ?.verified ===
                true;


        const status =
            verified
                ? "Doğrulandı"
                : "Doğrulama Bekliyor";


        return `
            <div
                class="card ui-identity-card"
                style="${this.escapeAttribute(
                    this.cardStyle()
                )}"
            >

                <div class="eyebrow">
                    VA KİMLİĞİ
                </div>

                <h3 class="ui-identity-id">
                    ${this.escapeHTML(
                        identityId
                    )}
                </h3>

                <p class="ui-card-copy">
                    Bu kimlik, varlığın VAERO Evreni içindeki temel varoluş kaydıdır.
                </p>

                <div
                    class="ui-status-text ${
                        verified
                            ? "is-success"
                            : "is-pending"
                    }"
                >
                    ${this.escapeHTML(
                        status
                    )}
                </div>

            </div>
        `;

    },


    /* =====================================================
       ORGAN / APP LAUNCHER
    ===================================================== */

    launcherCard(app = {}){

        const action =
            this.safeAction(
                app.action
            );


        const enabled =
            app.enabled !==
            false;


        const title =
            app.title ||
            app.name ||
            app.id ||
            "Uygulama";


        return `
            <button
                type="button"
                class="card ui-launcher-card"
                data-action="${this.escapeAttribute(
                    action
                )}"
                style="${this.escapeAttribute(
                    this.cardStyle()
                )}"
                ${
                    enabled
                        ? ""
                        : "disabled"
                }
                aria-disabled="${
                    enabled
                        ? "false"
                        : "true"
                }"
            >

                <span
                    class="ui-launcher-icon"
                    aria-hidden="true"
                >
                    ${this.escapeHTML(
                        app.icon ||
                        "◌"
                    )}
                </span>

                <span class="ui-launcher-title">
                    ${this.escapeHTML(
                        title
                    )}
                </span>

                <span class="ui-launcher-subtitle">
                    ${this.escapeHTML(
                        app.subtitle ||
                        app.description ||
                        ""
                    )}
                </span>

            </button>
        `;

    },


    /* =====================================================
       APPLICATION CATALOG CARD
    ===================================================== */

    applicationCard(
        app = {},
        state = {}
    ){

        const appId =
            this.safeId(
                app.id ||
                app.slug ||
                ""
            );


        const installed =
            state.installed ===
                true ||
            app.installed ===
                true;


        const trusted =
            state.trusted ===
                true ||
            app.trusted ===
                true;


        const system =
            state.builtIn ===
                true ||
            state.system ===
                true ||
            app.system ===
                true ||
            app.builtIn ===
                true ||
            app.distribution ===
                "built-in";


        const enabled =
            state.enabled !==
                false &&
            app.enabled !==
                false;


        const updateAvailable =
            state.updateAvailable ===
                true ||
            app.updateAvailable ===
                true;


        const installable =
            app.installable !==
                false &&
            !system;


        const pricing =
            app.pricing &&
            typeof app.pricing ===
                "object"
                ? app.pricing
                : {
                    model:
                        "free"
                };


        let buttonLabel =
            "İncele";


        let command =
            "details";


        if(updateAvailable){

            buttonLabel =
                "Güncelle";

            command =
                "update";

        }

        else if(
            system ||
            installed
        ){

            buttonLabel =
                enabled
                    ? "Aç"
                    : "Devre Dışı";

            command =
                enabled
                    ? "open"
                    : "details";

        }

        else if(installable){

            buttonLabel =
                pricing.model ===
                    "free"
                    ? "Yükle"
                    : "İncele";

            command =
                pricing.model ===
                    "free"
                    ? "install"
                    : "details";

        }


        const title =
            app.title ||
            app.name ||
            app.id ||
            "Uygulama";


        return `
            <article
                class="
                    card
                    ui-application-card
                    ${
                        installed
                            ? "is-installed"
                            : ""
                    }
                    ${
                        updateAvailable
                            ? "has-update"
                            : ""
                    }
                "
                style="${this.escapeAttribute(
                    this.cardStyle()
                )}"
                data-app-id="${this.escapeAttribute(
                    appId
                )}"
            >

                <div class="ui-application-main">

                    <div
                        class="ui-application-icon"
                        
