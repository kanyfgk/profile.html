const ProfileApp = {

    render(entity){

        return `
            <div class="section" style="margin-top:24px;padding:24px;">

                <button class="secondary-btn"
                    data-action="entity:dashboard"
                    style="margin-bottom:18px;">
                    ← Varlık Kontrol Paneli
                </button>
 
                <div style="
                    display:flex; 
                    align-items:center;
                    justify-content:space-between;
                    margin-bottom:20px;
                ">

                    <div>
                        <div class="eyebrow">PROFILE APP</div>

                        <h2 style="margin-top:6px;">
                            ${entity.name}
                        </h2>
                    </div>

                    <div style="
                        width:56px;
                        height:56px;
                        border-radius:18px;
                        background:rgba(255,255,255,.08);
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:28px;
                    ">
                        👤
                    </div>

                </div>

                <div class="card" style="margin-top:18px;padding:18px;">
                    <div class="eyebrow">HIZLI İŞLEMLER</div>

                    <div class="grid grid-2" style="margin-top:16px;">
                        <button class="secondary-btn">Düzenle</button>
                        <button class="secondary-btn">Paylaş</button>
                        <button class="secondary-btn">Kimlik</button>
                        <button class="secondary-btn">Rozetler</button>
                    </div>
                </div>

                <div class="card" style="margin-top:18px;padding:16px;">
                    <div class="grid grid-2">

                        <div class="card">
                            <div class="eyebrow">TAKİPÇİLER</div>
                            <p style="margin:0;color:var(--muted);">0</p>
                        </div>

                        <div class="card">
                            <div class="eyebrow">TAKİP EDİLEN</div>
                            <p style="margin:0;color:var(--muted);">0</p>
                        </div>

                        <div class="card">
                            <div class="eyebrow">KİMLİK</div>
                            <p style="margin:0;word-break:break-all;color:var(--muted);">
                                ${entity.id}
                            </p>
                        </div>

                        <div class="card">
                            <div class="eyebrow">TÜR</div>
                            <p style="margin:0;color:var(--muted);">
                                ${entity.type}
                            </p>
                        </div>

                        <div class="card">
                            <div class="eyebrow">DURUM</div>
                            <p style="margin:0;color:#4ade80;font-weight:600;">
                                Aktif
                            </p>
                        </div>

                        <div class="card">
                            <div class="eyebrow">KAYNAK</div>
                            <p style="margin:0;color:var(--muted);">
                                VAERO Engine
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        `;

    }

};
