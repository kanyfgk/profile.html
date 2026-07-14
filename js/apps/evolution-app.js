const EvolutionApp = {
    activeFilter: "all",

    setFilter(filter){

        const allowedFilters = [
            "all",
            "important",
            "achievement",
            "goal",
            "finance"
        ];

        this.activeFilter = allowedFilters.includes(filter)
            ? filter
            : "all";

        return this.activeFilter;

    },

    selectedEventId: null,

selectEvent(eventId){

    this.selectedEventId =
        String(eventId || "").trim() || null;

    return this.selectedEventId;

},

clearSelectedEvent(){

    this.selectedEventId = null;

    return true;

},

    filterEvents(events = []){

        if(!Array.isArray(events)){
            return [];
        }

        if(this.activeFilter === "important"){
            return events.filter(event =>
                event.importance === "high" ||
                event.importance === "critical"
            );
        }

        if(this.activeFilter === "achievement"){
            return events.filter(event =>
                event.type === "achievement"
            );
        }

        if(this.activeFilter === "goal"){
            return events.filter(event =>
                event.type === "goal"
            );
        }

        if(this.activeFilter === "finance"){
            return events.filter(event =>
                event.type === "finance"
            );
        }

        return events;

    },

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

    getEventXP(event = {}){

    const directXP = Number(event.xp);

    if(
        Number.isFinite(directXP) &&
        directXP > 0
    ){
        return directXP;
    }

    const payloadXP = Number(
        event.payload?.xp
    );

    if(
        Number.isFinite(payloadXP) &&
        payloadXP > 0
    ){
        return payloadXP;
    }

    const importanceXP = {
        low: 5,
        medium: 10,
        high: 25,
        critical: 50
    };

    return importanceXP[event.importance] || 10;

},

    getEvolutionProgress(totalXP = 0){

    const safeXP = Math.max(
        0,
        Number(totalXP) || 0
    );

    const level = Math.floor(
        safeXP / 100
    ) + 1;

    const currentLevelXP =
        safeXP % 100;

    const nextLevelXP = 100;

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
        totalXP: safeXP,
        currentLevelXP,
        nextLevelXP,
        progressPercent
    };

},

    renderEvolutionProgress(progress = {}){

    return `
        <section
            class="card"
            style="
                ${Theme.card}
                margin-top:16px;
                padding:20px;
            "
        >
            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:16px;
                "
            >
                <div>
                    <div
                        style="
                            color:var(--muted);
                            font-size:12px;
                        "
                    >
                        EVOLUTION SEVİYESİ
                    </div>

                    <strong
                        style="
                            display:block;
                            margin-top:6px;
                            font-size:28px;
                        "
                    >
                        Seviye ${progress.level}
                    </strong>
                </div>

                <div
                    style="
                        color:#f5d796;
                        font-size:14px;
                        font-weight:600;
                    "
                >
                    ${progress.totalXP} XP
                </div>
            </div>

            <div
                style="
                    margin-top:18px;
                    height:9px;
                    overflow:hidden;
                    border-radius:999px;
                    background:rgba(255,255,255,.06);
                "
            >
                <div
                    style="
                        width:${progress.progressPercent}%;
                        height:100%;
                        border-radius:999px;
                        background:linear-gradient(
                            90deg,
                            #b89045,
                            #f5d796
                        );
                    "
                ></div>
            </div>

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:12px;
                    margin-top:9px;
                    color:var(--muted);
                    font-size:11px;
                "
            >
                <span>
                    ${progress.currentLevelXP} / ${progress.nextLevelXP} XP
                </span>

                <span>
                    %${progress.progressPercent}
                </span>
            </div>
        </section>
    `;

},
    
getAffectedOrgans(event = {}){

    const organs = new Set(
        (Array.isArray(event.organs)
            ? event.organs
            : []
        )
            .map(value =>
                String(value || "")
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
        searchableText.includes("memory") ||
        searchableText.includes("hafıza") ||
        searchableText.includes("hatıra")
    ){
        organs.add("memory");
    }

    if(
        searchableText.includes("timeline") ||
        searchableText.includes("zaman çizelgesi") ||
        searchableText.includes("geçmiş")
    ){
        organs.add("timeline");
    }

    if(
        searchableText.includes("identity") ||
        searchableText.includes("kimlik") ||
        searchableText.includes("doğrulama")
    ){
        organs.add("identity");
    }

    if(
        searchableText.includes("profile") ||
        searchableText.includes("profil")
    ){
        organs.add("profile");
    }

    if(
        searchableText.includes("bridge") ||
        searchableText.includes("köprü") ||
        searchableText.includes("bağlantı")
    ){
        organs.add("bridge");
    }

    if(
        searchableText.includes("finance") ||
        searchableText.includes("finans") ||
        searchableText.includes("satış") ||
        searchableText.includes("ödeme") ||
        searchableText.includes("gelir")
    ){
        organs.add("finance");
    }

    if(event.type === "achievement"){
        organs.add("timeline");
        organs.add("memory");
    }

    if(event.type === "engine:start"){
        organs.add("timeline");
    }

    return [...organs];

},
    getLinkedRecordCounts(event = {}){

    if(!event.id){
        return {
            timeline: 0,
            memory: 0
        };
    }

    const timeline =
        VAERO.get("timeline");

    const memory =
        VAERO.get("memorySystem");

    const timelineEvents =
        timeline &&
        typeof timeline.all === "function"
            ? timeline.all()
            : [];

    const memoryRecords =
        memory &&
        typeof memory.all === "function"
            ? memory.all()
            : [];

    return {
        timeline: timelineEvents.filter(item =>
            item.payload &&
            item.payload.sourceEventId === event.id
        ).length,

        memory: memoryRecords.filter(item =>
            item.payload &&
            item.payload.sourceEventId === event.id
        ).length
    };

},

    getBrainAnalysis(event = {}){

    let summary =
        "Bu olay varlığın yaşam akışına kaydedildi.";

    let impact = "Orta";
    let risk = "Düşük";
    let suggestion =
        "Olayın gelecekteki etkileri izlenebilir.";

    if(event.type === "achievement"){

        summary =
            "Bu olay varlığın gelişiminde olumlu bir ilerleme oluşturuyor.";

        impact = "Yüksek";

        suggestion =
            "Bu başarı yeni bir hedef veya dönüm noktasıyla ilişkilendirilebilir.";

    }
    else if(event.type === "failure"){

        summary =
            "Bu olay başarısızlık olarak görünse de deneyim ve öğrenme üretiyor.";

        impact = "Yüksek";
        risk = "Orta";

        suggestion =
            "Sebep, sonuç ve çıkarılan dersler Hafıza organına eklenebilir.";

    }
    else if(event.type === "goal"){

        summary =
            "Bu olay geleceğe yönelik bir gelişim yönü oluşturuyor.";

        suggestion =
            "Hedef için ölçülebilir adımlar ve tamamlanma tarihi belirlenebilir.";

    }
    else if(event.type === "finance"){

        summary =
            "Bu olay varlığın finansal gelişimini veya yükümlülüklerini etkiliyor.";

        impact = "Yüksek";
        risk = "Orta";

        suggestion =
            "Ödeme, gelir, borç ve sonuç bilgileri düzenli olarak güncellenebilir.";

    }
    else if(event.type === "decision"){

        summary =
            "Bu karar varlığın sonraki yaşam akışını değiştirebilir.";

        suggestion =
            "Kararın nedeni ve sonraki sonuçları Timeline üzerinden izlenebilir.";

    }

    if(event.importance === "critical"){
        impact = "Kritik";
        risk = "Yüksek";
    }
    else if(event.importance === "high"){
        impact = "Yüksek";
    }

        if(event.organs?.includes("memory")){
    suggestion =
        "Bu olay hafızada uzun süreli iz bırakabilir.";
}

if(event.organs?.includes("identity")){
    impact = "Yüksek";
}

if(event.organs?.includes("timeline")){
    summary += " Timeline üzerinde önemli bir kayıt oluşturdu.";
}

    return {
        summary,
        impact,
        risk,
        suggestion
    };

},

    getOrganLabel(id){

    const organ = OrganRegistry.find(id);

    if(organ){
        return `${organ.icon} ${organ.title}`;
    }

    return id;

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
                data-action="evolution:event:open"
data-event-id="${event.id}"
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
                ${(() => {

    const affectedOrgans =
        this.getAffectedOrgans(event);

    if(affectedOrgans.length === 0){
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
            ${affectedOrgans.map(id => `
                <span
                    style="
                        padding:7px 10px;
                        border-radius:999px;
                        background:rgba(255,255,255,.035);
                        border:1px solid rgba(255,255,255,.07);
                        color:var(--muted);
                        font-size:12px;
                    "
                >
                    ${this.escapeHTML(
                        this.getOrganLabel(id)
                    )}
                </span>
            `).join("")}
        </div>
    `;

})()}

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

        const selectedEvent =
    this.selectedEventId &&
    evolution &&
    typeof evolution.find === "function"
        ? evolution.find(this.selectedEventId)
        : null;

        const selectedEventAnalysis =
    selectedEvent
        ? this.getBrainAnalysis(selectedEvent)
        : null;
        
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
        (total, event) =>
            total + this.getEventXP(event),
        0
    );

        const evolutionProgress =
    this.getEvolutionProgress(totalEffects);

        const filteredEvents =
    this.filterEvents(events);

const recentEvents =
    filteredEvents.slice(0, 8);

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
                ${this.renderEvolutionProgress(
    evolutionProgress
)}

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

                    <div
    style="
        display:flex;
        gap:8px;
        overflow-x:auto;
        padding:14px 0 4px;
        scrollbar-width:none;
    "
>
    ${[
        {
            id: "all",
            label: "Tümü"
        },
        {
            id: "important",
            label: "Önemli"
        },
        {
            id: "achievement",
            label: "Başarılar"
        },
        {
            id: "goal",
            label: "Hedefler"
        },
        {
            id: "finance",
            label: "Finans"
        }
    ].map(filter => {

        const isActive =
            this.activeFilter === filter.id;

        return `
            <button
                data-action="evolution:filter"
                data-filter="${filter.id}"
                style="
                    flex:0 0 auto;
                    border-radius:999px;
                    padding:9px 13px;
                    border:1px solid ${
                        isActive
                            ? "rgba(245,215,150,.55)"
                            : "rgba(255,255,255,.08)"
                    };
                    background:${
                        isActive
                            ? "rgba(245,215,150,.13)"
                            : "rgba(255,255,255,.025)"
                    };
                    color:${
                        isActive
                            ? "var(--text)"
                            : "var(--muted)"
                    };
                    cursor:pointer;
                    font-size:12px;
                    white-space:nowrap;
                "
            >
                ${filter.label}
            </button>
        `;

    }).join("")}
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
                ${
    selectedEvent
        ? `
            <div
                style="
                    position:fixed;
                    inset:0;
                    z-index:9998;
                    background:rgba(2,8,18,.78);
                    backdrop-filter:blur(14px);
                    display:flex;
                    align-items:flex-end;
                    justify-content:center;
                    padding:18px;
                "
            >
                <section
                    class="card"
                    style="
                        ${Theme.card}
                        width:min(100%,620px);
                        max-height:82vh;
                        overflow:auto;
                        padding:24px;
                        border-radius:26px 26px 18px 18px;
                    "
                >
                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            gap:16px;
                            align-items:flex-start;
                        "
                    >
                        <div>
                            <div class="eyebrow">
                                YAŞAM OLAYI
                            </div>

                            <h2 style="margin-top:8px;">
                                ${this.escapeHTML(
                                    selectedEvent.title ||
                                    "Yaşam olayı"
                                )}
                            </h2>
                        </div>

                        <button
                            data-action="evolution:event:close"
                            style="
                                width:40px;
                                height:40px;
                                border-radius:50%;
                                border:1px solid rgba(255,255,255,.09);
                                background:rgba(255,255,255,.04);
                                color:var(--text);
                                cursor:pointer;
                                font-size:18px;
                            "
                        >
                            ×
                        </button>
                    </div>

                    <div
                        style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                            margin-top:16px;
                        "
                    >
                        <span
                            style="
                                padding:7px 10px;
                                border-radius:999px;
                                background:rgba(255,255,255,.04);
                                color:var(--muted);
                                font-size:12px;
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
                                padding:7px 10px;
                                border-radius:999px;
                                border:1px solid ${
                                    this.getImportanceColor(
                                        selectedEvent.importance
                                    )
                                };
                                color:${
                                    this.getImportanceColor(
                                        selectedEvent.importance
                                    )
                                };
                                font-size:12px;
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
                                        margin-top:18px;
                                        color:var(--muted);
                                        line-height:1.75;
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

                    <div
    style="
        margin-top:18px;
        display:grid;
        gap:14px;
    "
>
    <div
        style="
            padding:16px;
            border-radius:18px;
            background:rgba(255,255,255,.035);
            border:1px solid rgba(255,255,255,.06);
        "
    >
        <div
            style="
                color:var(--muted);
                font-size:12px;
            "
        >
            Kazanılan Deneyim
        </div>

        <strong
            style="
                display:block;
                margin-top:6px;
                font-size:24px;
                color:#f5d796;
            "
        >
            +${this.getEventXP(selectedEvent)} XP
        </strong>
    </div>

    <div
        style="
            padding:16px;
            border-radius:18px;
            background:rgba(255,255,255,.035);
            border:1px solid rgba(255,255,255,.06);
        "
    >
        <div
            style="
                color:var(--muted);
                font-size:12px;
                margin-bottom:10px;
            "
        >
            Etkilenen Organlar
        </div>

        <div
            style="
                display:flex;
                gap:8px;
                flex-wrap:wrap;
            "
        >
            ${this.getAffectedOrgans(selectedEvent)
    .map(id => `
        <span
            style="
                padding:8px 11px;
                border-radius:999px;
                background:rgba(255,255,255,.04);
                border:1px solid rgba(255,255,255,.07);
                font-size:12px;
            "
        >
            ${this.escapeHTML(
                this.getOrganLabel(id)
            )}
        </span>
    `)
    .join("")}
        </div>
    </div>
</div>

<div
    style="
        margin-top:14px;
        padding:18px;
        border-radius:18px;
        background:rgba(112,167,255,.055);
        border:1px solid rgba(112,167,255,.15);
    "
>
    <div
        style="
            display:flex;
            align-items:center;
            gap:9px;
        "
    >
        <span style="font-size:20px;">
            🧠
        </span>

        <strong style="font-size:14px;">
            Brain Analizi
        </strong>
    </div>

    <p
        style="
            margin-top:13px;
            color:var(--muted);
            line-height:1.7;
            font-size:14px;
        "
    >
        ${this.escapeHTML(
    selectedEventAnalysis.summary
)}
    </p>

    <div
        style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:10px;
            margin-top:16px;
        "
    >
        <div
            style="
                padding:12px;
                border-radius:14px;
                background:rgba(255,255,255,.035);
            "
        >
            <div
                style="
                    color:var(--muted);
                    font-size:11px;
                "
            >
                Etki
            </div>

            <strong
                style="
                    display:block;
                    margin-top:5px;
                    font-size:14px;
                "
            >
                ${this.escapeHTML(
                    selectedEventAnalysis.impact
                )}
            </strong>
        </div>

        <div
            style="
                padding:12px;
                border-radius:14px;
                background:rgba(255,255,255,.035);
            "
        >
            <div
                style="
                    color:var(--muted);
                    font-size:11px;
                "
            >
                Risk
            </div>

            <strong
                style="
                    display:block;
                    margin-top:5px;
                    font-size:14px;
                "
            >
                ${this.escapeHTML(
                    selectedEventAnalysis.risk
                )}
            </strong>
        </div>
    </div>

    <div
        style="
            margin-top:14px;
            padding-top:14px;
            border-top:1px solid rgba(255,255,255,.06);
        "
    >
        <div
            style="
                color:var(--muted);
                font-size:11px;
                margin-bottom:6px;
            "
        >
            Öneri
        </div>

        <div
            style="
                line-height:1.65;
                font-size:13px;
            "
        >
            ${this.escapeHTML(
                selectedEventAnalysis.suggestion
            )}
        </div>
    </div>
</div>

                    <div
                        style="
                            margin-top:22px;
                            padding-top:18px;
                            border-top:1px solid rgba(255,255,255,.06);
                            display:grid;
                            gap:10px;
                            color:var(--muted);
                            font-size:13px;
                        "
                    >

                    <div
    style="
        margin-top:14px;
        padding:16px;
        border-radius:18px;
        background:rgba(245,215,150,.055);
        border:1px solid rgba(245,215,150,.14);
    "
>
    <div
        style="
            color:var(--muted);
            font-size:11px;
        "
    >
        Gelecek Etkisi
    </div>

    <strong
        style="
            display:block;
            margin-top:7px;
            font-size:15px;
            line-height:1.6;
        "
    >
        ${
            selectedEventAnalysis.impact === "Kritik"
                ? "Bu olay gelecekte birden fazla organı doğrudan etkileyebilir."
                : selectedEventAnalysis.impact === "Yüksek"
                    ? "Bu olay sonraki kararları ve gelişim yönünü belirleyebilir."
                    : "Bu olay yaşam akışında izlenmesi gereken bir kayıt oluşturur."
        }
    </strong>
</div>
                        <div>
                            Tarih:
                            <strong style="color:var(--text);">
                                ${this.escapeHTML(
                                    this.formatDate(
                                        selectedEvent.occurredAt ||
                                        selectedEvent.createdAt
                                    )
                                )}
                            </strong>
                        </div>

                        <div>
                            Durum:
                            <strong style="color:var(--text);">
                                ${this.escapeHTML(
                                    selectedEvent.status ||
                                    "completed"
                                )}
                            </strong>
                        </div>

                        <div>
                            Kaynak:
                            <strong style="color:var(--text);">
                                ${this.escapeHTML(
                                    selectedEvent.source ||
                                    "user"
                                )}
                            </strong>
                        </div>
                    </div>
                    <div>
    Etkilenen Organlar:
    <strong style="color:var(--text);">
        ${
    this.getAffectedOrgans(selectedEvent).length
        ? this.getAffectedOrgans(selectedEvent)
            .map(id => this.getOrganLabel(id))
            .join(", ")
        : "Yok"
}
    </strong>
</div>

<div
    style="
        margin-top:14px;
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
    "
>
    <div
    data-action="evolution:linked:open"
    data-target="timeline"
    style="
        padding:14px;
        border-radius:16px;
        background:rgba(255,255,255,.035);
        border:1px solid rgba(255,255,255,.06);
        cursor:pointer;
    "
>
        <div
            style="
                color:var(--muted);
                font-size:11px;
            "
        >
            Timeline Bağlantısı
        </div>

        <strong
            style="
                display:block;
                margin-top:5px;
                font-size:20px;
            "
        >
            ${
                this.getLinkedRecordCounts(
                    selectedEvent
                ).timeline
            }
        </strong>
    </div>

    <div
    data-action="evolution:linked:open"
    data-target="memory"
    style="
        padding:14px;
        border-radius:16px;
        background:rgba(255,255,255,.035);
        border:1px solid rgba(255,255,255,.06);
        cursor:pointer;
    "
>
        <div
            style="
                color:var(--muted);
                font-size:11px;
            "
        >
            Hafıza Bağlantısı
        </div>

        <strong
            style="
                display:block;
                margin-top:5px;
                font-size:20px;
            "
        >
            ${
                this.getLinkedRecordCounts(
                    selectedEvent
                ).memory
            }
        </strong>
    </div>
</div>

<div>
    Etkilenen Kimlikler:
    <strong style="color:var(--text);">
        ${
            (selectedEvent.identities || []).length
                ? selectedEvent.identities.join(", ")
                : "Yok"
        }
    </strong>
</div>
                </section>
            </div>
        `
        : ""
}
            </div>
        `;

    }

};

window.EvolutionApp = EvolutionApp;
