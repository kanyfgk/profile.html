const IdentityApp = {

    render(entity){

        return `
            <div class="section" style="margin-top:24px;padding:24px;">

                ${UI.appHeader(
    entity.name,
    "KİMLİK UYGULAMASI",
    "🪪"
)}

                ${UI.identityCard(entity)}

                <div class="card" style="margin-top:18px;padding:18px;">
                    <div class="eyebrow">KİMLİK TÜRÜ</div>

                    <h3 style="margin-top:12px;">
                        ${entity.type}
                    </h3>

                    <p style="margin-top:10px;color:var(--muted);line-height:1.7;">
                        Bu varlığın sistem içindeki tipi ve yetki kapsamı burada yönetilir.
                    </p>
                </div>

                <div class="card" style="margin-top:18px;padding:18px;">
                    <div class="eyebrow">KİMLİK KATMANLARI</div>

                    <div style="margin-top:14px;display:grid;gap:10px;">
                        <div class="card">VA ID · Aktif</div>
                        <div class="card">AE ID · Henüz yok</div>
                        <div class="card">EA ID · Henüz yok</div>
                    </div>
                </div>

            </div>
        `;

    }

};
