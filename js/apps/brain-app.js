const BrainApp = {

    render(){

        return `
            <section
                id="brainPanel"
                class="brain-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="brainPanelTitle"
            >
                <div
                    class="brain-panel-handle"
                    aria-hidden="true"
                ></div>

                <header class="brain-panel-header">

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

                    <button
                        type="button"
                        class="brain-close"
                        data-action="brain:close"
                        aria-label="Brain panelini kapat"
                    >
                        ×
                    </button>

                </header>

                <p
                    id="brainContextText"
                    class="brain-context"
                >
                    Bulunduğun ekran algılanıyor.
                </p>

                <div
                    id="brainSuggestion"
                    class="brain-suggestion"
                >
                    Bir komut verebilir veya ne yapmak istediğini yazabilirsin.
                </div>

                <div
                    id="brainMiniHistory"
                    class="brain-mini-history"
                    aria-label="Son Brain mesajları"
                ></div>

                <div
                    id="brainHistory"
                    class="brain-history"
                    aria-live="polite"
                    aria-label="Brain sohbet geçmişi"
                ></div>

                <div class="brain-composer">

                    <input
                        id="brainInput"
                        class="brain-input"
                        type="text"
                        maxlength="1000"
                        placeholder="Brain’e yaz..."
                        autocomplete="off"
                        aria-label="Brain mesajı"
                    >

                    <button
                        type="button"
                        class="brain-send"
                        data-action="brain:send"
                        aria-label="Mesajı gönder"
                    >
                        →
                    </button>

                </div>

                <small class="brain-input-hint">
                    Göndermek için Enter
                </small>

            </section>
        `;

    }

};

window.BrainApp =
    BrainApp; 
