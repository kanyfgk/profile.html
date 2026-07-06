const UI = {

    appHeader(title, subtitle, backAction = "entity:dashboard"){

        return `
            <button
                class="secondary-btn"
                data-action="${backAction}"
                style="margin-bottom:18px;">
                ← Geri
            </button>

            <div class="card" style="${Theme.card}">

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
            <div class="card" style="margin-top:${Theme.spacing.md}px;${Theme.card}">

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

    identityCard(entity){

    return `
        <div class="card" style="margin-top:${Theme.spacing.md}px;${Theme.card}">

            <div class="eyebrow">VA KİMLİĞİ</div>

            <h3 style="margin-top:12px;word-break:break-all;">
                ${entity.id}
            </h3>

            <p style="margin-top:10px;color:var(--muted);line-height:1.7;">
                Bu kimlik, varlığın VAERO Evreni içindeki temel varoluş kaydıdır.
            </p>

            <div style="margin-top:16px;color:#4ade80;font-weight:800;">
                Doğrulandı
            </div>

        </div>
    `;

},
};
