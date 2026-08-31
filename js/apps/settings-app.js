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
       SECTIONS
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


    getAllowedSections(){

        return this
            .getSections()
            .map(
                section =>
                    section.id
            );

    },


    normalizeSection(value){

        const section =
            String(
                value ||
                "privacy"
            )
                .trim()
                .toLowerCase();


        return this
            .getAllowedSections()
            .includes(
                section
            )
                ? section
                : "privacy";

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
       NORMALIZATION
    ===================================================== */

    normalizeBoolean(
        value,
        fallback = false
    ){

        return typeof value ===
            "boolean"
                ? value
                : fallback;

    },


    normalizeChoice(
        value,
        allowed,
        fallback
    ){

        const normalized =
            String(
                value ||
                ""
            )
                .trim()
                .toLowerCase();


        return allowed.includes(
            normalized
        )
            ? normalized
            : fallback;

    },


    normalizeSettings(input = {}){

        const defaults =
            this.getDefaults();


        const source =
            input &&
            typeof input ===
                "object" &&
            !Array.isArray(
                input
            )
                ? input
                : {};


        return {

            appearance:{

                density:
                    this.normalizeChoice(
                        source.appearance
                            ?.density,
                        [
                            "compact",
                            "comfortable",
                            "spacious"
                        ],
                        defaults.appearance
                            .density
                    ),

                reduceMotion:
                    this.normalizeBoolean(
                        source.appearance
                            ?.reduceMotion,
                        defaults.appearance
                            .reduceMotion
                    ),

                showAmbientEffects:
                    this.normalizeBoolean(
                        source.appearance
                            ?.showAmbientEffects,
                        defaults.appearance
                            .showAmbientEffects
                    )

            },


            privacy:{

                visibility:
                    this.normalizeChoice(
                        source.privacy
                            ?.visibility,
                        [
                            "private",
                            "connections",
                            "engine"
                        ],
                        defaults.privacy
                            .visibility
                    ),

                allowBridgeDiscovery:
                    this.normalizeBoolean(
                        source.privacy
                            ?.allowBridgeDiscovery,
                        defaults.privacy
                            .allowBridgeDiscovery
                    ),

                exposeProfileToConnections:
                    this.normalizeBoolean(
                        source.privacy
                            ?.exposeProfileToConnections,
                        defaults.privacy
                            .exposeProfileToConnections
                    ),

                includeInGlobalSearch:
                    this.normalizeBoolean(
                        source.privacy
                            ?.includeInGlobalSearch,
                        defaults.privacy
                            .includeInGlobalSearch
                    )

            },


            brain:{

                enabled:
                    this.normalizeBoolean(
                        source.brain
                            ?.enabled,
                        defaults.brain
                            .enabled
                    ),

                allowMemoryRead:
                    this.normalizeBoolean(
                        source.brain
                            ?.allowMemoryRead,
                        defaults.brain
                            .allowMemoryRead
                    ),

                allowTimelineRead:
                    this.normalizeBoolean(
                        source.brain
                            ?.allowTimelineRead,
                        defaults.brain
                            .allowTimelineRead
                    ),

                allowBridgeRead:
                    this.normalizeBoolean(
                        source.brain
                            ?.allowBridgeRead,
                        defaults.brain
                            .allowBridgeRead
                    ),

                allowEvolutionRead:
                    this.normalizeBoolean(
                        source.brain
                            ?.allowEvolutionRead,
                        defaults.brain
                            .allowEvolutionRead
                    ),

                allowProfileRead:
                    this.normalizeBoolean(
                        source.brain
                            ?.allowProfileRead,
                        defaults.brain
                            .allowProfileRead
                    ),

                requireConfirmationForActions:
                    this.normalizeBoolean(
                        source.brain
                            ?.requireConfirmationForActions,
                        defaults.brain
                            .requireConfirmationForActions
                    ),

                allowSensitiveContext:
                    this.normalizeBoolean(
                        source.brain
                            ?.allowSensitiveContext,
                        defaults.brain
                            .allowSensitiveContext
                    )

            },


            memory:{

                enabled:
                    this.normalizeBoolean(
                        source.memory
                            ?.enabled,
                        defaults.memory
                            .enabled
                    ),

                allowBrainAccess:
                    this.normalizeBoolean(
                        source.memory
                            ?.allowBrainAccess,
                        defaults.memory
                            .allowBrainAccess
                    ),

                includeArchived:
                    this.normalizeBoolean(
                        source.memory
                            ?.includeArchived,
                        defaults.memory
                            .includeArchived
                    ),

                autoCaptureSystemEvents:
                    this.normalizeBoolean(
                        source.memory
                            ?.autoCaptureSystemEvents,
                        defaults.memory
                            .autoCaptureSystemEvents
                    )

            },


            notifications:{

                enabled:
                    this.normalizeBoolean(
                        source.notifications
                            ?.enabled,
                        defaults.notifications
                            .enabled
                    ),

                evolution:
                    this.normalizeBoolean(
                        source.notifications
                            ?.evolution,
                        defaults.notifications
                            .evolution
                    ),

                bridge:
                    this.normalizeBoolean(
                        source.notifications
                            ?.bridge,
                        defaults.notifications
                            .bridge
                    ),

                memory:
                    this.normalizeBoolean(
                        source.notifications
                            ?.memory,
                        defaults.notifications
                            .memory
                    ),

                security:
                    this.normalizeBoolean(
                        source.notifications
                            ?.security,
                        defaults.notifications
                            .security
                    ),

                applications:
                    this.normalizeBoolean(
                        source.notifications
                            ?.applications,
                        defaults.notifications
                            .applications
                    )

            },


            applications:{

                allowInstall:
                    this.normalizeBoolean(
                        source.applications
                            ?.allowInstall,
                        defaults.applications
                            .allowInstall
                    ),

                requirePermissionReview:
                    this.normalizeBoolean(
                        source.applications
                            ?.requirePermissionReview,
                        defaults.applications
                            .requirePermissionReview
                    ),

                allowExternalApps:
                    this.normalizeBoolean(
                        source.applications
                            ?.allowExternalApps,
                        defaults.applications
                            .allowExternalApps
                    ),

                allowBackgroundActivity:
                    this.normalizeBoolean(
                        source.applications
                            ?.allowBackgroundActivity,
                        defaults.applications
                            .allowBackgroundActivity
                    )

            },


            security:{

                lockSensitiveActions:
                    this.normalizeBoolean(
                        source.security
                            ?.lockSensitiveActions,
                        defaults.security
                            .lockSensitiveActions
                    ),

                requireActionConfirmation:
                    this.normalizeBoolean(
                        source.security
                            ?.requireActionConfirmation,
                        defaults.security
                            .requireActionConfirmation
                    ),

                allowUnknownApplications:
                    this.normalizeBoolean(
                        source.security
                            ?.allowUnknownApplications,
                        defaults.security
                            .allowUnknownApplications
                    ),

                sessionVisibility:
                    this.normalizeChoice(
                        source.security
                            ?.sessionVisibility,
                        [
                            "private",
                            "entity",
                            "engine"
                        ],
                        defaults.security
                            .sessionVisibility
                    )

            },


            updatedAt:
                Number(
                    source.updatedAt
                ) ||
                Date.now()

        };

    },


    /* =====================================================
       STORAGE
       -----------------------------------------------------
       Entity preference compatibility layer.
       Policy enforcement remains responsibility of the
       systems that consume these settings.
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


        if(!entityId){

            return defaults;

        }


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


            return this.normalizeSettings(
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

        if(!entityId){

            return false;

        }


        try{

            const payload =
                this.normalizeSettings({
                    ...settings,

                    updatedAt:
                        Date.now()
                });


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
                            ...(
                                entity.metadata ||
                                {}
                            ),

                            settings:
                                settingsSnapshot
                        }
                    }
                );

            } catch(error){

                console.warn(
                    "Settings entity metadata güncellenemedi:",
                    error
                );


                return false;

            }

        }

        else {

            entity.metadata = {
                ...(
                    entity.metadata ||
                    {}
                ),

                settings:
                    settingsSnapshot
            };

        }


        try{

            this.getService(
                "world"
            )?.save?.();

        } catch(error){

            /* compatibility */

        }


        return true;

    },


    /* =====================================================
       EVENTS
    ===================================================== */

    emitChange(
        entityId,
        settings
    ){

        const payload = {

            entityId,

            settings,

            time:
                Date.now()

        };


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    "settings:updated",
                    payload
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
                payload
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


        const defaults =
            this.getDefaults();


        if(
            !defaults[section] ||
            typeof defaults[section] !==
                "object" ||
            Array.isArray(
                defaults[section]
            ) ||
            !Object.prototype.hasOwnProperty.call(
                defaults[section],
                key
            )
        ){

            return false;

        }


        const settings =
            this.load(
                entity.id
            );


        settings[section] = {
            ...settings[section],

            [key]:
                value
        };


        const normalized =
            this.normalizeSettings(
                settings
            );


        if(
            !this.save(
                entity.id,
                normalized
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

        const safeOptions =
            Array.isArray(
                options
            )
                ? options
                : [];


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

                    ${safeOptions
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
       NAVIGATION
    ===================================================== */

    renderNavigation(){

        return `
            <div
                class="settings-navigation"
                role="navigation"
                aria-label="Settings bölümleri"
            >

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
                                aria-pressed="${
                                    this.activeSection ===
                                        section.id
                                        ? "true"
                                        : "false"
                                }"
                            >

                                <span aria-hidden="true">
                                    ${this.escapeHTML(
                                        section.icon
                                    )}
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
                        Bu varlık için Engine içindeki tercih edilen görünürlük politikasını belirler.
                    </p>

                </header>


                ${this.renderSelect(
                    "privacy",
                    "visibility",
                    "Varlık görünürlüğü",
                    "Bu varlığın hedeflenen görünürlük seviyesini belirler.",
                    settings.privacy.visibility,
                    [
                        {
                            value:
                                "private",

                            label:
                                "Özel"
                        },

                        {
                            value:
                                "connections",

                            label:
                                "Bağlantılar"
                        },

                        {
                            value:
                                "engine",

                            label:
                                "Engine"
                        }
                    ]
                )}


                ${this.renderToggle(
                    "privacy",
                    "allowBridgeDiscovery",
                    "Bridge keşfine izin ver",
                    "Bridge katmanının bu tercihi keşif politikası olarak kullanmasına izin verir.",
                    settings.privacy.allowBridgeDiscovery
                )}


                ${this.renderToggle(
                    "privacy",
                    "exposeProfileToConnections",
                    "Profili bağlantılara göster",
                    "Bağlantı katmanları için profil görünürlüğü tercihini belirler.",
                    settings.privacy.exposeProfileToConnections
                )}


                ${this.renderToggle(
                    "privacy",
                    "includeInGlobalSearch",
                    "Engine aramasında göster",
                    "Search katmanı bu ayarı destekliyorsa varlığın sonuçlara dahil edilmesine izin verir.",
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
                        Brain servislerinin bu tercihleri desteklediği alanlarda hangi varlık bağlamlarının kullanılabileceğini tanımlar.
                    </p>

                </header>


                ${this.renderToggle(
                    "brain",
                    "enabled",
                    "Brain erişimi",
                    "Bu varlık için Brain kullanım politikasını açar veya kapatır.",
                    settings.brain.enabled
                )}


                ${this.renderToggle(
                    "brain",
                    "allowMemoryRead",
                    "Memory erişimi",
                    "Brain'in Memory bağlamını kullanmasına yönelik tercihi belirler.",
                    settings.brain.allowMemoryRead
                )}


                ${this.renderToggle(
                    "brain",
                    "allowTimelineRead",
                    "Timeline erişimi",
                    "Brain'in Timeline bağlamını kullanmasına yönelik tercihi belirler.",
                    settings.brain.allowTimelineRead
                )}


                ${this.renderToggle(
                    "brain",
                    "allowBridgeRead",
                    "Bridge erişimi",
                    "Brain'in Bridge ilişkilerini kullanmasına yönelik tercihi belirler.",
                    settings.brain.allowBridgeRead
                )}


                ${this.renderToggle(
                    "brain",
                    "allowEvolutionRead",
                    "Evolution erişimi",
                    "Brain'in Evolution bağlamını kullanmasına yönelik tercihi belirler.",
                    settings.brain.allowEvolutionRead
                )}


                ${this.renderToggle(
                    "brain",
                    "allowProfileRead",
                    "Profile erişimi",
                    "Brain'in Profile bağlamını kullanmasına yönelik tercihi belirler.",
                    settings.brain.allowProfileRead
                )}


                ${this.renderToggle(
                    "brain",
                    "requireConfirmationForActions",
                    "Aksiyonlarda onay iste",
                    "Brain action policy bu tercihi destekliyorsa değişiklik yapan işlemlerde onay talep eder.",
                    settings.brain.requireConfirmationForActions
                )}


                ${this.renderToggle(
                    "brain",
                    "allowSensitiveContext",
                    "Hassas bağlama izin ver",
                    "Desteklenen Brain policy katmanlarında hassas bağlam kullanım tercihini açar.",
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
                        Memory servislerinin desteklediği alanlarda bu varlık için kullanılacak tercihleri tanımlar.
                    </p>

                </header>


                ${this.renderToggle(
                    "memory",
                    "enabled",
                    "Memory aktif",
                    "Bu varlığın Memory kullanım tercihini açar veya kapatır.",
                    settings.memory.enabled
                )}


                ${this.renderToggle(
                    "memory",
                    "allowBrainAccess",
                    "Brain Memory erişimi",
                    "Brain ve Memory entegrasyonu bu tercihi destekliyorsa hafıza erişimine izin verir.",
                    settings.memory.allowBrainAccess
                )}


                ${this.renderToggle(
                    "memory",
                    "includeArchived",
                    "Arşivlenmiş hafızayı dahil et",
                    "Desteklenen Memory sorgularında arşivlenmiş kayıtları dahil etme tercihini belirler.",
                    settings.memory.includeArchived
                )}


                ${this.renderToggle(
                    "memory",
                    "autoCaptureSystemEvents",
                    "Sistem olaylarını otomatik kaydet",
                    "Memory Core bu policy'yi tüketiyorsa anlamlı sistem olaylarının kayda alınmasına izin verir.",
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
                        Bildirim sistemi bu tercihleri desteklediğinde hangi olay kategorilerinin bildirim üretebileceğini belirler.
                    </p>

                </header>


                ${this.renderToggle(
                    "notifications",
                    "enabled",
                    "Bildirimler",
                    "Bu varlık için genel bildirim tercihini açar veya kapatır.",
                    settings.notifications.enabled
                )}


                ${this.renderToggle(
                    "notifications",
                    "evolution",
                    "Evolution bildirimleri",
                    "Evolution olayları için bildirim tercihini belirler.",
                    settings.notifications.evolution
                )}


                ${this.renderToggle(
                    "notifications",
                    "bridge",
                    "Bridge bildirimleri",
                    "Bridge olayları için bildirim tercihini belirler.",
                    settings.notifications.bridge
                )}


                ${this.renderToggle(
                    "notifications",
                    "memory",
                    "Memory bildirimleri",
                    "Memory olayları için bildirim tercihini belirler.",
                    settings.notifications.memory
                )}


                ${this.renderToggle(
                    "notifications",
                    "security",
                    "Güvenlik bildirimleri",
                    "Güvenlik ve policy olayları için bildirim tercihini belirler.",
                    settings.notifications.security
                )}


                ${this.renderToggle(
                    "notifications",
                    "applications",
                    "Uygulama bildirimleri",
                    "Application olayları için bildirim tercihini belirler.",
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
                        Uygulama tercihleri
                    </h2>


                    <p>
                        Applications katmanının desteklediği alanlarda kurulum, izin incelemesi ve arka plan davranışı için tercihleri tanımlar.
                    </p>

                </header>


                ${this.renderToggle(
                    "applications",
                    "allowInstall",
                    "Uygulama kurulumu",
                    "Applications katmanı bu policy'yi destekliyorsa bu varlık bağlamında uygulama kurulumuna izin verir.",
                    settings.applications.allowInstall
                )}


                ${this.renderToggle(
                    "applications",
                    "requirePermissionReview",
                    "İzin incelemesi zorunlu",
                    "Bir uygulamanın izin talebi varsa kullanıcı incelemesi gerektirilmesi tercihini belirler.",
                    settings.applications.requirePermissionReview
                )}


                ${this.renderToggle(
                    "applications",
                    "allowExternalApps",
                    "Harici uygulamalara izin ver",
                    "Harici uygulamalar desteklendiğinde kuruluma izin verilmesi tercihini belirler. Bu ayar tek başına uygulamayı güvenilir veya doğrulanmış yapmaz.",
                    settings.applications.allowExternalApps
                )}


                ${this.renderToggle(
                    "applications",
                    "allowBackgroundActivity",
                    "Arka plan etkinliği",
                    "Applications runtime bunu destekliyorsa yetkili uygulamaların sınırlı arka plan çalışmasına izin verilmesi tercihini belirler.",
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
                        Bu ekran güvenlik policy tercihlerini saklar. Gerçek enforcement, ilgili Engine servisleri ve sunucu katmanları tarafından uygulanmalıdır.
                    </p>

                </header>


                ${this.renderToggle(
                    "security",
                    "lockSensitiveActions",
                    "Hassas aksiyonları kilitle",
                    "Action policy bu tercihi destekliyorsa kritik değişikliklerin ek kontrol olmadan çalışmasını sınırlar.",
                    settings.security.lockSensitiveActions
                )}


                ${this.renderToggle(
                    "security",
                    "requireActionConfirmation",
                    "Kritik işlemlerde onay iste",
                    "Desteklenen action policy akışlarında riskli işlemler için kullanıcı onayı tercihini açar.",
                    settings.security.requireActionConfirmation
                )}


                ${this.renderToggle(
                    "security",
                    "allowUnknownApplications",
                    "Bilinmeyen uygulamalara izin ver",
                    "Uygulama güven politikası bu ayarı destekliyorsa bilinmeyen kaynaklara yönelik tercihi belirler. Güvenli varsayılan kapalıdır.",
                    settings.security.allowUnknownApplications
                )}


                ${this.renderSelect(
                    "security",
                    "sessionVisibility",
                    "Oturum görünürlüğü",
                    "Oturum bağlamını kullanan servisler bu tercihi destekliyorsa hedef görünürlük seviyesini belirler.",
                    settings.security.sessionVisibility,
                    [
                        {
                            value:
                                "private",

                            label:
                                "Özel"
                        },

                        {
                            value:
                                "entity",

                            label:
                                "Yalnız bu varlık"
                        },

                        {
                            value:
                                "engine",

                            label:
                                "Engine"
                        }
                    ]
                )}


                <div class="settings-warning-card">

                    <strong>
                        Policy sınırı
                    </strong>


                    <p>
                        Buradaki tercihler tek başına kimlik doğrulama, yetkilendirme, oturum güvenliği veya uygulama doğrulaması sağlamaz.
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
                        Bu varlık bağlamındaki desteklenen arayüz davranış tercihlerini belirler.
                    </p>

                </header>


                ${this.renderSelect(
                    "appearance",
                    "density",
                    "Arayüz yoğunluğu",
                    "Arayüz katmanı bu tercihi destekliyorsa kart ve içerik alanlarının yoğunluk seviyesini belirler.",
                    settings.appearance.density,
                    [
                        {
                            value:
                                "compact",

                            label:
                                "Kompakt"
                        },

                        {
                            value:
                                "comfortable",

                            label:
                                "Dengeli"
                        },

                        {
                            value:
                                "spacious",

                            label:
                                "Geniş"
                        }
                    ]
                )}


                ${this.renderToggle(
                    "appearance",
                    "reduceMotion",
                    "Hareketleri azalt",
                    "UI katmanı bu tercihi destekliyorsa animasyon ve hareketli geçişleri azaltır.",
                    settings.appearance.reduceMotion
                )}


                ${this.renderToggle(
                    "appearance",
                    "showAmbientEffects",
                    "Ambient efektleri göster",
                    "UI katmanı bu tercihi destekliyorsa VAERO'nun ambient görsel efektlerini açık tutar.",
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
                                settings.privacy
                                    .visibility
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
                                settings.brain
                                    .enabled
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
                                settings.memory
                                    .enabled
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
                                settings.notifications
                                    .enabled
                            )
                        )}
                    </strong>

                </div>

            </div>
        `;

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
    entity?.name ||
    "VAERO Varlığı",
    "SETTINGS",
    " "
);

        }


        return `
            <header class="engine-app-header">

                <span class="engine-section-label">
                    SETTINGS
                </span>


                <h1>
                    ${this.escapeHTML(
                        entity?.name ||
                        "VAERO Varlığı"
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
       RENDER
    ===================================================== */

    render(entity){

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


        this.activeSection =
            this.normalizeSection(
                this.activeSection
            );


        this.enterBrainContext(
            entity
        );


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


                    ${this.renderAppHeader(
                        entity
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
                                Gizlilik, Brain, Memory, bildirimler, uygulamalar, güvenlik ve görünüm için varlık düzeyindeki tercihleri yönet.
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


                    ${this.renderBrainPanel()}

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
                    this.normalizeSection(
                        element?.dataset
                            ?.settingsSection
                    );


                return this.remount();


            case "reset":

                return this.resetEntitySettings(
                    entity
                );


            default:

                return false;

        }

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
   SETTINGS CONTROLS
========================================================= */

document.addEventListener(
    "change",
    event => {

        const target =
            event.target;


        if(
            !target.matches(
                "[data-settings-toggle], [data-settings-select]"
            )
        ){

            return;

        }


        const entity =
            SettingsApp
                .getCurrentEntity();


        if(!entity){

            return;

        }


        const section =
            String(
                target.dataset
                    .section ||
                ""
            );


        const key =
            String(
                target.dataset
                    .key ||
                ""
            );


        if(
            !section ||
            !key
        ){

            return;

        }


        if(
            target.matches(
                "[data-settings-toggle]"
            )
        ){

            SettingsApp.updateSetting(
                entity,
                section,
                key,
                Boolean(
                    target.checked
                )
            );


            return;

        }


        SettingsApp.updateSetting(
            entity,
            section,
            key,
            target.value
        );

    }
);


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
            "settingsApp",
            SettingsApp
        );

    }

} catch(error){

    /* global remains available */

}


window.SettingsApp =
    SettingsApp;
