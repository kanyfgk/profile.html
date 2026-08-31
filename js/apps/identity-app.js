/* =========================================================
   VAERO IDENTITY APP
   Entity Identity / Identifiers / Visibility / Verification
========================================================= */

const IdentityApp = {

    editorOpen:
        false,


    /* =====================================================
       SAFETY
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
       BRAIN CONTEXT
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
                "identity",
                {
                    entityId:
                        entity?.id ||
                        null,

                    verification:
                        entity?.identity
                            ?.verificationStatus ||
                        "unverified",

                    editorOpen:
                        this.editorOpen ===
                            true
                }
            );

        } catch(error){

            console.warn(
                "Identity Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       ID
    ===================================================== */

    createIdentifier(prefix){

        const safePrefix =
            String(
                prefix ||
                "VA"
            )
                .trim()
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]/g,
                    ""
                )
                .slice(
                    0,
                    8
                ) ||
            "VA";


        let randomPart =
            "";


        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){

                randomPart =
                    crypto
                        .randomUUID()
                        .replaceAll(
                            "-",
                            ""
                        )
                        .slice(
                            0,
                            12
                        )
                        .toUpperCase();

            }

        } catch(error){

            randomPart =
                "";

        }


        if(!randomPart){

            randomPart =
                `${Date.now().toString(36)}${Math.random()
                    .toString(36)
                    .slice(2,8)}`
                    .replace(
                        /[^a-z0-9]/gi,
                        ""
                    )
                    .slice(
                        0,
                        12
                    )
                    .toUpperCase();

        }


        return `${safePrefix}-${randomPart}`;

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


    normalizeVerification(value){

        const status =
            String(
                value ||
                "unverified"
            )
                .trim()
                .toLowerCase();


        return [
            "unverified",
            "pending",
            "verified",
            "rejected"
        ].includes(
            status
        )
            ? status
            : "unverified";

    },


    normalizeExternalIdentifier(value){

        return String(
            value ||
            ""
        )
            .trim()
            .replace(
                /\s+/g,
                " "
            )
            .slice(
                0,
                120
            );

    },


    normalizeAlias(value){

        return String(
            value ||
            ""
        )
            .trim()
            .replace(
                /\s+/g,
                " "
            )
            .slice(
                0,
                80
            );

    },


    getIdentity(entity){

        const existing =
            (
                entity?.identity &&
                typeof entity.identity ===
                    "object" &&
                !Array.isArray(
                    entity.identity
                )
            )
                ? entity.identity
                : {};


        const now =
            Date.now();


        const verificationStatus =
            this.normalizeVerification(
                existing.verificationStatus
            );


        return {

            vaId:
                String(
                    existing.vaId ||
                    existing.vaID ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        160
                    ),

            aeId:
                this.normalizeExternalIdentifier(
                    existing.aeId ||
                    existing.aeID
                ),

            eaId:
                this.normalizeExternalIdentifier(
                    existing.eaId ||
                    existing.eaID
                ),

            alias:
                this.normalizeAlias(
                    existing.alias
                ),

            visibility:
                this.normalizeVisibility(
                    existing.visibility
                ),

            verificationStatus,

            verificationRequestedAt:
                Number(
                    existing.verificationRequestedAt
                ) ||
                null,

            verifiedAt:
                verificationStatus ===
                    "verified"
                    ? (
                        Number(
                            existing.verifiedAt
                        ) ||
                        null
                    )
                    : null,

            issuer:
    String(
        existing.issuer ||
        ""
    )
        .trim()
        .slice(
            0,
            120
        ),

            createdAt:
                Number(
                    existing.createdAt
                ) ||
                Number(
                    entity?.createdAt
                ) ||
                now,

            updatedAt:
                Number(
                    existing.updatedAt
                ) ||
                now

        };

    },


    ensureVAID(entity){

        if(!entity){

            return null;

        }


        const identity =
            this.getIdentity(
                entity
            );


        if(identity.vaId){

            entity.identity = {
                ...identity
            };


            return identity;

        }


        identity.vaId =
            this.createIdentifier(
                "VA"
            );


        identity.updatedAt =
            Date.now();


        entity.identity = {
            ...identity
        };


        this.persistEntity(
            entity
        );


        return identity;

    },


    /* =====================================================
       PERSISTENCE
    ===================================================== */

    persistEntity(entity){

        if(
            !entity ||
            !entity.id
        ){

            return false;

        }


        const normalizedIdentity =
            this.getIdentity(
                entity
            );


        entity.identity = {
            ...normalizedIdentity,
            updatedAt:
                Date.now()
        };


        const manager =
            this.getService(
                "entityManager"
            );


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

                    managed.identity = {
                        ...entity.identity
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


                if(
                    typeof manager.update ===
                        "function"
                ){

                    try{

                        manager.update(
                            entity.id,
                            {
                                identity:{
                                    ...entity.identity
                                }
                            }
                        );

                    } catch(error){

                        /*
                         * Direct object sync yukarıda yapıldı.
                         * Manager API farklı imzaya sahipse
                         * sistemi burada kırmıyoruz.
                         */

                    }

                }

            } catch(error){

                console.warn(
                    "Identity EntityManager senkronu başarısız:",
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

                    current.identity = {
                        ...entity.identity
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

            this.getService(
                "world"
            )?.save?.();

        } catch(error){

            console.warn(
                "Identity World senkronu başarısız:",
                error
            );

        }


        return true;

    },


    /* =====================================================
       SAVE IDENTITY
    ===================================================== */

    saveIdentity(entity){

        if(!entity){

            return false;

        }


        const identity =
            this.ensureVAID(
                entity
            ) ||
            this.getIdentity(
                entity
            );


        if(!identity){

            return false;

        }


        const aliasInput =
            document.getElementById(
                "identityAliasInput"
            );


        const visibilityInput =
            document.getElementById(
                "identityVisibilityInput"
            );


        const aeIdInput =
            document.getElementById(
                "identityAeIdInput"
            );


        const eaIdInput =
            document.getElementById(
                "identityEaIdInput"
            );


        identity.alias =
            this.normalizeAlias(
                aliasInput?.value
            );


        identity.visibility =
            this.normalizeVisibility(
                visibilityInput?.value
            );


        identity.aeId =
            this.normalizeExternalIdentifier(
                aeIdInput?.value
            );


        identity.eaId =
            this.normalizeExternalIdentifier(
                eaIdInput?.value
            );


        /*
         * VA ID editörden değiştirilemez.
         */

        if(!identity.vaId){

            identity.vaId =
                this.createIdentifier(
                    "VA"
                );

        }


        /*
         * Verification alanları da editörden değiştirilemez.
         * getIdentity() mevcut authority durumunu korur.
         */

        identity.updatedAt =
            Date.now();


        entity.identity = {
            ...identity
        };


        if(
            !this.persistEntity(
                entity
            )
        ){

            return false;

        }


        this.recordEvolution(
            entity,
            "updated"
        );


        this.editorOpen =
            false;


        return this.remount();

    },


    /* =====================================================
       VERIFICATION REQUEST
    ===================================================== */

    requestVerification(entity){

        if(!entity){

            return false;

        }


        const identity =
            this.ensureVAID(
                entity
            );


        if(!identity){

            return false;

        }


        /*
         * Verified ve pending kimlik için yeni talep üretme.
         */

        if(
            identity.verificationStatus ===
                "verified" ||
            identity.verificationStatus ===
                "pending"
        ){

            return false;

        }


        identity.verificationStatus =
            "pending";


        identity.verificationRequestedAt =
            Date.now();


        /*
         * Önceki rejected / stale issuer bilgisi
         * yeni talepte authority sayılmaz.
         */

        identity.verifiedAt =
            null;


        identity.issuer =
            "";


        identity.updatedAt =
            Date.now();


        entity.identity = {
            ...identity
        };


        if(
            !this.persistEntity(
                entity
            )
        ){

            return false;

        }


        this.recordEvolution(
            entity,
            "verification-requested"
        );


        return this.remount();

    },


    /* =====================================================
       EVOLUTION
    ===================================================== */

    recordEvolution(
        entity,
        action
    ){

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


        const titles = {

            updated:
                "Kimlik bilgileri güncellendi",

            "verification-requested":
                "Kimlik doğrulama talebi oluşturuldu"

        };


        try{

            evolution.record(
                action ===
                    "verification-requested"
                    ? "milestone"
                    : "general",

                titles[action] ||
                "Kimlik güncellendi",

                {
                    title:
                        titles[action] ||
                        "Kimlik güncellendi",

                    source:
                        "identity",

                    status:
                        action ===
                            "verification-requested"
                            ? "planned"
                            : "completed",

                    importance:
                        action ===
                            "verification-requested"
                            ? "high"
                            : "medium",

                    relatedEntityId:
                        entity.id,

                    relatedWorldId:
                        this.getEngine()
                            ?.currentWorld
                            ?.id ||
                        null,

                    organs:[
                        "identity",
                        "timeline",
                        "memory"
                    ],

                    tags:[
                        "identity",
                        action
                    ]
                }
            );


            return true;

        } catch(error){

            console.warn(
                "Identity Evolution kaydı oluşturulamadı:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       LABELS
    ===================================================== */

    verificationLabel(value){

        const labels = {

            unverified:
                "Doğrulanmadı",

            pending:
                "İnceleniyor",

            verified:
                "Doğrulandı",

            rejected:
                "Reddedildi"

        };


        return (
            labels[value] ||
            "Doğrulanmadı"
        );

    },


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
       UI FALLBACKS
    ===================================================== */

    renderAppHeader(entity){

        if(
            window.UI &&
            typeof UI.appHeader ===
                "function"
        ){

            return UI.appHeader(
    entity.name ||
    "İsimsiz Varlık",
    "IDENTITY",
    "◈"
);
        }


        return `
            <header class="engine-app-header">

                <span class="engine-section-label">
                    IDENTITY
                </span>

                <h1>
                    ${this.escapeHTML(
                        entity.name ||
                        "İsimsiz Varlık"
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
       IDENTITY LAYER
    ===================================================== */

    renderIdentityLayer(
        code,
        value,
        status,
        active = false
    ){

        return `
            <div class="identity-layer-card">

                <span
                    class="identity-layer-indicator ${
                        active
                            ? "is-active"
                            : ""
                    }"
                    aria-hidden="true"
                ></span>


                <div class="identity-layer-copy">

                    <small>
                        ${this.escapeHTML(
                            code
                        )}
                    </small>

                    <strong>
                        ${this.escapeHTML(
                            value ||
                            "Henüz yok"
                        )}
                    </strong>

                </div>


                <span class="identity-layer-status">
                    ${this.escapeHTML(
                        status
                    )}
                </span>

            </div>
        `;

    },


    /* =====================================================
       EDITOR
    ===================================================== */

    renderEditor(
        entity,
        identity
    ){

        return `
            <div class="identity-detail-layer">

                <div
                    class="identity-detail-backdrop"
                    data-identity-action="editor:cancel"
                ></div>


                <form
                    class="identity-editor"
                    data-identity-form="edit"
                >

                    <header class="identity-detail-header">

                        <div>

                            <span class="engine-section-label">
                                IDENTITY EDITOR
                            </span>

                            <h2>
                                Kimliği düzenle
                            </h2>

                        </div>


                        <button
                            type="button"
                            class="engine-icon-btn"
                            data-identity-action="editor:cancel"
                            aria-label="Kapat"
                        >
                            ×
                        </button>

                    </header>


                    <div class="identity-editor-scroll">

                        <div class="identity-readonly-field">

                            <span>
                                VA ID
                            </span>

                            <strong>
                                ${this.escapeHTML(
                                    identity.vaId
                                )}
                            </strong>

                            <small>
                                VA ID Engine tarafından oluşturulur ve bu editörden değiştirilemez.
                            </small>

                        </div>


                        <label class="engine-field">

                            <span>
                                Kimlik alias
                            </span>

                            <input
                                id="identityAliasInput"
                                type="text"
                                maxlength="80"
                                autocomplete="off"
                                value="${this.escapeHTML(
                                    identity.alias
                                )}"
                                placeholder="Bu kimlik için kısa ad"
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                Görünürlük
                            </span>

                            <select
                                id="identityVisibilityInput"
                            >

                                <option
                                    value="private"
                                    ${
                                        identity.visibility ===
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
                                        identity.visibility ===
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
                                        identity.visibility ===
                                            "engine"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Engine
                                </option>

                            </select>

                        </label>


                        <label class="engine-field">

                            <span>
                                AE ID
                            </span>

                            <input
                                id="identityAeIdInput"
                                type="text"
                                maxlength="120"
                                autocomplete="off"
                                value="${this.escapeHTML(
                                    identity.aeId
                                )}"
                                placeholder="Opsiyonel kimlik referansı"
                            >

                        </label>


                        <label class="engine-field">

                            <span>
                                EA ID
                            </span>

                            <input
                                id="identityEaIdInput"
                                type="text"
                                maxlength="120"
                                autocomplete="off"
                                value="${this.escapeHTML(
                                    identity.eaId
                                )}"
                                placeholder="Opsiyonel kimlik referansı"
                            >

                        </label>


                        <div class="identity-verification-info">

                            <span class="engine-section-label">
                                VERIFICATION
                            </span>

                            <strong>
                                ${this.escapeHTML(
                                    this.verificationLabel(
                                        identity.verificationStatus
                                    )
                                )}
                            </strong>

                            <p>
                                Kimlik doğrulama durumu editörden doğrudan değiştirilemez. Production doğrulaması Identity Verifier ve backend tarafından yapılmalıdır.
                            </p>

                        </div>

                    </div>


                    <footer class="identity-detail-actions">

                        <button
                            type="button"
                            class="secondary-btn"
                            data-identity-action="editor:cancel"
                        >
                            Vazgeç
                        </button>


                        <button
                            type="submit"
                            class="primary-btn"
                        >
                            Kimliği Kaydet
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
                            Kimlik bulunamadı
                        </h1>

                        <p>
                            Bu varlığın kimlik bilgileri şu anda kullanılamıyor.
                        </p>

                    </div>

                </section>
            `;

        }


        const identity =
            this.ensureVAID(
                entity
            );


        const verification =
            this.normalizeVerification(
                identity
                    ?.verificationStatus
            );


        this.enterBrainContext(
            entity
        );


        return `
            <section class="engine-page identity-app-page">

                <div class="identity-app-shell">

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
                        entity
                    )}


                    <section class="identity-app-intro">

                        <div>

                            <span class="engine-section-label">
                                ENTITY IDENTITY
                            </span>

                            <h2>
                                Kimlik katmanı
                            </h2>

                            <p>
                                Bu varlığın Engine içindeki kalıcı kimliği, görünürlüğü ve doğrulama durumu.
                            </p>

                        </div>


                        <div class="identity-status-card">

                            <span>
                                Doğrulama
                            </span>

                            <strong
                                class="identity-verification-${this.escapeHTML(
                                    verification
                                )}"
                            >
                                ${this.escapeHTML(
                                    this.verificationLabel(
                                        verification
                                    )
                                )}
                            </strong>

                        </div>

                    </section>


                    <div class="identity-layout">

                        <section class="identity-primary-card">

                            <div class="identity-primary-mark">
                                ${this.escapeHTML(
                                    String(
                                        entity.name ||
                                        "V"
                                    )
                                        .charAt(0)
                                        .toUpperCase()
                                )}
                            </div>


                            <div class="identity-primary-copy">

                                <span class="engine-section-label">
                                    PRIMARY IDENTITY
                                </span>

                                <h2>
                                    ${this.escapeHTML(
                                        entity.name ||
                                        "İsimsiz Varlık"
                                    )}
                                </h2>

                                <p>
                                    ${this.escapeHTML(
                                        identity.alias ||
                                        entity.type ||
                                        "VAERO Entity"
                                    )}
                                </p>

                            </div>


                            <div class="identity-primary-meta">

                                <div>

                                    <span>
                                        Tür
                                    </span>

                                    <strong>
                                        ${this.escapeHTML(
                                            entity.type ||
                                            "Belirsiz"
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Görünürlük
                                    </span>

                                    <strong>
                                        ${this.escapeHTML(
                                            this.visibilityLabel(
                                                identity.visibility
                                            )
                                        )}
                                    </strong>

                                </div>

                            </div>


                            <button
                                type="button"
                                class="primary-btn"
                                data-identity-action="edit"
                            >
                                Kimliği Düzenle
                            </button>

                        </section>


                        <section class="identity-layers-panel">

                            <header>

                                <span class="engine-section-label">
                                    IDENTITY LAYERS
                                </span>

                                <h3>
                                    Tanımlayıcılar
                                </h3>

                            </header>


                            <div class="identity-layer-list">

                                ${this.renderIdentityLayer(
                                    "VA ID",
                                    identity.vaId,
                                    "Aktif",
                                    true
                                )}


                                ${this.renderIdentityLayer(
                                    "AE ID",
                                    identity.aeId,
                                    identity.aeId
                                        ? "Bağlı"
                                        : "Henüz yok",
                                    Boolean(
                                        identity.aeId
                                    )
                                )}


                                ${this.renderIdentityLayer(
                                    "EA ID",
                                    identity.eaId,
                                    identity.eaId
                                        ? "Bağlı"
                                        : "Henüz yok",
                                    Boolean(
                                        identity.eaId
                                    )
                                )}

                            </div>

                        </section>

                    </div>


                    <section class="identity-verification-panel">

                        <div>

                            <span class="engine-section-label">
                                IDENTITY VERIFICATION
                            </span>

                            <h3>
                                ${this.escapeHTML(
                                    this.verificationLabel(
                                        verification
                                    )
                                )}
                            </h3>

                            <p>
                                ${
                                    verification ===
                                        "verified"
                                        ? "Bu kimlik VAERO doğrulama otoritesi tarafından doğrulanmış."
                                        : verification ===
                                            "pending"
                                            ? "Doğrulama talebi oluşturuldu. Identity Verifier sonucu geldiğinde durum burada güncellenecek."
                                            : verification ===
                                                "rejected"
                                                ? "Önceki doğrulama talebi reddedilmiş. Yeni bir talep oluşturabilirsin."
                                                : "Kimlik henüz doğrulanmadı. Doğrulama talebi oluşturabilirsin."
                                }
                            </p>

                        </div>


                        ${
                            verification !==
                                "verified" &&
                            verification !==
                                "pending"
                                ? `
                                    <button
                                        type="button"
                                        class="secondary-btn"
                                        data-identity-action="verify"
                                    >
                                        Doğrulama Talebi
                                    </button>
                                  `
                                : ""
                        }

                    </section>


                    ${this.renderBrainPanel()}

                </div>


                ${
                    this.editorOpen
                        ? this.renderEditor(
                            entity,
                            identity
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

        const entity =
            this.getCurrentEntity();


        if(!entity){

            return false;

        }


        switch(action){

            case "edit":

                this.editorOpen =
                    true;


                return this.remount();


            case "editor:cancel":

                this.editorOpen =
                    false;


                return this.remount();


            case "verify":

                return this.requestVerification(
                    entity
                );


            default:

                return false;

        }

    }

};


/* =========================================================
   IDENTITY COMMANDS
========================================================= */

document.addEventListener(
    "click",
    event => {

        const element =
            event.target.closest(
                "[data-identity-action]"
            );


        if(!element){

            return;

        }


        event.preventDefault();


        IdentityApp.handleAction(
            element.dataset
                .identityAction
        );

    }
);


/* =========================================================
   IDENTITY FORM
========================================================= */

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target.closest(
                "[data-identity-form]"
            );


        if(!form){

            return;

        }


        event.preventDefault();


        const entity =
            IdentityApp
                .getCurrentEntity();


        if(!entity){

            return;

        }


        IdentityApp.saveIdentity(
            entity
        );

    }
);


/* =========================================================
   REGISTER
========================================================= */

try{

    VAERO?.register?.(
        "identityApp",
        IdentityApp
    );

} catch(error){

    /* global remains available */

}


window.IdentityApp =
    IdentityApp;
