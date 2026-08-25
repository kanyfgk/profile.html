const Components = {

    escapeHTML(value){

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    },

    translate(value){

        const text =
            String(value ?? "");

        const key =
            text.toLowerCase().trim();

        const translations = {
            "living digital universe":
                "Yaşayan Dijital Evren",

            "engine online":
                "Motor Çevrimiçi",

            "online":
                "Çevrimiçi",

            "active":
                "Aktif",

            "inactive":
                "Pasif",

            "offline":
                "Çevrimdışı",

            "ok":
                "Hazır",

            "brand":
                "Marka",

            "verified":
                "Doğrulandı",

            "unverified":
                "Doğrulanmadı",

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

            "vaero engine started with root entity":
                "VAERO Engine başlatıldı",

            "discovery journey tamamlandı":
                "Discovery Journey tamamlandı",

            "person":
                "Kişi",

            "company":
                "Şirket",

            "ai":
                "Yapay Zekâ",

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

    getWorlds(){

        const worldService =
            VAERO.get("world");

        return (
            worldService &&
            typeof worldService.all === "function"
                ? worldService.all()
                : []
        );

    },

    getActivity(){

        const evolution =
            VAERO.get("evolution");

        if(
            !evolution ||
            typeof evolution.all !== "function"
        ){
            return [];
        }

        return evolution
            .all()
            .filter(event =>
                event &&
                event.type !== "runtime:tick"
            )
            .slice(0, 4);

    },

    getDisplayName(entity){

        try {

            const saved =
                localStorage.getItem(
                    "vaero:user:profile:v1"
                );

            if(saved){

                const parsed =
                    JSON.parse(saved);

                const savedName =
                    String(
                        parsed?.name || ""
                    ).trim();

                if(savedName){
                    return savedName;
                }

            }

        } catch(error){

            console.warn(
                "Kullanıcı adı okunamadı:",
                error
            );

        }

        const profileName =
            String(
                entity?.profile?.name || ""
            ).trim();

        if(
            profileName &&
            profileName.toLowerCase() !==
                "vaero"
        ){
            return profileName;
        }

        return "";

    },

    formatRelativeTime(timestamp){

        const value =
            Number(timestamp);

        if(!Number.isFinite(value)){
            return "";
        }

        const difference =
            Math.max(
                0,
                Date.now() - value
            );

        const minute =
            60 * 1000;

        const hour =
            60 * minute;

        const day =
            24 * hour;

        if(difference < minute){
            return "Şimdi";
        }

        if(difference < hour){

            const minutes =
                Math.floor(
                    difference / minute
                );

            return `${minutes} dk önce`;

        }

        if(difference < day){

            const hours =
                Math.floor(
                    difference / hour
                );

            return `${hours} saat önce`;

        }

        const days =
            Math.floor(
                difference / day
            );

        return `${days} gün önce`;

    },

    home(entity){

        const worlds =
            this.getWorlds();

        const activeWorld =
            worlds.find(world =>
                world.status === "active"
            ) ||
            worlds[0] ||
            null;

        const activeEntities =
            Array.isArray(
                activeWorld?.entities
            )
                ? activeWorld.entities.filter(
                    item =>
                        item?.status === "active" ||
                        item?.status === "online"
                )
                : [];

        const activities =
            this.getActivity();

        const displayName =
            this.getDisplayName(entity);

        const welcomeText =
            displayName
                ? `Hoş geldin, ${this.escapeHTML(displayName)}`
                : "Hoş geldin";

        return `
            <section class="vaero-engine-home">

                <header class="engine-home-topbar">

                    <div class="engine-brand">
                        <span class="engine-brand-main">
                            VAERO
                        </span>

                        <span class="engine-brand-sub">
                            ENGINE
                        </span>
                    </div>

                    <div class="engine-top-actions">

                        <button
                            type="button"
                            class="engine-icon-btn"
                            aria-label="Bildirimler yakında"
                            title="Bildirimler yakında"
                            disabled
                        >
                            ♢
                        </button>

                        <button
                            type="button"
                            class="engine-icon-btn"
                            aria-label="Tarama yakında"
                            title="Tarama yakında"
                            disabled
                        >
                            ⌗
                        </button>

                    </div>

                </header>

                <section class="engine-hero">

                    <div class="engine-hero-copy">

                        <span class="engine-welcome">
                            ${welcomeText}
                        </span>

                        <h1>
                            VAERO Engine
                        </h1>

                        <p>
                            Yaşayan dijital evrenin kontrol merkezi
                        </p>

                        <div class="engine-status-pill">

                            <span
                                class="engine-status-dot"
                                aria-hidden="true"
                            ></span>

                            <strong>
                                Sistem Online
                            </strong>

                            <span
                                class="engine-status-separator"
                                aria-hidden="true"
                            ></span>

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

                        ${this.shortcutCard({
                            action: "worlds:open",
                            icon: "◯",
                            title: "Dünyalar",
                            subtitle: "Keşfet ve yönet",
                            tone: "gold"
                        })}

                        ${this.shortcutCard({
                            action: "profile:open",
                            icon: "♙",
                            title: "Profilim",
                            subtitle: "Yönün ve tercihlerin",
                            tone: "blue"
                        })}

                        ${this.shortcutCard({
                            action: "entities:open",
                            icon: "⬡",
                            title: "Varlıklar",
                            subtitle: "Varlıklarını yönet",
                            tone: "violet"
                        })}

                        ${this.shortcutCard({
                            action: "create:open",
                            icon: "✦",
                            title: "Yeni Dünya",
                            subtitle: "Yeni bir yapı başlat",
                            tone: "green"
                        })}

                    </div>

                </section>

                ${
                    activeWorld
                        ? this.activeWorldCard(
                            activeWorld,
                            activeEntities.length
                        )
                        : this.emptyWorldCard()
                }

                <section class="engine-activity">

                    <span class="engine-section-label">
                        SON AKTİVİTELER
                    </span>

                    ${
                        activities.length
                            ? `
                                <div class="engine-activity-list">

                                    ${activities
                                        .map((event, index) =>
                                            this.activityItem(
                                                event,
                                                index
                                            )
                                        )
                                        .join("")}

                                </div>
                              `
                            : `
                                <div class="engine-empty-state">
                                    <strong>
                                        Henüz aktivite yok
                                    </strong>

                                    <span>
                                        Engine ile yaptığın işlemler burada görünecek.
                                    </span>
                                </div>
                              `
                    }

                </section>

            </section>
        `;

    },

    shortcutCard({
        action,
        icon,
        title,
        subtitle,
        tone
    }){

        return `
            <button
                type="button"
                class="
                    engine-shortcut-card
                    engine-shortcut-${this.escapeHTML(tone)}
                "
                data-action="${this.escapeHTML(action)}"
            >
                <span class="engine-shortcut-icon">
                    ${this.escapeHTML(icon)}
                </span>

                <strong>
                    ${this.escapeHTML(title)}
                </strong>

                <small>
                    ${this.escapeHTML(subtitle)}
                </small>

                <span
                    class="engine-shortcut-arrow"
                    aria-hidden="true"
                >
                    →
                </span>
            </button>
        `;

    },

    activeWorldCard(world, activeCount){

        const name =
            this.escapeHTML(
                world.name ||
                "İsimsiz Dünya"
            );

        return `
            <section class="engine-active-world">

                <div class="engine-active-world-copy">

                    <span class="engine-section-label">
                        AKTİF DÜNYAN
                    </span>

                    <h2>
                        ${name}
                    </h2>

                    <strong class="engine-active-count">
                        ${activeCount}
                        aktif varlık
                    </strong>

                    <button
                        type="button"
                        class="engine-world-enter"
                        data-action="world:open"
                        data-world-id="${this.escapeHTML(world.id)}"
                    >
                        Dünyaya Git
                        <span aria-hidden="true">→</span>
                    </button>

                </div>

                <div
                    class="engine-world-visual"
                    aria-hidden="true"
                >
                    <div class="engine-world-glow"></div>
                    <div class="engine-world-planet"></div>
                </div>

            </section>
        `;

    },

    emptyWorldCard(){

        return `
            <section class="engine-active-world engine-active-world-empty">

                <div class="engine-active-world-copy">

                    <span class="engine-section-label">
                        İLK DÜNYAN
                    </span>

                    <h2>
                        Evrenin henüz sessiz
                    </h2>

                    <p>
                        İlk dünyanı oluşturarak varlıklarını tek bir yaşam alanında birleştir.
                    </p>

                    <button
                        type="button"
                        class="engine-world-enter"
                        data-action="create:open"
                    >
                        Dünya Oluştur
                        <span aria-hidden="true">→</span>
                    </button>

                </div>

            </section>
        `;

    },

    activityItem(event, index){

        const title =
            this.translate(
                event.title ||
                event.description ||
                event.type ||
                "Yaşam olayı"
            );

        const timestamp =
            event.occurredAt ||
            event.updatedAt ||
            event.createdAt;

        return `
            <div
                class="engine-activity-item"
                data-activity-tone="${index % 4}"
            >
                <span
                    class="activity-dot"
                    aria-hidden="true"
                ></span>

                <span>
                    ${this.escapeHTML(title)}
                </span>

                <small>
                    ${this.escapeHTML(
                        this.formatRelativeTime(timestamp)
                    )}
                </small>
            </div>
        `;

    },

    worldsView(worlds = []){

        const safeWorlds =
            Array.isArray(worlds)
                ? worlds.filter(Boolean)
                : [];

        return `
            <section class="engine-page worlds-page">

                ${this.pageHeader({
                    eyebrow: "DÜNYA",
                    title: "Dünyaların",
                    text:
                        "Projelerini, topluluklarını ve dijital varlıklarını yaşayan dünyalar içinde yönet.",
                    action: "create:open",
                    actionLabel: "Yeni Dünya"
                })}

                ${
                    safeWorlds.length
                        ? `
                            <div class="worlds-grid">

                                ${safeWorlds
                                    .map(world =>
                                        this.worldCard(world)
                                    )
                                    .join("")}

                            </div>
                          `
                        : `
                            <div class="section engine-page-empty">

                                <span class="engine-page-empty-icon">
                                    ◯
                                </span>

                                <h2>
                                    Henüz bir dünyan yok
                                </h2>

                                <p>
                                    İlk dünyanı oluşturarak Engine içindeki yaşam alanını başlat.
                                </p>

                                <button
                                    type="button"
                                    class="primary-btn"
                                    data-action="create:open"
                                >
                                    İlk Dünyayı Oluştur
                                </button>

                            </div>
                          `
                }

            </section>
        `;

    },

    worldCard(world){

        const entities =
            Array.isArray(world.entities)
                ? world.entities
                : [];

        const activeCount =
            entities.filter(entity =>
                entity?.status === "active" ||
                entity?.status === "online"
            ).length;

        return `
            <button
                type="button"
                class="world-card"
                data-action="world:open"
                data-world-id="${this.escapeHTML(world.id)}"
            >
                <span class="world-card-orbit" aria-hidden="true">
                    <span></span>
                </span>

                <span class="world-card-content">

                    <small>
                        ${
                            world.type === "root-world"
                                ? "ANA DÜNYA"
                                : "ÖZEL DÜNYA"
                        }
                    </small>

                    <strong>
                        ${this.escapeHTML(world.name)}
                    </strong>

                    <span>
                        ${entities.length} varlık ·
                        ${activeCount} aktif
                    </span>

                </span>

                <span class="world-card-arrow" aria-hidden="true">
                    →
                </span>
            </button>
        `;

    },

    createView(){

        const worlds =
            this.getWorlds();

        return `
            <section class="engine-page create-page">

                ${this.pageHeader({
                    eyebrow: "YARAT",
                    title: "Yeni bir dünya oluştur",
                    text:
                        "Bir proje, topluluk veya fikir için yaşayan bir dijital alan başlat."
                })}

                <div class="create-layout">

                    <form
                        class="section create-world-form"
                        data-engine-form="world-create"
                    >

                        <div class="eyebrow">
                            DÜNYA BİLGİLERİ
                        </div>

                        <label class="engine-field">

                            <span>
                                Dünya adı
                            </span>

                            <input
                                id="worldNameInput"
                                name="worldName"
                                type="text"
                                maxlength="60"
                                placeholder="Örn. Innerbloom"
                                autocomplete="off"
                                required
                            >

                        </label>

                        <label class="engine-field">

                            <span>
                                Kısa açıklama
                            </span>

                            <textarea
                                id="worldDescriptionInput"
                                name="worldDescription"
                                maxlength="180"
                                placeholder="Bu dünya ne için yaşayacak?"
                                rows="4"
                            ></textarea>

                        </label>

                        <button
                            type="submit"
                            class="primary-btn create-submit"
                            data-action="world:create:submit"
                        >
                            Dünyayı Oluştur
                        </button>

                    </form>

                    <aside class="section create-preview">

                        <span class="engine-section-label">
                            CANLI ÖNİZLEME
                        </span>

                        <div
                            class="create-preview-orbit"
                            aria-hidden="true"
                        >
                            <span></span>
                        </div>

                        <h2>
                            Yeni Dünyan
                        </h2>

                        <p>
                            Oluşturduğun dünya, varlıkların ve bağlantıların için bağımsız bir yaşam alanı olacak.
                        </p>

                        <small>
                            Şu anda ${worlds.length} dünya bulunuyor.
                        </small>

                    </aside>

                </div>

            </section>
        `;

    },

    worldView(world){

        if(!world || !world.id){

            return this.errorState(
                "Dünya bilgisi bulunamadı."
            );

        }

        const entities =
            Array.isArray(world.entities)
                ? world.entities
                : [];

        const activeCount =
            entities.filter(entity =>
                entity?.status === "active" ||
                entity?.status === "online"
            ).length;

        if(VAERO.engine.entityCreateMode){

            return this.entityCreateView(
                world
            );

        }

        return `
            <section class="engine-page world-page">

                <button
                    type="button"
                    class="engine-back-btn"
                    data-action="worlds:open"
                >
                    ← Dünyalara Dön
                </button>

                <header class="world-hero">

                    <div class="world-hero-copy">

                        <div class="world-badge">
                            ◯ DÜNYA
                        </div>

                        <h1 class="world-title">
                            ${this.escapeHTML(world.name)}
                        </h1>

                        <p class="world-description">
                            ${
                                this.escapeHTML(
                                    world.description ||
                                    "Bu dünya yaşayan bir ekosistemdir. Varlıklar burada doğar, gelişir ve tarih oluşturur."
                                )
                            }
                        </p>

                        <div class="world-stats">

                            ${this.statCard(
                                entities.length,
                                "Varlık"
                            )}

                            ${this.statCard(
                                activeCount,
                                "Aktif"
                            )}

                            ${this.statCard(
                                activeCount > 0
                                    ? "Canlı"
                                    : "Sessiz",
                                "Durum"
                            )}

                        </div>

                    </div>

                    <div
                        class="world-hero-planet"
                        aria-hidden="true"
                    >
                        <span></span>
                    </div>

                </header>

                <section class="world-entities">

                    <div class="world-section-heading">

                        <div>
                            <span class="engine-section-label">
                                VARLIKLAR
                            </span>

                            <h2>
                                Bu dünyanın yaşamı
                            </h2>
                        </div>

                        <button
                            type="button"
                            class="secondary-btn"
                            data-action="entity:create:first"
                        >
                            + Varlık Oluştur
                        </button>

                    </div>

                    ${
                        entities.length
                            ? `
                                <div class="world-entity-grid">

                                    ${entities
                                        .map(entity =>
                                            this.entityCard(entity)
                                        )
                                        .join("")}

                                </div>
                              `
                            : `
                                <div class="section world-empty">

                                    <span aria-hidden="true">
                                        ⬡
                                    </span>

                                    <h3>
                                        Bu dünya henüz sessiz
                                    </h3>

                                    <p>
                                        İlk varlığını oluşturarak dünyaya yaşam ekle.
                                    </p>

                                    <button
                                        type="button"
                                        class="primary-btn"
                                        data-action="entity:create:first"
                                    >
                                        İlk Varlığı Oluştur
                                    </button>

                                </div>
                              `
                    }

                </section>

            </section>
        `;

    },

    entityCreateView(world){

        const selectedType =
            VAERO.engine.entityType;

        const entityTypes = [
            {
                id: "Person",
                label: "Kişi",
                icon: "♙"
            },
            {
                id: "Company",
                label: "Şirket",
                icon: "▣"
            },
            {
                id: "AI",
                label: "Yapay Zekâ",
                icon: "✦"
            },
            {
                id: "Device",
                label: "Cihaz",
                icon: "◇"
            },
            {
                id: "Knowledge",
                label: "Bilgi",
                icon: "◫"
            },
            {
                id: "Community",
                label: "Topluluk",
                icon: "◯"
            },
            {
                id: "Planet",
                label: "Gezegen",
                icon: "●"
            },
            {
                id: "Custom",
                label: "Özel",
                icon: "+"
            }
        ];

        return `
            <section class="engine-page entity-create-page">

                <button
                    type="button"
                    class="engine-back-btn"
                    data-action="entity:create:cancel"
                >
                    ← ${this.escapeHTML(world.name)}
                </button>

                ${this.pageHeader({
                    eyebrow: "YENİ VARLIK",
                    title:
                        selectedType
                            ? `${this.translate(selectedType)} oluştur`
                            : "Ne oluşturmak istiyorsun?",
                    text:
                        selectedType
                            ? "Varlığın adını belirleyerek bu dünyaya yaşam ekle."
                            : "Oluşturacağın varlığın temel türünü seç."
                })}

                ${
                    selectedType
                        ? `
                            <form
                                class="section entity-create-form"
                                data-engine-form="entity-create"
                            >

                                <label class="engine-field">

                                    <span>
                                        ${this.escapeHTML(
                                            this.translate(selectedType)
                                        )} adı
                                    </span>

                                    <input
                                        id="entityNameInput"
                                        name="entityName"
                                        type="text"
                                        maxlength="60"
                                        placeholder="Varlık adını gir"
                                        autocomplete="off"
                                        required
                                    >

                                </label>

                                <label class="engine-field">

                                    <span>
                                        Kısa açıklama
                                    </span>

                                    <textarea
                                        id="entityDescriptionInput"
                                        name="entityDescription"
                                        maxlength="180"
                                        placeholder="Bu varlığın amacı nedir?"
                                        rows="4"
                                    ></textarea>

                                </label>

                                <div class="entity-create-actions">

                                    <button
                                        type="button"
                                        class="secondary-btn"
                                        data-action="entity:type:clear"
                                    >
                                        Türü Değiştir
                                    </button>

                                    <button
                                        type="submit"
                                        class="primary-btn"
                                        data-action="entity:create:submit"
                                    >
                                        Varlığı Oluştur
                                    </button>

                                </div>

                            </form>
                          `
                        : `
                            <div class="entity-type-grid">

                                ${entityTypes
                                    .map(type => `
                                        <button
                                            type="button"
                                            class="entity-type-card"
                                            data-action="entity:type:select"
                                            data-entity-type="${this.escapeHTML(type.id)}"
                                        >
                                            <span>
                                                ${this.escapeHTML(type.icon)}
                                            </span>

                                            <strong>
                                                ${this.escapeHTML(type.label)}
                                            </strong>
                                        </button>
                                    `)
                                    .join("")}

                            </div>
                          `
                }

            </section>
        `;

    },

    entityCard(entity){

        return `
            <button
                type="button"
                class="world-entity-btn"
                data-action="entity:open"
                data-entity-id="${this.escapeHTML(entity.id)}"
            >
                <span class="world-entity-symbol">
                    ${this.escapeHTML(
                        String(
                            entity.name || "V"
                        ).charAt(0).toUpperCase()
                    )}
                </span>

                <span class="world-entity-content">

                    <small class="world-entity-type">
                        ${this.escapeHTML(
                            this.translate(entity.type)
                        )}
                    </small>

                    <strong class="world-entity-name">
                        ${this.escapeHTML(entity.name)}
                    </strong>

                </span>

                <span
                    class="world-entity-arrow"
                    aria-hidden="true"
                >
                    →
                </span>
            </button>
        `;

    },

    entityApp(entity){

        switch(
            VAERO.engine.currentEntityPage
        ){

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

            case "discovery":
                return this.entityDiscovery(entity);

            default:
                return this.entityView(entity);

        }

    },

    entityView(entity){

        if(!entity){

            return this.errorState(
                "Varlık bilgisi bulunamadı."
            );

        }

        return `
            <section class="engine-page entity-page">

                <button
                    type="button"
                    class="engine-back-btn"
                    data-action="world:back"
                >
                    ← Dünyaya Dön
                </button>

                <header class="section entity-header">

                    <span class="entity-header-symbol">
                        ${this.escapeHTML(
                            String(entity.name || "V")
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </span>

                    <div>

                        <span class="engine-section-label">
                            ${this.escapeHTML(
                                this.translate(entity.type)
                            )}
                        </span>

                        <h1>
                            ${this.escapeHTML(entity.name)}
                        </h1>

                        <p>
                            ${
                                this.escapeHTML(
                                    entity.description ||
                                    "Bu varlık VAERO dünyası içinde yaşıyor."
                                )
                            }
                        </p>

                    </div>

                </header>

                <div class="entity-app-grid">

                    ${this.entityAppLink(
                        "entity:identity",
                        "ID",
                        "Kimlik",
                        "Varlık kimliği ve doğrulama"
                    )}

                    ${this.entityAppLink(
                        "entity:profile",
                        "♙",
                        "Profil",
                        "Profil bilgileri ve yön"
                    )}

                    ${this.entityAppLink(
                        "entity:organs",
                        "◫",
                        "Organlar",
                        "Bağlı sistem uygulamaları"
                    )}

                    ${this.entityAppLink(
                        "entity:evolution",
                        "⌬",
                        "Evrim",
                        "Yaşam ve gelişim olayları"
                    )}

                </div>

            </section>
        `;

    },

    entityAppLink(
        action,
        icon,
        title,
        subtitle
    ){

        return `
            <button
                type="button"
                class="entity-app-link"
                data-action="${this.escapeHTML(action)}"
            >
                <span>${this.escapeHTML(icon)}</span>

                <strong>
                    ${this.escapeHTML(title)}
                </strong>

                <small>
                    ${this.escapeHTML(subtitle)}
                </small>
            </button>
        `;

    },

    entityIdentity(entity){

        return IdentityApp.render(
            entity
        );

    },

    entityProfile(entity){

        return ProfileApp.render(
            entity
        );

    },

    entityOrgans(entity){

        return OrgansApp.render(
            entity
        );

    },

    entityTimeline(entity){

        return TimelineApp.render(
            entity
        );

    },

    entityBridge(entity){

        return BridgeApp.render(
            entity
        );

    },

    entityMemory(entity){

        return MemoryApp.render(
            entity
        );

    },

    entityEvolution(entity){

        return EvolutionApp.render(
            entity
        );

    },

    entitySettings(entity){

        return SettingsApp.render(
            entity
        );

    },

    entityDiscovery(){

        return `
            <section class="engine-page">

                ${this.pageHeader({
                    eyebrow: "DISCOVERY",
                    title: "Keşif yönünü güncelle",
                    text:
                        "İlgi alanlarını, hedeflerini ve VAERO’dan beklentilerini yeniden değerlendirebilirsin."
                })}

                <div class="section engine-page-empty">

                    <span class="engine-page-empty-icon">
                        ◇
                    </span>

                    <h2>
                        Discovery Journey
                    </h2>

                    <p>
                        Mevcut cevapların Profil ekranında korunur. Yeniden başlatırsan yeni seçimlerin önceki yönünün yerini alır.
                    </p>

                    <button
                        type="button"
                        class="primary-btn"
                        data-action="discovery:restart"
                    >
                        Discovery’yi Yeniden Başlat
                    </button>

                </div>

            </section>
        `;

    },

    pageHeader({
        eyebrow,
        title,
        text,
        action = null,
        actionLabel = null
    }){

        return `
            <header class="engine-page-header">

                <div>

                    <span class="engine-section-label">
                        ${this.escapeHTML(eyebrow)}
                    </span>

                    <h1>
                        ${this.escapeHTML(title)}
                    </h1>

                    <p>
                        ${this.escapeHTML(text)}
                    </p>

                </div>

                ${
                    action && actionLabel
                        ? `
                            <button
                                type="button"
                                class="primary-btn"
                                data-action="${this.escapeHTML(action)}"
                            >
                                ${this.escapeHTML(actionLabel)}
                            </button>
                          `
                        : ""
                }

            </header>
        `;

    },

    statCard(value, label){

        return `
            <div class="world-stat">

                <strong>
                    ${this.escapeHTML(value)}
                </strong>

                <span>
                    ${this.escapeHTML(label)}
                </span>

            </div>
        `;

    },

    errorState(message){

        return `
            <section class="section engine-error-state">

                <div class="eyebrow">
                    VAERO ENGINE
                </div>

                <h1>
                    Bu ekran açılamadı
                </h1>

                <p>
                    ${this.escapeHTML(message)}
                </p>

                <button
                    type="button"
                    class="primary-btn"
                    data-action="home:open"
                >
                    Ana Ekrana Dön
                </button>

            </section>
        `;

    },

    navigation(state = {}){

        const view =
            state.view ||
            "home";

        const homeActive =
            view === "home";

        const identityActive =
            view === "identity" ||
            view === "profile" ||
            (
                view === "entity" &&
                [
                    "identity",
                    "profile"
                ].includes(state.page)
            );

        const createActive =
            view === "create";

        const worldsActive =
            view === "worlds" ||
            view === "world";

        return `
            <nav
                class="bottom-nav engine-bottom-nav"
                aria-label="Ana navigasyon"
            >

                ${this.navButton({
                    action: "home:open",
                    icon: "⌂",
                    label: "Ev",
                    active: homeActive
                })}

                ${this.navButton({
                    action: "identity:open",
                    icon: "ID",
                    label: "Kimlik",
                    active: identityActive
                })}

                <button
                    type="button"
                    class="nav-brain-btn"
                    data-action="brain:open"
                    aria-label="Brain'i aç"
                >
                    <span class="nav-brain-orbit"></span>

                    <span class="nav-brain-core">
                        <span class="nav-brain-eye"></span>
                        <span class="nav-brain-eye"></span>
                    </span>
                </button>

                ${this.navButton({
                    action: "create:open",
                    icon: "＋",
                    label: "Yarat",
                    active: createActive
                })}

                ${this.navButton({
                    action: "worlds:open",
                    icon: "◌",
                    label: "Dünya",
                    active: worldsActive
                })}

                <span class="nav-brain-label">
                    Brain’e dokun veya konuş
                </span>

            </nav>
        `;

    },

    navButton({
        action,
        icon,
        label,
        active
    }){

        return `
            <button
                type="button"
                class="nav-btn ${active ? "active" : ""}"
                data-action="${this.escapeHTML(action)}"
                ${
                    active
                        ? 'aria-current="page"'
                        : ""
                }
            >
                <span class="nav-icon">
                    ${this.escapeHTML(icon)}
                </span>

                <span>
                    ${this.escapeHTML(label)}
                </span>
            </button>
        `;

    }

};

VAERO.register(
    "components",
    Components
);
