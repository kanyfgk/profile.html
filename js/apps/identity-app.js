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

                <div class="eyebrow">IDENTITY APP</div>

                <h2 style="margin-top:10px;">
                    ${entity.name}
                </h2>

                <div class="card" style="margin-top:18px;padding:18px;">
                    <div class="eyebrow">VA KİMLİĞİ</div>

                    <p style="margin-top:12px;color:var(--muted);line-height:1.7;">
                        Bu varlığın temel kimlik bilgileri burada yönetilecek.
                    </p>

                    <div style="margin-top:16px;">
                        <div><b>ID:</b></div>
                        <p style="margin-top:6px;color:var(--muted);word-break:break-all;">
                            ${entity.id}
                        </p>
                    </div>

                    <div style="margin-top:16px;">
                        <div><b>Tür:</b></div>
                        <p style="margin-top:6px;color:var(--muted);">
                            ${entity.type}
                        </p>
                    </div>

                    <div style="margin-top:16px;">
                        <div><b>Durum:</b></div>
                        <p style="margin-top:6px;color:#4ade80;font-weight:700;">
                            Doğrulandı
                        </p>
                    </div>
                </div>

            </div>
        `;

    }

};
