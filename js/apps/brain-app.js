const BrainApp = {

    render(){
        return `
            <div id="brainPanel" class="brain-panel">

                <button
                    class="brain-close"
                    data-action="brain:close">
                    ×
                </button>

                <div class="eyebrow">VAERO BRAIN</div>

<h3 class="brain-title">
    Brain Panel
</h3>

<p id="brainContextText" class="brain-context">
    Bağlam bekleniyor.
</p>

<div id="brainSuggestion" class="brain-suggestion">
    💡 Hazırım. Bir komut verebilir veya son oturumlarına bakabilirsin.
</div>

<div id="brainMiniHistory" class="brain-mini-history"></div>
<div id="brainHistory" class="brain-history"></div>

<input
    id="brainInput"
    class="brain-input"
    placeholder="Brain'e yaz..."
/>

<button
    class="primary-btn brain-send"
    data-action="brain:send">
    Gönder
</button>

            </div>
        `;
    }

};

window.BrainApp = BrainApp;
