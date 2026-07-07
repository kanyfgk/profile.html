const OrgansApp = {

    render(entity){

        VAERO.get("brainAwareness").enter("organs");

        const makeCard = app => `
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

                <h3 style="margin-top:16px;font-size:20px;font-weight:600;">
                    ${app.title}
                </h3>

                <div style="color:var(--muted);margin-top:8px;font-size:14px;line-height:1.5;">
                    ${app.subtitle}
                </div>
            </div>
        `;

        return `
            <div class="section" style="margin-top:24px;padding:24px;">

                <button
                    class="secondary-btn"
                    data-action="entity:dashboard"
                    style="margin-bottom:18px;">
                    ← Varlık Kontrol Paneli
                </button>

                <div class="card" style="${Theme.card}">
                    <div class="eyebrow">ORGAN LAUNCHER</div>

                    <h2 style="margin-top:8px;">
                        Organlar
                    </h2>

                    <p style="margin-top:10px;color:var(--muted);line-height:1.7;">
                        Her organ bağımsız çalışan bir uygulamadır.
                    </p>
                </div>

                <div class="grid grid-2" style="margin-top:20px;">
                    ${OrganRegistry.all().map(app => makeCard(app)).join("")}
                </div>

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

            </div>
        `;

    }

};
