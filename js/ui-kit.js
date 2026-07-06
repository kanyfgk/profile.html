const UI = {

    appHeader(
    title,
    subtitle,
    icon = "◌",
    backAction = "entity:dashboard"
){


        return `
            <button
                class="secondary-btn"
                data-action="${backAction}"
                style="margin-bottom:18px;">
                ← Geri
            </button>

            <div
                class="card"
                style="
                    ${Theme.card}
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                "
            >

                <div>

                    <div class="eyebrow">
                        ${subtitle}
                    </div>

                    <h2 style="margin-top:8px;">
                        ${title}
                    </h2>

                </div>

                <div style="${Theme.appIcon}">
                    ${icon}
                </div>

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

    },

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

                <div style="margin-top:16px;color:${Theme.colors.success};font-weight:800;">
                    Doğrulandı
                </div>

            </div>
        `;

    }

    launcherCard(app){

    return `
        <div
            class="card"
            data-action="${app.action}"
            style="
                ${Theme.card}
                cursor:pointer;
                min-height:150px;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                text-align:center;
            "
        >
            <div style="font-size:${Theme.icon.large}px;">
                ${app.icon}
            </div>

            <h3 style="
                margin-top:16px;
                font-size:20px;
                font-weight:600;
            ">
                ${app.title}
            </h3>

            <div style="
                color:var(--muted);
                margin-top:8px;
                font-size:14px;
                line-height:1.5;
            ">
                ${app.subtitle}
            </div>
        </div>
    `;

},

    statsCard(title, value){

    return `
        <div class="card" style="${Theme.card}">

            <div class="eyebrow">
                ${title}
            </div>

            <h3 style="margin-top:8px;">
                ${value}
            </h3>

        </div>
    `;

},
};
