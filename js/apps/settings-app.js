/* =========================================================
   VAERO SETTINGS APP
   Engine preferences / privacy / security
========================================================= */

const SettingsApp = {

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
                    "settings"
                );

            }

        } catch(error){

            console.warn(
                "Settings Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       SETTING CARD
    ===================================================== */

    settingCard(
        icon,
        title,
        description,
        status = "Hazır"
    ){

        return `

            <div
                class="card"
                style="
                    min-width:0;
                    padding:13px;
                    display:grid;
                    grid-template-columns:
                        36px
                        minmax(0,1fr)
                        auto;
                    align-items:center;
                    gap:10px;
                "
            >

                <span
                    aria-hidden="true"
                    style="
                        width:36px;
                        height:36px;
                        display:grid;
                        place-items:center;
                        border:
                            1px solid
                            rgba(
                                255,
                                255,
                                255,
                                .055
                            );
                        border-radius:11px;
                        background:
                            rgba(
                                255,
                                255,
                                255,
                                .025
                            );
                        color:
                            var(--engine-gold-soft);
                        font-size:14px;
                    "
                >
                    ${icon}
                </span>


                <div
                    style="
                        min-width:0;
                    "
                >

                    <strong
                        style="
                            display:block;
                            overflow:hidden;
                            color:
                                var(--engine-text);
                            font-size:10px;
                            font-weight:600;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                        "
                    >
                        ${this.escapeHTML(
                            title
                        )}
                    </strong>


                    <small
                        style="
                            display:block;
                            margin-top:3px;
                            overflow:hidden;
                            color:
                                var(--engine-muted);
                            font-size:7px;
                            line-height:1.35;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                        "
                    >
                        ${this.escapeHTML(
                            description
                        )}
                    </small>

                </div>


                <span
                    style="
                        flex:0 0 auto;
                        padding:
                            4px
                            7px;
                        border:
                            1px solid
                            rgba(
                                223,
                                189,
                                122,
                                .12
                            );
                        border-radius:999px;
                        background:
                            rgba(
                                223,
                                189,
                                122,
                                .035
                            );
                        color:
                            var(--engine-gold);
                        font-size:6px;
                        font-weight:700;
                        white-space:nowrap;
                    "
                >
                    ${this.escapeHTML(
                        status
                    )}
                </span>

            </div>

        `;

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(entity){

        this.enterBrainContext();


        const entityName =
            this.escapeHTML(
                entity?.name ||
                "VAERO Varlığı"
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
                    entityName,
                    "SETTINGS",
                    "⚙️"
                )}


                ${UI.appCard(
                    "AYARLAR",
                    "Bu varlığın görünümü, izinleri, güvenliği ve uygulama tercihleri burada yönetilir."
                )}


                <div
                    style="
                        margin-top:10px;
                        display:grid;
                        grid-template-columns:
                            repeat(
                                2,
                                minmax(0,1fr)
                            );
                        gap:7px;
                    "
                >

                    ${this.settingCard(
                        "◐",
                        "Görünüm",
                        "Tema ve arayüz tercihleri"
                    )}


                    ${this.settingCard(
                        "◎",
                        "Gizlilik",
                        "Veri ve görünürlük tercihleri"
                    )}


                    ${this.settingCard(
                        "◇",
                        "Güvenlik",
                        "Oturum ve erişim kontrolleri"
                    )}


                    ${this.settingCard(
                        "▦",
                        "Uygulamalar",
                        "Uygulama izinları ve tercihleri"
                    )}

                </div>


                <div
                    class="card"
                    style="
                        margin-top:7px;
                        padding:11px 13px;
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:12px;
                    "
                >

                    <div
                        style="
                            min-width:0;
                        "
                    >

                        <div
                            class="eyebrow"
                            style="
                                margin-bottom:4px;
                            "
                        >
                            ENGINE DURUMU
                        </div>


                        <strong
                            style="
                                display:block;
                                color:
                                    var(--engine-text);
                                font-size:10px;
                                font-weight:600;
                            "
                        >
                            Sistem tercihleri kullanılabilir
                        </strong>


                        <small
                            style="
                                display:block;
                                margin-top:2px;
                                color:
                                    var(--engine-muted);
                                font-size:7px;
                            "
                        >
                            Kalıcı ayar motoru sonraki sistem katmanından bağlanacak.
                        </small>

                    </div>


                    <span
                        aria-hidden="true"
                        style="
                            width:8px;
                            height:8px;
                            flex:0 0 8px;
                            border-radius:50%;
                            background:
                                var(--engine-green);
                            box-shadow:
                                0
                                0
                                9px
                                rgba(
                                    100,
                                    216,
                                    157,
                                    .48
                                );
                        "
                    ></span>

                </div>


                ${UI.brainPanel()}


            </div>

        `;

    }

};


window.SettingsApp =
    SettingsApp;
