/* =========================================================
   VAERO MEMORY APP
   Entity memory surface
========================================================= */

const MemoryApp = {

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
                    "memory"
                );

            }

        } catch(error){

            console.warn(
                "Memory Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       MEMORY MODULE
    ===================================================== */

    renderMemoryModule(
        icon,
        title,
        description
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
                            color:
                                var(--engine-muted);
                            font-size:7px;
                            line-height:1.35;
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
                            Hafıza açılamadı.
                        </h1>

                        <p>
                            Bu varlığın hafıza bağlamı
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
                    "MEMORY APP",
                    "💾"
                )}


                ${UI.appCard(
                    "HAFIZA",
                    "Bu varlığın kayıtları, notları ve geçmiş izleri Memory katmanında tutulur."
                )}


                <div
                    style="
                        margin-top:10px;
                        display:grid;
                        grid-template-columns:
                            repeat(
                                3,
                                minmax(0,1fr)
                            );
                        gap:7px;
                    "
                >

                    ${this.renderMemoryModule(
                        "◫",
                        "Kayıtlar",
                        "Varlığa ait kalıcı sistem kayıtları"
                    )}


                    ${this.renderMemoryModule(
                        "✦",
                        "Notlar",
                        "Bağlam ve anlam taşıyan hafıza parçaları"
                    )}


                    ${this.renderMemoryModule(
                        "⌁",
                        "Geçmiş İzleri",
                        "Zaman içinde oluşan deneyim izleri"
                    )}

                </div>


                <div
                    class="card"
                    style="
                        margin-top:7px;
                        padding:12px 13px;
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
                            MEMORY CORE
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
                            Hafıza motoru ile gerçek kayıt bağlantısı
                            sistem katmanından sağlanır.
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
                                var(--engine-blue);
                            box-shadow:
                                0
                                0
                                9px
                                rgba(
                                    107,
                                    183,
                                    241,
                                    .4
                                );
                        "
                    ></span>

                </div>


                ${UI.brainPanel()}

            </div>
        `;

    }

};


window.MemoryApp =
    MemoryApp;
