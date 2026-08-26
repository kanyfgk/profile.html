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
                ?.verified !== false;


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
       Applications app için ortak UI primitive
    ===================================================== */

    applicationCard(
        app = {},
        state = {}
    ){

        const installed =
            state.installed ===
            true;


        const trusted =
            app.trusted ===
            true;


        const system =
            app.system ===
            true;


        const pricing =
            app.pricing ||
            {
                model:
                    "free"
            };


        let buttonLabel =
            "İncele";


        if(system){

            buttonLabel =
                "Aç";

        } else if(installed){

            buttonLabel =
                "Aç";

        } else if(
            app.installable === true
        ){

            buttonLabel =
                pricing.model ===
                    "free"
                    ? "Yükle"
                    : "Al";

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
                        data-application-command="${
                            installed || system
                                ? "open"
                                : "details"
                        }"
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
                "info"
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
                        Number.isFinite(amount)
                            ? this.escapeHTML(amount)
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
                    Number.isFinite(amount)
                        ? this.escapeHTML(amount)
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
            permissions.length === 0
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
                    action.action
                        ? `
                            <button
                                type="button"
                                class="primary-btn"
                                data-action="${this.escapeAttribute(
                                    this.safeAction(
                                        action.action
                                    )
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

       Eski inline Brain panel kaldırıldı.

       Gerçek panel artık BrainApp.render()
       tarafından oluşturulur. Böylece sayfa içinde
       ikinci bir #brainPanel oluşmaz.
    ===================================================== */

    brainPanel(){

        return this.brainButton();

    }

};


window.UI =
    UI;
