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
                        aria-hidden="true"
                    >
                        ${this.escapeHTML(
                            app.icon ||
                            "◌"
                        )}
                    </div>

                    <div class="ui-application-copy">

                        <div class="ui-application-title-row">

                            <h3>
                                ${this.escapeHTML(
                                    title
                                )}
                            </h3>

                            ${
                                system
                                    ? this.statusBadge(
                                        "Sistem",
                                        "info"
                                    )
                                    : ""
                            }

                            ${
                                trusted
                                    ? this.statusBadge(
                                        "Doğrulanmış",
                                        "trusted"
                                    )
                                    : ""
                            }

                            ${
                                installed &&
                                !system
                                    ? this.statusBadge(
                                        "Yüklü",
                                        "success"
                                    )
                                    : ""
                            }

                            ${
                                updateAvailable
                                    ? this.statusBadge(
                                        "Güncelleme",
                                        "warning"
                                    )
                                    : ""
                            }

                        </div>

                        <p>
                            ${this.escapeHTML(
                                app.subtitle ||
                                app.description ||
                                ""
                            )}
                        </p>

                        <div class="ui-application-meta">

                            ${
                                app.developer
                                    ? `
                                        <span>
                                            ${this.escapeHTML(
                                                app.developer
                                            )}
                                        </span>
                                      `
                                    : ""
                            }

                            ${
                                app.version
                                    ? `
                                        <span>
                                            v${this.escapeHTML(
                                                app.version
                                            )}
                                        </span>
                                      `
                                    : ""
                            }

                            ${
                                app.category
                                    ? `
                                        <span>
                                            ${this.escapeHTML(
                                                app.category
                                            )}
                                        </span>
                                      `
                                    : ""
                            }

                        </div>

                    </div>

                </div>

                <div class="ui-application-actions">

                    ${this.pricingLabel(
                        pricing
                    )}

                    <button
                        type="button"
                        class="primary-btn ui-application-action"
                        data-applications-command="${this.escapeAttribute(
                            command
                        )}"
                        data-app-id="${this.escapeAttribute(
                            appId
                        )}"
                        ${
                            !appId
                                ? "disabled"
                                : ""
                        }
                    >
                        ${this.escapeHTML(
                            buttonLabel
                        )}
                    </button>

                </div>

            </article>
        `;

    },


    /* =====================================================
       STATUS BADGE
    ===================================================== */

    statusBadge(
        label,
        tone = "neutral"
    ){

        const allowedTones =
            new Set([
                "neutral",
                "success",
                "warning",
                "danger",
                "trusted",
                "info",
                "pending"
            ]);


        const safeTone =
            allowedTones.has(
                tone
            )
                ? tone
                : "neutral";


        return `
            <span
                class="ui-status-badge is-${safeTone}"
            >
                ${this.escapeHTML(
                    label
                )}
            </span>
        `;

    },


    /* =====================================================
       BRAIN STATUS BADGE
    ===================================================== */

    brainStatusBadge(status = {}){

        const providerConnected =
            status.providerConnected ===
                true;


        const pendingConfirmation =
            Number(
                status.pendingConfirmations
            ) > 0 ||
            status.pendingConfirmation ===
                true;


        const busy =
            status.busy ===
                true ||
            status.status ===
                "busy";


        const error =
            status.error ===
                true ||
            status.status ===
                "error";


        if(error){

            return this.statusBadge(
                "Brain Hatası",
                "danger"
            );

        }


        if(pendingConfirmation){

            return this.statusBadge(
                "Onay Bekliyor",
                "warning"
            );

        }


        if(busy){

            return this.statusBadge(
                "Brain Çalışıyor",
                "pending"
            );

        }


        if(providerConnected){

            return this.statusBadge(
                "Brain Online",
                "success"
            );

        }


        return this.statusBadge(
            "Local Brain",
            "info"
        );

    },


    /* =====================================================
       PRICING LABEL
    ===================================================== */

    pricingLabel(pricing = {}){

        const model =
            String(
                pricing.model ||
               "free"
            )
                .trim()
                .toLowerCase();


        if(model === "free"){

            return `
                <span class="ui-price-label">
                    Ücretsiz
                </span>
            `;

        }


        const amount =
            Number(
                pricing.amount
            );


        const currency =
            String(
                pricing.currency ||
                ""
            )
                .trim()
                .toUpperCase();


        const formattedAmount =
            Number.isFinite(
                amount
            )
                ? String(
                    amount
                )
                : "";


        if(
            model ===
            "subscription"
        ){

            const intervalMap = {

                month:
                    "ay",

                monthly:
                    "ay",

                year:
                    "yıl",

                yearly:
                    "yıl",

                annual:
                    "yıl"

            };


            const rawInterval =
                String(
                    pricing.interval ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const interval =
                rawInterval
                    ? (
                        intervalMap[
                            rawInterval
                        ] ||
                        rawInterval
                    )
                    : "";


            return `
                <span class="ui-price-label">

                    ${
                        formattedAmount
                            ? `${this.escapeHTML(
                                formattedAmount
                            )} `
                            : ""
                    }${this.escapeHTML(
                        currency
                    )}${
                        interval
                            ? ` / ${this.escapeHTML(
                                interval
                            )}`
                            : ""
                    }

                </span>
            `;

        }


        return `
            <span class="ui-price-label">

                ${
                    formattedAmount
                        ? `${this.escapeHTML(
                            formattedAmount
                        )} `
                        : ""
                }${this.escapeHTML(
                    currency
                )}

            </span>
        `;

    },


    /* =====================================================
       PERMISSIONS
    ===================================================== */

    permissionList(
        permissions = []
    ){

        if(
            !Array.isArray(
                permissions
            ) ||
            permissions.length ===
                0
        ){

            return `
                <div class="ui-permission-empty">
                    Özel izin istemiyor
                </div>
            `;

        }


        const unique =
            [
                ...new Set(
                    permissions
                        .map(
                            permission => {

                                if(
                                    permission &&
                                    typeof permission ===
                                        "object"
                                ){

                                    return String(
                                        permission.id ||
                                        permission.name ||
                                        permission.permission ||
                                        ""
                                    ).trim();

                                }


                                return String(
                                    permission ??
                                    ""
                                ).trim();

                            }
                        )
                        .filter(Boolean)
                )
            ];


        if(
            unique.length ===
            0
        ){

            return `
                <div class="ui-permission-empty">
                    Özel izin istemiyor
                </div>
            `;

        }


        return `
            <div class="ui-permission-list">

                ${unique
                    .map(
                        permission => `
                            <span class="ui-permission-chip">
                                ${this.escapeHTML(
                                    permission
                                )}
                            </span>
                        `
                    )
                    .join("")}

            </div>
        `;

    },


    /* =====================================================
       APPLICATION PERMISSION ROW
    ===================================================== */

    permissionRow(
        permission,
        {
            granted = false,
            appId = "",
            editable = true
        } = {}
    ){

        const safePermission =
            String(
                permission ||
                ""
            ).trim();


        if(!safePermission){

            return "";

        }


        const safeAppId =
            this.safeId(
                appId
            );


        const command =
            granted
                ? "permission-revoke"
                : "permission-grant";


        return `
            <div
                class="ui-permission-row"
                data-permission="${this.escapeAttribute(
                    safePermission
                )}"
            >

                <div class="ui-permission-row-copy">

                    <strong>
                        ${this.escapeHTML(
                            safePermission
                        )}
                    </strong>

                    ${
                        granted
                            ? this.statusBadge(
                                "İzin Verildi",
                                "success"
                            )
                            : this.statusBadge(
                                "Onay Bekliyor",
                                "pending"
                            )
                    }

                </div>

                ${
                    editable &&
                    safeAppId
                        ? `
                            <button
                                type="button"
                                class="${
                                    granted
                                        ? "secondary-btn"
                                        : "primary-btn"
                                }"
                                data-applications-command="${this.escapeAttribute(
                                    command
                                )}"
                                data-app-id="${this.escapeAttribute(
                                    safeAppId
                                )}"
                                data-permission="${this.escapeAttribute(
                                    safePermission
                                )}"
                            >
                                ${
                                    granted
                                        ? "İzni Kaldır"
                                        : "İzin Ver"
                                }
                            </button>
                          `
                        : ""
                }

            </div>
        `;

    },


    /* =====================================================
       STAT CARD
    ===================================================== */

    statsCard(
        title,
        value
    ){

        return `
            <div
                class="card ui-stats-card"
                style="${this.escapeAttribute(
                    this.cardStyle()
                )}"
            >

                <div class="eyebrow">
                    ${this.escapeHTML(
                        title
                    )}
                </div>

                <h3>
                    ${this.escapeHTML(
                        value
                    )}
                </h3>

            </div>
        `;

    },


    /* =====================================================
       INFO ROW
    ===================================================== */

    infoRow(
        label,
        value
    ){

        return `
            <div class="ui-info-row">

                <b>
                    ${this.escapeHTML(
                        label
                    )}
                </b>

                <p>
                    ${this.escapeHTML(
                        value
                    )}
                </p>

            </div>
        `;

    },


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    emptyState(
        title,
        text,
        action = null
    ){

        /*
         * Compatibility:
         *
         * UI.emptyState("Başlık", "Metin", {...})
         *
         * veya
         *
         * UI.emptyState({
         *   title,
         *   text,
         *   description,
         *   action,
         *   actionLabel,
         *   icon
         * })
         */

        let config = {

            title,
            text,
            action,
            icon:
                "◌"

        };


        if(
            title &&
            typeof title ===
                "object"
        ){

            config = {

                title:
                    title.title ||
                    "Henüz içerik yok",

                text:
                    title.text ||
                    title.description ||
                    "",

                action:
                    title.action &&
                    typeof title.action ===
                        "object"
                        ? title.action
                        : (
                            title.action &&
                            title.actionLabel
                                ? {
                                    action:
                                        title.action,
                                    label:
                                        title.actionLabel
                                }
                                : null
                        ),

                icon:
                    title.icon ||
                    "◌"

            };

        }


        const safeAction =
            config.action?.action
                ? this.safeAction(
                    config.action.action
                )
                : "";


        return `
            <div
                class="card ui-empty-state"
                style="${this.escapeAttribute(
                    this.cardStyle()
                )}"
            >

                <div
                    class="ui-empty-icon"
                    aria-hidden="true"
                >
                    ${this.escapeHTML(
                        config.icon
                    )}
                </div>

                <h3>
                    ${this.escapeHTML(
                        config.title ||
                        "Henüz içerik yok"
                    )}
                </h3>

                ${
                    config.text
                        ? `
                            <p>
                                ${this.escapeHTML(
                                    config.text
                                )}
                            </p>
                          `
                        : ""
                }

                ${
                    config.action &&
                    config.action.label &&
                    safeAction
                        ? `
                            <button
                                type="button"
                                class="primary-btn"
                                data-action="${this.escapeAttribute(
                                    safeAction
                                )}"
                            >
                                ${this.escapeHTML(
                                    config.action.label
                                )}
                            </button>
                          `
                        : ""
                }

            </div>
        `;

    },


    /* =====================================================
       BRAIN CONFIRMATION CARD
    ===================================================== */

    brainConfirmationCard(
        confirmation = {},
        {
            title =
                "Onay gerekiyor",

            message =
                "Brain bu işlemi uygulamadan önce onayını bekliyor."
        } = {}
    ){

        const confirmationId =
            this.safeId(
                confirmation.id ||
                confirmation.confirmationId ||
                ""
            );


        if(!confirmationId){

            return "";

        }


        const actionType =
            confirmation.actionType ||
            confirmation.intent
                ?.operation ||
            null;


        const expiresAt =
            Number(
                confirmation.expiresAt
            );


        return `
            <div
                class="card ui-brain-confirmation"
                style="${this.escapeAttribute(
                    this.cardStyle()
                )}"
                data-brain-confirmation-id="${this.escapeAttribute(
                    confirmationId
                )}"
            >

                <div class="ui-brain-confirmation-head">

                    <div>

                        <div class="eyebrow">
                            BRAIN ACTION
                        </div>

                        <h3>
                            ${this.escapeHTML(
                                title
                            )}
                        </h3>

                    </div>

                    ${this.statusBadge(
                        "Onay Bekliyor",
                        "warning"
                    )}

                </div>

                <p class="ui-card-copy">
                    ${this.escapeHTML(
                        message
                    )}
                </p>

                ${
                    actionType
                        ? `
                            <div class="ui-brain-confirmation-action">
                                ${this.escapeHTML(
                                    actionType
                                )}
                            </div>
                          `
                        : ""
                }

                ${
                    Number.isFinite(
                        expiresAt
                    )
                        ? `
                            <div
                                class="ui-brain-confirmation-expiry"
                                data-confirmation-expires-at="${this.escapeAttribute(
                                    expiresAt
                                )}"
                            >
                                Bu onay sınırlı süre için geçerlidir.
                            </div>
                          `
                        : ""
                }

                <div class="ui-brain-confirmation-buttons">

                    <button
                        type="button"
                        class="secondary-btn"
                        data-brain-command="cancel-confirmation"
                        data-confirmation-id="${this.escapeAttribute(
                            confirmationId
                        )}"
                    >
                        Vazgeç
                    </button>

                    <button
                        type="button"
                        class="primary-btn"
                        data-brain-command="confirm"
                        data-confirmation-id="${this.escapeAttribute(
                            confirmationId
                        )}"
                    >
                        Onayla
                    </button>

                </div>

            </div>
        `;

    },


    /* =====================================================
       BRAIN MESSAGE
    ===================================================== */

    brainMessage(
        message,
        {
            role = "brain",
            meta = null
        } = {}
    ){

        const normalizedRole =
            [
                "brain",
                "user",
                "system"
            ].includes(
                role
            )
                ? role
                : "brain";


        return `
            <div
                class="ui-brain-message is-${normalizedRole}"
            >

                <div class="ui-brain-message-copy">
                    ${this.escapeHTML(
                        message ||
                        ""
                    )}
                </div>

                ${
                    meta
                        ? `
                            <div class="ui-brain-message-meta">
                                ${this.escapeHTML(
                                    meta
                                )}
                            </div>
                          `
                        : ""
                }

            </div>
        `;

    },


    /* =====================================================
       BRAIN TRIGGER
    ===================================================== */

    brainButton(){

        return `
            <button
                type="button"
                class="ui-brain-trigger"
                data-action="brain:open"
                aria-label="VAERO Brain'i aç"
                title="Brain"
            >
                <span aria-hidden="true">
                    ✦
                </span>
            </button>
        `;

    },


    /* =====================================================
       BRAIN ENTRY POINT

       Inline Brain panel oluşturulmaz.

       Tek panel authority:
       BrainApp.render()
    ===================================================== */

    brainPanel(){

        return this.brainButton();

    }

};


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
            "ui",
            UI
        );

    }

} catch(error){

    console.warn(
        "UI Kit VAERO register başarısız:",
        error
    );

}


if(
    typeof window !==
    "undefined"
){

    window.UI =
        UI;

}
