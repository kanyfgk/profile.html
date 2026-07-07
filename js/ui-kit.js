const UI = {

    appHeader(title, subtitle, icon = "◌", backAction = "entity:dashboard"){

        return `
            <button class="secondary-btn" data-action="${backAction}" style="margin-bottom:18px;">
                ← Geri
            </button>

            <div class="card" style="${Theme.card}display:flex;align-items:center;justify-content:space-between;">
                <div>
                    <div class="eyebrow">${subtitle}</div>
                    <h2 style="margin-top:8px;">${title}</h2>
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
                <div class="eyebrow">${title}</div>
                <p style="margin-top:12px;color:var(--muted);line-height:1.7;">
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
    },

    launcherCard(app){
        return `
            <div class="card" data-action="${app.action}" style="${Theme.card}cursor:pointer;min-height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
                <div style="font-size:${Theme.icon.large}px;">
                    ${app.icon}
                </div>

                <h3 style="margin-top:16px;font-size:20px;font-weight:600;">
                    ${app.title}
                </h3>

                <div style="color:var(--muted);margin-top:8px;font-size:14px;line-height:1.5;">
                    ${app.subtitle}
                </div>
            </div>
        `;
    },

    statsCard(title, value){
        return `
            <div class="card" style="${Theme.card}">
                <div class="eyebrow">${title}</div>
                <h3 style="margin-top:8px;">${value}</h3>
            </div>
        `;
    },

    infoRow(label, value){
        return `
            <div style="margin-top:14px;">
                <b>${label}</b>
                <p style="margin-top:6px;color:var(--muted);word-break:break-all;">
                    ${value}
                </p>
            </div>
        `;
    },

    brainButton(){
        return `
            <button
                class="primary-btn"
                data-action="brain:open"
                style="
                    position:fixed;
                    right:24px;
                    bottom:24px;
                    width:62px;
                    height:62px;
                    border-radius:50%;
                    font-size:28px;
                    z-index:999;
                ">
                ✨
            </button>
        `;
    },

    brainPanel(){
    return `
        <div
            id="brainPanel"
            class="card"
            style="
                ${Theme.card}
                position:fixed;
                right:24px;
                bottom:100px;
                width:340px;
                max-width:calc(100vw - 48px);
                z-index:1000;
                display:none;
            "
        >
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <div>
                    <div class="eyebrow">VAERO BRAIN</div>
                    <h3 style="margin-top:6px;">Yanındayım</h3>
                </div>

                <button
                    class="secondary-btn"
                    data-action="brain:close"
                    style="padding:8px 12px;">
                    ×
                </button>
            </div>

            <p
                id="brainContextText"
                style="margin-top:14px;color:var(--muted);line-height:1.6;">
                Bulunduğun ekranı algılıyorum.
            </p>

            <textarea
                id="brainPromptInput"
                placeholder="Brain'e ne yapmak istediğini yaz..."
                style="
                    width:100%;
                    min-height:90px;
                    margin-top:14px;
                    border-radius:18px;
                    padding:14px;
                    background:rgba(255,255,255,.06);
                    color:white;
                    border:1px solid rgba(255,255,255,.12);
                    outline:none;
                    resize:none;
                "></textarea>

            <button
                class="primary-btn"
                data-action="brain:send"
                style="margin-top:12px;width:100%;">
                Gönder
            </button>

            <div
            <div
    id="brainHistory"
    style="
        margin-top:14px;
        max-height:180px;
        overflow:auto;
        color:var(--muted);
        line-height:1.6;
        font-size:14px;
    ">
</div>
                id="brainReply"
                style="margin-top:14px;color:var(--muted);line-height:1.6;">
            </div>
        </div>
    `;
}

};

window.UI = UI;
