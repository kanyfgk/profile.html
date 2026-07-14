const EvolutionApp = {

    escapeHTML(value){

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    },

    formatDate(timestamp){

        const date = new Date(
            Number(timestamp) || Date.now()
        );

        return new Intl.DateTimeFormat(
            "tr-TR",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(date);

    },

    getTypeLabel(type){

        const labels = {
            achievement: "Başarı",
            decision: "Karar",
            failure: "Başarısızlık",
            relationship: "İlişki",
            work: "İş",
            health: "Sağlık",
            finance: "Finans",
            location: "Konum",
            goal: "Hedef",
            milestone: "Dönüm Noktası",
            general: "Genel"
        };

        return labels[type] || "Genel";

    },

    getImportanceLabel(importance){

        const labels = {
            low: "Düşük",
            medium: "Orta",
            high: "Yüksek",
            critical: "Kritik"
        };

        return labels[importance] || "Orta";

    },

    getImportanceColor(importance){

        if(importance === "critical"){
            return "#ff5c75";
        }

        if(importance === "high"){
            return "#f5c96a";
        }

        if(importance === "low"){
            return "var(--muted)";
        }

        return "#70a7ff";

    },

    renderEffects(effects = {}){

        const entries = Object.entries(effects);

        if(entries.length === 0){
            return "";
        }

        return `
            <div
                style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px;
                    margin-top:14px;
                "
            >
                ${entries.map(([name, value]) => `
                    <span
                        style="
                            padding:7px 10px;
                            border-radius:999px;
                            border:1px solid rgba(255,255,255,.07);
                            background:rgba(255,255,255,.035);
                            color:var(--muted);
                            font-size:12px;
                        "
                    >
                        ${this.escapeHTML(name)}

                        <strong
                            style="
                                color:var(--text);
                                margin-left:4px;
                            "
                        >
                            ${Number(value) > 0 ? "+" : ""}
                            ${Number(value)}
                        </strong>
                    </span>
                `).join("")}
            </div>
        `;

    },

    renderEvent(event){

        const importanceColor =
            this.getImportanceColor(
                event.importance
            );

        return `
            <article
                class="card evolution-event-card"
                style="
                    ${Theme.card}
                    padding:18px;
                    margin-top:12px;
                "
            >
                <div
                    style="
                        display:flex;
                        align-items:flex-start;
                        justify-content:space-between;
                        gap:14px;
                    "
                >
                    <div style="min-width:0;">
                        <div
                            style="
                                display:flex;
                                gap:8px;
                                flex-wrap:wrap;
                                margin-bottom:10px;
                            "
                        >
                            <span
                                style="
                                    padding:6px 9px;
                                    border-radius:999px;
                                    background:rgba(255,255,255,.04);
                                    color:var(--muted);
                                    font-size:11px;
                                "
                            >
                                ${this.escapeHTML(
                                    this.getTypeLabel(event.type)
                                )}
                            </span>

                            <span
                                style="
                                    padding:6px 9px;
                                    border-radius:999px;
                                    border:1px solid ${importanceColor};
                                    color:${importanceColor};
                                    font-size:11px;
                                "
                            >
                                ${this.escapeHTML(
                                    this.getImportanceLabel(
                                        event.importance
                                    )
                                )}
                            </span>
                        </div>

                        <h3
                            style="
                                margin:0;
                                font-size:18px;
                                line-height:1.35;
                            "
                        >
                            ${this.escapeHTML(
                                event.title || "Yaşam olayı"
                            )}
                        </h3>

                        ${
                            event.description
                                ? `
                                    <p
                                        style="
                                            margin-top:9px;
                                            color:var(--muted);
                                            line-height:1.65;
                                            font-size:14px;
                                        "
                                    >
                                        ${this.escapeHTML(
                                            event.description
                                        )}
                                    </p>
                                `
                                : ""
                        }
                    </div>

                    <div
                        style="
                            width:10px;
                            height:10px;
                            flex:0 0 auto;
                            margin-top:5px;
                            border-radius:50%;
                            background:${importanceColor};
                            box-shadow:0 0 14px ${importanceColor};
                        "
                    ></div>
                </div>

                ${this.renderEffects(event.effects)}

                <div
                    style="
                        margin-top:15px;
                        padding-top:13px;
                        border-top:1px solid rgba(255,255,255,.055);
                        display:flex;
                        justify-content:space-between;
                        gap:12px;
                        color:var(--muted);
                        font-size:11px;
                    "
                >
                    <span>
                        ${this.escapeHTML(
                            this.formatDate(
                                event.occurredAt ||
                                event.createdAt
                            )
                        )}
                    </span>

                    <span>
                        ${this.escapeHTML(
                            event.status || "completed"
                        )}
                    </span>
                </div>
            </article>
        `;

    },

    render(entity){

        const awareness =
            VAERO.get("brainAwareness");

        if(
            awareness &&
            typeof awareness.enter === "function"
        ){
            awareness.enter("evolution");
        }

        const evolution =
            VAERO.get("evolution");

        const events =
            evolution &&
            typeof evolution.all === "function"
                ? evolution.all()
                : [];

        const importantCount =
            events.filter(event =>
                event.importance === "high" ||
                event.importance === "critical"
            ).length;

        const achievementCount =
            events.filter(event =>
                event.type === "achievement"
            ).length;

        const totalEffects =
            events.reduce(
                (total, event) => {

                    const effects =
                        event.effects &&
                        typeof event.effects === "object"
                            ? event.effects
                            : {};

                    return total +
                        Object.values(effects)
                            .reduce(
                                (sum, value) =>
                                    sum + (
                                        Number(value) || 0
                                    ),
                                0
                            );

                },
                0
            );

        const recentEvents =
            events.slice(0, 8);

        return `
            <div
                class="section evolution-app"
                style="
                    margin-top:24px;
                    padding:24px;
                "
            >
                <button
                    class="secondary-btn"
                    data-action="entity:organs"
                    style="margin-bottom:18px;"
                >
                    ← Organlara Dön
                </button>

                <section
                    class="card"
                    style="
                        ${Theme.card}
                        padding:22px;
                    "
                >
                    <div class="eyebrow">
                        EVOLUTION
                    </div>

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:space-between;
                            gap:18px;
                            margin-top:8px;
                        "
                    >
                        <div>
                            <h2 style="margin:0;">
                                Yaşam ve Gelişim
                            </h2>

                            <p
                                style="
                                    margin-top:10px;
                                    color:var(--muted);
                                    line-height:1.65;
                                "
                            >
                                Varlığın yaşam olayları,
                                gelişimi ve etkileri burada
                                birleşir.
                            </p>
                        </div>

                        <div
                            style="
                                font-size:44px;
                                flex:0 0 auto;
                            "
                        >
                            🧬
                        </div>
                    </div>
                </section>

                <section
                    style="
                        display:grid;
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                        gap:12px;
                        margin-top:16px;
                    "
                >
                    <div
                        class="card"
                        style="
                            ${Theme.card}
                            padding:16px;
                        "
                    >
                        <div
                            style="
                                color:var(--muted);
                                font-size:12px;
                            "
                        >
                            Toplam Olay
                        </div>

                        <strong
                            style="
                                display:block;
                                margin-top:7px;
                                font-size:27px;
                            "
                        >
                            ${events.length}
                        </strong>
                    </div>

                    <div
                        class="card"
                        style="
                            ${Theme.card}
                            padding:16px;
                        "
                    >
                        <div
                            style="
                                color:var(--muted);
                                font-size:12px;
                            "
                        >
                            Önemli Olay
                        </div>

                        <strong
                            style="
                                display:block;
                                margin-top:7px;
                                font-size:27px;
                            "
                        >
                            ${importantCount}
                        </strong>
                    </div>

                    <div
                        class="card"
                        style="
                            ${Theme.card}
                            padding:16px;
                        "
                    >
                        <div
                            style="
                                color:var(--muted);
                                font-size:12px;
                            "
                        >
                            Başarı
                        </div>

                        <strong
                            style="
                                display:block;
                                margin-top:7px;
                                font-size:27px;
                            "
                        >
                            ${achievementCount}
                        </strong>
                    </div>

                    <div
                        class="card"
                        style="
                            ${Theme.card}
                            padding:16px;
                        "
                    >
                        <div
                            style="
                                color:var(--muted);
                                font-size:12px;
                            "
                        >
                            Toplam Etki
                        </div>

                        <strong
                            style="
                                display:block;
                                margin-top:7px;
                                font-size:27px;
                            "
                        >
                            ${totalEffects}
                        </strong>
                    </div>
                </section>

                <section style="margin-top:24px;">
                    <div
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:space-between;
                            gap:14px;
                        "
                    >
                        <div>
                            <div class="eyebrow">
                                YAŞAM AKIŞI
                            </div>

                            <h2
                                style="
                                    margin-top:7px;
                                    font-size:22px;
                                "
                            >
                                Son Olaylar
                            </h2>
                        </div>

                        <span
                            style="
                                color:var(--muted);
                                font-size:12px;
                            "
                        >
                            ${recentEvents.length} gösteriliyor
                        </span>
                    </div>

                    ${
                        recentEvents.length > 0
                            ? recentEvents
                                .map(event =>
                                    this.renderEvent(event)
                                )
                                .join("")
                            : `
                                <div
                                    class="card"
                                    style="
                                        ${Theme.card}
                                        margin-top:14px;
                                        padding:28px;
                                        text-align:center;
                                    "
                                >
                                    <div style="font-size:38px;">
                                        🧬
                                    </div>

                                    <h3 style="margin-top:14px;">
                                        Henüz yaşam olayı yok
                                    </h3>

                                    <p
                                        style="
                                            margin-top:8px;
                                            color:var(--muted);
                                            line-height:1.6;
                                        "
                                    >
                                        Yeni bir olay oluşturulduğunda
                                        burada görünecek.
                                    </p>
                                </div>
                            `
                    }
                </section>
            </div>
        `;

    }

};

window.EvolutionApp = EvolutionApp;
