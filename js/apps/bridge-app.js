/* =========================================================
   VAERO BRIDGE APP
   Entity Connections Surface
========================================================= */

const BridgeApp = {

    /* =====================================================
       SAFETY
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


    /* =====================================================
       BRAIN CONTEXT
    ===================================================== */

    enterBrainContext(){

        try{

            const awareness =
                typeof VAERO !== "undefined" &&
                typeof VAERO.get === "function"
                    ? VAERO.get(
                        "brainAwareness"
                    )
                    : null;

            if(
                awareness &&
                typeof awareness.enter ===
                    "function"
            ){

                awareness.enter(
                    "bridge"
                );

            }

        } catch(error){

            console.warn(
                "Bridge Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       BRIDGE TYPE CARD
    ===================================================== */

    renderBridgeType(
        icon,
        title,
        description
    ){

        return `
            <div
                class="card"
                style="
                    min-width:0;
                    padding:12px;
                    display:grid;
                    grid-template-columns:
                        36px
                        minmax(0,1fr);
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
                            var(--engine-line);
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
                            color:
                                var(--engine-text);
                            font-size:10px;
                            font-weight:650;
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
                            Bridge açılamadı.
                        </h1>

                        <p>
                            Bu varlığın bağlantı bağlamı
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
                    "BRIDGE APP",
                    "🌉"
                )}


                ${UI.appCard(
                    "BAĞLANTILAR",
                    "Bu varlığın kişiler, şirketler, ürünler ve diğer varlıklarla kurduğu ilişkiler Bridge katmanında yönetilir."
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

                    ${this.renderBridgeType(
                        "◉",
                        "Kişiler",
                        "İnsan ve profil bağlantıları"
                    )}


                    ${this.renderBridgeType(
                        "▣",
                        "Şirketler",
                        "Organizasyon ve kurum ilişkileri"
                    )}


                    ${this.renderBridgeType(
                        "◇",
                        "Ürünler",
                        "Varlıkla ilişkili ürün bağlantıları"
                    )}


                    ${this.renderBridgeType(
                        "⌘",
                        "Diğer Varlıklar",
                        "Engine içindeki diğer varlık ilişkileri"
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

                        <div class="eyebrow">
                            BRIDGE CORE
                        </div>

                        <p
                            style="
                                margin:4px 0 0;
                                color:
                                    var(--engine-muted);
                                font-size:8px;
                                line-height:1.4;
                            "
                        >
                            Gerçek bağlantı verileri Bridge
                            sistem katmanından bağlanır.
                        </p>

                    </div>


                    <span
                        aria-hidden="true"
                        style="
                            width:8px;
                            height:8px;
                            flex:0 0 8px;
                            border-radius:50%;
                            background:
                                var(--engine-violet);
                            box-shadow:
                                0
                                0
                                9px
                                rgba(
                                    165,
                                    138,
                                    241,
                                    .42
                                );
                        "
                    ></span>

                </div>


                ${UI.brainPanel()}

            </div>
        `;

    }

};


window.BridgeApp =
    BridgeApp;
