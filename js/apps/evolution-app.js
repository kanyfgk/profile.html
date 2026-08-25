/* =========================================================
   VAERO EVOLUTION APP
   Life Events / Progress / Organ Impact
========================================================= */

const EvolutionApp = {

    activeFilter: "all",

    selectedEventId: null,


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
                    "evolution"
                );

            }

        } catch(error){

            console.warn(
                "Evolution Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       EVOLUTION CORE
    ===================================================== */

    getEvolutionCore(){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
            ){
                return null;
            }

            return VAERO.get(
                "evolution"
            ) || null;

        } catch(error){

            console.warn(
                "Evolution core okunamadı:",
                error
            );

            return null;

        }

    },


    getEvents(){

        const evolution =
            this.getEvolutionCore();


        if(
            !evolution ||
            typeof evolution.all !==
                "function"
        ){
            return [];
        }


        try{

            const events =
                evolution.all();

            return Array.isArray(events)
                ? events
                : [];

        } catch(error){

            console.warn(
                "Evolution olayları okunamadı:",
                error
            );

            return [];

        }

    },


    /* =====================================================
       FILTER
    ===================================================== */

    setFilter(filter){

        const allowedFilters = [
            "all",
            "important",
            "achievement",
            "goal",
            "finance"
        ];


        this.activeFilter =
            allowedFilters.includes(
                filter
            )
                ? filter
                : "all";


        return this.activeFilter;

    },


    filterEvents(events = []){

        if(!Array.isArray(events)){
            return [];
        }


        if(
            this.activeFilter ===
            "important"
        ){

            return events.filter(
                event =>
                    event &&
                    (
                        event.importance ===
                            "high" ||
                        event.importance ===
                            "critical"
                    )
            );

        }


        if(
            this.activeFilter ===
            "achievement"
        ){

            return events.filter(
                event =>
                    event &&
                    event.type ===
                        "achievement"
            );

        }


        if(
            this.activeFilter ===
            "goal"
        ){

            return events.filter(
                event =>
                    event &&
                    event.type ===
                        "goal"
            );

        }


        if(
            this.activeFilter ===
            "finance"
        ){

            return events.filter(
                event =>
                    event &&
                    event.type ===
                        "finance"
            );

        }


        return events;

    },


    /* =====================================================
       EVENT SELECTION
    ===================================================== */

    selectEvent(eventId){

        this.selectedEventId =
            String(
                eventId || ""
            ).trim() || null;


        return this.selectedEventId;

    },


    clearSelectedEvent(){

        this.selectedEventId =
            null;

        return true;

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
       LABELS
    ===================================================== */

    getTypeLabel(type){

        const labels = {

            achievement:"Başarı",
            decision:"Karar",
            failure:"Başarısızlık",
            relationship:"İlişki",
            work:"İş",
            health:"Sağlık",
            finance:"Finans",
            location:"Konum",
            goal:"Hedef",
            milestone:"Dönüm Noktası",
            general:"Genel"

        };


        return labels[type] ||
            "Genel";

    },


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
            importance ===
            "critical"
        ){

            return "var(--engine-danger)";

        }


        if(
            importance ===
            "high"
        ){

            return "var(--engine-gold)";

        }


        if(
            importance ===
            "low"
        ){

            return "var(--engine-muted)";

        }


        return "var(--engine-blue)";

    },


    /* =====================================================
       XP
    ===================================================== */

    getEventXP(event = {}){

        const directXP =
            Number(
                event.xp
            );


        if(
            Number.isFinite(
                directXP
            ) &&
            directXP > 0
        ){

            return directXP;

        }


        const payloadXP =
            Number(
                event.payload?.xp
            );


        if(
            Number.isFinite(
                payloadXP
            ) &&
            payloadXP > 0
        ){

            return payloadXP;

        }


        const importanceXP = {

            low:5,
            medium:10,
            high:25,
            critical:50

        };


        return (
            importanceXP[
                event.importance
            ] ||
            10
        );

    },


    getEvolutionProgress(
        totalXP = 0
    ){

        const safeXP =
            Math.max(
                0,
                Number(totalXP) || 0
            );


        const level =
            Math.floor(
                safeXP / 100
            ) + 1;


        const currentLevelXP =
            safeXP % 100;


        const nextLevelXP =
            100;


        const progressPercent =
            Math.min(
                100,
                Math.round(
                    (
                        currentLevelXP /
                        nextLevelXP
                    ) * 100
                )
            );


        return {
            level,
            totalXP:safeXP,
            currentLevelXP,
            nextLevelXP,
            progressPercent
        };

    },


    /* =====================================================
       AFFECTED ORGANS
    ===================================================== */

    getAffectedOrgans(
        event = {}
    ){

        const organs =
            new Set(
                (
                    Array.isArray(
                        event.organs
                    )
                        ? event.organs
                        : []
                )
                    .map(
                        value =>
                            String(
                                value || ""
                            )
                                .trim()
                                .toLowerCase()
                    )
                    .filter(Boolean)
            );


        const searchableText = [

            event.type,
            event.title,
            event.description,
            event.source,
            event.payload?.action,
            event.payload?.category

        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        if(
            searchableText.includes(
                "memory"
            ) ||
            searchableText.includes(
                "hafıza"
            ) ||
            searchableText.includes(
                "hatıra"
            )
        ){

            organs.add(
                "memory"
            );

        }


        if(
            searchableText.includes(
                "timeline"
            ) ||
            searchableText.includes(
                "zaman çizelgesi"
            ) ||
            searchableText.includes(
                "geçmiş"
            )
        ){

            organs.add(
                "timeline"
            );

        }


        if(
            searchableText.includes(
                "identity"
            ) ||
            searchableText.includes(
                "kimlik"
            ) ||
            searchableText.includes(
                "doğrulama"
            )
        ){

            organs.add(
                "identity"
            );

        }


        if(
            searchableText.includes(
                "profile"
            ) ||
            searchableText.includes(
                "profil"
            )
        ){

            organs.add(
                "profile"
            );

        }


        if(
            searchableText.includes(
                "bridge"
            ) ||
            searchableText.includes(
                "köprü"
            ) ||
            searchableText.includes(
                "bağlantı"
            )
        ){

            organs.add(
                "bridge"
            );

        }


        if(
            searchableText.includes(
                "finance"
            ) ||
            searchableText.includes(
                "finans"
            ) ||
            searchableText.includes(
                "satış"
            ) ||
            searchableText.includes(
                "ödeme"
            ) ||
            searchableText.includes(
                "gelir"
            )
        ){

            organs.add(
                "finance"
            );

        }


        if(
            event.type ===
            "achievement"
        ){

            organs.add(
                "timeline"
            );

            organs.add(
                "memory"
            );

        }


        if(
            event.type ===
            "engine:start"
        ){

            organs.add(
                "timeline"
            );

        }


        return [
            ...organs
        ];

    },


    /* =====================================================
       ORGAN LABEL
    ===================================================== */

    getOrganLabel(id){

        try{

            if(
                typeof OrganRegistry !==
                    "undefined" &&
                typeof OrganRegistry.find ===
                    "function"
            ){

                const organ =
                    OrganRegistry.find(
                        id
                    );


                if(organ){

                    return [
                        organ.icon,
                        organ.title
                    ]
                        .filter(Boolean)
                        .join(" ");

                }

            }

        } catch(error){

            console.warn(
                "Organ etiketi okunamadı:",
                error
            );

        }


        return String(
            id || "organ"
        );

    },


    /* =====================================================
       LINKED RECORDS
    ===================================================== */

    getLinkedRecordCounts(
        event = {}
    ){

        if(!event.id){

            return {
                timeline:0,
                memory:0
            };

        }


        let timelineEvents =
            [];

        let memoryRecords =
            [];


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.get ===
                    "function"
            ){

                const timeline =
                    VAERO.get(
                        "timeline"
                    );

                const memory =
                    VAERO.get(
                        "memorySystem"
                    );


                if(
                    timeline &&
                    typeof timeline.all ===
                        "function"
                ){

                    const result =
                        timeline.all();

                    timelineEvents =
                        Array.isArray(
                            result
                        )
                            ? result
                            : [];

                }


                if(
                    memory &&
                    typeof memory.all ===
                        "function"
                ){

                    const result =
                        memory.all();

                    memoryRecords =
                        Array.isArray(
                            result
                        )
                            ? result
                            : [];

                }

            }

        } catch(error){

            console.warn(
                "Evolution bağlantılı kayıtları okunamadı:",
                error
            );

        }


        return {

            timeline:
                timelineEvents.filter(
                    item =>
                        item &&
                        item.payload &&
                        item.payload
                            .sourceEventId ===
                            event.id
                ).length,

            memory:
                memoryRecords.filter(
                    item =>
                        item &&
                        item.payload &&
                        item.payload
                            .sourceEventId ===
                            event.id
                ).length

        };

    },


    /* =====================================================
       BRAIN ANALYSIS
    ===================================================== */

    getBrainAnalysis(
        event = {}
    ){

        let summary =
            "Bu olay varlığın yaşam akışına kaydedildi.";

        let impact =
            "Orta";

        let risk =
            "Düşük";

        let suggestion =
            "Olayın gelecekteki etkileri izlenebilir.";


        if(
            event.type ===
            "achievement"
        ){

            summary =
                "Bu olay varlığın gelişiminde olumlu bir ilerleme oluşturuyor.";

            impact =
                "Yüksek";

            suggestion =
                "Bu başarı yeni bir hedef veya dönüm noktasıyla ilişkilendirilebilir.";

        }
        else if(
            event.type ===
            "failure"
        ){

            summary =
                "Bu olay başarısızlık olarak görünse de deneyim ve öğrenme üretiyor.";

            impact =
                "Yüksek";

            risk =
                "Orta";

            suggestion =
                "Sebep, sonuç ve çıkarılan dersler Hafıza organına eklenebilir.";

        }
        else if(
            event.type ===
            "goal"
        ){

            summary =
                "Bu olay geleceğe yönelik bir gelişim yönü oluşturuyor.";

            suggestion =
                "Hedef için ölçülebilir adımlar ve tamamlanma tarihi belirlenebilir.";

        }
        else if(
            event.type ===
            "finance"
        ){

            summary =
                "Bu olay varlığın finansal gelişimini veya yükümlülüklerini etkiliyor.";

            impact =
                "Yüksek";

            risk =
                "Orta";

            suggestion =
                "Ödeme, gelir, borç ve sonuç bilgileri düzenli olarak güncellenebilir.";

        }
        else if(
            event.type ===
            "decision"
        ){

            summary =
                "Bu karar varlığın sonraki yaşam akışını değiştirebilir.";

            suggestion =
                "Kararın nedeni ve sonraki sonuçları Timeline üzerinden izlenebilir.";

        }


        if(
            event.importance ===
            "critical"
        ){

            impact =
                "Kritik";

            risk =
                "Yüksek";

        }
        else if(
            event.importance ===
            "high"
        ){

            impact =
                "Yüksek";

        }


        const affectedOrgans =
            this.getAffectedOrgans(
                event
            );


        if(
            affectedOrgans.includes(
                "memory"
            )
        ){

            suggestion =
                "Bu olay hafızada uzun süreli iz bırakabilir.";

        }


        if(
            affectedOrgans.includes(
                "identity"
            )
        ){

            impact =
                "Yüksek";

        }


        if(
            affectedOrgans.includes(
                "timeline"
            )
        ){

            summary +=
                " Timeline üzerinde önemli bir kayıt oluşturdu.";

        }


        return {
            summary,
            impact,
            risk,
            suggestion
        };

    },


    /* =====================================================
       EFFECTS
    ===================================================== */

    renderEffects(
        effects = {}
    ){

        const entries =
            Object.entries(
                effects
            );


        if(
            entries.length === 0
        ){
            return "";
        }


        return `
            <div
                style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:5px;
                    margin-top:8px;
                "
            >

                ${entries
                    .map(
                        ([name, value]) => {

                            const numericValue =
                                Number(value);

                            const safeValue =
                                Number.isFinite(
                                    numericValue
                                )
                                    ? numericValue
                                    : 0;

                            return `
                                <span
                                    style="
                                        padding:4px 7px;
                                        border-radius:999px;
                                        border:
                                            1px solid
                                            var(--engine-line);
                                        background:
                                            rgba(
                                                255,
                                                255,
                                                255,
                                                .02
                                            );
                                        color:
                                            var(--engine-muted);
                                        font-size:7px;
                                    "
                                >
                                    ${this.escapeHTML(
                                        name
                                    )}

                                    <strong
                                        style="
                                            color:
                                                var(--engine-text);
                                            margin-left:3px;
                                        "
                                    >
                                        ${
                                            safeValue > 0
                                                ? "+"
                                                : ""
                                        }${safeValue}
                                    </strong>
                                </span>
                            `;

                        }
                    )
                    .join("")}

            </div>
        `;

    },


    /* =====================================================
       EVOLUTION PROGRESS
    ===================================================== */

    renderEvolutionProgress(
        progress = {}
    ){

        return `
            <section
                class="card"
                style="
                    margin-top:7px;
                    padding:12px;
                "
            >

                <div
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:10px;
                    "
                >

                    <div>

                        <div
                            style="
                                color:
                                    var(--engine-muted);
                                font-size:7px;
                            "
                        >
                            EVOLUTION SEVİYESİ
                        </div>

                        <strong
                            style="
                                display:block;
                                margin-top:2px;
                                color:
                                    var(--engine-text);
                                font-size:15px;
                            "
                        >
                            Seviye
                            ${progress.level}
                        </strong>

                    </div>


                    <strong
                        style="
                            color:
                                var(--engine-gold-soft);
                            font-size:9px;
                        "
                    >
                        ${progress.totalXP}
                        XP
                    </strong>

                </div>


                <div
                    style="
                        margin-top:8px;
                        height:5px;
                        overflow:hidden;
                        border-radius:999px;
                        background:
                            rgba(
                                255,
                                255,
                                255,
                                .05
                            );
                    "
                >

                    <div
                        style="
                            width:
                                ${progress.progressPercent}%;
                            height:100%;
                            border-radius:999px;
                            background:
                                linear-gradient(
                                    90deg,
                                    var(--engine-gold),
                                    var(--engine-gold-soft)
                                );
                        "
                    ></div>

                </div>


                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        gap:8px;
                        margin-top:5px;
                        color:
                            var(--engine-muted);
                        font-size:6px;
                    "
                >

                    <span>
                        ${progress.currentLevelXP}
                        /
                        ${progress.nextLevelXP}
                        XP
                    </span>

                    <span>
                        %${progress.progressPercent}
                    </span>

                </div>

            </section>
        `;

    },


    /* =====================================================
       EVENT CARD
    ===================================================== */

    renderEvent(event){

        const importanceColor =
            this.getImportanceColor(
                event.importance
            );


        const affectedOrgans =
            this.getAffectedOrgans(
                event
            );


        return `
            <article
                class="
                    card
                    evolution-event-card
                "
                data-action="evolution:event:open"
                data-event-id="${this.escapeHTML(
                    event.id
                )}"
                style="
                    padding:11px;
                "
            >

                <div
                    style="
                        display:flex;
                        align-items:flex-start;
                        justify-content:space-between;
                        gap:10px;
                    "
                >

                    <div
                        style="
                            min-width:0;
                        "
                    >

                        <div
                            style="
                                display:flex;
                                gap:5px;
                                flex-wrap:wrap;
                                margin-bottom:6px;
                            "
                        >

                            <span
                                style="
                                    padding:4px 6px;
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
                                    font-size:6px;
                                "
                            >
                                ${this.escapeHTML(
                                    this.getTypeLabel(
                                        event.type
                                    )
                                )}
                            </span>


                            <span
                                style="
                                    padding:4px 6px;
                                    border-radius:999px;
                                    border:
                                        1px solid
                                        ${importanceColor};
                                    color:
                                        ${importanceColor};
                                    font-size:6px;
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
                                event.title ||
                                "Yaşam olayı"
                            )}
                        </h3>


                        ${
                            event.description
                                ? `
                                    <p
                                        style="
                                            margin:4px 0 0;
                                            display:
                                                -webkit-box;
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
                                            event.description
                                        )}
                                    </p>
                                  `
                                : ""
                        }

                    </div>


                    <span
                        aria-hidden="true"
                        style="
                            width:7px;
                            height:7px;
                            flex:0 0 7px;
                            margin-top:3px;
                            border-radius:50%;
                            background:
                                ${importanceColor};
                            box-shadow:
                                0
                                0
                                8px
                                ${importanceColor};
                        "
                    ></span>

                </div>


                ${this.renderEffects(
                    event.effects
                )}


                ${
                    affectedOrgans.length
                        ? `
                            <div
                                style="
                                    display:flex;
                                    flex-wrap:wrap;
                                    gap:4px;
                                    margin-top:7px;
                                "
                            >

                                ${affectedOrgans
                                    .slice(0, 4)
                                    .map(
                                        id => `
                                            <span
                                                style="
                                                    padding:
                                                        3px
                                                        6px;
                                                    border-radius:
                                                        999px;
                                                    background:
                                                        rgba(
                                                            255,
                                                            255,
                                                            255,
                                                            .018
                                                        );
                                                    border:
                                                        1px solid
                                                        var(--engine-line);
                                                    color:
                                                        var(--engine-muted);
                                                    font-size:
                                                        6px;
                                                "
                                            >
                                                ${this.escapeHTML(
                                                    this.getOrganLabel(
                                                        id
                                                    )
                                                )}
                                            </span>
                                        `
                                    )
                                    .join("")}

                            </div>
                          `
                        : ""
                }


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
                                event.occurredAt ||
                                event.createdAt
                            )
                        )}
                    </span>

                    <span>
                        ${this.escapeHTML(
                            event.status ||
                            "completed"
                        )}
                    </span>

                </div>

            </article>
        `;

    },

    /* =====================================================
       FILTER BAR
    ===================================================== */

    renderFilters(){

        const filters = [

            {
                id:"all",
                label:"Tümü"
            },

            {
                id:"important",
                label:"Önemli"
            },

            {
                id:"achievement",
                label:"Başarılar"
            },

            {
                id:"goal",
                label:"Hedefler"
            },

            {
                id:"finance",
                label:"Finans"
            }

        ];


        return `
            <div
                style="
                    display:flex;
                    gap:5px;
                    overflow-x:auto;
                    padding:7px 0 3px;
                    scrollbar-width:none;
                "
            >

                ${filters
                    .map(
                        filter => {

                            const isActive =
                                this.activeFilter ===
                                filter.id;

                            return `
                                <button
                                    type="button"
                                    data-action="evolution:filter"
                                    data-filter="${filter.id}"
                                    style="
                                        flex:0 0 auto;
                                        padding:
                                            5px
                                            8px;
                                        border:
                                            1px solid
                                            ${
                                                isActive
                                                    ? "rgba(223,189,122,.34)"
                                                    : "var(--engine-line)"
                                            };
                                        border-radius:
                                            999px;
                                        background:
                                            ${
                                                isActive
                                                    ? "rgba(223,189,122,.07)"
                                                    : "rgba(255,255,255,.018)"
                                            };
                                        color:
                                            ${
                                                isActive
                                                    ? "var(--engine-gold-soft)"
                                                    : "var(--engine-muted)"
                                            };
                                        font-size:7px;
                                        font-weight:650;
                                        white-space:nowrap;
                                    "
                                >
                                    ${filter.label}
                                </button>
                            `;

                        }
                    )
                    .join("")}

            </div>
        `;

    },


    /* =====================================================
       STAT
    ===================================================== */

    renderStat(
        label,
        value
    ){

        return `
            <div
                class="card"
                style="
                    min-width:0;
                    padding:10px 11px;
                "
            >

                <span
                    style="
                        display:block;
                        color:
                            var(--engine-muted);
                        font-size:6px;
                    "
                >
                    ${this.escapeHTML(
                        label
                    )}
                </span>

                <strong
                    style="
                        display:block;
                        margin-top:2px;
                        color:
                            var(--engine-text);
                        font-size:15px;
                        font-weight:650;
                    "
                >
                    ${this.escapeHTML(
                        value
                    )}
                </strong>

            </div>
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
                    Henüz yaşam olayı yok
                </strong>

                Yeni bir olay oluştuğunda
                Evolution akışında burada görünecek.

            </div>
        `;

    },


    /* =====================================================
       SELECTED EVENT MODAL
    ===================================================== */

    renderSelectedEvent(
        selectedEvent
    ){

        if(!selectedEvent){
            return "";
        }


        const analysis =
            this.getBrainAnalysis(
                selectedEvent
            );


        const affectedOrgans =
            this.getAffectedOrgans(
                selectedEvent
            );


        const linkedRecords =
            this.getLinkedRecordCounts(
                selectedEvent
            );


        const importanceColor =
            this.getImportanceColor(
                selectedEvent.importance
            );


        const identities =
            Array.isArray(
                selectedEvent.identities
            )
                ? selectedEvent.identities
                : [];


        return `
            <div
                style="
                    position:fixed;
                    inset:0;
                    z-index:9998;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    padding:12px;
                    background:
                        rgba(
                            2,
                            8,
                            18,
                            .76
                        );
                    backdrop-filter:
                        blur(12px);
                "
            >

                <section
                    class="card"
                    style="
                        width:
                            min(
                                100%,
                                580px
                            );
                        max-height:
                            min(
                                82dvh,
                                680px
                            );
                        overflow-y:auto;
                        overscroll-behavior:
                            contain;
                        padding:16px;
                        border-radius:20px;
                    "
                >

                    <!-- HEADER -->

                    <div
                        style="
                            display:flex;
                            align-items:flex-start;
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
                                YAŞAM OLAYI
                            </div>

                            <h2
                                style="
                                    margin:4px 0 0;
                                    color:
                                        var(--engine-text);
                                    font-size:18px;
                                    line-height:1.2;
                                "
                            >
                                ${this.escapeHTML(
                                    selectedEvent.title ||
                                    "Yaşam olayı"
                                )}
                            </h2>

                        </div>


                        <button
                            type="button"
                            data-action="evolution:event:close"
                            aria-label="Olay detayını kapat"
                            style="
                                width:32px;
                                height:32px;
                                flex:0 0 32px;
                                display:grid;
                                place-items:center;
                                border:
                                    1px solid
                                    var(--engine-line);
                                border-radius:50%;
                                background:
                                    rgba(
                                        255,
                                        255,
                                        255,
                                        .025
                                    );
                                color:
                                    var(--engine-text);
                                font-size:15px;
                            "
                        >
                            ×
                        </button>

                    </div>


                    <!-- TAGS -->

                    <div
                        style="
                            display:flex;
                            flex-wrap:wrap;
                            gap:5px;
                            margin-top:9px;
                        "
                    >

                        <span
                            style="
                                padding:4px 7px;
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
                            "
                        >
                            ${this.escapeHTML(
                                this.getTypeLabel(
                                    selectedEvent.type
                                )
                            )}
                        </span>


                        <span
                            style="
                                padding:4px 7px;
                                border:
                                    1px solid
                                    ${importanceColor};
                                border-radius:999px;
                                color:
                                    ${importanceColor};
                                font-size:7px;
                            "
                        >
                            ${this.escapeHTML(
                                this.getImportanceLabel(
                                    selectedEvent.importance
                                )
                            )}
                        </span>

                    </div>


                    ${
                        selectedEvent.description
                            ? `
                                <p
                                    style="
                                        margin:10px 0 0;
                                        color:
                                            var(--engine-muted);
                                        font-size:8px;
                                        line-height:1.5;
                                    "
                                >
                                    ${this.escapeHTML(
                                        selectedEvent.description
                                    )}
                                </p>
                              `
                            : ""
                    }


                    ${this.renderEffects(
                        selectedEvent.effects
                    )}


                    <!-- XP / ORGANS -->

                    <div
                        style="
                            margin-top:10px;
                            display:grid;
                            grid-template-columns:
                                minmax(0,.7fr)
                                minmax(0,1.3fr);
                            gap:7px;
                        "
                    >

                        <div
                            class="card"
                            style="
                                padding:10px;
                            "
                        >

                            <span
                                style="
                                    display:block;
                                    color:
                                        var(--engine-muted);
                                    font-size:6px;
                                "
                            >
                                KAZANILAN DENEYİM
                            </span>

                            <strong
                                style="
                                    display:block;
                                    margin-top:3px;
                                    color:
                                        var(--engine-gold-soft);
                                    font-size:16px;
                                "
                            >
                                +${this.getEventXP(
                                    selectedEvent
                                )} XP
                            </strong>

                        </div>


                        <div
                            class="card"
                            style="
                                padding:10px;
                            "
                        >

                            <span
                                style="
                                    display:block;
                                    color:
                                        var(--engine-muted);
                                    font-size:6px;
                                "
                            >
                                ETKİLENEN ORGANLAR
                            </span>


                            <div
                                style="
                                    display:flex;
                                    flex-wrap:wrap;
                                    gap:4px;
                                    margin-top:5px;
                                "
                            >

                                ${
                                    affectedOrgans.length
                                        ? affectedOrgans
                                            .map(
                                                id => `
                                                    <span
                                                        style="
                                                            padding:
                                                                3px
                                                                6px;
                                                            border:
                                                                1px solid
                                                                var(--engine-line);
                                                            border-radius:
                                                                999px;
                                                            background:
                                                                rgba(
                                                                    255,
                                                                    255,
                                                                    255,
                                                                    .018
                                                                );
                                                            color:
                                                                var(--engine-muted);
                                                            font-size:
                                                                6px;
                                                        "
                                                    >
                                                        ${this.escapeHTML(
                                                            this.getOrganLabel(
                                                                id
                                                            )
                                                        )}
                                                    </span>
                                                `
                                            )
                                            .join("")
                                        : `
                                            <span
                                                style="
                                                    color:
                                                        var(--engine-dim);
                                                    font-size:7px;
                                                "
                                            >
                                                Yok
                                            </span>
                                          `
                                }

                            </div>

                        </div>

                    </div>


                    <!-- BRAIN ANALYSIS -->

                    <div
                        style="
                            margin-top:7px;
                            padding:11px;
                            border:
                                1px solid
                                rgba(
                                    107,
                                    183,
                                    241,
                                    .12
                                );
                            border-radius:14px;
                            background:
                                rgba(
                                    107,
                                    183,
                                    241,
                                    .035
                                );
                        "
                    >

                        <div
                            style="
                                display:flex;
                                align-items:center;
                                gap:6px;
                            "
                        >

                            <span
                                aria-hidden="true"
                                style="
                                    font-size:13px;
                                "
                            >
                                🧠
                            </span>

                            <strong
                                style="
                                    color:
                                        var(--engine-text);
                                    font-size:9px;
                                "
                            >
                                Brain Analizi
                            </strong>

                        </div>


                        <p
                            style="
                                margin:7px 0 0;
                                color:
                                    var(--engine-muted);
                                font-size:8px;
                                line-height:1.45;
                            "
                        >
                            ${this.escapeHTML(
                                analysis.summary
                            )}
                        </p>


                        <div
                            style="
                                display:grid;
                                grid-template-columns:
                                    repeat(
                                        2,
                                        minmax(0,1fr)
                                    );
                                gap:6px;
                                margin-top:8px;
                            "
                        >

                            <div
                                style="
                                    padding:8px;
                                    border-radius:10px;
                                    background:
                                        rgba(
                                            255,
                                            255,
                                            255,
                                            .022
                                        );
                                "
                            >

                                <span
                                    style="
                                        display:block;
                                        color:
                                            var(--engine-muted);
                                        font-size:6px;
                                    "
                                >
                                    Etki
                                </span>

                                <strong
                                    style="
                                        display:block;
                                        margin-top:2px;
                                        color:
                                            var(--engine-text);
                                        font-size:8px;
                                    "
                                >
                                    ${this.escapeHTML(
                                        analysis.impact
                                    )}
                                </strong>

                            </div>


                            <div
                                style="
                                    padding:8px;
                                    border-radius:10px;
                                    background:
                                        rgba(
                                            255,
                                            255,
                                            255,
                                            .022
                                        );
                                "
                            >

                                <span
                                    style="
                                        display:block;
                                        color:
                                            var(--engine-muted);
                                        font-size:6px;
                                    "
                                >
                                    Risk
                                </span>

                                <strong
                                    style="
                                        display:block;
                                        margin-top:2px;
                                        color:
                                            var(--engine-text);
                                        font-size:8px;
                                    "
                                >
                                    ${this.escapeHTML(
                                        analysis.risk
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div
                            style="
                                margin-top:8px;
                                padding-top:7px;
                                border-top:
                                    1px solid
                                    var(--engine-line);
                            "
                        >

                            <span
                                style="
                                    display:block;
                                    color:
                                        var(--engine-muted);
                                    font-size:6px;
                                "
                            >
                                ÖNERİ
                            </span>

                            <p
                                style="
                                    margin:3px 0 0;
                                    color:
                                        var(--engine-text);
                                    font-size:8px;
                                    line-height:1.4;
                                "
                            >
                                ${this.escapeHTML(
                                    analysis.suggestion
                                )}
                            </p>

                        </div>

                    </div>


                    <!-- FUTURE IMPACT -->

                    <div
                        style="
                            margin-top:7px;
                            padding:10px;
                            border:
                                1px solid
                                rgba(
                                    223,
                                    189,
                                    122,
                                    .11
                                );
                            border-radius:13px;
                            background:
                                rgba(
                                    223,
                                    189,
                                    122,
                                    .03
                                );
                        "
                    >

                        <span
                            style="
                                display:block;
                                color:
                                    var(--engine-muted);
                                font-size:6px;
                            "
                        >
                            GELECEK ETKİSİ
                        </span>

                        <strong
                            style="
                                display:block;
                                margin-top:3px;
                                color:
                                    var(--engine-text);
                                font-size:8px;
                                line-height:1.4;
                            "
                        >
                            ${
                                analysis.impact ===
                                "Kritik"
                                    ? "Bu olay gelecekte birden fazla organı doğrudan etkileyebilir."
                                    : analysis.impact ===
                                      "Yüksek"
                                        ? "Bu olay sonraki kararları ve gelişim yönünü belirleyebilir."
                                        : "Bu olay yaşam akışında izlenmesi gereken bir kayıt oluşturur."
                            }
                        </strong>

                    </div>


                    <!-- META -->

                    <div
                        style="
                            margin-top:7px;
                            display:grid;
                            grid-template-columns:
                                repeat(
                                    3,
                                    minmax(0,1fr)
                                );
                            gap:6px;
                        "
                    >

                        <div
                            class="card"
                            style="
                                min-width:0;
                                padding:8px;
                            "
                        >

                            <span
                                style="
                                    display:block;
                                    color:
                                        var(--engine-muted);
                                    font-size:6px;
                                "
                            >
                                TARİH
                            </span>

                            <strong
                                style="
                                    display:block;
                                    margin-top:2px;
                                    overflow:hidden;
                                    color:
                                        var(--engine-text);
                                    font-size:7px;
                                    text-overflow:ellipsis;
                                    white-space:nowrap;
                                "
                            >
                                ${this.escapeHTML(
                                    this.formatDate(
                                        selectedEvent.occurredAt ||
                                        selectedEvent.createdAt
                                    )
                                )}
                            </strong>

                        </div>


                        <div
                            class="card"
                            style="
                                min-width:0;
                                padding:8px;
                            "
                        >

                            <span
                                style="
                                    display:block;
                                    color:
                                        var(--engine-muted);
                                    font-size:6px;
                                "
                            >
                                DURUM
                            </span>

                            <strong
                                style="
                                    display:block;
                                    margin-top:2px;
                                    overflow:hidden;
                                    color:
                                        var(--engine-text);
                                    font-size:7px;
                                    text-overflow:ellipsis;
                                    white-space:nowrap;
                                "
                            >
                                ${this.escapeHTML(
                                    selectedEvent.status ||
                                    "completed"
                                )}
                            </strong>

                        </div>


                        <div
                            class="card"
                            style="
                                min-width:0;
                                padding:8px;
                            "
                        >

                            <span
                                style="
                                    display:block;
                                    color:
                                        var(--engine-muted);
                                    font-size:6px;
                                "
                            >
                                KAYNAK
                            </span>

                            <strong
                                style="
                                    display:block;
                                    margin-top:2px;
                                    overflow:hidden;
                                    color:
                                        var(--engine-text);
                                    font-size:7px;
                                    text-overflow:ellipsis;
                                    white-space:nowrap;
                                "
                            >
                                ${this.escapeHTML(
                                    selectedEvent.source ||
                                    "user"
                                )}
                            </strong>

                        </div>

                    </div>


                    <!-- LINKED RECORDS -->

                    <div
                        style="
                            margin-top:7px;
                            display:grid;
                            grid-template-columns:
                                repeat(
                                    2,
                                    minmax(0,1fr)
                                );
                            gap:6px;
                        "
                    >

                        <button
                            type="button"
                            data-action="evolution:linked:open"
                            data-target="timeline"
                            class="card"
                            style="
                                padding:9px;
                                text-align:left;
                            "
                        >

                            <span
                                style="
                                    display:block;
                                    color:
                                        var(--engine-muted);
                                    font-size:6px;
                                "
                            >
                                TIMELINE BAĞLANTISI
                            </span>

                            <strong
                                style="
                                    display:block;
                                    margin-top:2px;
                                    color:
                                        var(--engine-text);
                                    font-size:14px;
                                "
                            >
                                ${linkedRecords.timeline}
                            </strong>

                        </button>


                        <button
                            type="button"
                            data-action="evolution:linked:open"
                            data-target="memory"
                            class="card"
                            style="
                                padding:9px;
                                text-align:left;
                            "
                        >

                            <span
                                style="
                                    display:block;
                                    color:
                                        var(--engine-muted);
                                    font-size:6px;
                                "
                            >
                                HAFIZA BAĞLANTISI
                            </span>

                            <strong
                                style="
                                    display:block;
                                    margin-top:2px;
                                    color:
                                        var(--engine-text);
                                    font-size:14px;
                                "
                            >
                                ${linkedRecords.memory}
                            </strong>

                        </button>

                    </div>


                    <!-- IDENTITIES -->

                    <div
                        style="
                            margin-top:7px;
                            padding-top:7px;
                            border-top:
                                1px solid
                                var(--engine-line);
                            color:
                                var(--engine-muted);
                            font-size:7px;
                        "
                    >

                        Etkilenen Kimlikler:

                        <strong
                            style="
                                color:
                                    var(--engine-text);
                            "
                        >
                            ${
                                identities.length
                                    ? identities
                                        .map(
                                            identity =>
                                                this.escapeHTML(
                                                    identity
                                                )
                                        )
                                        .join(", ")
                                    : "Yok"
                            }
                        </strong>

                    </div>

                </section>

            </div>
        `;

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(entity){

        this.enterBrainContext();


        const evolution =
            this.getEvolutionCore();


        const events =
            this.getEvents();


        const selectedEvent =
            this.selectedEventId &&
            evolution &&
            typeof evolution.find ===
                "function"
                ? (() => {

                    try{

                        return (
                            evolution.find(
                                this.selectedEventId
                            ) ||
                            null
                        );

                    } catch(error){

                        console.warn(
                            "Evolution olayı açılamadı:",
                            error
                        );

                        return null;

                    }

                })()
                : null;


        if(
            this.selectedEventId &&
            !selectedEvent
        ){

            this.clearSelectedEvent();

        }


        const importantCount =
            events.filter(
                event =>
                    event &&
                    (
                        event.importance ===
                            "high" ||
                        event.importance ===
                            "critical"
                    )
            ).length;


        const achievementCount =
            events.filter(
                event =>
                    event &&
                    event.type ===
                        "achievement"
            ).length;


        const totalXP =
            events.reduce(
                (
                    total,
                    event
                ) =>
                    total +
                    this.getEventXP(
                        event
                    ),
                0
            );


        const progress =
            this.getEvolutionProgress(
                totalXP
            );


        const filteredEvents =
            this.filterEvents(
                events
            );


        const recentEvents =
            filteredEvents.slice(
                0,
                8
            );


        return `
            <div
                class="
                    section
                    evolution-app
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


                <!-- TOP -->

                <section
                    class="card"
                    style="
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
                            EVOLUTION
                        </div>

                        <h2
                            style="
                                margin:3px 0 0;
                                color:
                                    var(--engine-text);
                                font-size:17px;
                            "
                        >
                            Yaşam ve Gelişim
                        </h2>

                        <p
                            style="
                                margin:3px 0 0;
                                color:
                                    var(--engine-muted);
                                font-size:8px;
                                line-height:1.4;
                            "
                        >
                            Varlığın yaşam olayları,
                            gelişimi ve etkileri burada birleşir.
                        </p>

                    </div>


                    <span
                        aria-hidden="true"
                        style="
                            flex:0 0 auto;
                            font-size:24px;
                        "
                    >
                        🧬
                    </span>

                </section>


                <!-- SUMMARY -->

                <section
                    style="
                        margin-top:7px;
                        display:grid;
                        grid-template-columns:
                            repeat(
                                4,
                                minmax(0,1fr)
                            );
                        gap:6px;
                    "
                >

                    ${this.renderStat(
                        "Toplam Olay",
                        events.length
                    )}

                    ${this.renderStat(
                        "Önemli Olay",
                        importantCount
                    )}

                    ${this.renderStat(
                        "Başarı",
                        achievementCount
                    )}

                    ${this.renderStat(
                        "Toplam XP",
                        totalXP
                    )}

                </section>


                ${this.renderEvolutionProgress(
                    progress
                )}


                <!-- LIFE FLOW -->

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
                                YAŞAM AKIŞI
                            </div>

                            <h2
                                style="
                                    margin:2px 0 0;
                                    color:
                                        var(--engine-text);
                                    font-size:13px;
                                "
                            >
                                Son Olaylar
                            </h2>

                        </div>


                        <span
                            style="
                                color:
                                    var(--engine-dim);
                                font-size:6px;
                            "
                        >
                            ${recentEvents.length}
                            gösteriliyor
                        </span>

                    </div>


                    ${this.renderFilters()}


                    ${
                        recentEvents.length
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
                                        margin-top:4px;
                                    "
                                >

                                    ${recentEvents
                                        .map(
                                            event =>
                                                this.renderEvent(
                                                    event
                                                )
                                        )
                                        .join("")}

                                </div>
                              `
                            : this.renderEmptyState()
                    }

                </section>


                ${this.renderSelectedEvent(
                    selectedEvent
                )}

            </div>
        `;

    }

};


window.EvolutionApp =
    EvolutionApp;
