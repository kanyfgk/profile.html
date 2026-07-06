const OrgansApp = {

    render(entity){

        return `
            <div class="section" style="margin-top:24px;padding:24px;">
  
                <button
                    class="secondary-btn"
                    data-action="entity:dashboard"
                    style="margin-bottom:18px;">
                    ← Varlık Kontrol Paneli
                </button>

                <div class="eyebrow">ENTITY ORGANS</div>

                <h2 style="margin-top:10px;">
                    ${entity.name}
                </h2>

                <p style="
                    margin-top:10px;
                    color:var(--muted);
                    line-height:1.7;
                ">
                    Organlar, bu varlığın çalışan sistemlerini temsil eder.
                </p>

                <div class="grid grid-2" style="margin-top:20px;">

                    <div class="card" style="grid-column:1 / -1;">

                        <div class="eyebrow">ORGAN SİSTEMİ</div>

                        <p style="
                            margin-top:12px;
                            color:var(--muted);
                            line-height:1.7;
                        ">
                            Her organ bağımsız çalışan bir sistemdir.
                        </p>

                    </div>

                    <div class="card">
                        <div class="eyebrow">IDENTITY</div>
                        <p style="font-size:42px;margin:18px 0 10px;">🪪</p>
                        <div style="color:var(--muted);">Kimlik</div>
                    </div>

                    <div class="card">
                        <div class="eyebrow">PROFILE</div>
                        <p style="font-size:42px;margin:18px 0 10px;">👤</p>
                        <div style="color:var(--muted);">Profil</div>
                    </div>

                    <div class="card">
                        <div class="eyebrow">MEMORY</div>
                        <p style="font-size:42px;margin:18px 0 10px;">💾</p>
                        <div style="color:var(--muted);">Hafıza</div>
                    </div>

                    <div class="card">
                        <div class="eyebrow">TIMELINE</div>
                        <p style="font-size:42px;margin:18px 0 10px;">🕓</p>
                        <div style="color:var(--muted);">Zaman Akışı</div>
                    </div>

                    <div class="card">
                        <div class="eyebrow">BRIDGE</div>
                        <p style="font-size:42px;margin:18px 0 10px;">🌉</p>
                        <div style="color:var(--muted);">Bağlantılar</div>
                    </div>

                    <div class="card">
                        <div class="eyebrow">GUARDIAN</div>
                        <p style="font-size:42px;margin:18px 0 10px;">🛡️</p>
                        <div style="color:var(--muted);">Koruyucu</div>
                    </div>

                </div>

            </div>
        `;

    }

};
