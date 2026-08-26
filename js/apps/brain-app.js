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

    /* =====================================================
       SERVICE ACCESS
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
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
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

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

                return (
                    service.compactContext() ||
                    {}
                );

            }

        } catch(error){

            /* fallback */
        }


        const context =
            this.getService(
                "brainContext"
            );


        try{

            return (
                context?.compact?.() ||
                {}
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

                return (
                    service.status() ||
                    {}
                );

            }

        } catch(error){

            /* fallback */
        }


        return {};

    },


    /* =====================================================
       MODE
    ===================================================== */

    getMode(){

        const service =
            this.getBrainService();


        try{

            const result =
                service?.getMode?.();


            if(result){
                return result;
            }

        } catch(error){

            /* fallback */
        }


        const mode =
            this.getService(
                "brainMode"
            );


        try{

            return (
                mode?.snapshot?.() ||
                {
                    mode:"silent"
                }
            );

        } catch(error){

            return {
                mode:"silent"
            };

        }

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

        const parts = [];


        if(
            context.app &&
            context.app !== "home"
        ){

            parts.push(
                String(
                    context.app
                )
            );

        }


        if(
            context.entity?.name
        ){

            parts.push(
                context.entity.name
            );

        }


        if(
            context.world?.name
        ){

            parts.push(
                context.world.name
            );

        }


        if(
            parts.length === 0
        ){

            return (
                context.engineReady === false
                    ? "Engine bağlamı hazırlanıyor."
                    : "Engine genel bağlamı aktif."
            );

        }


        return (
            parts.join(" • ") +
            " bağlamı aktif."
        );

    },


    /* =====================================================
       MODE LABEL
    ===================================================== */

    buildModeLabel(mode = {}){

        switch(
            mode.mode
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
       PROVIDER LABEL
    ===================================================== */

    buildProviderLabel(status = {}){

        const provider =
            status.provider ||
            status.brain?.provider ||
            null;


        if(
            provider?.externalAI ===
                true
        ){

            return (
                provider.name ||
                "AI Provider"
            );

        }


        if(provider){

            return (
                provider.name ||
                "Local Brain"
            );

        }


        return "Local Brain";

    },


    /* =====================================================
       STATUS BADGE
    ===================================================== */

    renderStatusBadge(status = {}){

        const ui =
            this.getUI();


        const brainStatus =
            status.brain ||
            {};


        if(
            ui &&
            typeof ui.brainStatusBadge ===
                "function"
        ){

            return ui.brainStatusBadge({

                providerConnected:
                    Boolean(
                        brainStatus
                            .providerConnected
                    ),

                pendingConfirmations:
                    Number(
                        brainStatus
                            .pendingConfirmations
                    ) ||
                    (
                        status
                            .pendingConfirmation
                            ? 1
                            : 0
                    )

            });

        }


        return "";

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
            typeof ui
                .brainConfirmationCard ===
                "function"
        ){

            return ui.brainConfirmationCard(
                confirmation,
                {

                    title:
                        "İşlem onayı",

                    message:
                        "Brain bu işlemi uygulamadan önce senden açık onay bekliyor."

                }
            );

        }


        return "";

    },


    /* =====================================================
       INITIAL SUGGESTION
    ===================================================== */

    buildInitialSuggestion(
        context,
        mode
    ){

        if(
            mode?.mode ===
                "active"
        ){

            if(
                context?.app ===
                    "applications"
            ){

                return (
                    "Uygulamaları inceleyebilir, " +
                    "yüklü olanları açabilir veya izin durumlarını sorabilirsin."
                );

            }


            if(
                context?.entity?.name
            ){

                return (
                    `${context.entity.name} bağlamındayım. ` +
                    "Bu Entity hakkında soru sorabilir veya ilgili uygulamaları açmamı isteyebilirsin."
                );

            }


            if(
                context?.world?.name
            ){

                return (
                    `${context.world.name} aktif. ` +
                    "World içindeki yapılarla ilgili ne yapmak istediğini yazabilirsin."
                );

            }

        }


        if(
            mode?.mode ===
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
                    mode?.mode ||
                    "silent"
                )}"
                data-brain-app="${this.escapeHTML(
                    context?.app ||
                    "home"
                )}"
            >

                <!-- =====================================
                     MOBILE HANDLE
                ====================================== -->

                <div
                    class="brain-panel-handle"
                    aria-hidden="true"
                ></div>


                <!-- =====================================
                     HEADER
                ====================================== -->

                <header
                    class="brain-panel-header"
                    data-brain-region="header"
                >

                    <div
                        class="brain-panel-heading"
                    >

                        <div
                            class="brain-panel-identity"
                        >

                            <span
                                class="brain-status-orb"
                                aria-hidden="true"
                            >
                                <span
                                    class="brain-status-core"
                                ></span>
                            </span>


                            <div
                                class="brain-panel-title-group"
                            >

                                <div
                                    class="brain-panel-eyebrow-row"
                                >

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


                                <div
                                    class="brain-runtime-meta"
                                >

                                    <span
                                        id="brainModeLabel"
                                        class="brain-runtime-meta-item"
                                    >
                                        ${this.escapeHTML(
                                            modeLabel
                                        )}
                                    </span>

                                    <span
                                        aria-hidden="true"
                                    >
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


                <!-- =====================================
                     AWARENESS / CONTEXT
                ====================================== -->

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


                <!-- =====================================
                     ACTIVE SUGGESTION
                ====================================== -->

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


                <!-- =====================================
                     CONFIRMATION REGION

                     Tek-use confirmationId burada
                     kullanıcıya gösterilir.
                ====================================== -->

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


                <!-- =====================================
                     MINI HISTORY / CONTEXT TRACE
                ====================================== -->

                <div
                    id="brainMiniHistory"
                    class="brain-mini-history"
                    data-brain-region="mini-history"
                    aria-label="Son Brain mesajları"
                ></div>


                <!-- =====================================
                     CONVERSATION
                ====================================== -->

                <div
                    id="brainHistory"
                    class="brain-history"
                    data-brain-region="history"
                    aria-live="polite"
                    aria-relevant="additions text"
                    aria-label="Brain sohbet geçmişi"
                    tabindex="0"
                ></div>


                <!-- =====================================
                     BUSY / SYSTEM STATE
                ====================================== -->

                <div
                    id="brainRuntimeState"
                    class="brain-runtime-state"
                    data-brain-region="runtime-state"
                    aria-live="polite"
                    hidden
                >
                    <span
                        class="brain-runtime-state-orb"
                        aria-hidden="true"
                    ></span>

                    <span
                        id="brainRuntimeStateText"
                    >
                        Brain düşünüyor...
                    </span>
                </div>


                <!-- =====================================
                     COMPOSER
                ====================================== -->

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
                        >


                        <button
                            type="button"
                            class="brain-send"
                            data-action="brain:send"
                            aria-label="Mesajı gönder"
                        >
                            <span aria-hidden="true">
                                →
                            </span>
                        </button>

                    </div>


                    <div
                        class="brain-composer-meta"
                    >

                        <small
                            class="brain-input-hint"
                        >
                            Enter ile gönder
                        </small>


                        <span
                            class="brain-privacy-hint"
                            aria-label="Brain bağlam göstergesi"
                        >

                            <span
                                aria-hidden="true"
                            >
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


    /* =====================================================
       RUNTIME STATE
    ===================================================== */

    setBusy(
        busy,
        message = "Brain düşünüyor..."
    ){

        const state =
            document.getElementById(
                "brainRuntimeState"
            );


        const text =
            document.getElementById(
                "brainRuntimeStateText"
            );


        const input =
            document.getElementById(
                "brainInput"
            );


        const send =
            document.querySelector(
                '#brainPanel [data-action="brain:send"]'
            );


        if(state){

            state.hidden =
                !busy;

        }


        if(text){

            text.textContent =
                String(
                    message ||
                    "Brain düşünüyor..."
                );

        }


        if(input){

            input.disabled =
                Boolean(
                    busy
                );

        }


        if(send){

            send.disabled =
                Boolean(
                    busy
                );

        }


        const panel =
            this.getPanel();


        if(panel){

            panel.classList.toggle(
                "is-busy",
                Boolean(
                    busy
                )
            );

        }


        return true;

    },


    /* =====================================================
       SET SUGGESTION
    ===================================================== */

    setSuggestion(text){

        const element =
            this.getSuggestionElement();


        if(!element){
            return false;
        }


        element.textContent =
            String(
                text ||
                ""
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
                String(
                    context?.app ||
                    "home"
                );

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
                String(
                    mode?.mode ||
                    "silent"
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


        const ui =
            this.getUI();


        let html =
            "";


        if(
            ui &&
            typeof ui.brainMessage ===
                "function"
        ){

            html =
                ui.brainMessage(
                    message,
                    {
                        role,
                        meta
                    }
                );

        } else {

            html = `
                <div class="ui-brain-message is-${this.escapeHTML(role)}">
                    ${this.escapeHTML(message)}
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
            !Array.isArray(entries) ||
            entries.length === 0
        ){

            element.innerHTML =
                "";

            return true;

        }


        element.innerHTML =
            entries
                .slice(-3)
                .map(
                    entry => {

                        const role =
                            entry.role ||
                            entry.type ||
                            "brain";


                        const text =
                            entry.message ||
                            entry.reply ||
                            entry.content ||
                            "";


                        return `
                            <div
                                class="brain-mini-history-item"
                                data-role="${this.escapeHTML(
                                    role
                                )}"
                            >
                                ${this.escapeHTML(
                                    text
                                )}
                            </div>
                        `;

                    }
                )
                .join("");


        return true;

    },


    /* =====================================================
       FOCUS
    ===================================================== */

    focusInput(){

        const input =
            document.getElementById(
                "brainInput"
            );


        if(!input){
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
       REFRESH
    ===================================================== */

    refresh(){

        this.refreshContext();

        this.refreshStatus();

        this.refreshConfirmation();


        return true;

    }

};


window.BrainApp =
    BrainApp;
