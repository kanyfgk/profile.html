/* =========================================================
   VAERO TIMELINE APP
   Chronological Life Event References
========================================================= */

const TimelineApp = {

    visibleLimit: 8,


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
                typeof awareness.enter === "function"
            ){

                awareness.enter(
                    "timeline"
                );

            }

        } catch(error){

            console.warn(
                "Timeline Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       TIMELINE CORE
    ===================================================== */

    getTimelineCore(){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
            ){
                return null;
            }

            return (
                VAERO.get("timeline") ||
                null
            );

        } catch(error){

            console.warn(
                "Timeline core okunamadı:",
                error
            );

            return null;

        }

    },


    cleanOrphans(timeline){

        if(
            !timeline ||
            typeof timeline.cleanOrphanLifeEvents !==
                "function"
        ){
            return;
        }


        try{

            timeline.cleanOrphanLifeEvents();

        } catch(error){

            console.warn(
                "Timeline orphan kayıtları temizlenemedi:",
                error
            );

        }

    },


    getEvents(timeline){

        if(
            !timeline ||
            typeof timeline.all !== "function"
        ){
            return [];
        }


        try{

            const events =
                timeline.all();

            return Array.isArray(events)
                ? events
                : [];

        } catch(error){

            console.warn(
                "Timeline kayıtları okunamadı:",
                error
            );

            return [];

        }

    },


    /* =====================================================
       DATE
    ===================================================== */

    formatDate(timestamp){

        const numericTimestamp =
            Number(timestamp);


        if(
            !Number.isFinite(
                numericTimestamp
            ) ||
            numericTimestamp <= 0
        ){

            return "Tarih bilinmiyor";

        }


        const date =
            new Date(
                numericTimestamp
            );


        if(
            Number.isNaN(
                date.getTime()
            )
        ){

            return "Tarih bilinmiyor";

        }


        try{

            return new Intl.DateTimeFormat(
                "tr-TR",
                {
                    day:"2-digit",
                    month:"long",
                    year:"numeric",
                    hour:"2-digit",
                    minute:"2-digit"
                }
            ).format(date);

        } catch(error){

            return date.toLocaleString();

        }

    },


    /* =====================================================
       IMPORTANCE
    ===================================================== */

    getImportanceLabel(
        importance
    ){

        const labels = {

            low:"Düşük",
            medium:"Orta",
            high:"Yüksek",
            critical:"Kritik"

        };


        return labels[importance] ||
            "Orta";

    },


    getImportanceColor(
        importance
    ){

        if(
            importance === "critical"
        ){
            return "var(--engine-danger)";
        }

        if(
            importance === "high"
        ){
            return "var(--engine-gold)";
        }

        if(
            importance === "low"
        ){
            return "var(--engine-muted)";
        }

        return "var(--engine-blue)";

    },


    /* =====================================================
       LIFE EVENT RESOLUTION
    ===================================================== */

    resolveLifeEvent(
        timelineEvent,
        timeline
    ){

        if(
            !timelineEvent ||
            timelineEvent.type !==
                "life-event" ||
            !timeline ||
            typeof timeline.resolveLifeEvent !==
                "function"
        ){

            return null;

        }


        try{

            return (
                timeline.resolveLifeEvent(
                    timelineEvent
                ) ||
                null
            );

        } catch(error){

            console.warn(
                "Timeline Evolution referansı çözülemedi:",
                error
            );

            return null;

        }

    },


    /* =====================================================
       TIMELINE EVENT
    ===================================================== */

    renderTimelineEvent(
        timelineEvent,
        timeline
    ){

        const lifeEvent =
            this.resolveLifeEvent(
                timelineEvent,
                timeline
            );


        const title =
            lifeEvent?.title ||
            timelineEvent?.title ||
            "Timeline Olayı";


        const description =
            lifeEvent?.description ||
            timelineEvent?.description ||
            "";


        const importance =
            lifeEvent?.importance ||
            "medium";


        const occurredAt =
            lifeEvent?.occurredAt ||
            lifeEvent?.createdAt ||
            timelineEvent?.occurredAt ||
            timelineEvent?.createdAt;


        const importanceColor =
            this.getImportanceColor(
                importance
            );


        return `
            <article
                class="card timeline-event-card"
                ${
                    lifeEvent?.id
                        ? `
                            data-action="timeline:life-event:open"
                            data-event-id="${this.escapeHTML(
                                lifeEvent.id
                            )}"
                          `
                        : ""
                }
                style="
                    min-width:0;
                    padding:10px 11px;
                    cursor:
                        ${
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
                        gap:9px;
                    "
                >

                    <div
                        style="
                            min-width:0;
                        "
                    >

                        <div
                            style="
                                color:
                                    ${
                                        lifeEvent
                                            ? "var(--engine-gold)"
                                            : "var(--engine-muted)"
                                    };
                                font-size:6px;
                                font-weight:700;
                                letter-spacing:.11em;
                                text-transform:uppercase;
                            "
                        >
                            ${
                                lifeEvent
                                    ? "Evolution Referansı"
                                    : this.escapeHTML(
                                        timelineEvent?.type ||
                                        "Timeline"
                                    )
                            }
                        </div>


                        <h3
                            style="
                                margin:4px 0 0;
                                overflow:hidden;
                                color:
                                    var(--engine-text);
                                font-size:10px;
                                line-height:1.3;
                                text-overflow:ellipsis;
                                white-space:nowrap;
                            "
                        >
                            ${this.escapeHTML(
                                title
                            )}
                        </h3>


                        ${
                            description
                                ? `
                                    <p
                                        style="
                                            margin:4px 0 0;
                                            display:-webkit-box;
                                            overflow:hidden;
                                            color:
                                                var(--engine-muted);
                                            font-size:7px;
                                            line-height:1.35;
                                            -webkit-line-clamp:2;
                                            -webkit-box-orient:
                                                vertical;
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
                                        display:flex;
                                        align-items:center;
                                        gap:4px;
                                        padding:4px 6px;
                                        border:
                                            1px solid
                                            ${importanceColor};
                                        border-radius:999px;
                                        color:
                                            ${importanceColor};
                                        font-size:6px;
                                        white-space:nowrap;
                                    "
                                >

                                    <span
                                        aria-hidden="true"
                                        style="
                                            width:5px;
                                            height:5px;
                                            border-radius:50%;
                                            background:
                                                ${importanceColor};
                                        "
                                    ></span>

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
                        margin-top:7px;
                        padding-top:6px;
                        border-top:
                            1px solid
                            var(--engine-line);
                        display:flex;
                        justify-content:space-between;
                        gap:8px;
                        color:
                            var(--engine-dim);
                        font-size:6px;
                    "
                >

                    <span>
                        ${this.escapeHTML(
                            this.formatDate(
                                occurredAt
                            )
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


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    renderEmptyState(){

        return `
            <div
                class="engine-empty-state"
                style="
                    margin-top:7px;
                "
            >

                <strong>
                    Timeline henüz boş
                </strong>

                Yeni Evolution olayları
                oluşturulduğunda kronolojik
                referansları burada görünecek.

            </div>
        `;

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(entity){

        this.enterBrainContext();


        const timeline =
            this.getTimelineCore();


        this.cleanOrphans(
            timeline
        );


        const timelineEvents =
            this.getEvents(
                timeline
            );


        const sortedEvents =
            [...timelineEvents]
                .filter(Boolean)
                .sort(
                    (a, b) => {

                        const bTime =
                            Number(
                                b.occurredAt ||
                                b.createdAt ||
                                0
                            );

                        const aTime =
                            Number(
                                a.occurredAt ||
                                a.createdAt ||
                                0
                            );


                        return (
                            bTime -
                            aTime
                        );

                    }
                );


        const visibleEvents =
            sortedEvents.slice(
                0,
                this.visibleLimit
            );


        const safeName =
            this.escapeHTML(
                entity?.name ||
                "VAERO Varlığı"
            );


        return `
            <div
                class="
                    section
                    timeline-app
                "
                style="
                    margin:0;
                    padding:16px;
                    overflow:hidden;
                "
            >

                <button
                    type="button"
                    class="secondary-btn"
                    data-action="entity:organs"
                    style="
                        margin-bottom:8px;
                    "
                >
                    ← Organlara Dön
                </button>


                ${UI.appHeader(
                    safeName,
                    "TIMELINE APP",
                    "🕓"
                )}


                ${UI.appCard(
                    "ZAMAN AKIŞI",
                    "Evolution olaylarının kronolojik referansları burada gösterilir."
                )}


                <section
                    style="
                        margin-top:8px;
                    "
                >

                    <div
                        style="
                            display:flex;
                            align-items:flex-end;
                            justify-content:space-between;
                            gap:10px;
                        "
                    >

                        <div>

                            <div class="eyebrow">
                                KRONOLOJİ
                            </div>

                            <h2
                                style="
                                    margin:2px 0 0;
                                    color:
                                        var(--engine-text);
                                    font-size:13px;
                                "
                            >
                                Yaşam Akışı
                            </h2>

                        </div>


                        <div
                            style="
                                display:flex;
                                align-items:center;
                                gap:5px;
                            "
                        >

                            <span
                                style="
                                    padding:4px 7px;
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
                                        var(--engine-muted);
                                    font-size:6px;
                                    white-space:nowrap;
                                "
                            >
                                ${sortedEvents.length}
                                kayıt
                            </span>


                            ${
                                sortedEvents.length >
                                visibleEvents.length
                                    ? `
                                        <span
                                            style="
                                                color:
                                                    var(--engine-dim);
                                                font-size:6px;
                                                white-space:nowrap;
                                            "
                                        >
                                            Son
                                            ${visibleEvents.length}
                                        </span>
                                      `
                                    : ""
                            }

                        </div>

                    </div>


                    ${
                        visibleEvents.length
                            ? `
                                <div
                                    style="
                                        display:grid;
                                        grid-template-columns:
                                            repeat(
                                                2,
                                                minmax(0,1fr)
                                            );
                                        gap:6px;
                                        margin-top:7px;
                                    "
                                >

                                    ${visibleEvents
                                        .map(
                                            event =>
                                                this.renderTimelineEvent(
                                                    event,
                                                    timeline
                                                )
                                        )
                                        .join("")}

                                </div>
                              `
                            : this.renderEmptyState()
                    }

                </section>


                ${UI.brainPanel()}

            </div>
        `;

    }

};


window.TimelineApp =
    TimelineApp;
