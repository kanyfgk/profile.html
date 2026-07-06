const ProfileApp = {

    render(entity){

        return `
            <div class="section" style="margin-top:24px;padding:24px;">

                ${UI.appHeader(
                    entity.name,
                    "PROFILE APP",
                    "👤"
                )}

                <div class="card" style="margin-top:${Theme.spacing.md}px;${Theme.card}">
                    <div class="eyebrow">HIZLI İŞLEMLER</div>

                    <div class="grid grid-2" style="margin-top:16px;">
                        <button class="secondary-btn">Düzenle</button>
                        <button class="secondary-btn">Paylaş</button>
                        <button class="secondary-btn" data-action="entity:identity">Kimlik</button>
                        <button class="secondary-btn">Rozetler</button>
                    </div>
                </div>

                <div class="card" style="margin-top:${Theme.spacing.md}px;${Theme.card}">
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

                    </div>
                </div>

            </div>
        `;

    }

};
