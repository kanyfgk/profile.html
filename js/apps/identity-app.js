const IdentityApp = {

    render(entity){

        return `
            <div class="section" style="margin-top:24px;padding:24px;">

                <button
                    class="secondary-btn"
                    data-action="entity:dashboard"
                    style="margin-bottom:18px;">
                    ← Varlık Kontrol Paneli
                </button>

                <div class="eyebrow">KİMLİK UYGULAMASI</div>

                <h2 style="margin-top:10px;">
                    ${entity.name}
                </h2>

                <div class="card" style="margin-top:18px;padding:18px;">
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
