/* =========================================================
   VAERO BRAIN APP
   Brain Interaction Surface

   UI authority only.

   Intelligence:
   Brain
   BrainService
   BrainCore
   BrainContext
   BrainAwareness
   BrainIntent
   BrainActionPolicy
   BrainActions
   BrainSkills
   BrainMode
   BrainProvider
========================================================= */

const BrainApp = {

    busy:
        false,


    /* =====================================================
       SERVICE ACCESS
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

            return null;

        }

    },


    /* =====================================================
       ENGINE ACCESS
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


    /* =====================================================
       UI ACCESS
    ===================================================== */

    getUI(){

        return (
            window.UI ||
            null
        );

    },


    /* =====================================================
       SAFE TEXT
    ===================================================== */

    escapeHTML(value){

        const ui =
            this.getUI();


        if(
            ui &&
            typeof ui.escapeHTML ===
                "function"
        ){

            return ui.escapeHTML(
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


    normalizeRole(value){

        const role =
            String(
                value ||
                "brain"
            )
                .trim()
                .toLowerCase();


        return [
            "brain",
            "user",
            "system",
            "assistant"
        ].includes(
            role
        )
            ? role
            : "brain";

    },


    normalizeText(
        value,
        maxLength = 4000
    ){

        return String(
            value ??
            ""
        )
            .trim()
            .slice(
                0,
                maxLength
            );

    },


    /* =====================================================
       BRAIN SERVICE
    ===================================================== */

    getBrainService(){

        return (
            this.getService(
                "brainService"
            ) ||
            window.BrainService ||
            null
        );

    },


    /* =====================================================
       CONTEXT
    ===================================================== */

    getContext(){

        const service =
            this.getBrainService();


        try{

            if(
                service &&
                typeof service.compactContext ===
                    "function"
            ){

                const result =
                    service.compactContext();


                if(
                    result &&
                    typeof result ===
                        "object"
                ){

                    return result;

                }

            }

        } catch(error){

            /* context fallback */

        }


        const context =
            this.getService(
                "brainContext"
            );


        try{

            const result =
                context?.compact?.();


            return (
                result &&
                typeof result ===
                    "object"
                    ? result
                    : {}
            );

        } catch(error){

            return {};

        }

    },


    /* =====================================================
       STATUS
    ===================================================== */

    getStatus(){

        const service =
            this.getBrainService();


        try{

            if(
                service &&
                typeof service.status ===
                    "function"
            ){

                const result =
                    service.status();


                return (
                    result &&
                    typeof result ===
                        "object"
                        ? result
                        : {}
                );

            }

        } catch(error){

            /* status unavailable */

        }


        return {};

    },


    /* =====================================================
       MODE
    ===================================================== */

    normalizeMode(value){

        const mode =
            String(
                value ||
                "silent"
            )
                .trim()
                .toLowerCase();


        return [
            "active",
            "balanced",
            "silent"
        ].includes(
            mode
        )
            ? mode
            : "silent";

    },


    getMode(){

        const service =
            this.getBrainService();


        try{

            const result =
                service?.getMode?.();


            if(result){

                if(
                    typeof result ===
                        "string"
                ){

                    return {
                        mode:
                            this.normalizeMode(
                                result
                            )
                    };

                }


                if(
                    typeof result ===
                        "object"
                ){

                    return {
                        ...result,

                        mode:
                            this.normalizeMode(
                                result.mode
                            )
                    };

                }

            }

        } catch(error){

            /* fallback */

        }


        const mode =
            this.getService(
                "brainMode"
            );


        try{

            const snapshot =
                mode?.snapshot?.();


            if(
                snapshot &&
                typeof snapshot ===
                    "object"
            ){

                return {
                    ...snapshot,

                    mode:
                        this.normalizeMode(
                            snapshot.mode
                        )
                };

            }

        } catch(error){

            /* fallback */

        }


        return {
            mode:
                "silent"
        };

    },


    /* =====================================================
       CONFIRMATION
    ===================================================== */

    getPendingConfirmation(){

        const service =
            this.getBrainService();


        try{

            if(
                service &&
                typeof service.getConfirmation ===
                    "function"
            ){

                return (
                    service.getConfirmation() ||
                    null
                );

            }

        } catch(error){

            return null;

        }


        return null;

    },


    /* =====================================================
       CONTEXT LABEL
    ===================================================== */

    buildContextLabel(context = {}){

        const parts =
            [];


        const app =
            this.normalizeText(
                context?.app,
                80
            );


        const entityName =
            this.normalizeText(
                context?.entity
                    ?.name,
                100
            );


        const worldName =
            this.normalizeText(
                context?.world
                    ?.name,
                100
            );


        if(
            app &&
            app !==
                "home"
        ){

            parts.push(
                app
            );

        }


        if(entityName){

            parts.push(
                entityName
            );

        }


        if(worldName){

            parts.push(
                worldName
            );

        }


        if(
            parts.length ===
                0
        ){

            return (
                context.engineReady ===
                    false
                    ? "Engine bağlamı hazırlanıyor."
                    : "Engine genel bağlamı aktif."
            );

        }


        return (
            parts.join(
                " • "
            ) +
            " bağlamı aktif."
        );

    },


    /* =====================================================
       MODE LABEL
    ===================================================== */

    buildModeLabel(mode = {}){

        switch(
            this.normalizeMode(
                mode?.mode
            )
        ){

            case "active":

                return "Aktif";


            case "balanced":

                return "Dengeli";


            case "silent":
            default:

                return "Sessiz";

        }

    },


    /* =====================================================
       PROVIDER
    ===================================================== */

    getProviderSnapshot(status = {}){

        const provider =
            status?.provider ||
            status?.brain
                ?.provider ||
            null;


        if(!provider){

            return {
                connected:
                    false,

                external:
                    false,

                name:
                    "Local Brain"
            };

        }


        if(
            typeof provider ===
                "string"
        ){

            return {
                connected:
                    true,

                external:
                    false,

                name:
                    provider
            };

        }


        if(
            typeof provider ===
                "object"
        ){

            return {
                connected:
                    provider.connected !==
                        false,

                external:
                    provider.externalAI ===
                        true,

                name:
                    this.normalizeText(
                        provider.name ||
                        provider.id ||
                        (
                            provider.externalAI
                                ? "AI Provider"
                                : "Local Brain"
                        ),
                        100
                    )
            };

        }


        return {
            connected:
                false,

            external:
                false,

            name:
                "Local Brain"
        };

    },


    buildProviderLabel(status = {}){

        return this
            .getProviderSnapshot(
                status
            )
            .name;

    },


    /* =====================================================
       STATUS BADGE
    ===================================================== */

    renderStatusBadge(status = {}){

        const ui =
            this.getUI();


        const brainStatus =
            (
                status?.brain &&
                typeof status.brain ===
                    "object"
            )
                ? status.brain
                : {};


        const provider =
            this.getProviderSnapshot(
                status
            );


        const pendingConfirmations =
            Number(
                brainStatus
                    .pendingConfirmations
            ) ||
            (
                status
                    ?.pendingConfirmation
                    ? 1
                    : 0
            );


        if(
            ui &&
            typeof ui.brainStatusBadge ===
                "function"
        ){

            try{

                return (
                    ui.brainStatusBadge({
                        providerConnected:
                            Boolean(
                                brainStatus
                                    .providerConnected ??
                                provider.connected
                            ),

                        pendingConfirmations:
                            Math.max(
                                0,
                                pendingConfirmations
                            )
                    }) ||
                    ""
                );

            } catch(error){

                /* fallback */

            }

        }


        const state =
            provider.connected
                ? "Hazır"
                : "Yerel";


        return `
            <span class="brain-status-fallback">
                ${this.escapeHTML(
                    state
                )}
            </span>
        `;

    },


    /* =====================================================
       CONFIRMATION UI
    ===================================================== */

    renderConfirmation(
        confirmation
    ){

        if(!confirmation){

            return "";

        }


        const ui =
            this.getUI();


        if(
            ui &&
            typeof ui.brainConfirmationCard ===
                "function"
        ){

            try{

                return (
                    ui.brainConfirmationCard(
                        confirmation,
                        {
                            title:
                                "İşlem onayı",

                            message:
                                "Brain bu işlemi uygulamadan önce senden açık onay bekliyor."
                        }
                    ) ||
                    ""
                );

            } catch(error){

                /* safe fallback below */

            }

        }


        const title =
            this.normalizeText(
                confirmation?.title ||
                confirmation?.action ||
                "İşlem onayı",
                140
            );


        const description =
            this.normalizeText(
                confirmation?.description ||
                confirmation?.message ||
                "Brain bu işlemi uygulamadan önce açık onay bekliyor.",
                500
            );


        return `
            <div class="brain-confirmation-card">

                <strong>
                    ${this.escapeHTML(
                        title
                    )}
                </strong>


                <p>
                    ${this.escapeHTML(
                        description
                    )}
                </p>

            </div>
        `;

    },


    /* =====================================================
       INITIAL SUGGESTION
    ===================================================== */

    buildInitialSuggestion(
        context = {},
        mode = {}
    ){

        const currentMode =
            this.normalizeMode(
                mode?.mode
            );


        const app =
            this.normalizeText(
                context?.app,
                80
            );


        const entityName =
            this.normalizeText(
                context?.entity
                    ?.name,
                100
            );


        const worldName =
            this.normalizeText(
                context?.world
                    ?.name,
                100
            );


        if(
            currentMode ===
                "active"
        ){

            if(
                app ===
                    "applications"
            ){

                return (
                    "Uygulamaları inceleyebilir, yüklü olanları açabilir veya izin durumlarını sorabilirsin."
                );

            }


            if(entityName){

                return (
                    `${entityName} bağlamındayım. ` +
                    "Bu varlık hakkında soru sorabilir veya Engine içindeki ilgili işlemi yazabilirsin."
                );

            }


            if(worldName){

                return (
                    `${worldName} aktif. ` +
                    "Bu World bağlamında ne yapmak istediğini yazabilirsin."
                );

            }

        }


        if(
            currentMode ===
                "balanced"
        ){

            return (
                "Bir şey sorabilir veya Engine içinde yapmak istediğin işlemi yazabilirsin."
            );

        }


        return (
            "Bir komut verebilir veya ne yapmak istediğini yazabilirsin."
        );

    },


    /* =====================================================
       RENDER
    ===================================================== */

    render(){

        const context =
            this.getContext();


        const status =
            this.getStatus();


        const mode =
            this.getMode();


        const confirmation =
            this.getPendingConfirmation();


        const contextLabel =
            this.buildContextLabel(
                context
            );


        const modeLabel =
            this.buildModeLabel(
                mode
            );


        const providerLabel =
            this.buildProviderLabel(
                status
            );


        const suggestion =
            this.buildInitialSuggestion(
                context,
                mode
            );


        const statusBadge =
            this.renderStatusBadge(
                status
            );


        const confirmationUI =
            this.renderConfirmation(
                confirmation
            );


        return `
            <section
                id="brainPanel"
                class="brain-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="brainPanelTitle"
                aria-describedby="brainContextText"
                data-brain-region="panel"
                data-brain-mode="${this.escapeHTML(
                    this.normalizeMode(
                        mode?.mode
                    )
                )}"
                data-brain-app="${this.escapeHTML(
                    context?.app ||
                    "home"
                )}"
                data-brain-busy="${
                    this.busy
                        ? "true"
                        : "false"
                }"
            >

                <div
                    class="brain-panel-handle"
                    aria-hidden="true"
                ></div>


                <header
                    class="brain-panel-header"
                    data-brain-region="header"
                >

                    <div class="brain-panel-heading">

                        <div class="brain-panel-identity">

                            <span
                                class="brain-status-orb"
                                aria-hidden="true"
                            >
                                <span class="brain-status-core"></span>
                            </span>


                            <div class="brain-panel-title-group">

                                <div class="brain-panel-eyebrow-row">

                                    <span class="eyebrow">
                                        VAERO BRAIN
                                    </span>


                                    <div
                                        id="brainStatusBadge"
                                        class="brain-status-badge-slot"
                                    >
                                        ${statusBadge}
                                    </div>

                                </div>


                                <h2
                                    id="brainPanelTitle"
                                    class="brain-title"
                                >
                                    Birlikte düşünelim.
                                </h2>


                                <div class="brain-runtime-meta">

                                    <span
                                        id="brainModeLabel"
                                        class="brain-runtime-meta-item"
                                    >
                                        ${this.escapeHTML(
                                            modeLabel
                                        )}
                                    </span>


                                    <span aria-hidden="true">
                                        •
                                    </span>


                                    <span
                                        id="brainProviderLabel"
                                        class="brain-runtime-meta-item"
                                    >
                                        ${this.escapeHTML(
                                            providerLabel
                                        )}
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="brain-close"
                        data-action="brain:close"
                        aria-label="Brain panelini kapat"
                    >
                        <span aria-hidden="true">
                            ×
                        </span>
                    </button>

                </header>


                <div
                    class="brain-awareness"
                    data-brain-region="awareness"
                >

                    <div
                        class="brain-awareness-indicator"
                        aria-hidden="true"
                    >
                        <span></span>
                    </div>


                    <p
                        id="brainContextText"
                        class="brain-context"
                    >
                        ${this.escapeHTML(
                            contextLabel
                        )}
                    </p>

                </div>


                <div
                    id="brainSuggestion"
                    class="brain-suggestion"
                    data-brain-region="suggestion"
                    aria-live="polite"
                >
                    ${this.escapeHTML(
                        suggestion
                    )}
                </div>


                <div
                    id="brainConfirmationRegion"
                    class="brain-confirmation-region ${
                        confirmation
                            ? "is-active"
                            : ""
                    }"
                    data-brain-region="confirmation"
                    aria-live="assertive"
                >
                    ${confirmationUI}
                </div>


                <div
                    id="brainMiniHistory"
                    class="brain-mini-history"
                    data-brain-region="mini-history"
                    aria-label="Son Brain mesajları"
                ></div>


                <div
                    id="brainHistory"
                    class="brain-history"
                    data-brain-region="history"
                    aria-live="polite"
                    aria-relevant="additions text"
                    aria-label="Brain sohbet geçmişi"
                    tabindex="0"
                ></div>


                <div
                    id="brainRuntimeState"
                    class="brain-runtime-state"
                    data-brain-region="runtime-state"
                    aria-live="polite"
                    ${
                        this.busy
                            ? ""
                            : "hidden"
                    }
                >

                    <span
                        class="brain-runtime-state-orb"
                        aria-hidden="true"
                    ></span>


                    <span id="brainRuntimeStateText">
                        Brain düşünüyor...
                    </span>

                </div>


                <div
                    class="brain-composer-shell"
                    data-brain-region="composer"
                >

                    <div class="brain-composer">

                        <input
                            id="brainInput"
                            class="brain-input"
                            type="text"
                            maxlength="1000"
                            placeholder="Brain’e yaz..."
                            autocomplete="off"
                            autocapitalize="sentences"
                            enterkeyhint="send"
                            spellcheck="true"
                            aria-label="Brain mesajı"
                            ${
                                this.busy
                                    ? "disabled"
                                    : ""
                            }
                        >


                        <button
                            type="button"
                            class="brain-send"
                            data-action="brain:send"
                            aria-label="Mesajı gönder"
                            ${
                                this.busy
                                    ? "disabled"
                                    : ""
                            }
                        >
                            <span aria-hidden="true">
                                →
                            </span>
                        </button>

                    </div>


                    <div class="brain-composer-meta">

                        <small class="brain-input-hint">
                            Enter ile gönder
                        </small>


                        <span
                            class="brain-privacy-hint"
                            aria-label="Brain bağlam göstergesi"
                        >

                            <span aria-hidden="true">
                                ◉
                            </span>

                            Bağlama duyarlı

                        </span>

                    </div>

                </div>

            </section>
        `;

    },

   /* =====================================================
       DOM HELPERS
    ===================================================== */

    getPanel(){

        return document.getElementById(
            "brainPanel"
        );

    },


    getHistoryElement(){

        return document.getElementById(
            "brainHistory"
        );

    },


    getMiniHistoryElement(){

        return document.getElementById(
            "brainMiniHistory"
        );

    },


    getSuggestionElement(){

        return document.getElementById(
            "brainSuggestion"
        );

    },


    getContextElement(){

        return document.getElementById(
            "brainContextText"
        );

    },


    getConfirmationElement(){

        return document.getElementById(
            "brainConfirmationRegion"
        );

    },


    getInputElement(){

        return document.getElementById(
            "brainInput"
        );

    },


    getSendButton(){

        const panel =
            this.getPanel();


        return (
            panel?.querySelector(
                '[data-action="brain:send"]'
            ) ||
            null
        );

    },


    /* =====================================================
       RUNTIME STATE
    ===================================================== */

    setBusy(
        busy,
        message = "Brain düşünüyor..."
    ){

        this.busy =
            Boolean(
                busy
            );


        const state =
            document.getElementById(
                "brainRuntimeState"
            );


        const text =
            document.getElementById(
                "brainRuntimeStateText"
            );


        const input =
            this.getInputElement();


        const send =
            this.getSendButton();


        if(state){

            state.hidden =
                !this.busy;

        }


        if(text){

            text.textContent =
                this.normalizeText(
                    message ||
                    "Brain düşünüyor...",
                    240
                ) ||
                "Brain düşünüyor...";

        }


        if(input){

            input.disabled =
                this.busy;

        }


        if(send){

            send.disabled =
                this.busy;

        }


        const panel =
            this.getPanel();


        if(panel){

            panel.classList.toggle(
                "is-busy",
                this.busy
            );


            panel.dataset.brainBusy =
                this.busy
                    ? "true"
                    : "false";

        }


        return true;

    },


    /* =====================================================
       SUGGESTION
    ===================================================== */

    setSuggestion(text){

        const element =
            this.getSuggestionElement();


        if(!element){

            return false;

        }


        element.textContent =
            this.normalizeText(
                text,
                800
            );


        return true;

    },


    /* =====================================================
       REFRESH CONTEXT
    ===================================================== */

    refreshContext(){

        const context =
            this.getContext();


        const element =
            this.getContextElement();


        if(element){

            element.textContent =
                this.buildContextLabel(
                    context
                );

        }


        const panel =
            this.getPanel();


        if(panel){

            panel.dataset.brainApp =
                this.normalizeText(
                    context?.app ||
                    "home",
                    80
                ) ||
                "home";

        }


        return context;

    },


    /* =====================================================
       REFRESH STATUS
    ===================================================== */

    refreshStatus(){

        const status =
            this.getStatus();


        const mode =
            this.getMode();


        const badge =
            document.getElementById(
                "brainStatusBadge"
            );


        const modeElement =
            document.getElementById(
                "brainModeLabel"
            );


        const providerElement =
            document.getElementById(
                "brainProviderLabel"
            );


        if(badge){

            badge.innerHTML =
                this.renderStatusBadge(
                    status
                );

        }


        if(modeElement){

            modeElement.textContent =
                this.buildModeLabel(
                    mode
                );

        }


        if(providerElement){

            providerElement.textContent =
                this.buildProviderLabel(
                    status
                );

        }


        const panel =
            this.getPanel();


        if(panel){

            panel.dataset.brainMode =
                this.normalizeMode(
                    mode?.mode
                );

        }


        return status;

    },


    /* =====================================================
       REFRESH CONFIRMATION
    ===================================================== */

    refreshConfirmation(
        confirmation = undefined
    ){

        const region =
            this.getConfirmationElement();


        if(!region){

            return false;

        }


        const pending =
            confirmation ===
                undefined
                ? this.getPendingConfirmation()
                : confirmation;


        region.innerHTML =
            pending
                ? this.renderConfirmation(
                    pending
                )
                : "";


        region.classList.toggle(
            "is-active",
            Boolean(
                pending
            )
        );


        this.refreshStatus();


        return true;

    },


    /* =====================================================
       MESSAGE NORMALIZATION
    ===================================================== */

    normalizeMessageEntry(entry){

        if(
            typeof entry ===
                "string"
        ){

            return {
                role:
                    "brain",

                text:
                    this.normalizeText(
                        entry
                    ),

                meta:
                    null
            };

        }


        if(
            !entry ||
            typeof entry !==
                "object"
        ){

            return null;

        }


        const role =
            this.normalizeRole(
                entry.role ||
                entry.type ||
                (
                    entry.user ===
                        true
                        ? "user"
                        : "brain"
                )
            );


        const text =
            this.normalizeText(
                entry.message ??
                entry.reply ??
                entry.content ??
                entry.text ??
                ""
            );


        if(!text){

            return null;

        }


        return {
            role,

            text,

            meta:
                entry.meta ??
                null
        };

    },


    /* =====================================================
       MESSAGE RENDERING
    ===================================================== */

    appendMessage(
        message,
        {
            role = "brain",
            meta = null
        } = {}
    ){

        const history =
            this.getHistoryElement();


        if(!history){

            return false;

        }


        const text =
            this.normalizeText(
                message
            );


        if(!text){

            return false;

        }


        const safeRole =
            this.normalizeRole(
                role
            );


        const ui =
            this.getUI();


        let html =
            "";


        if(
            ui &&
            typeof ui.brainMessage ===
                "function"
        ){

            try{

                html =
                    ui.brainMessage(
                        text,
                        {
                            role:
                                safeRole,

                            meta
                        }
                    ) ||
                    "";

            } catch(error){

                html =
                    "";

            }

        }


        if(!html){

            html = `
                <div
                    class="ui-brain-message is-${this.escapeHTML(
                        safeRole
                    )}"
                    data-brain-message-role="${this.escapeHTML(
                        safeRole
                    )}"
                >
                    ${this.escapeHTML(
                        text
                    )}
                </div>
            `;

        }


        history.insertAdjacentHTML(
            "beforeend",
            html
        );


        history.scrollTop =
            history.scrollHeight;


        return true;

    },


    renderHistory(entries = []){

        const history =
            this.getHistoryElement();


        if(!history){

            return false;

        }


        if(
            !Array.isArray(
                entries
            )
        ){

            history.innerHTML =
                "";


            return false;

        }


        history.innerHTML =
            "";


        entries.forEach(
            entry => {

                const normalized =
                    this.normalizeMessageEntry(
                        entry
                    );


                if(!normalized){

                    return;

                }


                this.appendMessage(
                    normalized.text,
                    {
                        role:
                            normalized.role,

                        meta:
                            normalized.meta
                    }
                );

            }
        );


        return true;

    },


    clearHistory(){

        const history =
            this.getHistoryElement();


        if(!history){

            return false;

        }


        history.innerHTML =
            "";


        return true;

    },


    /* =====================================================
       MINI HISTORY
    ===================================================== */

    renderMiniHistory(
        entries = []
    ){

        const element =
            this.getMiniHistoryElement();


        if(!element){

            return false;

        }


        if(
            !Array.isArray(
                entries
            ) ||
            entries.length ===
                0
        ){

            element.innerHTML =
                "";


            return true;

        }


        const normalized =
            entries
                .map(
                    entry =>
                        this.normalizeMessageEntry(
                            entry
                        )
                )
                .filter(Boolean)
                .slice(
                    -3
                );


        element.innerHTML =
            normalized
                .map(
                    entry => `
                        <div
                            class="brain-mini-history-item"
                            data-role="${this.escapeHTML(
                                entry.role
                            )}"
                        >
                            ${this.escapeHTML(
                                entry.text
                            )}
                        </div>
                    `
                )
                .join("");


        return true;

    },


    /* =====================================================
       FOCUS
    ===================================================== */

    focusInput(){

        const input =
            this.getInputElement();


        if(
            !input ||
            input.disabled
        ){

            return false;

        }


        try{

            input.focus();


            return true;

        } catch(error){

            return false;

        }

    },


    /* =====================================================
       INPUT
    ===================================================== */

    getInputValue(){

        const input =
            this.getInputElement();


        if(!input){

            return "";

        }


        return this.normalizeText(
            input.value,
            1000
        );

    },


    clearInput(){

        const input =
            this.getInputElement();


        if(!input){

            return false;

        }


        input.value =
            "";


        return true;

    },


    /* =====================================================
       OPEN STATE
    ===================================================== */

    onOpen(){

        this.refresh();


        requestAnimationFrame(
            () => {

                this.focusInput();

            }
        );


        return true;

    },


    /* =====================================================
       REFRESH
    ===================================================== */

    refresh(){

        const context =
            this.refreshContext();


        const status =
            this.refreshStatus();


        this.refreshConfirmation();


        const mode =
            this.getMode();


        this.setSuggestion(
            this.buildInitialSuggestion(
                context,
                mode
            )
        );


        return {
            context,
            status,
            mode
        };

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
            "brainApp",
            BrainApp
        );

    }

} catch(error){

    /* global remains available */

}


window.BrainApp =
    BrainApp;
