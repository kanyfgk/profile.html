/* =========================================================
   VAERO BRAIN APP
   Final Interaction Surface

   BrainApp yalnızca Brain'in kullanıcı arayüzünü oluşturur.
   Zekâ, context, intent, skills, actions ve provider mantığı
   ilgili Brain sistem katmanlarında çalışır.
========================================================= */

const BrainApp = {

    /* =====================================================
       RENDER
    ===================================================== */

    render(){

        return `

            <section
                id="brainPanel"
                class="brain-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="brainPanelTitle"
                aria-describedby="brainContextText"
                data-brain-region="panel"
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


                            <div>

                                <span class="eyebrow">
                                    VAERO BRAIN
                                </span>

                                <h2
                                    id="brainPanelTitle"
                                    class="brain-title"
                                >
                                    Birlikte düşünelim.
                                </h2>

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
                        Bulunduğun ekran algılanıyor.
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
                    Bir komut verebilir veya
                    ne yapmak istediğini yazabilirsin.
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

    }

};


window.BrainApp =
    BrainApp;
