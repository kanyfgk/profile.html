const TimelineApp = {

    render(entity){

        return `
            <div class="section" style="margin-top:24px;padding:24px;">

                <button
                    class="secondary-btn"
                    data-action="entity:dashboard"
                    style="margin-bottom:18px;">
                    ← Varlık Kontrol Paneli
                </button>

                <div class="eyebrow">TIMELINE APP</div>

                <h2 style="margin-top:10px;">
                    ${entity.name}
                </h2>

                <div class="card" style="margin-top:18px;padding:18px;">

                    <div class="eyebrow">ZAMAN AKIŞI</div>

                    <p style="
                        margin-top:12px;
                        color:var(--muted);
                        line-height:1.7;
                    ">
                        Bu varlığa ait tüm olaylar burada kronolojik olarak gösterilecek.
                    </p>

                </div>

            </div>
        `;

    }

};
