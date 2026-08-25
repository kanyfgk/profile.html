/* =========================================================
   VAERO IDENTITY APP
========================================================= */

const IdentityApp = {

    /* =====================================================
       SAFETY
    ===================================================== */

    escapeHTML(value){

        return String(
            value ?? ""
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

            const brainAwareness =
                typeof VAERO !== "undefined" &&
                typeof VAERO.get === "function"
                    ? VAERO.get(
                        "brainAwareness"
                    )
                    : null;

            if(
                brainAwareness &&
                typeof brainAwareness.enter ===
                    "function"
            ){

                brainAwareness.enter(
                    "identity"
                );

            }

        } catch(error){

            console.warn(
                "Identity Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       IDENTITY LAYER CARD
    ===================================================== */

    renderIdentityLayer(
        code,
        status,
        active = false
    ){

        return `
            <div
                class="card"
                style="
                    min-width:0;
                    padding:11px 12px;
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:10px;
                "
            >

                <div
                    style="
                        min-width:0;
                        display:flex;
                        align-items:center;
                        gap:9px;
                    "
                >

                    <span
                        aria-hidden="true"
                        style="
                            width:8px;
                            height:8px;
                            flex:0 0 8px;
                            border-radius:50%;
                            background:
                                ${
                                    active
                                        ? "var(--engine-green)"
                                        : "rgba(255,255,255,.16)"
                                };
                            box-shadow:
                                ${
                                    active
                                        ? "0 0 9px rgba(100,216,157,.45)"
                                        : "none"
                                };
                        "
                    ></span>

                    <strong
                        style="
                            overflow:hidden;
                            color:var(--engine-text);
                            font-size:10px;
                            font-weight:650;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                        "
                    >
                        ${this.escapeHTML(code)}
                    </strong>

                </div>


                <small
                    style="
                        flex:0 0 auto;
                        color:
                            ${
                                active
                                    ? "var(--engine-green)"
                                    : "var(--engine-muted)"
                            };
                        font-size:7px;
                        white-space:nowrap;
                    "
                >
                    ${this.escapeHTML(status)}
                </small>

            </div>
        `;

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(entity){

        this.enterBrainContext();

        if(!entity){

            return `
                <div class="section">

                    <div class="engine-error-state">

                        <h1>
                            Kimlik bulunamadı.
                        </h1>

                        <p>
                            Bu varlığın kimlik bilgileri
                            şu anda kullanılamıyor.
                        </p>

                    </div>

                </div>
            `;

        }


        const safeName =
            this.escapeHTML(
                entity.name ||
                "İsimsiz Varlık"
            );

        const safeType =
            this.escapeHTML(
                entity.type ||
                "Belirsiz"
            );


        return `
            <div
                class="section"
                style="
                    margin:0;
                    padding:16px;
                    overflow:hidden;
                "
            >

                ${UI.appHeader(
                    safeName,
                    "KİMLİK UYGULAMASI",
                    "🪪"
                )}


                <div
                    style="
                        display:grid;
                        grid-template-columns:
                            minmax(0,1.05fr)
                            minmax(0,.95fr);
                        gap:10px;
                        align-items:start;
                    "
                >

                    <div>

                        ${UI.identityCard(entity)}

                        <div
                            class="card"
                            style="
                                margin-top:10px;
                                padding:13px;
                            "
                        >

                            <div class="eyebrow">
                                KİMLİK TÜRÜ
                            </div>

                            <h3
                                style="
                                    margin:4px 0 0;
                                    color:var(--engine-text);
                                    font-size:16px;
                                    font-weight:550;
                                "
                            >
                                ${safeType}
                            </h3>

                            <p
                                style="
                                    margin:5px 0 0;
                                    color:var(--engine-muted);
                                    font-size:8px;
                                    line-height:1.4;
                                "
                            >
                                Bu varlığın sistem içindeki tipi
                                ve yetki kapsamı burada yönetilir.
                            </p>

                        </div>

                    </div>


                    <div
                        class="card"
                        style="
                            padding:13px;
                        "
                    >

                        <div class="eyebrow">
                            KİMLİK KATMANLARI
                        </div>

                        <p
                            style="
                                margin:0 0 9px;
                                color:var(--engine-muted);
                                font-size:8px;
                                line-height:1.4;
                            "
                        >
                            Varlığın Engine içindeki kimlik
                            katmanları ve mevcut durumları.
                        </p>


                        <div
                            style="
                                display:grid;
                                gap:6px;
                            "
                        >

                            ${this.renderIdentityLayer(
                                "VA ID",
                                "Aktif",
                                true
                            )}

                            ${this.renderIdentityLayer(
                                "AE ID",
                                "Henüz yok"
                            )}

                            ${this.renderIdentityLayer(
                                "EA ID",
                                "Henüz yok"
                            )}

                        </div>

                    </div>

                </div>

            </div>
        `;

    }

};


window.IdentityApp =
    IdentityApp;
