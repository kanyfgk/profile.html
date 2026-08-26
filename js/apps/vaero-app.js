/* =========================================================
   VAERO APP
   Engine System Overview / Continuity / Intelligence Hub
========================================================= */

const VaeroApp = {

    id:
        "vaero",

    title:
        "VAERO",


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


    safeAll(
        service,
        options = undefined
    ){

        if(
            !service ||
            typeof service.all !==
                "function"
        ){
            return [];
        }


        try{

            const result =
                options === undefined
                    ? service.all()
                    : service.all(
                        options
                    );


            return Array.isArray(
                result
            )
                ? result
                : [];

        } catch(error){

            return [];

        }

    },


    /* =====================================================
       BRAIN CONTEXT
    ===================================================== */

    enterBrainContext(){

        try{

            const engine =
                this.getEngine();


            const awareness =
                this.getService(
                    "brainAwareness"
                );


            awareness?.enter?.(
                "vaero",
                {
                    entityId:
                        engine
                            ?.currentEntity
                            ?.id ||
                        null,

                    worldId:
                        engine
                            ?.currentWorld
                            ?.id ||
                        null,

                    system:
                        true
                }
            );

        } catch(error){

            console.warn(
                "VAERO Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       WORLDS
    ===================================================== */

    getWorlds(){

        const world =
            this.getService(
                "world"
            );


        try{

            if(
                world &&
                typeof world.all ===
                    "function"
            ){

                const result =
                    world.all();


                return Array.isArray(
                    result
                )
                    ? result
                    : [];

            }

        } catch(error){

            return [];

        }


        return [];

    },


    /* =====================================================
       ENTITIES
    ===================================================== */

    getEntities(){

        const manager =
            this.getService(
                "entityManager"
            );


        if(
            !manager ||
            typeof manager.all !==
                "function"
        ){
            return [];
        }


        try{

            const result =
                manager.all({
                    includeArchived:false
                });


            return Array.isArray(
                result
            )
                ? result
                : [];

        } catch(error){

            return [];

        }

    },


    /* =====================================================
       APPLICATIONS
    ===================================================== */

    getApplicationRegistry(){

        return (
            this.getService(
                "appRegistry"
            ) ||
            this.getService(
                "applicationRegistry"
            ) ||
            (
                typeof AppRegistry !==
                    "undefined"
                    ? AppRegistry
                    : null
            )
        );

    },


    getApplications(){

        const registry =
            this.getApplicationRegistry();


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


    /* =====================================================
       ORGAN HEALTH
    ===================================================== */

    getOrganHealth(){

        const status =
            this.getService(
                "organStatus"
            );


        if(
            !status ||
            typeof status.health !==
                "function"
        ){

            return {

                status:
                    "unknown",

                averageHealth:
                    null,

                total:
                    0,

                active:
                    0,

                problematic:[],

                organs:[]

            };

        }


        try{

            const result =
                status.health();


            return (
                result &&
                typeof result ===
                    "object"
            )
                ? result
                : {
                    status:"unknown",
                    averageHealth:null,
                    total:0,
                    active:0,
                    problematic:[],
                    organs:[]
                };

        } catch(error){

            return {
                status:"unknown",
                averageHealth:null,
                total:0,
                active:0,
                problematic:[],
                organs:[]
            };

        }

    },


    /* =====================================================
       RUNTIME
    ===================================================== */

    getRuntimeReport(){

        const runtime =
            this.getService(
                "runtime"
            );


        if(!runtime){

            return null;
        }


        try{

            if(
                typeof runtime.report ===
                    "function"
            ){

                return (
                    runtime.report() ||
                    null
                );

            }

        } catch(error){

            /* fallback */
        }


        try{

            if(
                typeof runtime.health ===
                    "function"
            ){

                return (
                    runtime.health() ||
                    null
                );

            }

        } catch(error){

            return null;

        }


        return null;

    },


    /* =====================================================
       MEMORY
    ===================================================== */

    getMemoryStats(){

        const memory =
            this.getService(
                "memorySystem"
            );


        const records =
            this.safeAll(
                memory
            );


        return {

            total:
                records.filter(
                    record =>
                        record?.archived !==
                            true
                ).length,

            important:
                records.filter(
                    record =>
                        record?.archived !==
                            true &&
                        record?.important ===
                            true
                ).length

        };

    },


    /* =====================================================
       EVOLUTION
    ===================================================== */

    getEvolutionStats(){

        const evolution =
            this.getService(
                "evolution"
            );


        if(!evolution){

            return {
                total:0,
                xp:0,
                level:1,
                goals:0
            };

        }


        const engine =
            this.getEngine();


        const entityId =
            engine?.currentEntity
                ?.id ||
            null;


        let events = [];


        try{

            if(
                entityId &&
                typeof evolution.forEntity ===
                    "function"
            ){

                events =
                    evolution.forEntity(
                        entityId
                    );

            } else {

                events =
                    this.safeAll(
                        evolution
                    );

            }

        } catch(error){

            events =
                [];

        }


        const xp =
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


        return {

            total:
                events.length,

            xp,

            level:
                Math.floor(
                    xp / 100
                ) + 1,

            goals:
                events.filter(
                    event =>
                        event?.type ===
                            "goal" &&
                        event?.status !==
                            "completed" &&
                        event?.status !==
                            "cancelled"
                ).length

        };

    },


    /* =====================================================
       BRIDGE
    ===================================================== */

    getBridgeStats(){

        const bridge =
            this.getService(
                "bridge"
            );


        const engine =
            this.getEngine();


        const entityId =
            engine?.currentEntity
                ?.id ||
            null;


        if(!bridge){

            return {
                total:0,
                favorites:0
            };

        }


        let links = [];


        try{

            if(
                entityId &&
                typeof bridge.forEntity ===
                    "function"
            ){

                links =
                    bridge.forEntity(
                        entityId
                    );

            } else {

                links =
                    this.safeAll(
                        bridge
                    );

            }

        } catch(error){

            links =
                [];

        }


        return {

            total:
                links.length,

            favorites:
                links.filter(
                    link =>
                        link?.favorite ===
                            true
                ).length

        };

    },


    /* =====================================================
       DISCOVERY
    ===================================================== */

    getDiscoveryResult(){

        try{

            if(
                window.DiscoveryApp &&
                typeof window
                    .DiscoveryApp
                    .getResult ===
                    "function"
            ){

                return (
                    window
                        .DiscoveryApp
                        .getResult() ||
                    null
                );

            }

        } catch(error){

            /* storage fallback */
        }


        try{

            const saved =
                localStorage.getItem(
                    "vaero:discovery:result:v2"
                );


            if(!saved){
                return null;
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
                : null;

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       CONTINUITY
    ===================================================== */

    getContinuity(){

        const engine =
            this.getEngine();


        const worlds =
            this.getWorlds();


        const entities =
            this.getEntities();


        const memory =
            this.getMemoryStats();


        const evolution =
            this.getEvolutionStats();


        const bridge =
            this.getBridgeStats();


        const discovery =
            this.getDiscoveryResult();


        return {

            currentEntity:
                engine?.currentEntity ||
                null,

            currentWorld:
                engine?.currentWorld ||
                null,

            worlds:
                worlds.length,

            entities:
                entities.length,

            memories:
                memory.total,

            importantMemories:
                memory.important,

            evolutionEvents:
                evolution.total,

            xp:
                evolution.xp,

            level:
                evolution.level,

            activeGoals:
                evolution.goals,

            connections:
                bridge.total,

            favoriteConnections:
                bridge.favorites,

            discoveryDirection:
                discovery
                    ?.primaryDirection
                    ?.label ||
                null,

            brainMode:
                discovery
                    ?.signals
                    ?.brainMode ||
                null

        };

    },


    /* =====================================================
       SYSTEM SUMMARY
    ===================================================== */

    getSystemSummary(){

        const engine =
            this.getEngine();


        const organs =
            this.getOrganHealth();


        const runtime =
            this.getRuntimeReport();


        const worlds =
            this.getWorlds();


        const entities =
            this.getEntities();


        const applications =
            this.getApplications();


        return {

            engineStarted:
                Boolean(
                    engine?.started
                ),

            engineStartedAt:
                engine?.startedAt ||
                null,

            runtime,

            worlds:
                worlds.length,

            entities:
                entities.length,

            applications:
                applications.length,

            organHealth:
                organs.averageHealth,

            organStatus:
                organs.status,

            activeOrgans:
                organs.active ||
                0,

            totalOrgans:
                organs.total ||
                0,

            problematicOrgans:
                Array.isArray(
                    organs.problematic
                )
                    ? organs.problematic
                    : []

        };

    },


    /* =====================================================
       STATUS LABELS
    ===================================================== */

    getSystemStatusLabel(status){

        const labels = {

            healthy:
                "Sağlıklı",

            degraded:
                "Dikkat",

            critical:
                "Kritik",

            unknown:
                "Bilinmiyor"

        };


        return (
            labels[
                status
            ] ||
            "Bilinmiyor"
        );

    },


    getBrainModeLabel(mode){

        const labels = {

            direction:
                "Yön",

            evolution:
                "Gelişim",

            connections:
                "Eşleşme",

            opportunities:
                "Fırsat",

            balanced:
                "Dengeli"

        };


        return (
            labels[
                mode
            ] ||
            "Dengeli"
        );

    },


    /* =====================================================
       TIME
    ===================================================== */

    formatStartedAt(value){

        const timestamp =
            Number(
                value
            );


        if(
            !Number.isFinite(
                timestamp
            ) ||
            timestamp <= 0
        ){
            return "Bu oturum";
        }


        try{

            return new Date(
                timestamp
            ).toLocaleString(
                "tr-TR",
                {
                    day:"2-digit",
                    month:"short",
                    hour:"2-digit",
                    minute:"2-digit"
                }
            );

        } catch(error){

            return "Bu oturum";

        }

    },


    /* =====================================================
       STAT CARD
    ===================================================== */

    renderStat(
        label,
        value,
        detail = ""
    ){

        return `
            <div class="vaero-system-stat">

                <span>
                    ${this.escapeHTML(
                        label
                    )}
                </span>

                <strong>
                    ${this.escapeHTML(
                        value
                    )}
                </strong>

                ${
                    detail
                        ? `
                            <small>
                                ${this.escapeHTML(
                                    detail
                                )}
                            </small>
                          `
                        : ""
                }

            </div>
        `;

    },


    /* =====================================================
       SYSTEM HERO
    ===================================================== */

    renderHero(
        summary,
        continuity
    ){

        const engine =
            this.getEngine();


        const entityName =
            engine
                ?.currentEntity
                ?.name ||
            "VAERO Entity";


        return `
            <section class="vaero-system-hero">

                <div class="vaero-system-hero-copy">

                    <span class="engine-section-label">
                        LIVING ENGINE
                    </span>


                    <h1>
                        VAERO
                    </h1>


                    <p>
                        Dünyalarını, varlıklarını, hafızanı, bağlantılarını ve kişisel Brain bağlamını tek yaşayan sistem içinde birleştirir.
                    </p>


                    <div class="vaero-system-hero-context">

                        <span>
                            Aktif varlık
                            <strong>
                                ${this.escapeHTML(
                                    entityName
                                )}
                            </strong>
                        </span>


                        <span>
                            Seviye
                            <strong>
                                ${continuity.level}
                            </strong>
                        </span>


                        <span>
                            Sistem
                            <strong>
                                ${this.escapeHTML(
                                    this.getSystemStatusLabel(
                                        summary.organStatus
                                    )
                                )}
                            </strong>
                        </span>

                    </div>

                </div>


                <div class="vaero-system-mark">

                    <span>
                        V
                    </span>

                    <small>
                        ENGINE
                    </small>

                </div>

            </section>
        `;

    },


    /* =====================================================
       QUICK ACTIONS
    ===================================================== */

    renderQuickActions(){

        return `
            <section class="vaero-system-actions">

                <button
                    type="button"
                    data-action="worlds"
                >

                    <span>
                        ◉
                    </span>

                    <strong>
                        Worlds
                    </strong>

                    <small>
                        Dünyalarını yönet
                    </small>

                </button>


                <button
                    type="button"
                    data-action="app:applications"
                >

                    <span>
                        ▦
                    </span>

                    <strong>
                        Applications
                    </strong>

                    <small>
                        Uygulama katmanını aç
                    </small>

                </button>


                <button
                    type="button"
                    data-action="brain:open"
                >

                    <span>
                        ◇
                    </span>

                    <strong>
                        Brain
                    </strong>

                    <small>
                        Sistem zekâsını aç
                    </small>

                </button>


                <button
                    type="button"
                    data-action="create"
                >

                    <span>
                        ＋
                    </span>

                    <strong>
                        Oluştur
                    </strong>

                    <small>
                        Yeni World veya Entity
                    </small>

                </button>

            </section>
        `;

    },


    /* =====================================================
       CONTINUITY
    ===================================================== */

    renderContinuity(continuity){

        return `
            <section class="vaero-system-panel">

                <header>

                    <span class="engine-section-label">
                        CONTINUITY
                    </span>

                    <h2>
                        Sistem seninle birlikte birikiyor
                    </h2>

                    <p>
                        VAERO'nun kişisel süreklilik katmanı; dünyalar, hafıza, gelişim ve bağlantılar arasında bağ kurar.
                    </p>

                </header>


                <div class="vaero-system-stat-grid">

                    ${this.renderStat(
                        "WORLD",
                        continuity.worlds
                    )}


                    ${this.renderStat(
                        "ENTITY",
                        continuity.entities
                    )}


                    ${this.renderStat(
                        "MEMORY",
                        continuity.memories,
                        continuity.importantMemories
                            ? `${continuity.importantMemories} önemli`
                            : ""
                    )}


                    ${this.renderStat(
                        "BRIDGE",
                        continuity.connections,
                        continuity.favoriteConnections
                            ? `${continuity.favoriteConnections} favori`
                            : ""
                    )}


                    ${this.renderStat(
                        "EVOLUTION",
                        continuity.evolutionEvents,
                        `${continuity.xp} XP`
                    )}


                    ${this.renderStat(
                        "AKTİF HEDEF",
                        continuity.activeGoals
                    )}

                </div>

            </section>
        `;

    },


    /* =====================================================
       DIRECTION
    ===================================================== */

    renderDirection(continuity){

        return `
            <section class="vaero-system-panel">

                <header>

                    <span class="engine-section-label">
                        PERSONAL DIRECTION
                    </span>

                    <h2>
                        İlk yön
                    </h2>

                </header>


                ${
                    continuity.discoveryDirection
                        ? `
                            <div class="vaero-direction-card">

                                <div>

                                    <span>
                                        Discovery yönü
                                    </span>

                                    <strong>
                                        ${this.escapeHTML(
                                            continuity.discoveryDirection
                                        )}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Brain modu
                                    </span>

                                    <strong>
                                        ${this.escapeHTML(
                                            this.getBrainModeLabel(
                                                continuity.brainMode
                                            )
                                        )}
                                    </strong>

                                </div>

                            </div>
                          `
                        : `
                            <div class="engine-empty-state">

                                <strong>
                                    Discovery yönü bulunamadı
                                </strong>

                                İlk Discovery Journey tamamlandığında kişisel yön burada görünür.

                            </div>
                          `
                }

            </section>
        `;

    },


    /* =====================================================
       ENGINE HEALTH
    ===================================================== */

    renderEngineHealth(summary){

        const healthValue =
            Number.isFinite(
                Number(
                    summary.organHealth
                )
            )
                ? `${summary.organHealth}%`
                : "—";


        return `
            <section class="vaero-system-panel">

                <header>

                    <span class="engine-section-label">
                        ENGINE HEALTH
                    </span>

                    <h2>
                        Sistem durumu
                    </h2>

                </header>


                <div class="vaero-engine-health">

                    <div>

                        <span>
                            Engine
                        </span>

                        <strong>
                            ${
                                summary.engineStarted
                                    ? "Çalışıyor"
                                    : "Hazır değil"
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Organ Health
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                healthValue
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Aktif Organ
                        </span>

                        <strong>
                            ${summary.activeOrgans}
                            /
                            ${summary.totalOrgans}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Applications
                        </span>

                        <strong>
                            ${summary.applications}
                        </strong>

                    </div>

                </div>


                ${
                    summary.problematicOrgans
                        .length
                        ? `
                            <div class="vaero-system-warning">

                                <strong>
                                    Dikkat isteyen organlar
                                </strong>

                                <p>
                                    ${this.escapeHTML(
                                        summary
                                            .problematicOrgans
                                            .join(", ")
                                    )}
                                </p>

                            </div>
                          `
                        : ""
                }

            </section>
        `;

    },


    /* =====================================================
       CURRENT CONTEXT
    ===================================================== */

    renderCurrentContext(){

        const engine =
            this.getEngine();


        const entity =
            engine?.currentEntity ||
            null;


        const world =
            engine?.currentWorld ||
            null;


        return `
            <section class="vaero-system-panel">

                <header>

                    <span class="engine-section-label">
                        CURRENT CONTEXT
                    </span>

                    <h2>
                        Şu an neredesin?
                    </h2>

                </header>


                <div class="vaero-context-list">

                    <div>

                        <span>
                            World
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                world?.name ||
                                "World seçilmedi"
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Entity
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                entity?.name ||
                                "Entity seçilmedi"
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Entity türü
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                entity?.type ||
                                "—"
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Engine başlangıcı
                        </span>

                        <strong>
                            ${this.escapeHTML(
                                this.formatStartedAt(
                                    engine?.startedAt
                                )
                            )}
                        </strong>

                    </div>

                </div>


                ${
                    entity
                        ? `
                            <button
                                type="button"
                                class="secondary-btn"
                                data-action="entity:dashboard"
                            >
                                Varlığı Aç
                            </button>
                          `
                        : ""
                }

            </section>
        `;

    },


    /* =====================================================
       SYSTEM PRINCIPLE
    ===================================================== */

    renderSystemPrinciple(){

        return `
            <section class="vaero-system-principle">

                <span class="engine-section-label">
                    VAERO PRINCIPLE
                </span>

                <blockquote>
                    VAERO seni kullandıkça sana dönüşür.
                </blockquote>

                <p>
                    Hafıza, Identity, Profile, Worlds, Bridge, Evolution ve Brain birbirinden kopuk uygulamalar değil; aynı kişisel sistemin farklı organlarıdır.
                </p>

            </section>
        `;

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(){

        this.enterBrainContext();


        const summary =
            this.getSystemSummary();


        const continuity =
            this.getContinuity();


        return `
            <section class="engine-page vaero-system-app">

                <div class="vaero-system-shell">

                    <div class="engine-page-toolbar">

                        <button
                            type="button"
                            class="engine-back-btn"
                            data-action="home"
                        >
                            ← Engine
                        </button>

                    </div>


                    ${this.renderHero(
                        summary,
                        continuity
                    )}


                    ${this.renderQuickActions()}


                    <div class="vaero-system-scroll">

                        <div class="vaero-system-grid">

                            <div>

                                ${this.renderContinuity(
                                    continuity
                                )}


                                ${this.renderDirection(
                                    continuity
                                )}

                            </div>


                            <div>

                                ${this.renderEngineHealth(
                                    summary
                                )}


                                ${this.renderCurrentContext()}

                            </div>

                        </div>


                        ${this.renderSystemPrinciple()}

                    </div>


                    ${UI.brainPanel()}

                </div>

            </section>
        `;

    }

};


window.VaeroApp =
    VaeroApp;
