const UI = {

    appHeader(title, subtitle, backAction = "entity:dashboard"){

        return `
            <button
                class="secondary-btn"
                data-action="${backAction}"
                style="margin-bottom:18px;">
                ← Geri
            </button>

            <div class="card" style="padding:20px;">

                <div class="eyebrow">
                    ${subtitle}
                </div>

                <h2 style="margin-top:8px;">
                    ${title}
                </h2>

            </div>
        `;

    },

    appCard(title, text){

        return `
            <div class="card" style="margin-top:18px;padding:18px;">

                <div class="eyebrow">
                    ${title}
                </div>

                <p style="
                    margin-top:12px;
                    color:var(--muted);
                    line-height:1.7;
                ">
                    ${text}
                </p>

            </div>
        `;

    }

};
