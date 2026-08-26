/* =========================================================
   VAERO ORGANS APP
   Organ Launcher / Health / Capabilities / Permissions
========================================================= */

const OrgansApp = {

    searchQuery:
        "",

    activeFilter:
        "all",

    selectedOrganId:
        null,

    searchTimer:
        null,


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
                "organs",
                {
                    entityId:
                        entity?.id ||
                        null,

                    selectedOrganId:
                        this.selectedOrganId,

                    filter:
                        this.activeFilter
                }
            );

        } catch(error){

            console.warn(
                "Organs Brain context açılamadı:",
                error
            );

        }

    },


    /* =====================================================
       ORGAN REGISTRY
    ===================================================== */

    getRegistry(){

        try{

            if(
                typeof OrganRegistry !==
                    "undefined"
            ){
                return OrganRegistry;
            }

        } catch(error){

            /* service fallback */
        }


        return (
            this.getService(
                "organRegistry"
            ) ||
            null
        );

    },


    getRegisteredOrgans(){

        const registry =
            this.getRegistry();


        if(
            !registry ||
            typeof registry.all !==
                "function"
        ){
            return [];
        }


        try{

            const organs =
                registry.all();


            return Array.isArray(
                organs
            )
                ? organs.filter(Boolean)
                : [];

        } catch(error){

            console.warn(
                "Organ Registry okunamadı:",
                error
            );


            return [];

        }

    },


    findRegisteredOrgan(id){

        const organId =
            String(
                id ||
                ""
            ).trim();


        if(!organId){
            return null;
        }


        const registry =
            this.getRegistry();


        try{

            if(
                registry &&
                typeof registry.find ===
                    "function"
            ){

                const found =
                    registry.find(
                        organId
                    );


                if(found){
                    return found;
                }

            }

        } catch(error){

            /* array fallback */
        }


        return (
            this.getRegisteredOrgans()
                .find(
                    organ =>
                        organ?.id ===
                        organId
                ) ||
            null
        );

    },


    /* =====================================================
       ORGAN SYSTEM
    ===================================================== */

    getOrganSystem(){

        return (
            this.getService(
                "organSystem"
            ) ||
            this.getService(
                "organ"
            ) ||
            (
                typeof Organ !==
                    "undefined"
                    ? Organ
                    : null
            )
        );

    },


    resolveRuntimeOrgan(id){

        const system =
            this.getOrganSystem();


        if(!system){
            return null;
        }


        try{

            if(
                typeof system.get ===
                    "function"
            ){

                const organ =
                    system.get(
                        id
                    );


                if(organ){
                    return organ;
                }

            }

        } catch(error){

            /* fallback */
        }


        try{

            if(
                typeof system.find ===
                    "function"
            ){

                const organ =
                    system.find(
                        id
                    );


                if(organ){
                    return organ;
                }

            }

        } catch(error){

            /* fallback */
        }


        if(
            system.organs instanceof
                Map
        ){

            return (
                system.organs.get(
                    id
                ) ||
                null
            );

        }


        if(
            system.registry instanceof
                Map
        ){

            return (
                system.registry.get(
                    id
                ) ||
                null
            );

        }


        return null;

    },


    /* =====================================================
       LIVE STATUS
    ===================================================== */

    getStatusService(){

        return this.getService(
            "organStatus"
        );

    },


    getLiveStatuses(){

        const organStatus =
            this.getStatusService();


        if(
            !organStatus ||
            typeof organStatus.all !==
                "function"
        ){
            return [];
        }


        try{

            const statuses =
                organStatus.all();


            return Array.isArray(
                statuses
            )
                ? statuses.filter(Boolean)
                : [];

        } catch(error){

            console.warn(
                "Organ durumları okunamadı:",
                error
            );


            return [];

        }

    },


    normalizeText(value){

        return String(
            value ||
            ""
        )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );

    },


    inferStatusId(app){

        const searchable =
            this.normalizeText(
                [
                    app?.id,
                    app?.title,
                    app?.action
                ]
                    .filter(Boolean)
                    .join(" ")
            );


        const mappings = [

            ["memory","memory"],
            ["hafıza","memory"],
            ["hafiza","memory"],

            ["timeline","timeline"],
            ["zaman","timeline"],

            ["evolution","evolution"],
            ["evrim","evolution"],

            ["bridge","bridge"],
            ["bağlantı","bridge"],
            ["baglanti","bridge"],

            ["identity","identity"],
            ["kimlik","identity"],

            ["profile","profile"],
            ["profil","profile"]

        ];


        for(
            const [
                token,
                id
            ] of mappings
        ){

            if(
                searchable.includes(
                    token
                )
            ){
                return id;
            }

        }


        return (
            app?.id ||
            null
        );

    },


    findLiveStatus(
        app,
        liveStatuses
    ){

        const statusId =
            this.inferStatusId(
                app
            );


        if(!statusId){
            return null;
        }


        return (
            liveStatuses.find(
                item =>
                    item?.id ===
                    statusId
            ) ||
            null
        );

    },


    /* =====================================================
       STATUS / HEALTH
    ===================================================== */

    normalizeStatus(status){

        const value =
            String(
                status ||
                "ready"
            )
                .trim()
                .toLowerCase();


        if(
            [
                "active",
                "ready",
                "inactive",
                "paused",
                "missing",
                "error",
                "disabled"
            ].includes(
                value
            )
        ){
            return value;
        }


        return "ready";

    },


    getStatusPresentation(status){

        const normalized =
            this.normalizeStatus(
                status
            );


        const map = {

            active:{
                label:"Aktif",
                tone:"good"
            },

            ready:{
                label:"Hazır",
                tone:"neutral"
            },

            inactive:{
                label:"Pasif",
                tone:"neutral"
            },

            paused:{
                label:"Duraklatıldı",
                tone:"warning"
            },

            missing:{
                label:"Bağlı değil",
                tone:"danger"
            },

            error:{
                label:"Hata",
                tone:"danger"
            },

            disabled:{
                label:"Devre dışı",
                tone:"warning"
            }

        };


        return (
            map[normalized] ||
            map.ready
        );

    },


    getHealth(
        app,
        liveStatus,
        runtimeOrgan
    ){

        const raw =
            liveStatus?.health ??
            runtimeOrgan?.health ??
            app?.health ??
            null;


        if(
            typeof raw ===
                "number"
        ){

            const score =
                Math.max(
                    0,
                    Math.min(
                        100,
                        Math.round(
                            raw
                        )
                    )
                );


            return {
                score,
                label:
                    score >= 80
                        ? "İyi"
                        : score >= 50
                            ? "Dikkat"
                            : "Kritik"
            };

        }


        const status =
            this.normalizeStatus(
                liveStatus?.status ||
                runtimeOrgan?.status ||
                app?.status
            );


        if(
            status === "active" ||
            status === "ready"
        ){

            return {
                score:100,
                label:"İyi"
            };

        }


        if(
            status === "paused" ||
            status === "inactive"
        ){

            return {
                score:60,
                label:"Dikkat"
            };

        }


        if(
            status === "missing" ||
            status === "error"
        ){

            return {
                score:0,
                label:"Kritik"
            };

        }


        return {
            score:80,
            label:"İyi"
        };

    },


    /* =====================================================
       ORGAN DATA
    ===================================================== */

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
                                    item ??
                                    ""
                                ).trim()
                        )
                        .filter(Boolean)
                )
            ];

        }


        if(
            value instanceof
                Set
        ){

            return [
                ...value
            ]
                .map(
                    item =>
                        String(
                            item ??
                            ""
                        ).trim()
                )
                .filter(Boolean);

        }


        return [];

    },


    getCapabilities(
        app,
        runtimeOrgan
    ){

        return this.normalizeList(
            runtimeOrgan
                ?.capabilities ||
            app?.capabilities ||
            []
        );

    },


    getPermissions(
        app,
        runtimeOrgan
    ){

        return this.normalizeList(
            runtimeOrgan
                ?.permissions ||
            app?.permissions ||
            []
        );

    },


    getDependencies(
        app,
        runtimeOrgan
    ){

        return this.normalizeList(
            runtimeOrgan
                ?.dependencies ||
            runtimeOrgan
                ?.dependsOn ||
            app?.dependencies ||
            []
        );

    },


    getMetadata(
        app,
        runtimeOrgan
    ){

        const metadata =
            runtimeOrgan?.metadata ||
            app?.metadata ||
            {};


        return (
            metadata &&
            typeof metadata ===
                "object" &&
            !Array.isArray(
                metadata
            )
        )
            ? metadata
            : {};

    },


    buildOrganModel(
        app,
        liveStatuses
    ){

        const runtimeOrgan =
            this.resolveRuntimeOrgan(
                app?.id
            );


        const liveStatus =
            this.findLiveStatus(
                app,
                liveStatuses
            );


        const status =
            this.normalizeStatus(
                liveStatus?.status ||
                runtimeOrgan?.status ||
                app?.status ||
                "ready"
            );


        return {

            id:
                String(
                    app?.id ||
                    runtimeOrgan?.id ||
                    ""
                ).trim(),

            title:
                String(
                    app?.title ||
                    runtimeOrgan?.title ||
                    app?.name ||
                    runtimeOrgan?.name ||
                    "Organ"
                ).trim(),

            subtitle:
                String(
                    app?.subtitle ||
                    runtimeOrgan?.description ||
                    "VAERO Engine organı"
                ).trim(),

            icon:
                String(
                    app?.icon ||
                    runtimeOrgan?.icon ||
                    "◈"
                ),

            action:
                String(
                    app?.action ||
                    runtimeOrgan?.action ||
                    ""
                ).trim(),

            status,

            total:
                Number.isFinite(
                    Number(
                        liveStatus?.total
                    )
                )
                    ? Number(
                        liveStatus.total
                    )
                    : null,

            health:
                this.getHealth(
                    app,
                    liveStatus,
                    runtimeOrgan
                ),

            capabilities:
                this.getCapabilities(
                    app,
                    runtimeOrgan
                ),

            permissions:
                this.getPermissions(
                    app,
                    runtimeOrgan
                ),

            dependencies:
                this.getDependencies(
                    app,
                    runtimeOrgan
                ),

            metadata:
                this.getMetadata(
                    app,
                    runtimeOrgan
                ),

            runtimeOrgan,

            source:
                app

        };

    },


    getOrgans(){

        const statuses =
            this.getLiveStatuses();


        return this
            .getRegisteredOrgans()
            .map(
                app =>
                    this.buildOrganModel(
                        app,
                        statuses
                    )
            )
            .filter(
                organ =>
                    organ.id
            );

    },


    /* =====================================================
       FILTER / SEARCH
    ===================================================== */

    getVisibleOrgans(){

        let organs =
            this.getOrgans();


        if(
            this.activeFilter ===
                "active"
        ){

            organs =
                organs.filter(
                    organ =>
                        organ.status ===
                        "active"
                );

        }


        if(
            this.activeFilter ===
                "attention"
        ){

            organs =
                organs.filter(
                    organ =>
                        organ.status ===
                            "error" ||
                        organ.status ===
                            "missing" ||
                        organ.status ===
                            "paused" ||
                        organ.health.score <
                            80
                );

        }


        if(
            this.activeFilter ===
                "permissions"
        ){

            organs =
                organs.filter(
                    organ =>
                        organ.permissions
                            .length > 0
                );

        }


        const query =
            this.normalizeText(
                this.searchQuery
            );


        if(query){

            organs =
                organs.filter(
                    organ => {

                        const haystack =
                            this.normalizeText(
                                [
                                    organ.id,
                                    organ.title,
                                    organ.subtitle,
                                    organ.status,
                                    ...organ.capabilities,
                                    ...organ.permissions,
                                    ...organ.dependencies
                                ].join(" ")
                            );


                        return haystack.includes(
                            query
                        );

                    }
                );

        }


        return organs;

    },


    /* =====================================================
       SELECTED ORGAN
    ===================================================== */

    findOrgan(id){

        return (
            this.getOrgans()
                .find(
                    organ =>
                        organ.id ===
                        id
                ) ||
            null
        );

    },


    selectOrgan(id){

        const organ =
            this.findOrgan(
                id
            );


        if(!organ){
            return false;
        }


        this.selectedOrganId =
            organ.id;


        return this.remount();

    },


    closeOrgan(){

        this.selectedOrganId =
            null;


        return this.remount();

    },


    /* =====================================================
       PERMISSIONS
    ===================================================== */

    canManagePermissions(organ){

        const runtime =
            organ?.runtimeOrgan;


        return Boolean(
            runtime &&
            (
                typeof runtime.grantPermission ===
                    "function" ||
                typeof runtime.setPermission ===
                    "function" ||
                typeof runtime.revokePermission ===
                    "function"
            )
        );

    },


    grantPermission(
        organId,
        permission
    ){

        const organ =
            this.findOrgan(
                organId
            );


        const runtime =
            organ?.runtimeOrgan;


        const normalized =
            String(
                permission ||
                ""
            ).trim();


        if(
            !runtime ||
            !normalized
        ){
            return false;
        }


        try{

            if(
                typeof runtime.grantPermission ===
                    "function"
            ){

                const result =
                    runtime.grantPermission(
                        normalized
                    );


                if(result === false){
                    return false;
                }

            } else if(
                typeof runtime.setPermission ===
                    "function"
            ){

                const result =
                    runtime.setPermission(
                        normalized
                    );


                if(result === false){
                    return false;
                }

            } else {

                return false;

            }

        } catch(error){

            console.warn(
                "Organ izni verilemedi:",
                error
            );


            return false;

        }


        this.emitPermissionEvent(
            "granted",
            organ,
            normalized
        );


        return this.remount();

    },


    revokePermission(
        organId,
        permission
    ){

        const organ =
            this.findOrgan(
                organId
            );


        const runtime =
            organ?.runtimeOrgan;


        const normalized =
            String(
                permission ||
                ""
            ).trim();


        if(
            !runtime ||
            !normalized ||
            typeof runtime.revokePermission !==
                "function"
        ){
            return false;
        }


        try{

            const result =
                runtime.revokePermission(
                    normalized
                );


            if(result === false){
                return false;
            }

        } catch(error){

            console.warn(
                "Organ izni kaldırılamadı:",
                error
            );


            return false;

        }


        this.emitPermissionEvent(
            "revoked",
            organ,
            normalized
        );


        return this.remount();

    },


    emitPermissionEvent(
        action,
        organ,
        permission
    ){

        try{

            VAERO?.emit?.(
                `organ:permission-${action}`,
                {
                    organId:
                        organ.id,

                    permission,

                    entityId:
                        this.getCurrentEntity()
                            ?.id ||
                        null,

                    time:
                        Date.now()
                }
            );

        } catch(error){

            /* non-fatal */
        }

    },


    /* =====================================================
       ORGAN OPEN
    ===================================================== */

    openOrgan(organ){

        if(!organ){
            return false;
        }


        if(!organ.action){

            this.selectedOrganId =
                organ.id;


            return this.remount();

        }


        try{

            const trigger =
                document.querySelector(
                    `[data-action="${CSS.escape(
                        organ.action
                    )}"]`
                );


            if(
                trigger &&
                trigger !==
                    document.activeElement
            ){

                trigger.click();

                return true;

            }

        } catch(error){

            /* fall through */
        }


        /*
         * Actions router kullanıyorsa sentetik click
         * mevcut sistem davranışını bozmadan çalışır.
         */

        try{

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.dataset.action =
                organ.action;

            button.style.display =
                "none";


            document.body.appendChild(
                button
            );


            button.click();

            button.remove();


            return true;

        } catch(error){

            console.warn(
                "Organ açılamadı:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       SUMMARY
    ===================================================== */

    getSummary(organs){

        return {

            total:
                organs.length,

            active:
                organs.filter(
                    organ =>
                        organ.status ===
                        "active"
                ).length,

            healthy:
                organs.filter(
                    organ =>
                        organ.health.score >=
                        80
                ).length,

            attention:
                organs.filter(
                    organ =>
                        organ.health.score <
                            80 ||
                        organ.status ===
                            "error" ||
                        organ.status ===
                            "missing"
                ).length

        };

    },


    /* =====================================================
       TOOLBAR
    ===================================================== */

    renderToolbar(){

        const filters = [

            ["all","Tümü"],

            ["active","Aktif"],

            ["attention","Dikkat"],

            ["permissions","İzinli"]

        ];


        return `
            <div class="organs-toolbar">

                <label class="organs-search">

                    <span aria-hidden="true">
                        ⌕
                    </span>

                    <input
                        id="organsSearchInput"
                        type="search"
                        autocomplete="off"
                        placeholder="Organ, capability veya izin ara"
                        value="${this.escapeHTML(
                            this.searchQuery
                        )}"
                    >

                </label>


                <div class="organs-filter-row">

                    ${filters
                        .map(
                            ([id,label]) => `
                                <button
                                    type="button"
                                    class="organs-filter-btn ${
                                        this.activeFilter ===
                                            id
                                            ? "is-active"
                                            : ""
                                    }"
                                    data-organs-action="filter"
                                    data-organs-filter="${id}"
                                >
                                    ${label}
                                </button>
                            `
                        )
                        .join("")}

                </div>

            </div>
        `;

    },


    /* =====================================================
       ORGAN CARD
    ===================================================== */

    renderOrganCard(organ){

        const status =
            this.getStatusPresentation(
                organ.status
            );


        return `
            <article
                class="organ-control-card"
                data-organ-tone="${this.escapeHTML(
                    status.tone
                )}"
            >

                <button
                    type="button"
                    class="organ-control-main"
                    data-organs-action="detail"
                    data-organ-id="${this.escapeHTML(
                        organ.id
                    )}"
                >

                    <span class="organ-control-icon">
                        ${this.escapeHTML(
                            organ.icon
                        )}
                    </span>


                    <span class="organ-control-copy">

                        <span class="organ-control-heading">

                            <strong>
                                ${this.escapeHTML(
                                    organ.title
                                )}
                            </strong>

                            <small>
                                ${this.escapeHTML(
                                    organ.id
                                )}
                            </small>

                        </span>


                        <span class="organ-control-subtitle">
                            ${this.escapeHTML(
                                organ.subtitle
                            )}
                        </span>


                        <span class="organ-control-meta">

                            <small>
                                ${this.escapeHTML(
                                    status.label
                                )}
                            </small>

                            <small>
                                Health ${organ.health.score}%
                            </small>

                            ${
                                organ.total !== null
                                    ? `
                                        <small>
                                            ${organ.total} kayıt
                                        </small>
                                      `
                                    : ""
                            }

                        </span>

                    </span>

                </button>


                <div class="organ-control-actions">

                    ${
                        organ.action
                            ? `
                                <button
                                    type="button"
                                    class="secondary-btn"
                                    data-organs-action="open"
                                    data-organ-id="${this.escapeHTML(
                                        organ.id
                                    )}"
                                >
                                    Aç
                                </button>
                              `
                            : ""
                    }


                    <button
                        type="button"
                        class="secondary-btn"
                        data-organs-action="detail"
                        data-organ-id="${this.escapeHTML(
                            organ.id
                        )}"
                    >
                        İncele
                    </button>

                </div>

            </article>
        `;

    },


    /* =====================================================
       TAG LIST
    ===================================================== */

    renderTagList(
        values,
        emptyText
    ){

        if(
            !Array.isArray(values) ||
            values.length === 0
        ){

            return `
                <span class="organ-detail-empty">
                    ${this.escapeHTML(
                        emptyText
                    )}
                </span>
            `;

        }


        return `
            <div class="organ-detail-tags">

                ${values
                    .map(
                        item => `
                            <span>
                                ${this.escapeHTML(
                                    item
                                )}
                            </span>
                        `
                    )
                    .join("")}

            </div>
        `;

    },


    /* =====================================================
       DETAIL
    ===================================================== */

    renderDetail(organ){

        if(!organ){
            return "";
        }


        const status =
            this.getStatusPresentation(
                organ.status
            );


        const metadataEntries =
            Object.entries(
                organ.metadata ||
                {}
            )
                .filter(
                    ([,value]) =>
                        typeof value !==
                            "object"
                )
                .slice(
                    0,
                    8
                );


        return `
            <div class="organ-detail-layer">

                <div
                    class="organ-detail-backdrop"
                    data-organs-action="close"
                ></div>


                <section
                    class="organ-detail-panel"
                    role="dialog"
                    aria-modal="true"
                >

                    <header class="organ-detail-header">

                        <div class="organ-detail-title">

                            <span class="organ-detail-icon">
                                ${this.escapeHTML(
                                    organ.icon
                                )}
                            </span>


                            <div>

                                <span class="engine-section-label">
                                    ORGAN CONTROL
                                </span>

                                <h2>
                                    ${this.escapeHTML(
                                        organ.title
                                    )}
                                </h2>

                                <small>
                                    ${this.escapeHTML(
                                        organ.id
                                    )}
                                </small>

                            </div>

                        </div>


                        <button
                            type="button"
                            class="engine-icon-btn"
                            data-organs-action="close"
                            aria-label="Kapat"
                        >
                            ×
                        </button>

                    </header>


                    <div class="organ-detail-scroll">

                        <section class="organ-health-card">

                            <div>

                                <span>
                                    Durum
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        status.label
                                    )}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Health
                                </span>

                                <strong>
                                    ${organ.health.score}%
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Health durumu
                                </span>

                                <strong>
                                    ${this.escapeHTML(
                                        organ.health.label
                                    )}
                                </strong>

                            </div>


                            ${
                                organ.total !== null
                                    ? `
                                        <div>

                                            <span>
                                                Kayıt
                                            </span>

                                            <strong>
                                                ${organ.total}
                                            </strong>

                                        </div>
                                      `
                                    : ""
                            }

                        </section>


                        <section class="organ-detail-section">

                            <span class="engine-section-label">
                                CAPABILITIES
                            </span>

                            <h3>
                                Yetenekler
                            </h3>


                            ${this.renderTagList(
                                organ.capabilities,
                                "Bu organ için capability bilgisi tanımlanmamış."
                            )}

                        </section>


                        <section class="organ-detail-section">

                            <span class="engine-section-label">
                                PERMISSIONS
                            </span>

                            <h3>
                                İzinler
                            </h3>


                            ${
                                organ.permissions.length
                                    ? `
                                        <div class="organ-permission-list">

                                            ${organ.permissions
                                                .map(
                                                    permission => `
                                                        <div>

                                                            <span>
                                                                ${this.escapeHTML(
                                                                    permission
                                                                )}
                                                            </span>


                                                            ${
                                                                this.canManagePermissions(
                                                                    organ
                                                                ) &&
                                                                typeof organ
                                                                    .runtimeOrgan
                                                                    ?.revokePermission ===
                                                                    "function"
                                                                    ? `
                                                                        <button
                                                                            type="button"
                                                                            data-organs-action="permission:revoke"
                                                                            data-organ-id="${this.escapeHTML(
                                                                                organ.id
                                                                            )}"
                                                                            data-permission="${this.escapeHTML(
                                                                                permission
                                                                            )}"
                                                                        >
                                                                            Kaldır
                                                                        </button>
                                                                      `
                                                                    : ""
                                                            }

                                                        </div>
                                                    `
                                                )
                                                .join("")}

                                        </div>
                                      `
                                    : `
                                        <span class="organ-detail-empty">
                                            Aktif izin bulunmuyor.
                                        </span>
                                      `
                            }


                            ${
                                this.canManagePermissions(
                                    organ
                                )
                                    ? `
                                        <form
                                            class="organ-permission-form"
                                            data-organ-permission-form
                                            data-organ-id="${this.escapeHTML(
                                                organ.id
                                            )}"
                                        >

                                            <input
                                                type="text"
                                                name="permission"
                                                maxlength="120"
                                                placeholder="permission.name"
                                                required
                                            >

                                            <button
                                                type="submit"
                                                class="secondary-btn"
                                            >
                                                İzin Ver
                                            </button>

                                        </form>
                                      `
                                    : `
                                        <p class="organ-detail-note">
                                            Bu organın mevcut runtime API'si izin değişikliğini desteklemiyor. Arayüz kendi başına izin oluşturmaz.
                                        </p>
                                      `
                            }

                        </section>


                        <section class="organ-detail-section">

                            <span class="engine-section-label">
                                DEPENDENCIES
                            </span>

                            <h3>
                                Bağımlılıklar
                            </h3>


                            ${this.renderTagList(
                                organ.dependencies,
                                "Tanımlı bağımlılık bulunmuyor."
                            )}

                        </section>


                        ${
                            metadataEntries.length
                                ? `
                                    <section class="organ-detail-section">

                                        <span class="engine-section-label">
                                            METADATA
                                        </span>

                                        <h3>
                                            Sistem bilgisi
                                        </h3>


                                        <div class="organ-metadata-list">

                                            ${metadataEntries
                                                .map(
                                                    ([key,value]) => `
                                                        <div>

                                                            <span>
                                                                ${this.escapeHTML(
                                                                    key
                                                                )}
                                                            </span>

                                                            <strong>
                                                                ${this.escapeHTML(
                                                                    value
                                                                )}
                                                            </strong>

                                                        </div>
                                                    `
                                                )
                                                .join("")}

                                        </div>

                                    </section>
                                  `
                                : ""
                        }


                        <div class="organ-security-note">

                            <strong>
                                Yetki sınırı
                            </strong>

                            <p>
                                Buradaki permission bilgileri Engine içi organ politikasını temsil eder. Production yetkilendirmesi Guardian ve backend tarafında ayrıca uygulanmalıdır.
                            </p>

                        </div>

                    </div>


                    <footer class="organ-detail-actions">

                        ${
                            organ.action
                                ? `
                                    <button
                                        type="button"
                                        class="primary-btn"
                                        data-organs-action="open"
                                        data-organ-id="${this.escapeHTML(
                                            organ.id
                                        )}"
                                    >
                                        Organı Aç
                                    </button>
                                  `
                                : ""
                        }


                        <button
                            type="button"
                            class="secondary-btn"
                            data-organs-action="close"
                        >
                            Kapat
                        </button>

                    </footer>

                </section>

            </div>
        `;

    },


    /* =====================================================
       EMPTY
    ===================================================== */

    renderEmpty(){

        return `
            <div class="engine-empty-state organs-empty">

                <strong>
                    ${
                        this.searchQuery ||
                        this.activeFilter !==
                            "all"
                            ? "Eşleşen organ bulunamadı"
                            : "Organ bulunamadı"
                    }
                </strong>

                ${
                    this.searchQuery ||
                    this.activeFilter !==
                        "all"
                        ? "Arama veya filtreyi değiştir."
                        : "Organ Registry kullanılabilir bir Engine organı döndürmedi."
                }

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


        const allOrgans =
            this.getOrgans();


        const organs =
            this.getVisibleOrgans();


        const summary =
            this.getSummary(
                allOrgans
            );


        const selectedOrgan =
            this.selectedOrganId
                ? this.findOrgan(
                    this.selectedOrganId
                )
                : null;


        if(
            this.selectedOrganId &&
            !selectedOrgan
        ){

            this.selectedOrganId =
                null;

        }


        return `
            <section class="engine-page organs-app-page">

                <div class="organs-app-shell">

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
                            entity?.name ||
                            "VAERO Varlığı"
                        ),
                        "ORGANS",
                        "⌘"
                    )}


                    <section class="organs-intro">

                        <div>

                            <span class="engine-section-label">
                                ORGAN CONTROL
                            </span>

                            <h2>
                                Engine organları
                            </h2>

                            <p>
                                Uygulamaları aç, çalışma durumlarını incele ve desteklenen organlarda capabilities, permissions ve dependencies katmanlarını yönet.
                            </p>

                        </div>


                        <div class="organs-summary">

                            <div>

                                <strong>
                                    ${summary.total}
                                </strong>

                                <span>
                                    Organ
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${summary.active}
                                </strong>

                                <span>
                                    Aktif
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${summary.healthy}
                                </strong>

                                <span>
                                    Sağlıklı
                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${summary.attention}
                                </strong>

                                <span>
                                    Dikkat
                                </span>

                            </div>

                        </div>

                    </section>


                    ${this.renderToolbar()}


                    <div class="organs-list-scroll">

                        ${
                            organs.length
                                ? `
                                    <div class="organs-control-grid">

                                        ${organs
                                            .map(
                                                organ =>
                                                    this.renderOrganCard(
                                                        organ
                                                    )
                                            )
                                            .join("")}

                                    </div>
                                  `
                                : this.renderEmpty()
                        }

                    </div>


                    ${UI.brainPanel()}

                </div>


                ${this.renderDetail(
                    selectedOrgan
                )}

            </section>
        `;

    },


    /* =====================================================
       COMMANDS
    ===================================================== */

    handleAction(
        action,
        element
    ){

        switch(action){

            case "filter":

                this.activeFilter =
                    [
                        "all",
                        "active",
                        "attention",
                        "permissions"
                    ].includes(
                        element.dataset
                            .organsFilter
                    )
                        ? element.dataset
                            .organsFilter
                        : "all";


                this.selectedOrganId =
                    null;


                return this.remount();


            case "detail":

                return this.selectOrgan(
                    element.dataset
                        .organId
                );


            case "close":

                return this.closeOrgan();


            case "open":{

                const organ =
                    this.findOrgan(
                        element.dataset
                            .organId
                    );


                return this.openOrgan(
                    organ
                );

            }


            case "permission:revoke":

                return this.revokePermission(
                    element.dataset
                        .organId,
                    element.dataset
                        .permission
                );

        }


        return false;

    }

};


/* =========================================================
   ORGAN COMMANDS
========================================================= */

document.addEventListener(
    "click",
    event => {

        const element =
            event.target.closest(
                "[data-organs-action]"
            );


        if(!element){
            return;
        }


        event.preventDefault();


        OrgansApp.handleAction(
            element.dataset
                .organsAction,
            element
        );

    }
);


/* =========================================================
   ORGAN SEARCH
========================================================= */

document.addEventListener(
    "input",
    event => {

        if(
            event.target.id !==
                "organsSearchInput"
        ){
            return;
        }


        OrgansApp.searchQuery =
            String(
                event.target.value ||
                ""
            );


        clearTimeout(
            OrgansApp.searchTimer
        );


        OrgansApp.searchTimer =
            setTimeout(
                () => {

                    OrgansApp.selectedOrganId =
                        null;

                    OrgansApp.remount();

                },
                120
            );

    }
);


/* =========================================================
   ORGAN PERMISSION FORM
========================================================= */

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target.closest(
                "[data-organ-permission-form]"
            );


        if(!form){
            return;
        }


        event.preventDefault();


        const permission =
            String(
                new FormData(
                    form
                ).get(
                    "permission"
                ) ||
                ""
            ).trim();


        if(!permission){
            return;
        }


        OrgansApp.grantPermission(
            form.dataset
                .organId,
            permission
        );

    }
);


window.OrgansApp =
    OrgansApp;
