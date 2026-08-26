/* =========================================================
   VAERO SETTINGS APP
   Engine / Entity Preferences / Privacy / Security Policy
========================================================= */

const SettingsApp = {

    activeSection:
        "privacy",

    storagePrefix:
        "vaero:settings:entity:v2:",


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
       BRAIN CONTEXT
    ===================================================== */

    enterBrainContext(entity = null){

        try{

            const awareness =
                this.getService(
                    "brainAwareness"
                );


            awareness?.enter?.(
                "settings",
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
                "Settings Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       DEFAULT SETTINGS
    ===================================================== */

    getDefaults(){

        return {

            appearance:{

                density:
                    "comfortable",

                reduceMotion:
                    false,

                showAmbientEffects:
                    true

            },


            privacy:{

                visibility:
                    "private",

                allowBridgeDiscovery:
                    true,

                exposeProfileToConnections:
                    true,

                includeInGlobalSearch:
                    true

            },


            brain:{

                enabled:
                    true,

                allowMemoryRead:
                    true,

                allowTimelineRead:
                    true,

                allowBridgeRead:
                    true,

                allowEvolutionRead:
                    true,

                allowProfileRead:
                    true,

                requireConfirmationForActions:
                    true,

                allowSensitiveContext:
                    false

            },


            memory:{

                enabled:
                    true,

                allowBrainAccess:
                    true,

                includeArchived:
                    false,

                autoCaptureSystemEvents:
                    true

            },


            notifications:{

                enabled:
                    true,

                evolution:
                    true,

                bridge:
                    true,

                memory:
                    false,

                security:
                    true,

                applications:
                    true

            },


            applications:{

                allowInstall:
                    true,

                requirePermissionReview:
                    true,

                allowExternalApps:
                    false,

                allowBackgroundActivity:
                    false

            },


            security:{

                lockSensitiveActions:
                    true,

                requireActionConfirmation:
                    true,

                allowUnknownApplications:
                    false,

                sessionVisibility:
                    "private"

            },


            updatedAt:
                Date.now()

        };

    },


    /* =====================================================
       MERGE
    ===================================================== */

    mergeSettings(
        base,
        incoming
    ){

        const result = {
            ...base
        };


        Object.keys(
            base
        ).forEach(
            key => {

                if(
                    base[key] &&
                    typeof base[key] ===
                        "object" &&
                    !Array.isArray(
                        base[key]
                    )
                ){

                    result[key] = {
                        ...base[key],
                        ...(
                            incoming?.[key] &&
                            typeof incoming[key] ===
                                "object" &&
                            !Array.isArray(
                                incoming[key]
                            )
                                ? incoming[key]
                                : {}
                        )
                    };

                } else if(
                    incoming?.[key] !==
                        undefined
                ){

                    result[key] =
                        incoming[key];

                }

            }
        );


        return result;

    },


    /* =====================================================
       STORAGE
    ===================================================== */

    getStorageKey(entityId){

        return (
            this.storagePrefix +
            String(
                entityId ||
                "global"
            )
        );

    },


    load(entityId){

        const defaults =
            this.getDefaults();


        try{

            const saved =
                localStorage.getItem(
                    this.getStorageKey(
                        entityId
                    )
                );


            if(!saved){
                return defaults;
            }


            const parsed =
                JSON.parse(
                    saved
                );


            if(
                !parsed ||
                typeof parsed !==
                    "object" ||
                Array.isArray(
                    parsed
                )
            ){
                return defaults;
            }


            return this.mergeSettings(
                defaults,
                parsed
            );

        } catch(error){

            console.warn(
                "Settings yüklenemedi:",
                error
            );


            return defaults;

        }

    },


    save(
        entityId,
        settings
    ){

        try{

            const payload = {
                ...settings,
                updatedAt:
                    Date.now()
            };


            localStorage.setItem(
                this.getStorageKey(
                    entityId
                ),
                JSON.stringify(
                    payload
                )
            );


            this.syncEntityMetadata(
                entityId,
                payload
            );


            this.emitChange(
                entityId,
                payload
            );


            return true;

        } catch(error){

            console.error(
                "Settings kaydedilemedi:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       ENTITY SYNC
    ===================================================== */

    syncEntityMetadata(
        entityId,
        settings
    ){

        const manager =
            this.getService(
                "entityManager"
            );


        if(
            !manager ||
            typeof manager.get !==
                "function"
        ){
            return false;
        }


        let entity =
            null;


        try{

            entity =
                manager.get(
                    entityId
                );

        } catch(error){

            return false;

        }


        if(!entity){
            return false;
        }


        const settingsSnapshot = {

            visibility:
                settings.privacy
                    ?.visibility ||
                "private",

            bridgeDiscovery:
                settings.privacy
                    ?.allowBridgeDiscovery ===
                true,

            brainEnabled:
                settings.brain
                    ?.enabled ===
                true,

            memoryEnabled:
                settings.memory
                    ?.enabled ===
                true,

            notificationsEnabled:
                settings.notifications
                    ?.enabled ===
                true,

            updatedAt:
                Date.now()

        };


        if(
            typeof manager.update ===
                "function"
        ){

            try{

                manager.update(
                    entityId,
                    {
                        metadata:{
                            settings:
                                settingsSnapshot
                        }
                    }
                );

            } catch(error){

                return false;

            }

        } else {

            entity.metadata = {
                ...(
                    entity.metadata ||
                    {}
                ),

                settings:
                    settingsSnapshot
            };

        }


        this.getService(
            "world"
        )?.save?.();


        return true;

    },


    /* =====================================================
       EVENTS
    ===================================================== */

    emitChange(
        entityId,
        settings
    ){

        try{

            if(
                typeof VAERO !== "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    "settings:updated",
                    {
                        entityId,
                        settings,
                        time:
                            Date.now()
                    }
                );

            }

        } catch(error){

            /* non-fatal */
        }


        const events =
            this.getService(
                "events"
            );


        try{

            events?.emit?.(
                "settings:updated",
                {
                    entityId,
                    settings,
                    time:
                        Date.now()
                }
            );

        } catch(error){

            /* non-fatal */
        }

    },


    /* =====================================================
       SETTING MUTATION
    ===================================================== */

    updateSetting(
        entity,
        section,
        key,
        value
    ){

        if(
            !entity ||
            !entity.id
        ){
            return false;
        }


        const settings =
            this.load(
                entity.id
            );


        if(
            !settings[section] ||
            typeof settings[section] !==
                "object"
        ){
            return false;
        }


        settings[section] = {
            ...settings[section],
            [key]:
                value
        };


        if(
            !this.save(
                entity.id,
                settings
            )
        ){
            return false;
        }


        return this.remount();

    },


    /* =====================================================
       RESET
    ===================================================== */

    resetEntitySettings(entity){

        if(
            !entity ||
            !entity.id
        ){
            return false;
        }


        const defaults =
            this.getDefaults();


        if(
            !this.save(
                entity.id,
                defaults
            )
        ){
            return false;
        }


        return this.remount();

    },


    /* =====================================================
       STATUS HELPERS
    ===================================================== */

    yesNo(value){

        return value
            ? "Açık"
            : "Kapalı";

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
       CONTROL COMPONENTS
    ===================================================== */

    renderToggle(
        section,
        key,
        label,
        description,
        checked
    ){

        return `
            <label class="settings-control-row">

                <span class="settings-control-copy">

                    <strong>
                        ${this.escapeHTML(
                            label
                        )}
                    </strong>

                    <small>
                        ${this.escapeHTML(
                            description
                        )}
                    </small>

                </span>


                <input
                    type="checkbox"
                    data-settings-toggle
                    data-section="${this.escapeHTML(
                        section
                    )}"
                    data-key="${this.escapeHTML(
                        key
                    )}"
                    ${
                        checked
                            ? "checked"
                            : ""
                    }
                >

            </label>
        `;

    },


    renderSelect(
        section,
        key,
        label,
        description,
        value,
        options
    ){

        return `
            <label class="settings-select-row">

                <span class="settings-control-copy">

                    <strong>
                        ${this.escapeHTML(
                            label
                        )}
                    </strong>

                    <small>
                        ${this.escapeHTML(
                            description
                        )}
                    </small>

                </span>


                <select
                    data-settings-select
                    data-section="${this.escapeHTML(
                        section
                    )}"
                    data-key="${this.escapeHTML(
                        key
                    )}"
                >

                    ${options
                        .map(
                            option => `
                                <option
                                    value="${this.escapeHTML(
                                        option.value
                                    )}"
                                    ${
                                        option.value ===
                                            value
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${this.escapeHTML(
                                        option.label
                                    )}
                                </option>
                            `
                        )
                        .join("")}

                </select>

            </label>
        `;

    },


    /* =====================================================
       NAV
    ===================================================== */

    getSections(){

        return [

            {
                id:
                    "privacy",
                label:
                    "Gizlilik",
                icon:
                    "◎"
            },

            {
                id:
                    "brain",
                label:
                    "Brain",
                icon:
                    "◇"
            },

            {
                id:
                    "memory",
                label:
                    "Memory",
                icon:
                    "◫"
            },

            {
                id:
                    "notifications",
                label:
                    "Bildirimler",
                icon:
                    "◉"
            },

            {
                id:
                    "applications",
                label:
                    "Uygulamalar",
                icon:
                    "▦"
            },

            {
                id:
                    "security",
                label:
                    "Güvenlik",
                icon:
                    "⌾"
            },

            {
                id:
                    "appearance",
                label:
                    "Görünüm",
                icon:
                    "◐"
            }

        ];

    },


    renderNavigation(){

        return `
            <div class="settings-navigation">

                ${this
                    .getSections()
                    .map(
                        section => `
                            <button
                                type="button"
                                class="settings-nav-item ${
                                    this.activeSection ===
                                        section.id
                                        ? "is-active"
                                        : ""
                                }"
                                data-settings-action="section"
                                data-settings-section="${this.escapeHTML(
                                    section.id
                                )}"
                            >

                                <span aria-hidden="true">
                                    ${section.icon}
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        section.label
                                    )}
                                </strong>

                            </button>
                        `
                    )
                    .join("")}

            </div>
        `;

    },


    /* =====================================================
       PRIVACY
    ===================================================== */

    renderPrivacy(settings){

        return `
            <section class="settings-panel">

                <header>

                    <span class="engine-section-label">
                        PRIVACY
                    </span>

                    <h2>
                        Gizlilik ve görünürlük
                    </h2>

                    <p>
                        Bu varlığın Engine içinde ne kadar görünür olduğunu kontrol eder.
                    </p>

                </header>


                ${this.renderSelect(
                    "privacy",
                    "visibility",
                    "Varlık görünürlüğü",
                    "Bu varlığa kimlerin erişebileceğini belirler.",
                    settings.privacy.visibility,
                    [
                        {
                            value:"private",
                            label:"Özel"
                        },
                        {
                            value:"connections",
                            label:"Bağlantılar"
                        },
                        {
                            value:"engine",
                            label:"Engine"
                        }
                    ]
                )}


                ${this.renderToggle(
                    "privacy",
                    "allowBridgeDiscovery",
                    "Bridge keşfine izin ver",
                    "Diğer uygun varlıkların Bridge üzerinden bu varlığı keşfedebilmesini sağlar.",
                    settings.privacy.allowBridgeDiscovery
                )}


                ${this.renderToggle(
                    "privacy",
                    "exposeProfileToConnections",
                    "Profili bağlantılara göster",
                    "Bridge bağlantılarının profil bağlamını görebilmesine izin verir.",
                    settings.privacy.exposeProfileToConnections
                )}


                ${this.renderToggle(
                    "privacy",
                    "includeInGlobalSearch",
                    "Engine aramasında göster",
                    "VAERO içindeki Search katmanının bu varlığı sonuçlara dahil etmesini sağlar.",
                    settings.privacy.includeInGlobalSearch
                )}

            </section>
        `;

    },


    /* =====================================================
       BRAIN
    ===================================================== */

    renderBrain(settings){

        return `
            <section class="settings-panel">

                <header>

                    <span class="engine-section-label">
                        BRAIN POLICY
                    </span>

                    <h2>
                        Brain erişim sınırları
                    </h2>

                    <p>
                        Brain'in bu varlıktan hangi bağlamları okuyabileceğini belirler.
                    </p>

                </header>


                ${this.renderToggle(
                    "brain",
                    "enabled",
                    "Brain erişimi",
                    "Brain'in bu varlığın bağlamına erişebilmesini sağlar.",
                    settings.brain.enabled
                )}


                ${this.renderToggle(
                    "brain",
                    "allowMemoryRead",
                    "Memory erişimi",
                    "Brain'in kayıtlı Memory içeriklerini okuyabilmesine izin verir.",
                    settings.brain.allowMemoryRead
                )}


                ${this.renderToggle(
                    "brain",
                    "allowTimelineRead",
                    "Timeline erişimi",
                    "Brain'in geçmiş olay akışını okuyabilmesine izin verir.",
                    settings.brain.allowTimelineRead
                )}


                ${this.renderToggle(
                    "brain",
                    "allowBridgeRead",
                    "Bridge erişimi",
                    "Brain'in ilişki ağını ve bağlantıları okuyabilmesine izin verir.",
                    settings.brain.allowBridgeRead
                )}


                ${this.renderToggle(
                    "brain",
                    "allowEvolutionRead",
                    "Evolution erişimi",
                    "Brain'in hedef, karar ve gelişim kayıtlarını okuyabilmesini sağlar.",
                    settings.brain.allowEvolutionRead
                )}


                ${this.renderToggle(
                    "brain",
                    "allowProfileRead",
                    "Profile erişimi",
                    "Brain'in profil bağlamını kullanabilmesini sağlar.",
                    settings.brain.allowProfileRead
                )}


                ${this.renderToggle(
                    "brain",
                    "requireConfirmationForActions",
                    "Aksiyonlarda onay iste",
                    "Brain'in değişiklik yapan işlemleri kullanıcı onayı olmadan çalıştırmasını engeller.",
                    settings.brain.requireConfirmationForActions
                )}


                ${this.renderToggle(
                    "brain",
                    "allowSensitiveContext",
                    "Hassas bağlama izin ver",
                    "Hassas olarak işaretlenen bağlamların Brain'e aktarılmasına izin verir.",
                    settings.brain.allowSensitiveContext
                )}

            </section>
        `;

    },


    /* =====================================================
       MEMORY
    ===================================================== */

    renderMemory(settings){

        return `
            <section class="settings-panel">

                <header>

                    <span class="engine-section-label">
                        MEMORY POLICY
                    </span>

                    <h2>
                        Hafıza sınırları
                    </h2>

                    <p>
                        Bu varlığın hafızasının nasıl kullanılacağını belirler.
                    </p>

                </header>


                ${this.renderToggle(
                    "memory",
                    "enabled",
                    "Memory aktif",
                    "Bu varlık için Memory kayıtlarının kullanılmasını sağlar.",
                    settings.memory.enabled
                )}


                ${this.renderToggle(
                    "memory",
                    "allowBrainAccess",
                    "Brain Memory erişimi",
                    "Brain'in Memory Core üzerinden bu varlığın hafızasını okuyabilmesini sağlar.",
                    settings.memory.allowBrainAccess
                )}


                ${this.renderToggle(
                    "memory",
                    "includeArchived",
                    "Arşivlenmiş hafızayı dahil et",
                    "Uygun sorgularda arşivlenmiş kayıtların da kullanılmasına izin verir.",
                    settings.memory.includeArchived
                )}


                ${this.renderToggle(
                    "memory",
                    "autoCaptureSystemEvents",
                    "Sistem olaylarını otomatik kaydet",
                    "Anlamlı Engine olaylarının Memory Core'a aktarılmasına izin verir.",
                    settings.memory.autoCaptureSystemEvents
                )}

            </section>
        `;

    },


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    renderNotifications(settings){

        return `
            <section class="settings-panel">

                <header>

                    <span class="engine-section-label">
                        NOTIFICATIONS
                    </span>

                    <h2>
                        Bildirim tercihleri
                    </h2>

                    <p>
                        Engine içindeki hangi olayların bildirim üretebileceğini belirler.
                    </p>

                </header>


                ${this.renderToggle(
                    "notifications",
                    "enabled",
                    "Bildirimler",
                    "Bu varlık için bildirim üretimini açar veya kapatır.",
                    settings.notifications.enabled
                )}


                ${this.renderToggle(
                    "notifications",
                    "evolution",
                    "Evolution bildirimleri",
                    "Önemli hedef ve gelişim olaylarında bildirim üretir.",
                    settings.notifications.evolution
                )}


                ${this.renderToggle(
                    "notifications",
                    "bridge",
                    "Bridge bildirimleri",
                    "Yeni veya değişen bağlantılarda bildirim üretir.",
                    settings.notifications.bridge
                )}


                ${this.renderToggle(
                    "notifications",
                    "memory",
                    "Memory bildirimleri",
                    "Önemli Memory değişikliklerinde bildirim üretir.",
                    settings.notifications.memory
                )}


                ${this.renderToggle(
                    "notifications",
                    "security",
                    "Güvenlik bildirimleri",
                    "Güvenlik/policy olaylarının bildirim üretmesini sağlar.",
                    settings.notifications.security
                )}


                ${this.renderToggle(
                    "notifications",
                    "applications",
                    "Uygulama bildirimleri",
                    "Kurulum, güncelleme ve izin olaylarını bildirir.",
                    settings.notifications.applications
                )}

            </section>
        `;

    },


    /* =====================================================
       APPLICATIONS
    ===================================================== */

    renderApplications(settings){

        return `
            <section class="settings-panel">

                <header>

                    <span class="engine-section-label">
                        APPLICATION POLICY
                    </span>

                    <h2>
                        Uygulama izinleri
                    </h2>

                    <p>
                        Applications katmanının bu varlık üzerinde hangi yetkilere sahip olabileceğini belirler.
                    </p>

                </header>


                ${this.renderToggle(
                    "applications",
                    "allowInstall",
                    "Uygulama kurulumu",
                    "Bu varlık bağlamında uygulama kurulmasına izin verir.",
                    settings.applications.allowInstall
                )}


                ${this.renderToggle(
                    "applications",
                    "requirePermissionReview",
                    "İzin incelemesi zorunlu",
                    "Bir uygulama izin talep ettiğinde kullanıcı incelemesi gerektirir.",
                    settings.applications.requirePermissionReview
                )}


                ${this.renderToggle(
                    "applications",
                    "allowExternalApps",
                    "Harici uygulamalara izin ver",
                    "Doğrulanmış dış uygulamaların kurulabilmesine izin verir. Gerçek doğrulama Application Verifier tarafından yapılmalıdır.",
                    settings.applications.allowExternalApps
                )}


                ${this.renderToggle(
                    "applications",
                    "allowBackgroundActivity",
                    "Arka plan etkinliği",
                    "Yetkili uygulamaların açık olmadıkları sırada sınırlı görev çalıştırabilmesine izin verir.",
                    settings.applications.allowBackgroundActivity
                )}

            </section>
        `;

    },


    /* =====================================================
       SECURITY
    ===================================================== */

    renderSecurity(settings){

        return `
            <section class="settings-panel">

                <header>

                    <span class="engine-section-label">
                        SECURITY POLICY
                    </span>

                    <h2>
                        Güvenlik tercihleri
                    </h2>

                    <p>
                        Bu ayarlar Engine tarafındaki policy davranışını belirler. Sunucu tarafı güvenliğin yerine geçmez.
                    </p>

                </header>


                ${this.renderToggle(
                    "security",
                    "lockSensitiveActions",
                    "Hassas aksiyonları kilitle",
                    "Silme, ödeme, izin ve kritik değişikliklerin doğrudan çalışmasını engeller.",
                    settings.security.lockSensitiveActions
                )}


                ${this.renderToggle(
                    "security",
                    "requireActionConfirmation",
                    "Kritik işlemlerde onay iste",
                    "Riskli işlemlerde kullanıcı onayı gerektirir.",
                    settings.security.requireActionConfirmation
                )}


                ${this.renderToggle(
                    "security",
                    "allowUnknownApplications",
                    "Bilinmeyen uygulamalara izin ver",
                    "Doğrulanmamış uygulamalara güvenilmesini sağlar. Güvenli varsayılan kapalıdır.",
                    settings.security.allowUnknownApplications
                )}


                ${this.renderSelect(
                    "security",
                    "sessionVisibility",
                    "Oturum görünürlüğü",
                    "Engine içindeki aktif oturum bağlamının görünürlük seviyesini belirler.",
                    settings.security.sessionVisibility,
                    [
                        {
                            value:"private",
                            label:"Özel"
                        },
                        {
                            value:"entity",
                            label:"Yalnız bu varlık"
                        },
                        {
                            value:"engine",
                            label:"Engine"
                        }
                    ]
                )}


                <div class="settings-warning-card">

                    <strong>
                        Production güvenliği
                    </strong>

                    <p>
                        Gerçek kimlik doğrulama, yetkilendirme, rate limiting, WAF, signed applications ve oturum doğrulaması backend katmanında uygulanmalıdır.
                    </p>

                </div>

            </section>
        `;

    },


    /* =====================================================
       APPEARANCE
    ===================================================== */

    renderAppearance(settings){

        return `
            <section class="settings-panel">

                <header>

                    <span class="engine-section-label">
                        APPEARANCE
                    </span>

                    <h2>
                        Engine görünümü
                    </h2>

                    <p>
                        Bu Entity bağlamındaki arayüz davranış tercihlerini belirler.
                    </p>

                </header>


                ${this.renderSelect(
                    "appearance",
                    "density",
                    "Arayüz yoğunluğu",
                    "Kart ve içerik alanlarının sıkılık seviyesini belirler.",
                    settings.appearance.density,
                    [
                        {
                            value:"compact",
                            label:"Kompakt"
                        },
                        {
                            value:"comfortable",
                            label:"Dengeli"
                        },
                        {
                            value:"spacious",
                            label:"Geniş"
                        }
                    ]
                )}


                ${this.renderToggle(
                    "appearance",
                    "reduceMotion",
                    "Hareketleri azalt",
                    "Animasyon ve hareketli geçişleri azaltır.",
                    settings.appearance.reduceMotion
                )}


                ${this.renderToggle(
                    "appearance",
                    "showAmbientEffects",
                    "Ambient efektleri göster",
                    "VAERO'nun yaşayan arayüz atmosferini etkin tutar.",
                    settings.appearance.showAmbientEffects
                )}

            </section>
        `;

    },


    /* =====================================================
       ACTIVE PANEL
    ===================================================== */

    renderActivePanel(settings){

        switch(
            this.activeSection
        ){

            case "brain":
                return this.renderBrain(
                    settings
                );


            case "memory":
                return this.renderMemory(
                    settings
                );


            case "notifications":
                return this.renderNotifications(
                    settings
                );


            case "applications":
                return this.renderApplications(
                    settings
                );


            case "security":
                return this.renderSecurity(
                    settings
                );


            case "appearance":
                return this.renderAppearance(
                    settings
                );


            case "privacy":
            default:
                return this.renderPrivacy(
                    settings
                );

        }

    },


    /* =====================================================
       SUMMARY
    ===================================================== */

    renderSummary(settings){

        return `
            <div class="settings-summary">

                <div>

                    <span>
                        Görünürlük
                    </span>

                    <strong>
                        ${this.escapeHTML(
                            this.visibilityLabel(
                                settings.privacy.visibility
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Brain
                    </span>

                    <strong>
                        ${this.escapeHTML(
                            this.yesNo(
                                settings.brain.enabled
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Memory
                    </span>

                    <strong>
                        ${this.escapeHTML(
                            this.yesNo(
                                settings.memory.enabled
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Bildirim
                    </span>

                    <strong>
                        ${this.escapeHTML(
                            this.yesNo(
                                settings.notifications.enabled
                            )
                        )}
                    </strong>

                </div>

            </div>
        `;

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(entity){

        this.enterBrainContext(
            entity
        );


        if(!entity){

            return `
                <section class="engine-page">

                    <div class="section engine-error-state">

                        <h1>
                            Settings açılamadı
                        </h1>

                        <p>
                            Bu varlığın ayar bağlamı bulunamadı.
                        </p>

                    </div>

                </section>
            `;

        }


        const settings =
            this.load(
                entity.id
            );


        return `
            <section class="engine-page settings-app-page">

                <div class="settings-app-shell">

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
                            entity.name ||
                            "VAERO Varlığı"
                        ),
                        "SETTINGS",
                        "⚙️"
                    )}


                    <section class="settings-app-intro">

                        <div>

                            <span class="engine-section-label">
                                ENTITY POLICY
                            </span>

                            <h2>
                                Ayarlar ve sınırlar
                            </h2>

                            <p>
                                Gizlilik, Brain erişimi, Memory davranışı, bildirimler, uygulama izinleri ve güvenlik tercihleri.
                            </p>

                        </div>


                        ${this.renderSummary(
                            settings
                        )}

                    </section>


                    <div class="settings-layout">

                        <aside>
                            ${this.renderNavigation()}
                        </aside>


                        <div class="settings-content-scroll">

                            ${this.renderActivePanel(
                                settings
                            )}


                            <div class="settings-reset-row">

                                <div>

                                    <strong>
                                        Varsayılan ayarlar
                                    </strong>

                                    <small>
                                        Bu varlığın tüm Settings tercihlerini başlangıç değerlerine döndürür.
                                    </small>

                                </div>


                                <button
                                    type="button"
                                    class="secondary-btn"
                                    data-settings-action="reset"
                                >
                                    Sıfırla
                                </button>

                            </div>

                        </div>

                    </div>


                    ${UI.brainPanel()}

                </div>

            </section>
        `;

    },


    /* =====================================================
       COMMAND
    ===================================================== */

    handleAction(
        action,
        element
    ){

        const entity =
            this.getCurrentEntity();


        if(!entity){
            return false;
        }


        switch(action){

            case "section":

                this.activeSection =
                    element.dataset
                        .settingsSection ||
                    "privacy";


                return this.remount();


            case "reset":

                return this.resetEntitySettings(
                    entity
                );

        }


        return false;

    }

};


/* =========================================================
   SETTINGS NAV / COMMANDS
========================================================= */

document.addEventListener(
    "click",
    event => {

        const element =
            event.target.closest(
                "[data-settings-action]"
            );


        if(!element){
            return;
        }


        event.preventDefault();


        SettingsApp.handleAction(
            element.dataset
                .settingsAction,
            element
        );

    }
);


/* =========================================================
   SETTINGS TOGGLES
========================================================= */

document.addEventListener(
    "change",
    event => {

        const entity =
            SettingsApp.getCurrentEntity();


        if(!entity){
            return;
        }


        if(
            event.target.matches(
                "[data-settings-toggle]"
            )
        ){

            const section =
                event.target.dataset
                    .section;


            const key =
                event.target.dataset
                    .key;


            SettingsApp.updateSetting(
                entity,
                section,
                key,
                Boolean(
                    event.target.checked
                )
            );


            return;

        }


        if(
            event.target.matches(
                "[data-settings-select]"
            )
        ){

            const section =
                event.target.dataset
                    .section;


            const key =
                event.target.dataset
                    .key;


            SettingsApp.updateSetting(
                entity,
                section,
                key,
                event.target.value
            );

        }

    }
);


window.SettingsApp =
    SettingsApp;
