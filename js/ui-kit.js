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
                >
                    ← Geri
                </button>

                <div
                    class="card ui-app-header-card"
                    style="${Theme.card}"
                >

                    <div class="ui-app-header-copy">

                        <div class="eyebrow">
                            ${this.escapeHTML(subtitle)}
                        </div>

                        <h2>
                            ${this.escapeHTML(title)}
                        </h2>

                    </div>

                    <div
                        class="ui-app-header-icon"
                        aria-hidden="true"
                    >
                        ${this.escapeHTML(icon)}
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
                style="${Theme.card}"
            >

                <div class="eyebrow">
                    ${this.escapeHTML(title)}
                </div>

                <p>
                    ${this.escapeHTML(text)}
                </p>

            </div>
        `;

    },


    /* =====================================================
       IDENTITY
    ===================================================== */

    identityCard(entity){

        const identityId =
            entity?.id ||
            "Kimlik bulunamadı";


        const verified =
            entity?.identity
                ?.verified ===
                true;


        return `
            <div
                class="card ui-identity-card"
                style="${Theme.card}"
            >

                <div class="eyebrow">
                    VA KİMLİĞİ
                </div>

                <h3 class="ui-identity-id">
                    ${this.escapeHTML(identityId)}
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
                    ${
                        verified
                            ? "Doğrulandı"
                            : "Doğrulama Bekliyor"
                    }
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


        return `
            <button
                type="button"
                class="card ui-launcher-card"
                data-action="${this.escapeAttribute(action)}"
                style="${Theme.card}"
                ${
                    app.enabled === false
                        ? "disabled"
                        : ""
                }
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
                        app.title ||
                        app.id ||
                        "Uygulama"
                    )}
                </span>

                <span class="ui-launcher-subtitle">
                    ${this.escapeHTML(
                        app.subtitle ||
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

        const installed =
            state.installed ===
            true;


        const trusted =
            state.trusted ===
            true ||
            app.trusted ===
            true;


        const system =
            state.builtIn ===
            true ||
            app.system ===
            true ||
            app.distribution ===
            "built-in";


        const updateAvailable =
            state.updateAvailable ===
            true;


        const pricing =
            app.pricing ||
            {
                model:
                    "free"
            };


        let buttonLabel =
            "İncele";


        let command =
            "details";


        if(
            updateAvailable
        ){

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
                "Aç";

            command =
                "open";

        }
        else if(
            app.installable === true
        ){

            buttonLabel =
                pricing.model ===
                    "free"
                    ? "Yükle"
                    : "Al";

            command =
                "details";

        }


        return `
            <article
                class="card ui-application-card"
                style="${Theme.card}"
                data-app-id="${this.escapeAttribute(
                    app.id ||
                    ""
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
                                    app.title ||
                                    app.id ||
                                    "Uygulama"
                                )}
                            </h3>

                            ${
                                trusted
                                    ? this.statusBadge(
                                        "Doğrulanmış",
                                        "trusted"
                                    )
                                    : ""
                            }

                            ${
                                updateAvailable
                                    ? this.statusBadge(
                                        "Güncelleme",
                                        "info"
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
                        data-application-command="${this.escapeAttribute(
                            command
                        )}"
                        data-app-id="${this.escapeAttribute(
                            app.id ||
                            ""
                        )}"
                    >
                        ${this.escapeHTML(buttonLabel)}
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
                ${this.escapeHTML(label)}
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
            ) > 0;


        if(
            pendingConfirmation
        ){

            return this.statusBadge(
                "Onay Bekliyor",
                "warning"
            );

        }


        if(
            providerConnected
        ){

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


        if(
            model ===
            "free"
        ){

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
            pricing.currency ||
            "";


        if(
            model ===
            "subscription"
        ){

            const interval =
                pricing.interval
                    ? ` / ${pricing.interval}`
                    : "";


            return `
                <span class="ui-price-label">
                    ${
                        Number.isFinite(
                            amount
                        )
                            ? this.escapeHTML(
                                amount
                            )
                            : ""
                    }
                    ${this.escapeHTML(currency)}
                    ${this.escapeHTML(interval)}
                </span>
            `;

        }


        return `
            <span class="ui-price-label">
                ${
                    Number.isFinite(
                        amount
                    )
                        ? this.escapeHTML(
                            amount
                        )
                        : ""
                }
                ${this.escapeHTML(currency)}
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
                            permission =>
                                String(
                                    permission ??
                                    ""
                                ).trim()
                        )
                        .filter(Boolean)
                )
            ];


        return `
            <div class="ui-permission-list">

                ${unique
                    .map(
                        permission => `
                            <span class="ui-permission-chip">
                                ${this.escapeHTML(permission)}
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
                    editable
                        ? `
                            <button
                                type="button"
                                class="${
                                    granted
                                        ? "secondary-btn"
                                        : "primary-btn"
                                }"
                                data-application-command="${this.escapeAttribute(
                                    command
                                )}"
                                data-app-id="${this.escapeAttribute(
                                    appId
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
                style="${Theme.card}"
            >

                <div class="eyebrow">
                    ${this.escapeHTML(title)}
                </div>

                <h3>
                    ${this.escapeHTML(value)}
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
                    ${this.escapeHTML(label)}
                </b>

                <p>
                    ${this.escapeHTML(value)}
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

        const safeAction =
            action?.action
                ? this.safeAction(
                    action.action
                )
                : "";


        return `
            <div
                class="card ui-empty-state"
                style="${Theme.card}"
            >

                <div
                    class="ui-empty-icon"
                    aria-hidden="true"
                >
                    ◌
                </div>

                <h3>
                    ${this.escapeHTML(title)}
                </h3>

                <p>
                    ${this.escapeHTML(text)}
                </p>

                ${
                    action &&
                    action.label &&
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
                                    action.label
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
                confirmation
                    .confirmationId ||
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
                style="${Theme.card}"
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
                            ${this.escapeHTML(title)}
                        </h3>

                    </div>

                    ${this.statusBadge(
                        "Onay Bekliyor",
                        "warning"
                    )}

                </div>

                <p class="ui-card-copy">
                    ${this.escapeHTML(message)}
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
                                ${this.escapeHTML(meta)}
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
            >
                <span aria-hidden="true">
                    ✨
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


window.UI =
    UI;
