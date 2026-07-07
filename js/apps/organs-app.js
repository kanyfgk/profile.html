const OrgansApp = {

    render(entity){

        VAERO.get("brainAwareness").enter("organs");

        const UIX = window.UI;

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

                    ${OrganRegistry.all().map(app => UIX.launcherCard(app)).join("")}

                </div>

                ${UIX.brainButton()}

            </div>
        `;

    }

};
