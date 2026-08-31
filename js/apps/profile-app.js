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

        if(
            window.UI &&
            typeof UI.escapeHTML ===
                "function"
        ){

            return UI.escapeHTML(
                value
            );

        }


        return String(
            value ?? ""
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


    /* =====================================================
       ENGINE / SERVICES
    ===================================================== */

    getEngine(){

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
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


        const entity =
            engine.currentOpenedEntity ||
            engine.currentEntity ||
            engine.rootEntity ||
            null;


        return engine.mount(
            entity
        );

    },


    /* =====================================================
       BRAIN AWARENESS
    ===================================================== */

    enterBrainContext(
        entity = null
    ){

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
                        this.activeSection,

                    editorOpen:
                        this.editorOpen ===
                            true
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

        const source =
            Array.isArray(
                value
            )
                ? value
                : String(
                    value ||
                    ""
                ).split(",");


        const seen =
            new Set();


        const result =
            [];


        source.forEach(
            item => {

                const normalized =
                    String(
                        item ?? ""
                    )
                        .trim()
                        .replace(
                            /\s+/g,
                            " "
                        );


                if(!normalized){

                    return;

                }


                const key =
                    normalized
                        .toLocaleLowerCase(
                            "tr-TR"
                        );


                if(
                    seen.has(
                        key
                    )
                ){

                    return;

                }


                seen.add(
                    key
                );


                result.push(
                    normalized
                );

            }
        );


        return result;

    },


    normalizeWebsite(value){

        const website =
            String(
                value ||
                ""
            ).trim();


        if(!website){

            return "";

        }


        /*
         * Profil katmanı URL'yi doğrudan çalıştırmıyor.
         * Yine de javascript:/data: benzeri şemaları
         * kalıcı profile almıyoruz.
         */

        if(
            /^(javascript|data|vbscript):/i.test(
                website
            )
        ){

            return "";

        }


        return website;

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
                )
                    .trim()
                    .slice(
                        0,
                        100
                    ),

            headline:
                String(
                    profile.headline ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        140
                    ),

            bio:
                String(
                    profile.bio ||
                    profile.about ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        1200
                    ),

            location:
                String(
                    profile.location ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        120
                    ),

            website:
                this.normalizeWebsite(
                    profile.website
                )
                    .slice(
                        0,
                        300
                    ),

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


        /*
         * Runtime'daki entity profile alanını normalize edilmiş
         * tek şekle getiriyoruz.
         */

        entity.profile =
            profile;


        return profile;

    },


    /* =====================================================
       DISCOVERY DATA
    ===================================================== */

    getDiscoveryAnswers(
        entity = null
    ){

        const evolution =
            this.getService(
                "evolution"
            );


        /*
         * Öncelik Evolution kayıtları.
         * Aynı entity için birden fazla discovery kaydı varsa
         * en yeni kayıt kullanılmalı.
         */

        if(
            evolution &&
            typeof evolution.all ===
                "function"
        ){

            try{

                const events =
                    evolution.all({
                        includeArchived:
                            true
                    }) ||
                    [];


                const matching =
                    Array.isArray(
                        events
                    )
                        ? events.filter(
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
                        )
                        : [];


                matching.sort(
                    (
                        a,
                        b
                    ) =>
                        Number(
                            b.updatedAt ||
                            b.createdAt ||
                            b.time ||
                            0
                        ) -
                        Number(
                            a.updatedAt ||
                            a.createdAt ||
                            a.time ||
                            0
                        )
                );


                const discoveryEvent =
                    matching[0];


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


        /*
         * Current Discovery Journey compatibility.
         */

        try{

            const keys = [

                "vaero:discovery:answers:v2",
                "vaero:discovery:answers"

            ];


            for(
                const key of keys
            ){

                const saved =
                    localStorage.getItem(
                        key
                    );


                if(!saved){

                    continue;

                }


                const parsed =
                    JSON.parse(
                        saved
                    );


                if(
                    parsed &&
                    typeof parsed ===
                        "object" &&
                    !Array.isArray(
                        parsed
                    )
                ){

                    return parsed;

                }

            }


            return {};

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
                this.normalizeList(
                    answer
                );


            return values.length
                ? values.join(
                    " · "
                )
                : "Henüz belirlenmedi";

        }


        if(
            answer ===
                null ||
            answer ===
                undefined ||
            answer ===
                ""
        ){

            return "Henüz belirlenmedi";

        }


        if(
            typeof answer ===
                "object"
        ){

            try{

                return Object.values(
                    answer
                )
                    .filter(
                        value =>
                            value !==
                                null &&
                            value !==
                                undefined &&
                            value !==
                                ""
                    )
                    .join(
                        " · "
                    ) ||
                    "Henüz belirlenmedi";

            } catch(error){

                return "Henüz belirlenmedi";

            }

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


        /* =================================================
           BRIDGE
        ================================================= */

        try{

            let links =
                [];


            if(
                bridge &&
                typeof bridge.forEntity ===
                    "function"
            ){

                const result =
                    bridge.forEntity(
                        entity.id
                    );


                links =
                    Array.isArray(
                        result
                    )
                        ? result
                        : [];

            }

            else if(
                bridge &&
                typeof bridge.find ===
                    "function"
            ){

                const result =
                    bridge.find(
                        entity.id
                    );


                links =
                    Array.isArray(
                        result
                    )
                        ? result
                        : (
                            result
                                ? [result]
                                : []
                        );

            }


            connections =
                links.length;

        } catch(error){

            connections =
                0;

        }


        /* =================================================
           EVOLUTION
        ================================================= */

        try{

            if(
                evolution &&
                typeof evolution.forEntity ===
                    "function"
            ){

                const result =
                    evolution.forEntity(
                        entity.id
                    );


                const events =
                    Array.isArray(
                        result
                    )
                        ? result
                        : [];


                xp =
                    events.reduce(
                        (
                            total,
                            event
                        ) =>
                            total +
                            Math.max(
                                0,
                                Number(
                                    event?.xp
                                ) ||
                                0
                            ),
                        0
                    );


                milestones =
                    events.filter(
                        event =>
                            event?.type ===
                                "milestone" ||
                            event?.type ===
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


        const normalized =
            this.normalizeProfile(
                {
                    ...profile,

                    updatedAt:
                        Date.now()
                },
                entity
            );


        entity.profile = {
            ...normalized
        };


        const manager =
            this.getService(
                "entityManager"
            );


        /*
         * EntityManager source-of-truth objesi mevcutsa
         * aynı profile verisini oraya da geçiriyoruz.
         */

        if(manager){

            try{

                const managed =
                    typeof manager.get ===
                        "function"
                        ? manager.get(
                            entity.id
                        )
                        : null;


                if(managed){

                    managed.profile = {
                        ...normalized
                    };


                    if(
                        typeof managed.touch ===
                            "function"
                    ){

                        managed.touch();

                    }

                    else {

                        managed.updatedAt =
                            Date.now();

                    }

                }


                /*
                 * Manager'ın özel update/persist API'si varsa
                 * onu da kullan; yoksa mevcut mimari bozulmaz.
                 */

                if(
                    typeof manager.update ===
                        "function"
                ){

                    try{

                        manager.update(
                            entity.id,
                            {
                                profile:{
                                    ...normalized
                                }
                            }
                        );

                    } catch(error){

                        /* direct object sync already applied */

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


            if(
                index >=
                    0
            ){

                const current =
                    world.entities[
                        index
                    ];


                if(
                    current &&
                    typeof current ===
                        "object"
                ){

                    current.profile = {
                        ...normalized
                    };


                    current.updatedAt =
                        Date.now();

                }

                else {

                    world.entities[
                        index
                    ] = entity;

                }

            }

        }


        try{

            const worldService =
                this.getService(
                    "world"
                );


            worldService?.save?.();

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


        const displayNameInput =
            document.getElementById(
                "profileDisplayNameInput"
            );


        const displayName =
            String(
                displayNameInput?.value ||
                ""
            )
                .trim()
                .slice(
                    0,
                    100
                );


        if(!displayName){

            displayNameInput?.focus();


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
                )
                    .trim()
                    .slice(
                        0,
                        140
                    ),

            bio:
                String(
                    document.getElementById(
                        "profileBioInput"
                    )?.value ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        1200
                    ),

            location:
                String(
                    document.getElementById(
                        "profileLocationInput"
                    )?.value ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        120
                    ),

            website:
                this.normalizeWebsite(
                    document.getElementById(
                        "profileWebsiteInput"
                    )?.value
                )
                    .slice(
                        0,
                        300
                    ),

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
         * displayName Profile katmanına aittir.
         *
         * Entity.name = sistem kimliği.
         * Profile.displayName = kullanıcının görünen adı.
         *
         * Birbirine zorla bağlanmaz.
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

    renderStats(
        entity,
        profile
    ){

        const stats =
            this.getStats(
                entity
            );


        return `
            <section class="profile-stats">

                <div>

                    <strong>
                        ${
                            profile.showConnections
                                ? stats.connections
                                : "—"
                        }
                    </strong>

                    <span>
                        Bağlantı
                    </span>

                </div>


                <div>

                    <strong>
                        ${
                            profile.showEvolution
                                ? stats.milestones
                                : "—"
                        }
                    </strong>

                    <span>
                        Dönüm Noktası
                    </span>

                </div>


                <div>

                    <strong>
                        ${
                            profile.showEvolution
                                ? stats.level
                                : "—"
                        }
                    </strong>

                    <span>
                        Seviye
                    </span>

                </div>


                <div>

                    <strong>
                        ${
                            profile.showEvolution
                                ? stats.xp
                                : "—"
                        }
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

        const list =
            Array.isArray(
                values
            )
                ? values
                : [];


        return `
            <div class="profile-tag-group">

                <span>
                    ${this.escapeHTML(
                        title
                    )}
                </span>


                <div>

                    ${
                        list.length
                            ? list
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
                    answers.interest ||
                    answers.interests
            },

            {
                label:
                    "Güçlü yönler",

                value:
                    answers.strength ||
                    answers.strengths
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
                    answers.connection ||
                    answers.connections
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
            ).length >
            0;


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
       APP HEADER FALLBACK
    ===================================================== */

    renderAppHeader(profile){

        if(
            window.UI &&
            typeof UI.appHeader ===
                "function"
        ){

            return UI.appHeader(
    profile.displayName,
    "PROFILE",
    "◉"
);

        }


        return `
            <header class="engine-app-header">

                <span class="engine-section-label">
                    PROFILE
                </span>

                <h1>
                    ${this.escapeHTML(
                        profile.displayName
                    )}
                </h1>

            </header>
        `;

    },


    renderBrainPanel(){

        try{

            return (
                window.UI
                    ?.brainPanel?.() ||
                ""
            );

        } catch(error){

            return "";

        }

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
                                autocomplete="name"
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
                                autocomplete="off"
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
                                autocomplete="off"
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
                                type="url"
                                inputmode="url"
                                maxlength="300"
                                autocomplete="url"
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
                                autocomplete="off"
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
                                autocomplete="off"
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
                                autocomplete="off"
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
                                    Uygun Discovery ve topluluk yüzeylerinde profilin bulunabilmesine izin verir.
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


                    ${this.renderAppHeader(
                        profile
                    )}


                    ${this.renderProfileHero(
                        entity,
                        profile
                    )}


                    ${this.renderStats(
                        entity,
                        profile
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


                    ${this.renderBrainPanel()}

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


            default:

                return false;

        }

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


/* =========================================================
   REGISTER
========================================================= */

try{

    VAERO?.register?.(
        "profileApp",
        ProfileApp
    );

} catch(error){

    /* global remains available */

}


window.ProfileApp =
    ProfileApp;
