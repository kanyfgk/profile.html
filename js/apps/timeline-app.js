const TimelineApp = {

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

    getImportanceLabel(importance){

        const labels = {
            low: "Düşük",
            medium: "Orta",
            high: "Yüksek",
            critical: "Kritik"
        };

        return labels[importance] || "Orta";

    },

    renderTimelineEvent(timelineEvent, timeline){

        const lifeEvent =
            timelineEvent.type === "life-event" &&
            typeof timeline.resolveLifeEvent === "function"
                ? timeline.resolveLifeEvent(timelineEvent)
                : null;

        /*
         * Life Event referansıysa gerçek veriyi Evolution’dan al.
         * Normal Timeline kayıtlarında mevcut Timeline verisini kullan.
         */
        const title =
            lifeEvent?.title ||
            timelineEvent.title ||
            "Timeline Olayı";

        const description =
            lifeEvent?.description || "";

        const importance =
            lifeEvent?.importance || "medium";

        const occurredAt =
            lifeEvent?.occurredAt ||
            lifeEvent?.createdAt ||
            timelineEvent.createdAt;

        return `
            <article
                class="card"
                ${
                    lifeEvent
                        ? `
                            data-action="timeline:life-event:open"
                            data-event-id="${this.escapeHTML(
                                lifeEvent.id
                            )}"
                        `
                        : ""
                }
                style="
                    ${Theme.card}
                    padding:18px;
                    margin-top:12px;
                    cursor:${
                        lifeEvent
                            ? "pointer"
                            : "default"
                    };
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
                                color:#f5d796;
                                font-size:11px;
                                letter-spacing:.14em;
                                text-transform:uppercase;
                            "
                        >
                            ${
                                lifeEvent
                                    ? "Evolution Referansı"
                                    : this.escapeHTML(
                                        timelineEvent.type ||
                                        "Timeline"
                                    )
                            }
                        </div>

                        <h3
                            style="
                                margin:9px 0 0;
                                font-size:18px;
                                line-height:1.4;
                            "
                        >
                            ${this.escapeHTML(title)}
                        </h3>

                        ${
                            description
                                ? `
                                    <p
                                        style="
                                            margin-top:9px;
                                            color:var(--muted);
                                            font-size:14px;
                                            line-height:1.65;
                                        "
                                    >
                                        ${this.escapeHTML(
                                            description
                                        )}
                                    </p>
                                `
                                : ""
                        }
                    </div>

                    ${
                        lifeEvent
                            ? `
                                <span
                                    style="
                                        flex:0 0 auto;
                                        padding:6px 9px;
                                        border-radius:999px;
                                        background:rgba(255,255,255,.04);
                                        border:1px solid rgba(255,255,255,.08);
                                        color:var(--muted);
                                        font-size:11px;
                                    "
                                >
                                    ${this.escapeHTML(
                                        this.getImportanceLabel(
                                            importance
                                        )
                                    )}
                                </span>
                            `
                            : ""
                    }
                </div>

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        gap:12px;
                        margin-top:15px;
                        padding-top:13px;
                        border-top:1px solid rgba(255,255,255,.06);
                        color:var(--muted);
                        font-size:11px;
                    "
                >
                    <span>
                        ${this.escapeHTML(
                            this.formatDate(occurredAt)
                        )}
                    </span>

                    <span>
                        ${
                            lifeEvent
                                ? "Evolution’a bağlı"
                                : "Timeline kaydı"
                        }
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
            awareness.enter("timeline");
        }

        const timeline =
            VAERO.get("timeline");

        if(
            timeline &&
            typeof timeline.cleanOrphanLifeEvents === "function"
        ){
            timeline.cleanOrphanLifeEvents();
        }

        const timelineEvents =
            timeline &&
            typeof timeline.all === "function"
                ? timeline.all()
                : [];

        const sortedEvents = [...timelineEvents]
            .sort((a, b) =>
                Number(b.createdAt || 0) -
                Number(a.createdAt || 0)
            );

        return `
            <div
                class="section timeline-app"
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

                ${UI.appHeader(
                    entity.name,
                    "TIMELINE APP",
                    "🕓"
                )}

                ${UI.appCard(
                    "ZAMAN AKIŞI",
                    "Evolution olaylarının kronolojik referansları burada gösterilir."
                )}

                <section style="margin-top:22px;">
                    <div
                        style="
                            display:flex;
                            align-items:flex-end;
                            justify-content:space-between;
                            gap:14px;
                        "
                    >
                        <div>
                            <div class="eyebrow">
                                KRONOLOJİ
                            </div>

                            <h2 style="margin-top:7px;">
                                Yaşam Akışı
                            </h2>
                        </div>

                        <span
                            style="
                                color:var(--muted);
                                font-size:12px;
                            "
                        >
                            ${sortedEvents.length} kayıt
                        </span>
                    </div>

                    ${
                        sortedEvents.length
                            ? sortedEvents
                                .map(event =>
                                    this.renderTimelineEvent(
                                        event,
                                        timeline
                                    )
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
                                        🕓
                                    </div>

                                    <h3 style="margin-top:14px;">
                                        Timeline henüz boş
                                    </h3>

                                    <p
                                        style="
                                            margin-top:8px;
                                            color:var(--muted);
                                            line-height:1.6;
                                        "
                                    >
                                        Yeni Evolution olayları
                                        oluşturulduğunda kronolojik
                                        referansları burada görünecek.
                                    </p>
                                </div>
                            `
                    }
                </section>
            </div>
        `;

    }

};

window.TimelineApp = TimelineApp;
