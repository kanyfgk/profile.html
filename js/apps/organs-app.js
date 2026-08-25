/* =========================================================
   VAERO ORGANS APP
   Organ Launcher + Live Status
========================================================= */

const OrgansApp = {

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
                    ? VAERO.get("brainAwareness")
                    : null;

            if(
                awareness &&
                typeof awareness.enter === "function"
            ){

                awareness.enter("organs");

            }

        } catch(error){

            console.warn(
                "Organs Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       ORGAN REGISTRY
    ===================================================== */

    getRegisteredOrgans(){

        try{

            if(
                typeof OrganRegistry === "undefined" ||
                typeof OrganRegistry.all !== "function"
            ){
                return [];
            }

            const organs =
                OrganRegistry.all();

            return Array.isArray(organs)
                ? organs
                : [];

        } catch(error){

            console.warn(
                "Organ Registry okunamadı:",
                error
            );

            return [];

        }

    },


    /* =====================================================
       LIVE STATUS
    ===================================================== */

    getLiveStatuses(){

        try{

            const organStatus =
                typeof VAERO !== "undefined" &&
                typeof VAERO.get === "function"
                    ? VAERO.get("organStatus")
                    : null;

            if(
                !organStatus ||
                typeof organStatus.all !== "function"
            ){
                return [];
            }

            const statuses =
                organStatus.all();

            return Array.isArray(statuses)
                ? statuses
                : [];

        } catch(error){

            console.warn(
                "Organ durumları okunamadı:",
                error
            );

            return [];

        }

    },


    /* =====================================================
       STATUS MATCHING
    ===================================================== */

    findLiveStatus(
        app,
        liveStatuses
    ){

        const searchableText = [
            app?.id,
            app?.title,
            app?.action
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        let statusId = null;


        if(
            searchableText.includes("memory") ||
            searchableText.includes("hafıza") ||
            searchableText.includes("hafiza")
        ){

            statusId = "memory";

        }


        if(
            searchableText.includes("timeline") ||
            searchableText.includes("zaman")
        ){

            statusId = "timeline";

        }


        if(
            searchableText.includes("evolution") ||
            searchableText.includes("evrim")
        ){

            statusId = "evolution";

        }


        if(!statusId){
            return null;
        }


        return (
            liveStatuses.find(
                item =>
                    item &&
                    item.id === statusId
            ) ||
            null
        );

    },


    /* =====================================================
       STATUS PRESENTATION
    ===================================================== */

    getStatusPresentation(status){

        if(status === "active"){

            return {
                label:"Aktif",
                color:"var(--engine-green)",
                glow:"rgba(100,216,157,.42)"
            };

        }


        if(status === "missing"){

            return {
                label:"Bağlı değil",
                color:"var(--engine-danger)",
                glow:"rgba(255,123,133,.34)"
            };

        }


        return {
            label:"Hazır",
            color:"var(--engine-muted)",
            glow:"transparent"
        };

    },


    /* =====================================================
       ORGAN CARD
    ===================================================== */

    renderOrganCard(
        app,
        liveStatuses
    ){

        const liveStatus =
            this.findLiveStatus(
                app,
                liveStatuses
            );


        const status =
            liveStatus?.status ||
            "ready";


        const statusUI =
            this.getStatusPresentation(
                status
            );


        const total =
            Number.isFinite(
                liveStatus?.total
            )
                ? liveStatus.total
                : null;


        const safeAction =
            this.escapeHTML(
                app?.action || ""
            );

        const safeIcon =
            this.escapeHTML(
                app?.icon || "◈"
            );

        const safeTitle =
            this.escapeHTML(
                app?.title || "Organ"
            );

        const safeSubtitle =
            this.escapeHTML(
                app?.subtitle ||
                "VAERO Engine organı"
            );


        return `

            <button
                type="button"
                class="card organ-launcher-card"
                data-action="${safeAction}"
                style="
                    width:100%;
                    min-width:0;
                    min-height:92px;
                    padding:12px;
                    display:grid;
                    grid-template-columns:
                        38px
                        minmax(0,1fr)
                        auto;
                    align-items:center;
                    gap:10px;
                    text-align:left;
                    position:relative;
                    overflow:hidden;
                "
            >

                <span
                    aria-hidden="true"
                    style="
                        width:38px;
                        height:38px;
                        display:grid;
                        place-items:center;
                        border:
                            1px solid
                            var(--engine-line);
                        border-radius:12px;
                        background:
                            rgba(
                                255,
                                255,
                                255,
                                .025
                            );
                        color:
                            var(--engine-gold-soft);
                        font-size:15px;
                    "
                >
                    ${safeIcon}
                </span>


                <span
                    style="
                        min-width:0;
                        display:block;
                    "
                >

                    <strong
                        style="
                            display:block;
                            overflow:hidden;
                            color:
                                var(--engine-text);
                            font-size:11px;
                            font-weight:650;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                        "
                    >
                        ${safeTitle}
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
                        ${safeSubtitle}
                    </small>


                    ${
                        total !== null
                            ? `
                                <small
                                    style="
                                        display:block;
                                        margin-top:5px;
                                        color:
                                            var(--engine-dim);
                                        font-size:7px;
                                    "
                                >
                                    <strong
                                        style="
                                            color:
                                                var(--engine-text);
                                            font-size:8px;
                                        "
                                    >
                                        ${total}
                                    </strong>

                                    kayıt
                                </small>
                              `
                            : ""
                    }

                </span>


                <span
                    style="
                        display:flex;
                        align-items:center;
                        gap:5px;
                        padding:4px 6px;
                        border:
                            1px solid
                            var(--engine-line);
                        border-radius:999px;
                        background:
                            rgba(
                                255,
                                255,
                                255,
                                .018
                            );
                        color:
                            ${statusUI.color};
                        font-size:6px;
                        font-weight:700;
                        white-space:nowrap;
                    "
                >

                    <span
                        aria-hidden="true"
                        style="
                            width:6px;
                            height:6px;
                            border-radius:50%;
                            background:
                                ${statusUI.color};
                            box-shadow:
                                0
                                0
                                7px
                                ${statusUI.glow};
                        "
                    ></span>

                    ${statusUI.label}

                </span>

            </button>

        `;

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(entity){

        this.enterBrainContext();


        const organs =
            this.getRegisteredOrgans();

        const liveStatuses =
            this.getLiveStatuses();


        const activeConnections =
            liveStatuses.filter(
                item =>
                    item &&
                    item.status === "active"
            ).length;


        return `

            <div
                class="section"
                style="
                    margin:0;
                    padding:16px;
                    overflow:hidden;
                "
            >

                <button
                    type="button"
                    class="secondary-btn"
                    data-action="entity:dashboard"
                    style="
                        margin-bottom:8px;
                    "
                >
                    ← Varlık Kontrol Paneli
                </button>


                <div
                    class="card"
                    style="
                        padding:13px;
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:14px;
                    "
                >

                    <div
                        style="
                            min-width:0;
                        "
                    >

                        <div class="eyebrow">
                            ORGAN LAUNCHER
                        </div>

                        <h2
                            style="
                                margin:3px 0 0;
                                color:
                                    var(--engine-text);
                                font-size:17px;
                            "
                        >
                            Organlar
                        </h2>

                        <p
                            style="
                                margin:4px 0 0;
                                max-width:520px;
                                color:
                                    var(--engine-muted);
                                font-size:8px;
                                line-height:1.4;
                            "
                        >
                            Her organ bağımsız çalışan bir
                            Engine uygulamasıdır. Canlı durumunu
                            açmadan önce görebilirsin.
                        </p>

                    </div>


                    <div
                        style="
                            flex:0 0 auto;
                            display:flex;
                            align-items:center;
                            gap:6px;
                        "
                    >

                        <span
                            style="
                                padding:5px 8px;
                                border-radius:999px;
                                background:
                                    rgba(
                                        255,
                                        255,
                                        255,
                                        .025
                                    );
                                color:
                                    var(--engine-muted);
                                font-size:7px;
                                white-space:nowrap;
                            "
                        >
                            ${organs.length} organ
                        </span>


                        <span
                            style="
                                padding:5px 8px;
                                border-radius:999px;
                                background:
                                    rgba(
                                        100,
                                        216,
                                        157,
                                        .045
                                    );
                                color:
                                    var(--engine-green);
                                font-size:7px;
                                white-space:nowrap;
                            "
                        >
                            ${activeConnections} canlı
                        </span>

                    </div>

                </div>


                ${
                    organs.length
                        ? `
                            <div
                                class="grid grid-2"
                                style="
                                    margin-top:8px;
                                    gap:7px;
                                "
                            >

                                ${organs
                                    .map(
                                        app =>
                                            this.renderOrganCard(
                                                app,
                                                liveStatuses
                                            )
                                    )
                                    .join("")}

                            </div>
                          `
                        : `
                            <div
                                class="engine-empty-state"
                                style="
                                    margin-top:8px;
                                "
                            >
                                <strong>
                                    Organ bulunamadı
                                </strong>

                                Organ Registry şu anda
                                kullanılabilir bir organ
                                döndürmedi.
                            </div>
                          `
                }

            </div>

        `;

    }

};


window.OrgansApp =
    OrgansApp; 
