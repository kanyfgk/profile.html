/* =========================================================
   VAERO COMPONENTS
   Engine Views / Editors / Navigation / Shared Rendering
========================================================= */

const Components = {

    /* =====================================================
       SECURITY / FORMAT
    ===================================================== */

    escapeHTML(value){

        return String(
            value ??
            ""
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


    safeAction(value){

        const action =
            String(
                value ??
                ""
            )
                .trim()
                .toLowerCase();


        return /^[a-z0-9:_\-.]+$/.test(
            action
        )
            ? action
            : "";

    },


    normalizeList(value){

        if(
            Array.isArray(
                value
            )
        ){

            return value
                .map(
                    item =>
                        String(
                            item ??
                            ""
                        ).trim()
                )
                .filter(Boolean);

        }


        if(
            value instanceof
                Set
        ){

            return this.normalizeList(
                [
                    ...value
                ]
            );

        }


        return [];

    },


    translate(value){

        const text =
            String(
                value ??
                ""
            );


        const key =
            text
                .toLowerCase()
                .trim();


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

            "paused":
                "Duraklatıldı",

            "archived":
                "Arşivlendi",

            "disabled":
                "Devre Dışı",

            "installing":
                "Kuruluyor",

            "updating":
                "Güncelleniyor",

            "error":
                "Hata",

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

            "pending":
                "Bekliyor",

            "identity":
                "Kimlik",

            "engine":
                "Motor",

            "renderer":
                "Oluşturucu",

            "bridge":
                "Köprü",

            "memory":
                "Hafıza",

            "timeline":
                "Zaman Çizelgesi",

            "applications":
"Uygulamalar",

"evolution":
"Gelişim",

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
                "Özel",

            "custom-world":
                "Özel Dünya",

            "root-world":
                "Ana Dünya"

        };


        return (
            translations[
                key
            ] ||
            text
        );

    },


    /* =====================================================
       SERVICES
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO ===
                    "undefined" ||
                typeof VAERO.get !==
                    "function"
            ){

                return null;

            }


            return (
                VAERO.get(
                    name
                ) ||
                null
            );

        } catch(error){

            console.warn(
                `Components service lookup failed: ${name}`,
                error
            );


            return null;

        }

    },


    getEngine(){

        try{

            return (
                VAERO?.engine ||
                this.getService(
                    "engine"
                ) ||
                window.Engine ||
                null
            );

        } catch(error){

            return (
                window.Engine ||
                null
            );

        }

    },


    getWorlds(){

        const worldService =
            this.getService(
                "world"
            );


        if(
            !worldService ||
            typeof worldService.all !==
                "function"
        ){

            return [];

        }


        try{

            const result =
                worldService.all();


            return Array.isArray(
                result
            )
                ? result
                : [];

        } catch(error){

            return [];

        }

    },


    getActivity(){

        const evolution =
            this.getService(
                "evolution"
            );


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


            return Array.isArray(
                events
            )
                ? events
                    .filter(
                        event =>
                            event &&
                            event.type !==
                                "runtime:tick"
                    )
                    .slice(
                        0,
                        4
                    )
                : [];

        } catch(error){

            return [];

        }

    },


    getApplications(){

        const registry =
    this.getService(
        "appRegistry"
    ) ||
    (
        typeof window !==
            "undefined"
            ? window.AppRegistry ||
              null
            : null
    );


        if(
            !registry ||
            typeof registry.all !==
                "function"
        ){

            return [];

        }


        try{

            const apps =
                registry.all();


            return Array.isArray(
                apps
            )
                ? apps
                : [];

        } catch(error){

            return [];

        }

    },


    getOrganStatus(){

        const organStatus =
            this.getService(
                "organStatus"
            ) ||
            window.OrganStatus ||
            null;


        if(
            !organStatus ||
            typeof organStatus.report !==
                "function"
        ){

            return null;

        }


        try{

            return (
                organStatus.report() ||
                null
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       USER DISPLAY
    ===================================================== */

    getDisplayName(entity){

        const profile =
            entity?.profile;


        const profileName =
            String(
                profile?.name ||
                profile?.displayName ||
                ""
            ).trim();


        if(
            profileName &&
            profileName.toLowerCase() !==
                "vaero"
        ){

            return profileName;

        }


        const profileService =
            this.getService(
                "profile"
            );


        try{

            if(
                entity?.id &&
                profileService &&
                typeof profileService.get ===
                    "function"
            ){

                const storedProfile =
                    profileService.get(
                        entity.id
                    );


                const storedName =
                    String(
                        storedProfile?.name ||
                        storedProfile?.displayName ||
                        ""
                    ).trim();


                if(
                    storedName &&
                    storedName.toLowerCase() !==
                        "vaero"
                ){

                    return storedName;

                }

            }

        } catch(error){

            /* compatibility fallback */

        }


        try{

            const saved =
                localStorage.getItem(
                    "vaero:user:profile:v1"
                );


            if(saved){

                const parsed =
                    JSON.parse(
                        saved
                    );


                const savedName =
                    String(
                        parsed?.name ||
                        ""
                    ).trim();


                if(savedName){

                    return savedName;

                }

            }

        } catch(error){

            /* old local profile is optional */

        }


        return "";

    },


    formatRelativeTime(timestamp){

        const value =
            Number(
                timestamp
            );


        if(
            !Number.isFinite(
                value
            )
        ){

            return "";

        }


        const difference =
            Math.max(
                0,
                Date.now() -
                value
            );


        const minute =
            60 *
            1000;


        const hour =
            60 *
            minute;


        const day =
            24 *
            hour;


        if(
            difference <
            minute
        ){

            return "Şimdi";

        }


        if(
            difference <
            hour
        ){

            return `${Math.floor(
                difference /
                minute
            )} dk önce`;

        }


        if(
            difference <
            day
        ){

            return `${Math.floor(
                difference /
                hour
            )} saat önce`;

        }


        return `${Math.floor(
            difference /
            day
        )} gün önce`;

    },


    /* =====================================================
       HOME
    ===================================================== */

    home(entity){

        const worlds =
            this.getWorlds();


        const activeWorld =
            worlds.find(
                world =>
                    world?.status ===
                        "active" &&
                    world?.archived !==
                        true
            ) ||
            worlds.find(
                world =>
                    world?.archived !==
                        true
            ) ||
            null;


        const activeEntities =
            Array.isArray(
                activeWorld?.entities
            )
                ? activeWorld.entities.filter(
                    item =>
                        item?.archived !==
                            true &&
                        (
                            item?.status ===
                                "active" ||
                            item?.status ===
                                "online"
                        )
                )
                : [];


        const activities =
            this.getActivity();


        const applications =
            this.getApplications();


        const displayName =
            this.getDisplayName(
                entity
            );


        const welcomeText =
            displayName
                ? `Hoş geldin, ${this.escapeHTML(
                    displayName
                )}`
                : "Hoş geldin";


        const health =
            this.getOrganStatus();


        const engineStatus =
            health?.status ||
            (
                this.getEngine()
                    ?.started
                    ? "healthy"
                    : "unknown"
            );


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
data-action="app:applications"
aria-label="Uygulamalar"
title="Uygulamalar"
>
▦
</button>

${
    typeof window !==
        "undefined" &&
    window.NotificationCenter &&
    typeof window.NotificationCenter.renderBell ===
        "function"
        ? window.NotificationCenter.renderBell()
        : ""
}

<button
type="button"
class="engine-icon-btn"
data-action="brain:open"
aria-label="Brain"
title="Brain"
>
✦
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

                        <div
                            class="engine-status-pill"
                            data-engine-health="${this.escapeHTML(
                                engineStatus
                            )}"
                        >

                            <span
                                class="engine-status-dot"
                                aria-hidden="true"
                            ></span>

                            <strong>
                                ${
                                    engineStatus ===
                                        "critical"
                                        ? "Sistem Uyarısı"
                                        : engineStatus ===
                                            "degraded"
                                            ? "Sistem İzleniyor"
                                            : "Sistem Online"
                                }
                            </strong>

                            <span
                                class="engine-status-separator"
                                aria-hidden="true"
                            ></span>

                            <small>
                                ${applications.length}
                                uygulama hazır
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
                        ENGINE
                    </span>

                    <div class="engine-shortcuts-grid">

                        ${this.shortcutCard({
                            action:
                                "worlds:open",
                            icon:
                                "◯",
                            title:
                                "Dünyalar",
                            subtitle:
                                "Keşfet ve yönet",
                            tone:
                                "gold"
                        })}

                        ${this.shortcutCard({
                            action:
                                "entities:open",
                            icon:
                                "⬡",
                            title:
                                "Varlıklar",
                            subtitle:
                                "Yaşayan yapılar",
                            tone:
                                "blue"
                        })}

                        ${this.shortcutCard({
                            action:
                                "app:applications",
                            icon:
                                "▦",
                            title:
    "Uygulamalar",

subtitle:
    "Araçlarını keşfet",
                            tone:
                                "violet"
                        })}

                        ${this.shortcutCard({
                            action:
                                "create:open",
                            icon:
                                "✦",
                            title:
                                "Yarat",
                            subtitle:
                                "Fikrini inşa et",
                            tone:
                                "green"
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
                                        .map(
                                            (
                                                event,
                                                index
                                            ) =>
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
                    engine-shortcut-${this.escapeHTML(
                        tone
                    )}
                "
                data-action="${this.escapeHTML(
                    this.safeAction(
                        action
                    )
                )}"
            >

                <span class="engine-shortcut-icon">
                    ${this.escapeHTML(
                        icon
                    )}
                </span>

                <strong>
                    ${this.escapeHTML(
                        title
                    )}
                </strong>

                <small>
                    ${this.escapeHTML(
                        subtitle
                    )}
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


    activeWorldCard(
        world,
        activeCount
    ){

        return `
            <section class="engine-active-world">

                <div class="engine-active-world-copy">

                    <span class="engine-section-label">
                        AKTİF DÜNYAN
                    </span>

                    ${(() => {

    const creationKind =
        String(
            world?.metadata
                ?.creationKind ||
            ""
        )
            .trim()
            .toLowerCase();


    const labels = {

        idea:
            "Fikir",

        project:
            "Proje",

        application:
            "Uygulama",

        system:
            "Sistem",

        automation:
            "Otomasyon",

        invention:
            "Buluş"

    };


    const label =
        labels[
            creationKind
        ] ||
        this.translate(
            world?.type ||
            "custom-world"
        );


    return `
        <span class="engine-active-kind">
            ${this.escapeHTML(
                label
            )}
        </span>
    `;

})()}

                    <h2>
                        ${this.escapeHTML(
                            world.name ||
                            "İsimsiz Dünya"
                        )}
                    </h2>

                    <strong class="engine-active-count">
                        ${this.escapeHTML(
                            activeCount
                        )}
                        aktif varlık
                    </strong>

                    <button
                        type="button"
                        class="engine-world-enter"
                        data-action="world:open"
                        data-world-id="${this.escapeHTML(
                            world.id
                        )}"
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
            <section class="
                engine-active-world
                engine-active-world-empty
            ">

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


    activityItem(
        event,
        index
    ){

        const title =
            this.translate(
                event?.title ||
                event?.description ||
                event?.type ||
                "Yaşam olayı"
            );


        const timestamp =
            event?.occurredAt ||
            event?.updatedAt ||
            event?.createdAt;


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
                    ${this.escapeHTML(
                        title
                    )}
                </span>

                <small>
                    ${this.escapeHTML(
                        this.formatRelativeTime(
                            timestamp
                        )
                    )}
                </small>

            </div>
        `;

    },

   /* =====================================================
       WORLDS LIST
    ===================================================== */

    worldsView(
        worlds = []
    ){

        const safeWorlds =
            Array.isArray(
                worlds
            )
                ? worlds.filter(
                    world =>
                        world &&
                        world.archived !==
                            true
                )
                : [];


        return `
            <section class="engine-page worlds-page">

                ${this.pageHeader({
                    eyebrow:
                        "DÜNYALAR",
                    title:
                        "Yaşam alanların",
                    text:
                        "Projelerini, topluluklarını, fikirlerini ve dijital varlıklarını bağımsız dünyalar içinde yönet.",
                    action:
                        "create:open",
                    actionLabel:
                        "Yeni Dünya"
                })}

                ${
                    safeWorlds.length
                        ? `
                            <div class="worlds-grid">

                                ${safeWorlds
                                    .map(
                                        world =>
                                            this.worldCard(
                                                world
                                            )
                                    )
                                    .join("")}

                            </div>
                        `
                        : this.emptyState({
                            icon:
                                "◯",
                            title:
                                "Henüz bir dünyan yok",
                            text:
                                "İlk dünyanı oluşturarak Engine içindeki yaşam alanını başlat.",
                            action:
                                "create:open",
                            actionLabel:
                                "İlk Dünyayı Oluştur"
                        })
                }

            </section>
        `;

    },


    worldCard(world){

        const entities =
            Array.isArray(
                world?.entities
            )
                ? world.entities.filter(
                    entity =>
                        entity?.archived !==
                            true
                )
                : [];


        const activeCount =
            entities.filter(
                entity =>
                    entity?.status ===
                        "active" ||
                    entity?.status ===
                        "online"
            ).length;

       const creationKind =
    String(
        world?.metadata
            ?.creationKind ||
        ""
    )
        .trim()
        .toLowerCase();


const creationKindLabels = {

    idea:
        "Fikir",

    project:
        "Proje",

    application:
        "Uygulama",

    system:
        "Sistem",

    automation:
        "Otomasyon",

    invention:
        "Buluş"

};


const worldKindLabel =
    creationKindLabels[
        creationKind
    ] ||
    this.translate(
        world?.type ||
        "custom-world"
    );


        return `
            <button
                type="button"
                class="world-card"
                data-action="world:open"
                data-world-id="${this.escapeHTML(
                    world?.id
                )}"
            >

                <span
                    class="world-card-orbit"
                    aria-hidden="true"
                >
                    <span></span>
                </span>

                <span class="world-card-content">

                    <small>
    ${this.escapeHTML(
        worldKindLabel
    )}
</small>

                    <strong>
                        ${this.escapeHTML(
                            world?.name ||
                            "İsimsiz Dünya"
                        )}
                    </strong>

                    <span>
                        ${entities.length} varlık ·
                        ${activeCount} aktif
                    </span>

                </span>

                <span
                    class="world-card-arrow"
                    aria-hidden="true"
                >
                    →
                </span>

            </button>
        `;

    },


    /* =====================================================
       CREATE WORLD
    ===================================================== */

    createView(){

    const worlds =
        this.getWorlds();


    const creationKinds = [

        {
            id:
                "idea",

            icon:
                "✦",

            title:
                "Fikir",

            text:
                "Bir düşünceyi geliştir ve şekillendir."
        },

        {
            id:
                "project",

            icon:
                "◇",

            title:
                "Proje",

            text:
                "Bir hedefi çalışan bir projeye dönüştür."
        },

        {
            id:
                "application",

            icon:
                "▦",

            title:
                "Uygulama",

            text:
                "VAERO içinde kullanılabilecek bir uygulama geliştir."
        },

        {
            id:
                "system",

            icon:
                "⬡",

            title:
                "Sistem",

            text:
                "Birbirine bağlı işlevlerden oluşan bir yapı kur."
        },

        {
            id:
                "automation",

            icon:
                "↻",

            title:
                "Otomasyon",

            text:
                "Tekrarlanan işleri çalışan bir akışa bağla."
        },

        {
            id:
                "invention",

            icon:
                "◉",

            title:
                "Buluş",

            text:
                "Yeni bir ürün, cihaz veya çözüm geliştir."
        }

    ];


    return `
        <section class="engine-page create-page">

            ${this.pageHeader({
                eyebrow:
                    "YARAT",

                title:
                    "Ne oluşturmak istiyorsun?",

                text:
                    "Bir fikirle başla. VAERO sana bunun için bağımsız bir çalışma alanı açsın; Brain ile adım adım geliştir."
            })}


            <div class="create-layout">

                <form
                    class="section create-world-form create-studio"
                    data-engine-form="world-create"
                >

                    <div class="create-intent-head">

                        <div class="eyebrow">
                            BAŞLANGIÇ TÜRÜ
                        </div>

                        <p>
                            Ne üzerinde çalışacağını seç.
                            Teknik yapıyı VAERO arkada yönetecek.
                        </p>

                    </div>


                    <div
                        class="create-intent-grid"
                        role="radiogroup"
                        aria-label="Oluşturma türü"
                    >

                        ${creationKinds
                            .map(
                                (
                                    item,
                                    index
                                ) => `

                                    <label
                                        class="create-intent-card"
                                    >

                                        <input
                                            type="radio"
                                            name="creationKind"
                                            value="${this.escapeHTML(
                                                item.id
                                            )}"
                                            ${
                                                index ===
                                                    1
                                                    ? "checked"
                                                    : ""
                                            }
                                        >

                                        <span
                                            class="create-intent-icon"
                                            aria-hidden="true"
                                        >
                                            ${this.escapeHTML(
                                                item.icon
                                            )}
                                        </span>

                                        <span
                                            class="create-intent-copy"
                                        >

                                            <strong>
                                                ${this.escapeHTML(
                                                    item.title
                                                )}
                                            </strong>

                                            <small>
                                                ${this.escapeHTML(
                                                    item.text
                                                )}
                                            </small>

                                        </span>

                                        <span
                                            class="create-intent-check"
                                            aria-hidden="true"
                                        >
                                            ✓
                                        </span>

                                    </label>

                                `
                            )
                            .join("")}

                    </div>


                    <div class="create-studio-fields">

                        <div class="eyebrow">
                            İLK ADIM
                        </div>


                        <label class="engine-field">

                            <span>
                                Ad
                            </span>

                            <input
                                id="worldNameInput"
                                name="worldName"
                                type="text"
                                maxlength="60"
                                placeholder="Örn. Akıllı sera sistemi"
                                autocomplete="off"
                                required
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                Ne yapmak istiyorsun?
                            </span>

                            <textarea
                                id="worldDescriptionInput"
                                name="worldDescription"
                                maxlength="300"
                                placeholder="Fikrini birkaç cümleyle anlat..."
                                rows="4"
                            ></textarea>

                        </label>


                        <label class="engine-field">

                            <span>
                                Etiketler
                            </span>

                            <input
                                id="worldTagsInput"
                                name="worldTags"
                                type="text"
                                maxlength="160"
                                placeholder="teknoloji, tasarım, araştırma"
                                autocomplete="off"
                            >

                        </label>


                        <button
                            type="submit"
                            class="primary-btn create-submit"
                            data-action="world:create:submit"
                        >
                            Çalışma Alanını Başlat
                        </button>

                    </div>

                </form>


                <aside class="section create-preview">

                    <span class="engine-section-label">
                        VAERO YARAT
                    </span>

                    <div
                        class="create-preview-orbit"
                        aria-hidden="true"
                    >
                        <span></span>
                    </div>

                    <h2>
                        Fikirden çalışan yapıya
                    </h2>

                    <p>
                        VAERO seçtiğin şey için bağımsız bir çalışma alanı oluşturur.
                        Brain, uygulamalar, varlıklar ve diğer araçlar bu alanın içinde birlikte çalışabilir.
                    </p>

                    <small>
                        ${worlds.length}
                        mevcut çalışma alanı
                    </small>

                </aside>

            </div>

        </section>
    `;

},

    /* =====================================================
       WORLD VIEW
    ===================================================== */

    worldView(world){

        if(
            !world ||
            !world.id
        ){

            return this.errorState(
                "Dünya bilgisi bulunamadı."
            );

        }


        const engine =
            this.getEngine();


        if(
            engine?.worldEditMode ===
            true
        ){

            return this.worldEditView(
                world
            );

        }


        if(
            engine?.entityCreateMode
        ){

            return this.entityCreateView(
                world
            );

        }

       const creationKind =
    String(
        world?.metadata
            ?.creationKind ||
        ""
    )
        .trim()
        .toLowerCase();


const creationKindLabels = {

    idea:
        "Fikir",

    project:
        "Proje",

    application:
        "Uygulama",

    system:
        "Sistem",

    automation:
        "Otomasyon",

    invention:
        "Buluş"

};


const worldKindLabel =
    creationKindLabels[
        creationKind
    ] ||
    this.translate(
        world?.type ||
        "custom-world"
    );

        const entities =
            Array.isArray(
                world.entities
            )
                ? world.entities.filter(
                    entity =>
                        entity?.archived !==
                            true
                )
                : [];


        const activeCount =
            entities.filter(
                entity =>
                    entity?.status ===
                        "active" ||
                    entity?.status ===
                        "online"
            ).length;


        return `
            <section class="engine-page world-page">

                <div class="engine-page-toolbar">

                    <button
                        type="button"
                        class="engine-back-btn"
                        data-action="worlds:open"
                    >
                        ← Dünyalara Dön
                    </button>

                    <div class="engine-page-toolbar-actions">

                        <button
                            type="button"
                            class="secondary-btn"
                            data-action="world:edit:open"
                        >
                            Düzenle
                        </button>

                        ${
                            world.id !==
                                "vaero-world"
                                ? `
                                    <button
                                        type="button"
                                        class="secondary-btn"
                                        data-action="world:archive"
                                    >
                                        Arşivle
                                    </button>
                                `
                                : ""
                        }

                    </div>

                </div>


                <header class="world-hero">

                    <div class="world-hero-copy">

                        <div class="world-badge">
    ◯
    ${this.escapeHTML(
        worldKindLabel
    )}
</div>
                        <h1 class="world-title">
                            ${this.escapeHTML(
                                world.name
                            )}
                        </h1>

                        <p class="world-description">
                            ${this.escapeHTML(
                                world.description ||
                                "Bu dünya yaşayan bir ekosistemdir. Varlıklar burada doğar, gelişir ve tarih oluşturur."
                            )}
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
                                this.translate(
                                    world.status
                                ),
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
                                        .map(
                                            entity =>
                                                this.entityCard(
                                                    entity
                                                )
                                        )
                                        .join("")}

                                </div>
                            `
                            : this.emptyState({
                                icon:
                                    "⬡",
                                title:
                                    "Bu dünya henüz sessiz",
                                text:
                                    "İlk varlığını oluşturarak dünyaya yaşam ekle.",
                                action:
                                    "entity:create:first",
                                actionLabel:
                                    "İlk Varlığı Oluştur"
                            })
                    }

                </section>

            </section>
        `;

    },


    /* =====================================================
       WORLD EDITOR
    ===================================================== */

    worldEditView(world){

        const tags =
            Array.isArray(
                world.tags
            )
                ? world.tags.join(
                    ", "
                )
                : "";


        return `
            <section class="engine-page world-editor-page">

                <div class="engine-page-toolbar">

                    <button
                        type="button"
                        class="engine-back-btn"
                        data-action="world:edit:cancel"
                    >
                        ← Dünyaya Dön
                    </button>

                </div>


                ${this.pageHeader({
                    eyebrow:
                        "DÜNYA EDİTÖRÜ",
                    title:
                        world.name,
                    text:
                        "Dünyanın görünen bilgilerini ve yaşam durumunu düzenle."
                })}


                <form
                    class="section engine-editor-form"
                    data-engine-form="world-edit"
                >

                    <label class="engine-field">

                        <span>
                            Dünya adı
                        </span>

                        <input
                            id="worldEditNameInput"
                            name="worldName"
                            type="text"
                            maxlength="60"
                            value="${this.escapeHTML(
                                world.name
                            )}"
                            required
                        >

                    </label>


                    <label class="engine-field">

                        <span>
                            Açıklama
                        </span>

                        <textarea
                            id="worldEditDescriptionInput"
                            name="worldDescription"
                            maxlength="300"
                            rows="5"
                        >${this.escapeHTML(
                            world.description ||
                            ""
                        )}</textarea>

                    </label>


                    <label class="engine-field">

                        <span>
                            Etiketler
                        </span>

                        <input
                            id="worldEditTagsInput"
                            name="worldTags"
                            type="text"
                            maxlength="160"
                            value="${this.escapeHTML(
                                tags
                            )}"
                            placeholder="proje, araştırma, kişisel"
                        >

                    </label>


                    <label class="engine-field">

                        <span>
                            Durum
                        </span>

                        <select
                            id="worldEditStatusInput"
                            name="worldStatus"
                        >

                            <option
                                value="active"
                                ${
                                    world.status ===
                                        "active"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Aktif
                            </option>

                            <option
                                value="inactive"
                                ${
                                    world.status ===
                                        "inactive"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Pasif
                            </option>

                            <option
                                value="paused"
                                ${
                                    world.status ===
                                        "paused"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Duraklatıldı
                            </option>

                        </select>

                    </label>


                    <div class="engine-editor-actions">

                        <button
                            type="button"
                            class="secondary-btn"
                            data-action="world:edit:cancel"
                        >
                            Vazgeç
                        </button>

                        <button
                            type="submit"
                            class="primary-btn"
                            data-action="world:edit:submit"
                        >
                            Değişiklikleri Kaydet
                        </button>

                    </div>

                </form>

            </section>
        `;

    },


    worldEditor(world){

        return this.worldEditView(
            world
        );

    },

   /* =====================================================
       ENTITY CREATE
    ===================================================== */

    entityCreateView(world){

        const selectedType =
            this.getEngine()
                ?.entityType;


        const entityTypes = [

            {
                id:
                    "Person",
                label:
                    "Kişi",
                icon:
                    "♙"
            },

            {
                id:
                    "Company",
                label:
                    "Şirket",
                icon:
                    "▣"
            },

            {
                id:
                    "AI",
                label:
                    "Yapay Zekâ",
                icon:
                    "✦"
            },

            {
                id:
                    "Device",
                label:
                    "Cihaz",
                icon:
                    "◇"
            },

            {
                id:
                    "Knowledge",
                label:
                    "Bilgi",
                icon:
                    "◫"
            },

            {
                id:
                    "Community",
                label:
                    "Topluluk",
                icon:
                    "◯"
            },

            {
                id:
                    "Planet",
                label:
                    "Gezegen",
                icon:
                    "●"
            },

            {
                id:
                    "Custom",
                label:
                    "Özel",
                icon:
                    "+"
            }

        ];


        return `
            <section class="engine-page entity-create-page">

                <button
                    type="button"
                    class="engine-back-btn"
                    data-action="entity:create:cancel"
                >
                    ← ${this.escapeHTML(
                        world?.name ||
                        "Dünya"
                    )}
                </button>


                ${this.pageHeader({
                    eyebrow:
                        "YENİ VARLIK",
                    title:
                        selectedType
                            ? `${this.translate(
                                selectedType
                            )} oluştur`
                            : "Ne oluşturmak istiyorsun?",
                    text:
                        selectedType
                            ? "Varlığın temel bilgilerini belirleyerek bu dünyaya yaşam ekle."
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
                                            this.translate(
                                                selectedType
                                            )
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
                                        Açıklama
                                    </span>

                                    <textarea
                                        id="entityDescriptionInput"
                                        name="entityDescription"
                                        maxlength="300"
                                        placeholder="Bu varlığın amacı nedir?"
                                        rows="4"
                                    ></textarea>

                                </label>


                                <label class="engine-field">

                                    <span>
                                        Etiketler
                                    </span>

                                    <input
                                        id="entityTagsInput"
                                        name="entityTags"
                                        type="text"
                                        maxlength="160"
                                        placeholder="kişisel, proje, araştırma"
                                        autocomplete="off"
                                    >

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
                                    .map(
                                        type => `
                                            <button
                                                type="button"
                                                class="entity-type-card"
                                                data-action="entity:type:select"
                                                data-entity-type="${this.escapeHTML(
                                                    type.id
                                                )}"
                                            >

                                                <span>
                                                    ${this.escapeHTML(
                                                        type.icon
                                                    )}
                                                </span>

                                                <strong>
                                                    ${this.escapeHTML(
                                                        type.label
                                                    )}
                                                </strong>

                                            </button>
                                        `
                                    )
                                    .join("")}

                            </div>
                        `
                }

            </section>
        `;

    },


    /* =====================================================
       ENTITY CARD
    ===================================================== */

    entityCard(entity){

        const tags =
            Array.isArray(
                entity?.tags
            )
                ? entity.tags.slice(
                    0,
                    2
                )
                : [];


        return `
            <button
                type="button"
                class="world-entity-btn"
                data-action="entity:open"
                data-entity-id="${this.escapeHTML(
                    entity?.id
                )}"
            >

                <span class="world-entity-symbol">
                    ${this.escapeHTML(
                        String(
                            entity?.name ||
                            "V"
                        )
                            .charAt(0)
                            .toUpperCase()
                    )}
                </span>

                <span class="world-entity-content">

                    <small class="world-entity-type">
                        ${this.escapeHTML(
                            this.translate(
                                entity?.type
                            )
                        )}
                    </small>

                    <strong class="world-entity-name">
                        ${this.escapeHTML(
                            entity?.name ||
                            "İsimsiz Varlık"
                        )}
                    </strong>

                    ${
                        tags.length
                            ? `
                                <span class="world-entity-tags">
                                    ${tags
                                        .map(
                                            tag =>
                                                this.escapeHTML(
                                                    tag
                                                )
                                        )
                                        .join(" · ")}
                                </span>
                            `
                            : ""
                    }

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


    /* =====================================================
       ENTITY APP ROUTER
    ===================================================== */

    entityApp(entity){

        const engine =
            this.getEngine();


        switch(
            engine?.currentEntityPage
        ){

            case "identity":

                return this.entityIdentity(
                    entity
                );


            case "profile":

                return this.entityProfile(
                    entity
                );


            case "organs":

                return this.entityOrgans(
                    entity
                );


            case "memory":

                return this.entityMemory(
                    entity
                );


            case "timeline":

                return this.entityTimeline(
                    entity
                );


            case "bridge":

                return this.entityBridge(
                    entity
                );


            case "evolution":

                return this.entityEvolution(
                    entity
                );


            case "settings":

                return this.entitySettings(
                    entity
                );


            case "discovery":

                return this.entityDiscovery(
                    entity
                );


            default:

                return this.entityView(
                    entity
                );

        }

    },


    /* =====================================================
       ENTITY VIEW
    ===================================================== */

    entityView(entity){

        if(!entity){

            return this.errorState(
                "Varlık bilgisi bulunamadı."
            );

        }


        const engine =
            this.getEngine();


        if(
            engine?.entityEditMode ===
            true
        ){

            return this.entityEditView(
                entity
            );

        }


        const tags =
            Array.isArray(
                entity.tags
            )
                ? entity.tags
                : [];


        return `
            <section class="engine-page entity-page">

                <div class="engine-page-toolbar">

                    <button
                        type="button"
                        class="engine-back-btn"
                        data-action="world:back"
                    >
                        ← Dünyaya Dön
                    </button>


                    <div class="engine-page-toolbar-actions">

                        <button
                            type="button"
                            class="secondary-btn"
                            data-action="entity:edit:open"
                        >
                            Düzenle
                        </button>

                        ${
                            entity.id !==
                                engine?.rootEntity?.id
                                ? `
                                    <button
                                        type="button"
                                        class="secondary-btn"
                                        data-action="entity:archive"
                                    >
                                        Arşivle
                                    </button>
                                `
                                : ""
                        }

                    </div>

                </div>


                <header class="section entity-header">

                    <span class="entity-header-symbol">
                        ${this.escapeHTML(
                            String(
                                entity.name ||
                                "V"
                            )
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </span>

                    <div>

                        <span class="engine-section-label">
                            ${this.escapeHTML(
                                this.translate(
                                    entity.type
                                )
                            )}
                        </span>

                        <h1>
                            ${this.escapeHTML(
                                entity.name
                            )}
                        </h1>

                        <p>
                            ${this.escapeHTML(
                                entity.description ||
                                "Bu varlık VAERO dünyası içinde yaşıyor."
                            )}
                        </p>

                        ${
                            tags.length
                                ? `
                                    <div class="entity-tag-row">

                                        ${tags
                                            .map(
                                                tag => `
                                                    <span>
                                                        ${this.escapeHTML(
                                                            tag
                                                        )}
                                                    </span>
                                                `
                                            )
                                            .join("")}

                                    </div>
                                `
                                : ""
                        }

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
                        "entity:memory",
                        "◫",
                        "Hafıza",
                        "Kalıcı kayıtlar"
                    )}

                    ${this.entityAppLink(
                        "entity:timeline",
                        "◷",
                        "Zaman Çizelgesi",
"Geçmiş ve önemli olaylar"
                    )}

                    ${this.entityAppLink(
                        "entity:bridge",
                        "⌁",
                        "Bağlantılar",
"İlişkiler ve bağlantılar"
                    )}

                    ${this.entityAppLink(
                        "entity:organs",
                        "▦",
                        "Organlar",
                        "Bağlı sistem uygulamaları"
                    )}

                    ${this.entityAppLink(
                        "entity:evolution",
                        "⌬",
                        "Evrim",
                        "Yaşam ve gelişim olayları"
                    )}

                    ${this.entityAppLink(
                        "entity:settings",
                        "⚙️",
                        "Ayarlar",
                        "Varlık tercihleri"
                    )}

                </div>

            </section>
        `;

    },


    /* =====================================================
       ENTITY EDITOR
    ===================================================== */

    entityEditView(entity){

        const tags =
            Array.isArray(
                entity.tags
            )
                ? entity.tags.join(
                    ", "
                )
                : "";


        return `
            <section class="engine-page entity-editor-page">

                <button
                    type="button"
                    class="engine-back-btn"
                    data-action="entity:edit:cancel"
                >
                    ← Varlığa Dön
                </button>


                ${this.pageHeader({
                    eyebrow:
                        "VARLIK EDİTÖRÜ",
                    title:
                        entity.name,
                    text:
                        "Varlığın temel görünümünü, açıklamasını, etiketlerini ve durumunu düzenle."
                })}


                <form
                    class="section engine-editor-form"
                    data-engine-form="entity-edit"
                >

                    <label class="engine-field">

                        <span>
                            Varlık adı
                        </span>

                        <input
                            id="entityEditNameInput"
                            name="entityName"
                            type="text"
                            maxlength="60"
                            value="${this.escapeHTML(
                                entity.name
                            )}"
                            required
                        >

                    </label>


                    <label class="engine-field">

                        <span>
                            Açıklama
                        </span>

                        <textarea
                            id="entityEditDescriptionInput"
                            name="entityDescription"
                            maxlength="300"
                            rows="5"
                        >${this.escapeHTML(
                            entity.description ||
                            ""
                        )}</textarea>

                    </label>


                    <label class="engine-field">

                        <span>
                            Etiketler
                        </span>

                        <input
                            id="entityEditTagsInput"
                            name="entityTags"
                            type="text"
                            maxlength="160"
                            value="${this.escapeHTML(
                                tags
                            )}"
                        >

                    </label>


                    <label class="engine-field">

                        <span>
                            Durum
                        </span>

                        <select
                            id="entityEditStatusInput"
                            name="entityStatus"
                        >

                            <option
                                value="active"
                                ${
                                    entity.status ===
                                        "active"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Aktif
                            </option>

                            <option
                                value="inactive"
                                ${
                                    entity.status ===
                                        "inactive"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Pasif
                            </option>

                            <option
                                value="paused"
                                ${
                                    entity.status ===
                                        "paused"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Duraklatıldı
                            </option>

                        </select>

                    </label>


                    <div class="engine-editor-actions">

                        <button
                            type="button"
                            class="secondary-btn"
                            data-action="entity:edit:cancel"
                        >
                            Vazgeç
                        </button>

                        <button
                            type="submit"
                            class="primary-btn"
                            data-action="entity:edit:submit"
                        >
                            Değişiklikleri Kaydet
                        </button>

                    </div>

                </form>

            </section>
        `;

    },


    entityEditor(entity){

        return this.entityEditView(
            entity
        );

    },

   /* =====================================================
       ENTITY APPS
    ===================================================== */

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
                data-action="${this.escapeHTML(
                    this.safeAction(
                        action
                    )
                )}"
            >

                <span>
                    ${this.escapeHTML(
                        icon
                    )}
                </span>

                <strong>
                    ${this.escapeHTML(
                        title
                    )}
                </strong>

                <small>
                    ${this.escapeHTML(
                        subtitle
                    )}
                </small>

            </button>
        `;

    },


    resolveApplication(
        serviceName,
        globalName
    ){

        try{

            return (
                this.getService(
                    serviceName
                ) ||
                window[
                    globalName
                ] ||
                null
            );

        } catch(error){

            return null;

        }

    },


    renderAppSafely(
        app,
        entity,
        fallbackMessage
    ){

        if(
            app &&
            typeof app.render ===
                "function"
        ){

            try{

                const result =
                    app.render(
                        entity
                    );


                if(
                    typeof result ===
                    "string"
                ){

                    return result;

                }

            } catch(error){

                console.error(
                    "Entity application render failed:",
                    error
                );

            }

        }


        return this.errorState(
            fallbackMessage
        );

    },


    entityIdentity(entity){

        return this.renderAppSafely(
            this.resolveApplication(
                "identityApp",
                "IdentityApp"
            ),
            entity,
            "Kimlik uygulaması yüklenemedi."
        );

    },


    entityProfile(entity){

        return this.renderAppSafely(
            this.resolveApplication(
                "profileApp",
                "ProfileApp"
            ),
            entity,
            "Profil uygulaması yüklenemedi."
        );

    },


    entityOrgans(entity){

        return this.renderAppSafely(
            this.resolveApplication(
                "organsApp",
                "OrgansApp"
            ),
            entity,
            "Organlar uygulaması yüklenemedi."
        );

    },


    entityTimeline(entity){

        return this.renderAppSafely(
            this.resolveApplication(
                "timelineApp",
                "TimelineApp"
            ),
            entity,
            "Timeline uygulaması yüklenemedi."
        );

    },


    entityBridge(entity){

        return this.renderAppSafely(
            this.resolveApplication(
                "bridgeApp",
                "BridgeApp"
            ),
            entity,
            "Bridge uygulaması yüklenemedi."
        );

    },


    entityMemory(entity){

        return this.renderAppSafely(
            this.resolveApplication(
                "memoryApp",
                "MemoryApp"
            ),
            entity,
            "Hafıza uygulaması yüklenemedi."
        );

    },


    entityEvolution(entity){

        return this.renderAppSafely(
            this.resolveApplication(
                "evolutionApp",
                "EvolutionApp"
            ),
            entity,
            "Evolution uygulaması yüklenemedi."
        );

    },


    entitySettings(entity){

        return this.renderAppSafely(
            this.resolveApplication(
                "settingsApp",
                "SettingsApp"
            ),
            entity,
            "Ayarlar uygulaması yüklenemedi."
        );

    },


    entityDiscovery(entity){

    return `
        <section class="engine-page">

            ${this.pageHeader({
                eyebrow:
                    "DISCOVERY",

                title:
                    "Keşif yönünü güncelle",

                text:
                    "İlgi alanlarını, hedeflerini ve VAERO’dan beklentilerini yeniden değerlendirebilirsin."
            })}


            ${this.emptyState({
                icon:
                    "◇",

                title:
                    "Discovery Journey",

                text:
                    "Mevcut yönünü yeniden değerlendirmek için Discovery Journey’i yeniden başlatabilirsin.",

                action:
                    "discovery:restart",

                actionLabel:
                    "Discovery’yi Yeniden Başlat"
            })}

        </section>
    `;

},

    /* =====================================================
       SHARED PAGE UI
    ===================================================== */

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
                        ${this.escapeHTML(
                            eyebrow ||
                            ""
                        )}
                    </span>

                    <h1>
                        ${this.escapeHTML(
                            title ||
                            ""
                        )}
                    </h1>

                    ${
                        text
                            ? `
                                <p>
                                    ${this.escapeHTML(
                                        text
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

                ${
                    action &&
                    actionLabel
                        ? `
                            <button
                                type="button"
                                class="primary-btn"
                                data-action="${this.escapeHTML(
                                    this.safeAction(
                                        action
                                    )
                                )}"
                            >
                                ${this.escapeHTML(
                                    actionLabel
                                )}
                            </button>
                        `
                        : ""
                }

            </header>
        `;

    },


    statCard(
        value,
        label
    ){

        return `
            <div class="world-stat">

                <strong>
                    ${this.escapeHTML(
                        value
                    )}
                </strong>

                <span>
                    ${this.escapeHTML(
                        label
                    )}
                </span>

            </div>
        `;

    },


    emptyState({
        icon = "◌",
        title,
        text = "",
        description = "",
        action = null,
        actionLabel = null
    }){

        const bodyText =
            text ||
            description ||
            "";


        return `
            <div class="section engine-page-empty">

                <span class="engine-page-empty-icon">
                    ${this.escapeHTML(
                        icon
                    )}
                </span>

                <h2>
                    ${this.escapeHTML(
                        title ||
                        "Henüz içerik yok"
                    )}
                </h2>

                ${
                    bodyText
                        ? `
                            <p>
                                ${this.escapeHTML(
                                    bodyText
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    action &&
                    actionLabel
                        ? `
                            <button
                                type="button"
                                class="primary-btn"
                                data-action="${this.escapeHTML(
                                    this.safeAction(
                                        action
                                    )
                                )}"
                            >
                                ${this.escapeHTML(
                                    actionLabel
                                )}
                            </button>
                        `
                        : ""
                }

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
                    ${this.escapeHTML(
                        message ||
                        "Bilinmeyen ekran hatası."
                    )}
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


    /* =====================================================
       NAVIGATION
    ===================================================== */

    navigation(
        state = {}
    ){

        const view =
            state.view ||
            "home";


        const page =
            state.page ||
            null;


        const homeActive =
            view ===
                "home" &&
            !page;


        const identityActive =
            view ===
                "identity" ||
            view ===
                "profile" ||
            (
                view ===
                    "entity" &&
                [
                    "identity",
                    "profile"
                ].includes(
                    page
                )
            );


        const createActive =
            view ===
                "create";


        const worldsActive =
            view ===
                "worlds" ||
            view ===
                "world";


        return `
            <nav
                class="bottom-nav engine-bottom-nav"
                aria-label="Ana navigasyon"
            >

                ${this.navButton({
                    action:
                        "home:open",
                    icon:
                        "⌂",
                    label:
                        "Ev",
                    active:
                        homeActive
                })}


                ${this.navButton({
                    action:
                        "identity:open",
                    icon:
                        "ID",
                    label:
                        "Kimlik",
                    active:
                        identityActive
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
                    action:
                        "create:open",
                    icon:
                        "＋",
                    label:
                        "Yarat",
                    active:
                        createActive
                })}


                ${this.navButton({
                    action:
                        "worlds:open",
                    icon:
                        "◌",
                    label:
                        "Dünya",
                    active:
                        worldsActive
                })}


                <span class="nav-brain-label">
                    Brain
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
                class="
                    nav-btn
                    ${
                        active
                            ? "active"
                            : ""
                    }
                "
                data-action="${this.escapeHTML(
                    this.safeAction(
                        action
                    )
                )}"
                ${
                    active
                        ? 'aria-current="page"'
                        : ""
                }
            >

                <span class="nav-icon">
                    ${this.escapeHTML(
                        icon
                    )}
                </span>

                <span>
                    ${this.escapeHTML(
                        label
                    )}
                </span>

            </button>
        `;

    }

};


/* =========================================================
   REGISTER
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        VAERO.register(
            "components",
            Components
        );

    }

} catch(error){

    console.warn(
        "Components VAERO register başarısız:",
        error
    );

}


window.Components =
    Components;
