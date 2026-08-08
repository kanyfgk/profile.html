const Components = {
    translate(value){

        const text =
            String(value || "");

        const key =
            text.toLowerCase().trim(); 

        const translations = {
            "living digital universe":
                "Yaşayan Dijital Evren",

            "engine online":
                "Motor Çevrimiçi",

            "online":
                "çevrimiçi",

            "active":
                "aktif",

            "ok":
                "hazır",

            "brand":
                "marka",

            "verified":
                "doğrulandı",

            "unverified":
                "doğrulanmadı",

            "identity":
                "Kimlik",

            "engine":
                "Motor",

            "renderer":
                "Oluşturucu",

            "bridge":
                "Köprü",

            "entity:mounted":
                "Varlık sisteme bağlandı",

            "life-event":
                "Yaşam olayı",

            "runtime started":
                "Çalışma zamanı başladı",

            "runtime tick":
                "Sistem döngüsü çalıştı",

            "entity mounted":
                "Varlık sisteme bağlandı",

            "engine started":
                "Motor başlatıldı",

            "discovery journey tamamlandı":
                "Discovery Journey tamamlandı",

            "person":
                "Kişi",

            "company":
                "Şirket",

            "device":
                "Cihaz",

            "knowledge":
                "Bilgi",

            "community":
                "Topluluk",

            "planet":
                "Gezegen",

            "custom":
                "Özel"
        };

        return (
            translations[key] ||
            text
        );

    },

    hero(entity){

    return `
        <header class="brand-header">

            <div class="brand-mark">
                ${entity.name.charAt(0)}
            </div>

            <div class="brand-info">

                <span class="brand-label">
                    VAERO ENGINE
                </span>

                <h1 class="brand-title">
                    ${entity.name}
                </h1>

                <p class="brand-subtitle">
                    ${this.translate(entity.description)}
                </p>

                <div class="status-pill">

                    <span
                        class="status-dot"
                        aria-hidden="true"
                    ></span>

                    <span>
                        ${this.translate(
                            entity.status === "online"
                                ? "Engine Online"
                                : entity.status
                        )}
                    </span>

                </div>

            </div>

        </header>
    `;

},

    home(){

    return `
        <section class="vaero-engine-home">

            <header class="engine-home-topbar">

                <div class="engine-brand">
                    <span class="engine-brand-main">VAERO</span>
                    <span class="engine-brand-sub">ENGINE</span>
                </div>

                <div class="engine-top-actions">
                    <button
                        type="button"
                        class="engine-icon-btn"
                        aria-label="Bildirimler"
                    >
                        ♢
                    </button>

                    <button
                        type="button"
                        class="engine-icon-btn"
                        aria-label="Tarama"
                    >
                        ⌗
                    </button>
                </div>

            </header>

            <section class="engine-hero">

                <div class="engine-hero-copy">

                    <span class="engine-welcome">
                        Hoş geldin, Mehmet
                    </span>

                    <h1>
                        VAERO Engine
                    </h1>

                    <p>
                        Yaşayan dijital evrenin kontrol merkezi
                    </p>

                    <div class="engine-status-pill">

                        <span class="engine-status-dot"></span>

                        <strong>
                            Sistem Online
                        </strong>

                        <span class="engine-status-separator"></span>

                        <small>
                            Tüm sistemler çalışıyor
                        </small>

                    </div>

                </div>

                <button
                    type="button"
                    class="engine-brain-orb"
                    data-action="brain:open"
                    aria-label="Brain'i aç"
                >
                    <span class="brain-orbit brain-orbit-1"></span>
                    <span class="brain-orbit brain-orbit-2"></span>
                    <span class="brain-orbit brain-orbit-3"></span>

                    <span class="brain-core">
                        <span class="brain-eye"></span>
                        <span class="brain-eye"></span>
                    </span>
                </button>

            </section>

            <section class="engine-shortcuts">

                <span class="engine-section-label">
                    KISAYOLLAR
                </span>

                <div class="engine-shortcuts-grid">

                    <button
                        type="button"
                        class="engine-shortcut-card"
                        data-action="worlds:open"
                    >
                        <span class="engine-shortcut-icon">
                            ◯
                        </span>

                        <strong>
                            Dünyalar
                        </strong>

                        <small>
                            Keşfet ve yönet
                        </small>

                        <span class="engine-shortcut-arrow">
                            →
                        </span>
                    </button>

                    <button
                        type="button"
                        class="engine-shortcut-card"
                        data-action="entity:profile"
                    >
                        <span class="engine-shortcut-icon">
                            ♙
                        </span>

                        <strong>
                            Profilim
                        </strong>

                        <small>
                            Kimliğin ve ayarların
                        </small>

                        <span class="engine-shortcut-arrow">
                            →
                        </span>
                    </button>

                    <button
                        type="button"
                        class="engine-shortcut-card"
                        data-action="entities:open"
                    >
                        <span class="engine-shortcut-icon">
                            ⬡
                        </span>

                        <strong>
                            Varlıklar
                        </strong>

                        <small>
                            Varlıklarını yönet
                        </small>

                        <span class="engine-shortcut-arrow">
                            →
                        </span>
                    </button>

                    <button
                        type="button"
                        class="engine-shortcut-card"
                        data-action="world:create"
                    >
                        <span class="engine-shortcut-icon">
                            ✦
                        </span>

                        <strong>
                            Yeni Dünya
                        </strong>

                        <small>
                            Evrenine yeni bir dünya ekle
                        </small>

                        <span class="engine-shortcut-arrow">
                            →
                        </span>
                    </button>

                </div>

            </section>

            <section class="engine-active-world">

                <div class="engine-active-world-copy">

                    <span class="engine-section-label">
                        AKTİF DÜNYAN
                    </span>

                    <h2>
                        Earth Prime
                    </h2>

                    <strong class="engine-active-count">
                        1 aktif varlık
                    </strong>

                    <button
                        type="button"
                        class="engine-world-enter"
                        data-action="worlds:open"
                    >
                        Dünyaya Git
                        <span>→</span>
                    </button>

                </div>

                <div class="engine-world-visual">
                    <div class="engine-world-glow"></div>
                    <div class="engine-world-planet"></div>
                </div>

            </section>

            <section class="engine-activity">

                <span class="engine-section-label">
                    SON AKTİVİTELER
                </span>

                <div class="engine-activity-list">

                    <div class="engine-activity-item">
                        <span class="activity-dot"></span>
                        <span>Innerbloom bağlantısı eklendi</span>
                        <small>2 saat önce</small>
                    </div>

                    <div class="engine-activity-item">
                        <span class="activity-dot"></span>
                        <span>Yeni bellek oluşturuldu</span>
                        <small>5 saat önce</small>
                    </div>

                    <div class="engine-activity-item">
                        <span class="activity-dot"></span>
                        <span>Zaman çizelgesine 3 olay eklendi</span>
                        <small>1 gün önce</small>
                    </div>

                    <div class="engine-activity-item">
                        <span class="activity-dot"></span>
                        <span>Finansal kayıt güncellendi</span>
                        <small>2 gün önce</small>
                    </div>

                </div>

            </section>

        </section>
    `;

},

    entityApp(entity){

    switch(VAERO.engine.currentEntityPage){

        case "identity":
            return this.entityIdentity(entity);

        case "profile":
            return this.entityProfile(entity);

        case "organs":
            return this.entityOrgans(entity);

        case "memory":
            return this.entityMemory(entity);

        case "timeline":
            return this.entityTimeline(entity);

        case "bridge":
            return this.entityBridge(entity);

        case "evolution":
            return this.entityEvolution(entity);
            
        case "settings":
            return this.entitySettings(entity);

        default:
            return this.entityView(entity);

    }

},

    organs(entity){

    const organNames = {
        identity: "Kimlik",
        engine: "Motor",
        renderer: "Oluşturucu",
        bridge: "Köprü"
    };

    const statusNames = {
        active: "aktif",
        online: "çevrimiçi",
        inactive: "pasif",
        offline: "çevrimdışı"
    };

    return `
        <div
            class="section"
            style="
                margin-top:24px;
                padding:18px;
            "
        >
            <div class="eyebrow">
                BAĞLANTILI ORGANLAR
            </div>

            ${(entity.organs || [])
                .map(organ => {

                    const organKey =
                        String(
                            organ.name || ""
                        ).toLowerCase();

                    const statusKey =
                        String(
                            organ.status || ""
                        ).toLowerCase();

                    return `
                        <div
                            style="
                                display:flex;
                                justify-content:space-between;
                                gap:18px;
                                margin-top:10px;
                                color:var(--muted);
                            "
                        >
                            <span>
                                ${
                                    organNames[organKey] ||
                                    organ.name
                                }
                            </span>

                            <span
                                style="
                                    color:var(--green);
                                "
                            >
                                ${
                                    statusNames[statusKey] ||
                                    organ.status
                                }
                            </span>
                        </div>
                    `;

                })
                .join("")}
        </div>
    `;

},

    profile(entity){
    return `
        <div class="section" style="margin-top:24px;padding:18px;">
            <div class="eyebrow">PROFİL</div>

            <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);">
                <span>İsim</span>
                <span>${entity.profile.name}</span>
            </div>

            <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);">
                <span>Tür</span>
                <span>${this.translate(entity.profile.type)}</span>
            </div>

            <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);">
                <span>Kimlik</span>
                <span style="color:var(--green);">
                    ${
                        this.translate(
                            entity.profile.identity.verified
                                ? "Verified"
                                : "Unverified"
                        )
                    }
                </span>
            </div>
        </div>
    `;
},
    identityCard(entity){
    return `
        <div class="section" style="margin-top:24px;padding:18px;">
            <div class="eyebrow">VAERO KİMLİĞİ</div>

            <div style="font-size:26px;font-weight:900;margin-top:10px;">
                ${entity.profile.name}
            </div>

            <div style="margin-top:8px;color:var(--muted);">
                ${this.translate(entity.profile.type).toUpperCase()}
                ·
                ${
                    this.translate(
                        entity.profile.identity.verified
                            ? "Verified"
                            : "Unverified"
                    ).toUpperCase()
                }
            </div>

            <div style="margin-top:18px;display:grid;gap:10px;">
                <div style="display:flex;justify-content:space-between;color:var(--muted);">
                    <span>Varlık Kimliği</span>
                    <span>${entity.id}</span>
                </div>

                <div style="display:flex;justify-content:space-between;color:var(--muted);">
                    <span>Durum</span>
                    <span style="color:var(--green);">
                        ${this.translate(entity.status)}
                    </span>
                </div>
            </div>
        </div>
    `;
},
    bridge(){
        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">İLK KÖPRÜ</div>
                <p style="color:var(--muted);line-height:1.7;">
                    VAERO artık ilk topluluk köprüsüne bağlandı.
                </p>
            </div>
        `;
    },

    memory(){
    const memory =
        VAERO.get("memorySystem");

    return `
        <div class="section" style="margin-top:24px;padding:18px;">
            <div class="eyebrow">HAFIZA</div>

            ${memory.all().map(record => `
                <div style="margin-top:10px;color:var(--muted);line-height:1.6;">
                    ${this.translate(record.type)}
                </div>
            `).join("")}
        </div>
    `;
},

    timeline(){
    const timeline =
        VAERO.get("timeline");

    return `
        <div class="section" style="margin-top:24px;padding:18px;">
            <div class="eyebrow">ZAMAN AKIŞI</div>

            ${timeline.all().map(event => `
                <div style="margin-top:10px;color:var(--muted);line-height:1.6;">
                    ${this.translate(event.title)}
                </div>
            `).join("")}
        </div>
    `;
},
    guardian(){
        const guardian = VAERO.get("guardian");

        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">GUARDIAN</div>
                <p style="color:var(--muted);line-height:1.7;">
                    Guardian active · ${guardian.rules.length} validation rules loaded
                </p>
            </div>
        `;
    },

    brain(){
    const brain =
        VAERO.get("brain");

    const report =
        brain.report();

    const labels = {
        identity: "Kimlik",
        memory: "Hafıza",
        guardian: "Koruyucu",
        bridge: "Köprü",
        evolution: "Evrim",
        timeline: "Zaman Akışı",
        profile: "Profil"
    };

    return `
        <div class="section" style="margin-top:24px;padding:18px;">
            <div class="eyebrow">BRAIN DURUMU</div>

            ${Object.entries(report).map(([key, value]) => `
                <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);">
                    <span>
                        ${labels[key] || this.translate(key)}
                    </span>

                    <span style="color:var(--green);">
                        ${this.translate(value)}
                    </span>
                </div>
            `).join("")}
        </div>
    `;
},
    alphaCreateWorld(){

        const world = VAERO.get("world");
        const worlds = world ? world.all() : [];

        return `
            <div class="section" style="margin-top:24px;padding:18px;">
                <div class="eyebrow">VAERO ALPHA</div>

                <h2 style="margin-top:10px;">İlk dünyanızı yaratın</h2>

                <p style="color:var(--muted);line-height:1.7;margin-top:10px;">
                    VAERO Evreni içinde inşa etmeye başlayın.
                </p>

                <input
                    id="worldNameInput"
                    placeholder="Benim İlk Dünyam"
                    style="
                        width:100%;
                        margin-top:18px;
                        padding:16px;
                        border-radius:18px;
                        border:1px solid rgba(255,255,255,.10);
                        background:rgba(255,255,255,.06);
                        color:var(--text);
                        font-weight:800;
                    "
                >

                <button class="primary-btn" data-action="world:create" style="width:100%;margin-top:14px;">
                    Dünyayı Yarat
                </button>

                <div style="margin-top:22px;">
                    <div class="eyebrow">SİZİN DÜNYALARINIZ</div>

                    ${worlds.length === 0 ? `
                        <p style="color:var(--muted);line-height:1.7;margin-top:10px;">
                            Henüz özel dünyalar yok.
                        </p>
                    ` : worlds.map(item=>`
                        <button
                            data-action="world:open"
                            data-world-id="${item.id}"
                            style="
                                width:100%;
                                text-align:left;
                                margin-top:10px;
                                padding:14px;
                                border-radius:16px;
                                border:0;
                                background:rgba(255,255,255,.05);
                                color:var(--text);
                                font-weight:800;
                                cursor:pointer;
                            "
                        >
                            🟢 ${item.name}
                        </button>
                    `).join("")}
                </div>
            </div>
        `;
    },

    dashboard(entity){
        return `
            <div class="dashboard-shell">
                ${this.alphaCreateWorld()}
                ${this.identityCard(entity)}
                ${this.profile(entity)}
                ${this.memory()}
                ${this.timeline()}
                ${this.guardian()}
                ${this.brain()}
            </div>
        `;
    },

    worldView(world){

        const entities = world.entities || [];
        const activeCount = entities.filter(entity =>
    entity.status === "online"
).length;

const totalCount = entities.length;

const worldStatus =
    activeCount > 0
        ? "Canlı"
        : "Sessiz";

        if(VAERO.engine.entityCreateMode){

            if(VAERO.engine.entityType){
                return `
                <div class="world-hero">

    <div class="world-badge">
        🌍 DÜNYA
    </div>

    <h1 class="world-title">
        ${world.name}
    </h1>

    <p class="world-description">
        Bu dünya yaşayan bir ekosistemdir. Varlıklar burada doğar, gelişir ve tarih oluşturur.
    </p>

    <div class="world-stats">

        <div class="world-stat">
            <strong>${totalCount}</strong>
            <span>Varlık</span>
        </div>

        <div class="world-stat">
            <strong>${activeCount}</strong>
            <span>Aktif</span>
        </div>

        <div class="world-stat">
            <strong>${worldStatus}</strong>
            <span>Durum</span>
        </div>

    </div>

</div>
                    <div class="section" style="margin-top:24px;padding:24px;">
                        ${this.translate(VAERO.engine.entityType).toUpperCase()} OLUŞTUR

                        <h2 style="margin-top:10px;">
                            ${this.translate(VAERO.engine.entityType)} adını belirtin.
                        </h2>

                        <input
                            id="entityNameInput"
                            placeholder="${this.translate(VAERO.engine.entityType)} adı"
                            style="
                                width:100%;
                                margin-top:18px;
                                padding:16px;
                                border-radius:18px;
                                border:1px solid rgba(255,255,255,.10);
                                background:rgba(255,255,255,.06);
                                color:var(--text);
                                font-weight:800;
                            "
                        >

                        <button
                            class="primary-btn"
                            data-action="entity:create"
                            style="width:100%;margin-top:14px;"
                        >
                            ${this.translate(VAERO.engine.entityType)} Oluştur
                        </button>
                    </div>
                `;
            }

            return `
                <div class="section" style="margin-top:24px;padding:24px;">
                    <div class="eyebrow">VARLIK OLUŞTUR</div>

                    <h2 style="margin-top:10px;">
                        Ne oluşturmak istiyorsun?
                    </h2>

                    <div style="display:grid;gap:10px;margin-top:18px;">
                        ${["Person","Company","AI","Device","Knowledge","Community","Planet","Custom"].map(type=>`
                            <button
                                class="secondary-btn"
                                data-action="entity:type:select"
                                data-entity-type="${type}"
                                style="width:100%;text-align:left;"
                            >
                                ${this.translate(type)}
                            </button>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        return `
            <div class="section dashboard-shell">
                <div class="world-badge">
    🌍 DÜNYA
</div>

                <h1 class="world-title">
    ${world.name}
</h1>

                ${entities.length === 0 ? `
                    <p class="world-empty">
                        Bu dünyada henüz hiçbir varlık yok.
                    </p>
                ` : entities.map(entity=>`
                    <button
    <button
    class="secondary-btn world-entity-btn"
    data-action="entity:open"
    data-entity-id="${entity.id}"
>

    <div class="world-entity-content">
        <div class="world-entity-type">
            ${entity.type}
        </div>

        <div class="world-entity-name">
            ${entity.name}
        </div>
    </div>

    <div class="world-entity-arrow">
        →
    </div>

</button>
                `).join("")}

                <button
    class="primary-btn world-create-btn"
    data-action="entity:create:first"
>
                    + İlk Varlığı Oluştur
                </button>
            </div>
        `;
    },

    entityView(entity){

    return `
        <div class="section" style="margin-top:24px;padding:24px;">
        <button
    class="secondary-btn"
    data-action="world:back"
    style="margin-bottom:18px;"
>
    ← Dünyaya Dön
</button>

            <div class="eyebrow">
    ${this.translate(entity.type).toUpperCase()}
</div>

            <h2 style="margin-top:10px;">
                ${entity.name}
            </h2>

            <p style="margin-top:12px;color:var(--muted);">
                Bu varlık başarıyla oluşturuldu.
            </p>
            
        </div>
    `;

},

    entityIdentity(entity){
    return IdentityApp.render(entity);
},

    entityProfile(entity){
    return ProfileApp.render(entity);
},
    entityOrgans(entity){
    return OrgansApp.render(entity);
},

    entityTimeline(entity){
    return TimelineApp.render(entity);
},

    entityBridge(entity){
    return BridgeApp.render(entity);
},
    entityMemory(entity){
    return MemoryApp.render(entity);
},

    entityEvolution(entity){
    return EvolutionApp.render(entity);
},

    entitySettings(entity){
    return SettingsApp.render(entity);
},
    actions(){
        return `
            <div style="display:flex;gap:14px;margin-top:32px;">
                <button class="primary-btn" data-action="profile:open">
                    Devam Et
                </button>

                <button class="secondary-btn" data-action="docs:open">
                    Belgeler
                </button>
            </div>
        `;
    },

    modal(){
        return `
            <div class="vaero-modal" id="profileModal">
                <div class="modal-card">
                    <h2 id="modalTitle">Profil</h2>
                    <p id="modalText"></p>

                    <button class="primary-btn modal-close" data-action="modal:close">
                        Kapat
                    </button>
                </div>
            </div>
        `;
    },

    idModal(){
        return `
            <div class="vaero-modal" id="idModal">
                <div class="modal-card">
                    <h2>Platform Kimliği</h2>

                    <p>
                        Kimliğini bağlamak için VAERO Platform Kimliğini gir.
                    </p>

                    <input
                        id="platformIdInput"
                        placeholder="VA-001"
                        style="
                            width:100%;
                            margin-top:18px;
                            padding:16px;
                            border-radius:18px;
                            border:1px solid rgba(255,255,255,.10);
                            background:rgba(255,255,255,.06);
                            color:var(--text);
                            font-weight:800;
                        "
                    >

                    <button class="primary-btn modal-close" data-action="identity:connect">
                        Kimliği Bağla
                    </button>

                    <button class="secondary-btn modal-close" data-action="idmodal:close" style="width:100%;margin-top:10px;">
                        Close
                    </button>
                </div>
            </div>
        `;
    },

    navigation(){
    return `
        <nav class="bottom-nav">
            <button class="nav-btn active">
                <div class="nav-icon">⌂</div>
                Ev
            </button>

            <button class="nav-btn">
                <div class="nav-icon">ID</div>
                Kimlik
            </button>

            <button class="nav-btn">
                <div class="nav-icon">＋</div>
                Yarat
            </button>

            <button class="nav-btn">
                <div class="nav-icon">◌</div>
                Dünya
            </button>
        </nav>
    `;
},

brainPanel(){
    return BrainApp.render();
}

};

VAERO.register("components", Components);
