/* =========================================================
   VAERO PROFILE APP
   Entity Public / Social / Discovery Presentation Layer
========================================================= */

const ProfileApp = {

    editorOpen:
        false,

    activeSection:
        "overview",


    /* =====================================================
       HTML SAFETY
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
       ENGINE / SERVICES
    ===================================================== */

    getEngine(){

        try{

            if(
                typeof VAERO !== "undefined" &&
                VAERO.engine
            ){
                return VAERO.engine;
            }

        } catch(error){

            /* fallback */
        }


        return (
            window.Engine ||
            null
        );

    },


    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !==
                    "function"
            ){
                return null;
            }


            return (
                VAERO.get(name) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    getCurrentEntity(){

        const engine =
            this.getEngine();


        return (
            engine?.currentOpenedEntity ||
            engine?.currentEntity ||
            engine?.rootEntity ||
            null
        );

    },


    remount(){

        const engine =
            this.getEngine();


        if(
            !engine ||
            typeof engine.mount !==
                "function"
        ){
            return false;
        }


        return engine.mount(
            engine.currentEntity
        );

    },


    /* =====================================================
       BRAIN AWARENESS
    ===================================================== */

    enterBrainContext(entity = null){

        try{

            const awareness =
                this.getService(
                    "brainAwareness"
                );


            awareness?.enter?.(
                "profile",
                {
                    entityId:
                        entity?.id ||
                        null,

                    section:
                        this.activeSection
                }
            );

        } catch(error){

            console.warn(
                "Profile Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeVisibility(value){

        const visibility =
            String(
                value ||
                "private"
            )
                .trim()
                .toLowerCase();


        return [
            "private",
            "connections",
            "engine"
        ].includes(
            visibility
        )
            ? visibility
            : "private";

    },


    normalizeList(value){

        if(
            Array.isArray(
                value
            )
        ){

            return [
                ...new Set(
                    value
                        .map(
                            item =>
                                String(
                                    item ?? ""
                                ).trim()
                        )
                        .filter(Boolean)
                )
            ];

        }


        return [
            ...new Set(
                String(
                    value ||
                    ""
                )
                    .split(",")
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(Boolean)
            )
        ];

    },


    normalizeProfile(
        profile = {},
        entity = null
    ){

        const now =
            Date.now();


        return {

            displayName:
                String(
                    profile.displayName ||
                    entity?.name ||
                    "İsimsiz Varlık"
                ).trim(),

            headline:
                String(
                    profile.headline ||
                    ""
                ).trim(),

            bio:
                String(
                    profile.bio ||
                    profile.about ||
                    ""
                ).trim(),

            location:
                String(
                    profile.location ||
                    ""
                ).trim(),

            website:
                String(
                    profile.website ||
                    ""
                ).trim(),

            interests:
                this.normalizeList(
                    profile.interests
                ),

            skills:
                this.normalizeList(
                    profile.skills
                ),

            languages:
                this.normalizeList(
                    profile.languages
                ),

            visibility:
                this.normalizeVisibility(
                    profile.visibility
                ),

            discoverable:
                profile.discoverable !==
                    false,

            showEvolution:
                profile.showEvolution !==
                    false,

            showConnections:
                profile.showConnections !==
                    false,

            createdAt:
                Number(
                    profile.createdAt
                ) ||
                Number(
                    entity?.createdAt
                ) ||
                now,

            updatedAt:
                Number(
                    profile.updatedAt
                ) ||
                now

        };

    },


    getProfile(entity){

        if(!entity){
            return null;
        }


        const profile =
            this.normalizeProfile(
                entity.profile ||
                {},
                entity
            );


        entity.profile =
            profile;


        return profile;

    },


    /* =====================================================
       DISCOVERY DATA
    ===================================================== */

    getDiscoveryAnswers(entity = null){

        /*
         * Öncelik Evolution Core.
         */

        const evolution =
            this.getService(
                "evolution"
            );


        if(
            evolution &&
            typeof evolution.all ===
                "function"
        ){

            try{

                const events =
                    evolution.all({
                        includeArchived:true
                    }) ||
                    [];


                const discoveryEvent =
                    events.find(
                        item =>
                            item &&
                            item.source ===
                                "discovery" &&
                            item.payload &&
                            item.payload
                                .discoveryAnswers &&
                            (
                                !entity?.id ||
                                !item.relatedEntityId ||
                                item.relatedEntityId ===
                                    entity.id
                            )
                    );


                if(discoveryEvent){

                    return {
                        ...discoveryEvent
                            .payload
                            .discoveryAnswers
                    };

                }

            } catch(error){

                /* localStorage fallback */
            }

        }


        try{

            const saved =
                localStorage.getItem(
                    "vaero:discovery:answers"
                );


            if(!saved){
                return {};
            }


            const parsed =
                JSON.parse(
                    saved
                );


            return (
                parsed &&
                typeof parsed ===
                    "object" &&
                !Array.isArray(
                    parsed
                )
            )
                ? parsed
                : {};

        } catch(error){

            console.warn(
                "Discovery profili okunamadı:",
                error
            );


            return {};

        }

    },


    formatDiscoveryAnswer(answer){

        if(
            Array.isArray(
                answer
            )
        ){

            const values =
                answer
                    .map(
                        item =>
                            String(
                                item ||
                                ""
                            ).trim()
                    )
                    .filter(Boolean);


            return values.length
                ? values.join(
                    " · "
                )
                : "Henüz belirlenmedi";

        }


        if(
            answer === null ||
            answer === undefined ||
            answer === ""
        ){

            return "Henüz belirlenmedi";

        }


        return String(
            answer
        );

    },


    /* =====================================================
       STATS
    ===================================================== */

    getStats(entity){

        const bridge =
            this.getService(
                "bridge"
            );


        const evolution =
            this.getService(
                "evolution"
            );


        let connections =
            0;

        let xp =
            0;

        let level =
            1;

        let milestones =
            0;


        try{

            if(
                bridge &&
                typeof bridge.find ===
                    "function"
            ){

                connections =
                    (
                        bridge.find(
                            entity.id
                        ) ||
                        []
                    ).length;

            }

        } catch(error){

            connections =
                0;

        }


        try{

            if(
                evolution &&
                typeof evolution.forEntity ===
                    "function"
            ){

                const events =
                    evolution.forEntity(
                        entity.id
                    ) ||
                    [];


                xp =
                    events.reduce(
                        (total,event) =>
                            total +
                            Math.max(
                                0,
                                Number(
                                    event.xp
                                ) ||
                                0
                            ),
                        0
                    );


                milestones =
                    events.filter(
                        event =>
                            event.type ===
                                "milestone" ||
                            event.type ===
                                "achievement"
                    ).length;


                level =
                    Math.floor(
                        xp / 100
                    ) + 1;

            }

        } catch(error){

            xp =
                0;

            level =
                1;

            milestones =
                0;

        }


        return {

            connections,

            xp,

            level,

            milestones

        };

    },


    /* =====================================================
       PERSISTENCE
    ===================================================== */

    persistProfile(
        entity,
        profile
    ){

        if(
            !entity ||
            !entity.id
        ){
            return false;
        }


        entity.profile = {
            ...profile,
            updatedAt:
                Date.now()
        };


        const manager =
            this.getService(
                "entityManager"
            );


        if(
            manager &&
            typeof manager.get ===
                "function"
        ){

            try{

                const managed =
                    manager.get(
                        entity.id
                    );


                if(managed){

                    managed.profile = {
                        ...entity.profile
                    };


                    if(
                        typeof managed.touch ===
                            "function"
                    ){

                        managed.touch();

                    } else {

                        managed.updatedAt =
                            Date.now();

                    }

                }

            } catch(error){

                console.warn(
                    "Profile EntityManager senkronu başarısız:",
                    error
                );

            }

        }


        const engine =
            this.getEngine();


        const world =
            engine?.currentWorld;


        if(
            world &&
            Array.isArray(
                world.entities
            )
        ){

            const index =
                world.entities.findIndex(
                    item =>
                        item?.id ===
                        entity.id
                );


            if(index >= 0){

                world.entities[
                    index
                ] = entity;

            }

        }


        try{

            this.getService(
                "world"
            )?.save?.();

        } catch(error){

            console.warn(
                "Profile World senkronu başarısız:",
                error
            );

        }


        return true;

    },


    /* =====================================================
       SAVE PROFILE
    ===================================================== */

    saveProfile(entity){

        if(!entity){
            return false;
        }


        const current =
            this.getProfile(
                entity
            );


        const displayName =
            String(
                document.getElementById(
                    "profileDisplayNameInput"
                )?.value ||
                ""
            ).trim();


        if(!displayName){

            document.getElementById(
                "profileDisplayNameInput"
            )?.focus();


            return false;

        }


        const profile = {

            ...current,

            displayName,

            headline:
                String(
                    document.getElementById(
                        "profileHeadlineInput"
                    )?.value ||
                    ""
                ).trim(),

            bio:
                String(
                    document.getElementById(
                        "profileBioInput"
                    )?.value ||
                    ""
                ).trim(),

            location:
                String(
                    document.getElementById(
                        "profileLocationInput"
                    )?.value ||
                    ""
                ).trim(),

            website:
                String(
                    document.getElementById(
                        "profileWebsiteInput"
                    )?.value ||
                    ""
                ).trim(),

            interests:
                this.normalizeList(
                    document.getElementById(
                        "profileInterestsInput"
                    )?.value
                ),

            skills:
                this.normalizeList(
                    document.getElementById(
                        "profileSkillsInput"
                    )?.value
                ),

            languages:
                this.normalizeList(
                    document.getElementById(
                        "profileLanguagesInput"
                    )?.value
                ),

            visibility:
                this.normalizeVisibility(
                    document.getElementById(
                        "profileVisibilityInput"
                    )?.value
                ),

            discoverable:
                Boolean(
                    document.getElementById(
                        "profileDiscoverableInput"
                    )?.checked
                ),

            showEvolution:
                Boolean(
                    document.getElementById(
                        "profileShowEvolutionInput"
                    )?.checked
                ),

            showConnections:
                Boolean(
                    document.getElementById(
                        "profileShowConnectionsInput"
                    )?.checked
                ),

            updatedAt:
                Date.now()

        };


        /*
         * Display name Profile katmanındadır.
         * Entity'nin sistem kimliği/name alanını zorla
         * değiştirmiyoruz.
         */

        if(
            !this.persistProfile(
                entity,
                profile
            )
        ){
            return false;
        }


        this.recordEvolution(
            entity
        );


        this.editorOpen =
            false;


        return this.remount();

    },


    /* =====================================================
       EVOLUTION RECORD
    ===================================================== */

    recordEvolution(entity){

        const evolution =
            this.getService(
                "evolution"
            );


        if(
            !evolution ||
            typeof evolution.record !==
                "function"
        ){
            return false;
        }


        try{

            evolution.record(
                "general",
                "Profil bilgileri güncellendi",
                {
                    title:
                        "Profil güncellendi",

                    source:
                        "profile",

                    status:
                        "completed",

                    importance:
                        "low",

                    relatedEntityId:
                        entity.id,

                    relatedWorldId:
                        this.getEngine()
                            ?.currentWorld
                            ?.id ||
                        null,

                    organs:[
                        "profile",
                        "memory",
                        "timeline"
                    ],

                    tags:[
                        "profile",
                        "update"
                    ]
                }
            );


            return true;

        } catch(error){

            console.warn(
                "Profile Evolution kaydı oluşturulamadı:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       VISIBILITY
    ===================================================== */

    visibilityLabel(value){

        const labels = {

            private:
                "Özel",

            connections:
                "Bağlantılar",

            engine:
                "Engine"

        };


        return (
            labels[value] ||
            "Özel"
        );

    },


    /* =====================================================
       PROFILE HERO
    ===================================================== */

    renderProfileHero(
        entity,
        profile
    ){

        const initial =
            String(
                profile.displayName ||
                entity.name ||
                "V"
            )
                .charAt(0)
                .toUpperCase();


        return `
            <section class="profile-hero-card">

                <div class="profile-avatar">
                    ${this.escapeHTML(
                        initial
                    )}
                </div>


                <div class="profile-hero-copy">

                    <span class="engine-section-label">
                        ENTITY PROFILE
                    </span>

                    <h2>
                        ${this.escapeHTML(
                            profile.displayName
                        )}
                    </h2>

                    <p class="profile-headline">
                        ${this.escapeHTML(
                            profile.headline ||
                            entity.type ||
                            "VAERO Entity"
                        )}
                    </p>


                    ${
                        profile.location
                            ? `
                                <small>
                                    ${this.escapeHTML(
                                        profile.location
                                    )}
                                </small>
                              `
                            : ""
                    }

                </div>


                <div class="profile-hero-actions">

                    <span class="profile-visibility-chip">
                        ${this.escapeHTML(
                            this.visibilityLabel(
                                profile.visibility
                            )
                        )}
                    </span>


                    <button
                        type="button"
                        class="primary-btn"
                        data-profile-action="edit"
                    >
                        Profili Düzenle
                    </button>

                </div>

            </section>
        `;

    },


    /* =====================================================
       STATS UI
    ===================================================== */

    renderStats(entity){

        const stats =
            this.getStats(
                entity
            );


        return `
            <section class="profile-stats">

                <div>

                    <strong>
                        ${stats.connections}
                    </strong>

                    <span>
                        Bağlantı
                    </span>

                </div>


                <div>

                    <strong>
                        ${stats.milestones}
                    </strong>

                    <span>
                        Dönüm Noktası
                    </span>

                </div>


                <div>

                    <strong>
                        ${stats.level}
                    </strong>

                    <span>
                        Seviye
                    </span>

                </div>


                <div>

                    <strong>
                        ${stats.xp}
                    </strong>

                    <span>
                        XP
                    </span>

                </div>

            </section>
        `;

    },


    /* =====================================================
       OVERVIEW
    ===================================================== */

    renderOverview(
        entity,
        profile
    ){

        return `
            <section class="profile-overview">

                <div class="profile-about-card">

                    <span class="engine-section-label">
                        ABOUT
                    </span>

                    <h3>
                        Hakkında
                    </h3>


                    ${
                        profile.bio
                            ? `
                                <p>
                                    ${this.escapeHTML(
                                        profile.bio
                                    )}
                                </p>
                              `
                            : `
                                <p class="profile-empty-text">
                                    Henüz profil açıklaması eklenmedi.
                                </p>
                              `
                    }


                    ${
                        profile.website
                            ? `
                                <div class="profile-info-line">

                                    <span>
                                        Website
                                    </span>

                                    <strong>
                                        ${this.escapeHTML(
                                            profile.website
                                        )}
                                    </strong>

                                </div>
                              `
                            : ""
                    }


                    <div class="profile-info-line">

                        <span>
                            Entity türü
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                entity.type ||
                                "Belirsiz"
                            )}
                        </strong>

                    </div>


                    <div class="profile-info-line">

                        <span>
                            Entity ID
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                entity.id
                            )}
                        </strong>

                    </div>

                </div>


                <div class="profile-capabilities-card">

                    <span class="engine-section-label">
                        SIGNALS
                    </span>

                    <h3>
                        İlgi ve yetenekler
                    </h3>


                    ${this.renderTagGroup(
                        "İlgi Alanları",
                        profile.interests
                    )}


                    ${this.renderTagGroup(
                        "Yetenekler",
                        profile.skills
                    )}


                    ${this.renderTagGroup(
                        "Diller",
                        profile.languages
                    )}

                </div>

            </section>
        `;

    },


    renderTagGroup(
        title,
        values
    ){

        return `
            <div class="profile-tag-group">

                <span>
                    ${this.escapeHTML(
                        title
                    )}
                </span>


                <div>

                    ${
                        values.length
                            ? values
                                .map(
                                    item => `
                                        <small>
                                            ${this.escapeHTML(
                                                item
                                            )}
                                        </small>
                                    `
                                )
                                .join("")
                            : `
                                <small class="is-empty">
                                    Henüz eklenmedi
                                </small>
                              `
                    }

                </div>

            </div>
        `;

    },


    /* =====================================================
       DISCOVERY PROFILE
    ===================================================== */

    renderDiscoveryProfile(entity){

        const answers =
            this.getDiscoveryAnswers(
                entity
            );


        const rows = [

            {
                label:
                    "Geliş amacı",

                value:
                    answers.purpose
            },

            {
                label:
                    "İlgi alanları",

                value:
                    answers.interest
            },

            {
                label:
                    "Güçlü yönler",

                value:
                    answers.strength
            },

            {
                label:
                    "Şu anki hedef",

                value:
                    answers.goal
            },

            {
                label:
                    "Aradığı bağlantılar",

                value:
                    answers.connection
            },

            {
                label:
                    "VAERO tercihi",

                value:
                    answers.guidance
            }

        ];


        const hasAnswers =
            Object.keys(
                answers
            ).length > 0;


        return `
            <section class="profile-discovery-card">

                <header>

                    <span class="engine-section-label">
                        DISCOVERY PROFILE
                    </span>

                    <h3>
                        Keşif sinyalleri
                    </h3>

                    <p>
                        Discovery Journey sırasında oluşan yön, ilgi ve eşleşme bağlamı.
                    </p>

                </header>


                ${
                    hasAnswers
                        ? `
                            <div class="profile-discovery-grid">

                                ${rows
                                    .map(
                                        row => `
                                            <div>

                                                <span>
                                                    ${this.escapeHTML(
                                                        row.label
                                                    )}
                                                </span>

                                                <strong>
                                                    ${this.escapeHTML(
                                                        this.formatDiscoveryAnswer(
                                                            row.value
                                                        )
                                                    )}
                                                </strong>

                                            </div>
                                        `
                                    )
                                    .join("")}

                            </div>
                          `
                        : `
                            <div class="profile-discovery-empty">

                                <strong>
                                    Discovery verisi bulunamadı
                                </strong>

                                <p>
                                    Discovery Journey tamamlandığında kişisel yön ve eşleşme sinyalleri burada görünür.
                                </p>

                            </div>
                          `
                }

            </section>
        `;

    },


    /* =====================================================
       PROFILE POLICY
    ===================================================== */

    renderPolicy(profile){

        return `
            <section class="profile-policy-card">

                <span class="engine-section-label">
                    PROFILE POLICY
                </span>

                <h3>
                    Profil görünürlüğü
                </h3>


                <div class="profile-policy-list">

                    <div>

                        <span>
                            Görünürlük
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                this.visibilityLabel(
                                    profile.visibility
                                )
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Keşfedilebilir
                        </span>

                        <strong>
                            ${
                                profile.discoverable
                                    ? "Açık"
                                    : "Kapalı"
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Evolution özeti
                        </span>

                        <strong>
                            ${
                                profile.showEvolution
                                    ? "Göster"
                                    : "Gizle"
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Bağlantı sayısı
                        </span>

                        <strong>
                            ${
                                profile.showConnections
                                    ? "Göster"
                                    : "Gizle"
                            }
                        </strong>

                    </div>

                </div>

            </section>
        `;

    },


    /* =====================================================
       EDITOR
    ===================================================== */

    renderEditor(profile){

        return `
            <div class="profile-detail-layer">

                <div
                    class="profile-detail-backdrop"
                    data-profile-action="editor:cancel"
                ></div>


                <form
                    class="profile-editor"
                    data-profile-form="edit"
                >

                    <header class="profile-detail-header">

                        <div>

                            <span class="engine-section-label">
                                PROFILE EDITOR
                            </span>

                            <h2>
                                Profili düzenle
                            </h2>

                        </div>


                        <button
                            type="button"
                            class="engine-icon-btn"
                            data-profile-action="editor:cancel"
                            aria-label="Kapat"
                        >
                            ×
                        </button>

                    </header>


                    <div class="profile-editor-scroll">

                        <label class="engine-field">

                            <span>
                                Görünen isim
                            </span>

                            <input
                                id="profileDisplayNameInput"
                                type="text"
                                maxlength="100"
                                value="${this.escapeHTML(
                                    profile.displayName
                                )}"
                                required
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                Başlık
                            </span>

                            <input
                                id="profileHeadlineInput"
                                type="text"
                                maxlength="140"
                                value="${this.escapeHTML(
                                    profile.headline
                                )}"
                                placeholder="Kısa profil başlığı"
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                Hakkında
                            </span>

                            <textarea
                                id="profileBioInput"
                                maxlength="1200"
                                rows="6"
                                placeholder="Bu varlığı anlat"
                            >${this.escapeHTML(
                                profile.bio
                            )}</textarea>

                        </label>


                        <label class="engine-field">

                            <span>
                                Konum
                            </span>

                            <input
                                id="profileLocationInput"
                                type="text"
                                maxlength="120"
                                value="${this.escapeHTML(
                                    profile.location
                                )}"
                                placeholder="Şehir veya bölge"
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                Website
                            </span>

                            <input
                                id="profileWebsiteInput"
                                type="text"
                                maxlength="300"
                                value="${this.escapeHTML(
                                    profile.website
                                )}"
                                placeholder="https://..."
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                İlgi alanları
                            </span>

                            <input
                                id="profileInterestsInput"
                                type="text"
                                maxlength="300"
                                value="${this.escapeHTML(
                                    profile.interests.join(
                                        ", "
                                    )
                                )}"
                                placeholder="teknoloji, tasarım, müzik"
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                Yetenekler
                            </span>

                            <input
                                id="profileSkillsInput"
                                type="text"
                                maxlength="300"
                                value="${this.escapeHTML(
                                    profile.skills.join(
                                        ", "
                                    )
                                )}"
                                placeholder="strateji, yazılım, tasarım"
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                Diller
                            </span>

                            <input
                                id="profileLanguagesInput"
                                type="text"
                                maxlength="200"
                                value="${this.escapeHTML(
                                    profile.languages.join(
                                        ", "
                                    )
                                )}"
                                placeholder="Türkçe, English"
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                Profil görünürlüğü
                            </span>

                            <select
                                id="profileVisibilityInput"
                            >

                                <option
                                    value="private"
                                    ${
                                        profile.visibility ===
                                            "private"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Özel
                                </option>

                                <option
                                    value="connections"
                                    ${
                                        profile.visibility ===
                                            "connections"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Bağlantılar
                                </option>

                                <option
                                    value="engine"
                                    ${
                                        profile.visibility ===
                                            "engine"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Engine
                                </option>

                            </select>

                        </label>


                        <label class="profile-toggle-row">

                            <span>

                                <strong>
                                    Keşfedilebilir
                                </strong>

                                <small>
                                    Search ve uygun Discovery yüzeylerinde profilin bulunabilmesine izin verir.
                                </small>

                            </span>


                            <input
                                id="profileDiscoverableInput"
                                type="checkbox"
                                ${
                                    profile.discoverable
                                        ? "checked"
                                        : ""
                                }
                            >

                        </label>


                        <label class="profile-toggle-row">

                            <span>

                                <strong>
                                    Evolution bilgisini göster
                                </strong>

                                <small>
                                    Profil özetlerinde gelişim bilgisinin kullanılmasına izin verir.
                                </small>

                            </span>


                            <input
                                id="profileShowEvolutionInput"
                                type="checkbox"
                                ${
                                    profile.showEvolution
                                        ? "checked"
                                        : ""
                                }
                            >

                        </label>


                        <label class="profile-toggle-row">

                            <span>

                                <strong>
                                    Bağlantı bilgisini göster
                                </strong>

                                <small>
                                    Uygun profil yüzeylerinde Bridge bağlantı sayısının kullanılmasına izin verir.
                                </small>

                            </span>


                            <input
                                id="profileShowConnectionsInput"
                                type="checkbox"
                                ${
                                    profile.showConnections
                                        ? "checked"
                                        : ""
                                }
                            >

                        </label>

                    </div>


                    <footer class="profile-detail-actions">

                        <button
                            type="button"
                            class="secondary-btn"
                            data-profile-action="editor:cancel"
                        >
                            Vazgeç
                        </button>


                        <button
                            type="submit"
                            class="primary-btn"
                        >
                            Profili Kaydet
                        </button>

                    </footer>

                </form>

            </div>
        `;

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(entity){

        if(!entity){

            return `
                <section class="engine-page">

                    <div class="section engine-error-state">

                        <h1>
                            Profil bulunamadı
                        </h1>

                        <p>
                            Bu varlığın profil bilgileri şu anda kullanılamıyor.
                        </p>

                    </div>

                </section>
            `;

        }


        this.enterBrainContext(
            entity
        );


        const profile =
            this.getProfile(
                entity
            );


        return `
            <section class="engine-page profile-app-page">

                <div class="profile-app-shell">

                    <div class="engine-page-toolbar">

                        <button
                            type="button"
                            class="engine-back-btn"
                            data-action="entity:dashboard"
                        >
                            ← Varlığa Dön
                        </button>

                    </div>


                    ${UI.appHeader(
                        this.escapeHTML(
                            profile.displayName
                        ),
                        "PROFILE",
                        "◉"
                    )}


                    ${this.renderProfileHero(
                        entity,
                        profile
                    )}


                    ${this.renderStats(
                        entity
                    )}


                    <div class="profile-content-scroll">

                        <div class="profile-content-grid">

                            <div>

                                ${this.renderOverview(
                                    entity,
                                    profile
                                )}

                            </div>


                            <div>

                                ${this.renderDiscoveryProfile(
                                    entity
                                )}


                                ${this.renderPolicy(
                                    profile
                                )}

                            </div>

                        </div>

                    </div>


                    ${UI.brainPanel()}

                </div>


                ${
                    this.editorOpen
                        ? this.renderEditor(
                            profile
                        )
                        : ""
                }

            </section>
        `;

    },


    /* =====================================================
       COMMANDS
    ===================================================== */

    handleAction(action){

        switch(action){

            case "edit":

                this.editorOpen =
                    true;


                return this.remount();


            case "editor:cancel":

                this.editorOpen =
                    false;


                return this.remount();

        }


        return false;

    }

};


/* =========================================================
   PROFILE COMMANDS
========================================================= */

document.addEventListener(
    "click",
    event => {

        const element =
            event.target.closest(
                "[data-profile-action]"
            );


        if(!element){
            return;
        }


        event.preventDefault();


        ProfileApp.handleAction(
            element.dataset
                .profileAction
        );

    }
);


/* =========================================================
   PROFILE FORM
========================================================= */

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target.closest(
                "[data-profile-form]"
            );


        if(!form){
            return;
        }


        event.preventDefault();


        const entity =
            ProfileApp
                .getCurrentEntity();


        if(!entity){
            return;
        }


        ProfileApp.saveProfile(
            entity
        );

    }
);


window.ProfileApp =
    ProfileApp;
