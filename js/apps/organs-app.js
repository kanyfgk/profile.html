const OrgansApp = {

    render(entity){

        const awareness = VAERO.get("brainAwareness");

        if(
            awareness &&
            typeof awareness.enter === "function"
        ){
            awareness.enter("organs");
        }

        const organStatus = VAERO.get("organStatus");

        const liveStatuses =
            organStatus &&
            typeof organStatus.all === "function"
                ? organStatus.all()
                : [];

        const findLiveStatus = app => {

            const searchableText = [
                app.id,
                app.title,
                app.action
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            if(
                searchableText.includes("memory") ||
                searchableText.includes("hafıza") ||
                searchableText.includes("hafiza")
            ){
                return liveStatuses.find(
                    item => item.id === "memory"
                ) || null;
            }

            if(
                searchableText.includes("timeline") ||
                searchableText.includes("zaman")
            ){
                return liveStatuses.find(
                    item => item.id === "timeline"
                ) || null;
            }

            if(
                searchableText.includes("evolution") ||
                searchableText.includes("evrim")
            ){
                return liveStatuses.find(
                    item => item.id === "evolution"
                ) || null;
            }

            return null;

        };

        const getStatusLabel = status => {

            if(status === "active"){
                return "Aktif";
            }

            if(status === "missing"){
                return "Bağlı değil";
            }

            return "Hazır";

        };

        const getStatusColor = status => {

            if(status === "active"){
                return "var(--green)";
            }

            if(status === "missing"){
                return "#ff6b6b";
            }

            return "var(--muted)";

        };

        const makeCard = app => {

            const liveStatus = findLiveStatus(app);

            const status =
                liveStatus?.status || "ready";

            const total =
                Number.isFinite(liveStatus?.total)
                    ? liveStatus.total
                    : null;

            return `
                <div
                    class="card organ-launcher-card"
                    data-action="${app.action}"
                    style="
                        ${Theme.card}
                        cursor:pointer;
                        min-height:178px;
                        display:flex;
                        flex-direction:column;
                        align-items:center;
                        justify-content:center;
                        text-align:center;
                        position:relative;
                        overflow:hidden;
                    "
                >
                    <div
                        style="
                            position:absolute;
                            top:14px;
                            right:14px;
                            display:flex;
                            align-items:center;
                            gap:6px;
                            padding:6px 9px;
                            border:1px solid rgba(255,255,255,.08);
                            border-radius:999px;
                            background:rgba(255,255,255,.025);
                            font-size:11px;
                            color:${getStatusColor(status)};
                        "
                    >
                        <span
                            style="
                                width:7px;
                                height:7px;
                                border-radius:50%;
                                background:${getStatusColor(status)};
                                box-shadow:0 0 10px ${getStatusColor(status)};
                            "
                        ></span>

                        ${getStatusLabel(status)}
                    </div>

                    <div style="font-size:${Theme.icon.large}px;">
                        ${app.icon}
                    </div>

                    <h3
                        style="
                            margin-top:16px;
                            font-size:20px;
                            font-weight:600;
                        "
                    >
                        ${app.title}
                    </h3>

                    <div
                        style="
                            color:var(--muted);
                            margin-top:8px;
                            font-size:14px;
                            line-height:1.5;
                        "
                    >
                        ${app.subtitle}
                    </div>

                    ${
                        total !== null
                            ? `
                                <div
                                    style="
                                        margin-top:16px;
                                        padding:8px 12px;
                                        border-radius:12px;
                                        background:rgba(255,255,255,.035);
                                        border:1px solid rgba(255,255,255,.06);
                                        font-size:12px;
                                        color:var(--muted);
                                    "
                                >
                                    <strong
                                        style="
                                            color:var(--text);
                                            font-size:15px;
                                        "
                                    >
                                        ${total}
                                    </strong>

                                    kayıt
                                </div>
                            `
                            : ""
                    }
                </div>
            `;

        };

        return `
            <div
                class="section"
                style="
                    margin-top:24px;
                    padding:24px;
                "
            >

                <button
                    class="secondary-btn"
                    data-action="entity:dashboard"
                    style="margin-bottom:18px;"
                >
                    ← Varlık Kontrol Paneli
                </button>

                <div class="card" style="${Theme.card}">
                    <div class="eyebrow">
                        ORGAN LAUNCHER
                    </div>

                    <h2 style="margin-top:8px;">
                        Organlar
                    </h2>

                    <p
                        style="
                            margin-top:10px;
                            color:var(--muted);
                            line-height:1.7;
                        "
                    >
                        Her organ bağımsız çalışan bir uygulamadır.
                        Canlı durumlarını açmadan önce görebilirsin.
                    </p>

                    <div
                        style="
                            margin-top:16px;
                            display:flex;
                            gap:10px;
                            flex-wrap:wrap;
                        "
                    >
                        <span
                            style="
                                padding:7px 10px;
                                border-radius:999px;
                                background:rgba(255,255,255,.035);
                                color:var(--muted);
                                font-size:12px;
                            "
                        >
                            ${OrganRegistry.all().length} organ
                        </span>

                        <span
                            style="
                                padding:7px 10px;
                                border-radius:999px;
                                background:rgba(50,210,130,.08);
                                color:var(--green);
                                font-size:12px;
                            "
                        >
                            ${liveStatuses.filter(
                                item => item.status === "active"
                            ).length} canlı veri bağlantısı
                        </span>
                    </div>
                </div>

                <div
                    class="grid grid-2"
                    style="margin-top:20px;"
                >
                    ${OrganRegistry
                        .all()
                        .map(app => makeCard(app))
                        .join("")}
                </div>

            </div>
        `;

    }

};
