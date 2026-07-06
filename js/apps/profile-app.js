const ProfileApp = {

    render(entity){

        return `
            <div class="section" style="margin-top:24px;padding:24px;">

                ${UI.appHeader(
                    entity.name,
                    "PROFILE APP",
                    "👤"
                )}

                ${UI.appCard(
                    "HAKKINDA",
                    "Bu varlık VAERO Evreni içinde oluşturulmuş dijital bir profildir."
                )}

                <div class="card" style="margin-top:${Theme.spacing.md}px;${Theme.card}">
                    <div class="eyebrow">PROFİL BİLGİLERİ</div>

                    <div style="margin-top:14px;display:grid;gap:12px;">

                        <div>
                            <b>İsim</b>
                            <p style="margin-top:6px;color:var(--muted);">
                                ${entity.name}
                            </p>
                        </div>

                        <hr style="opacity:.12;">

                        <div>
                            <b>Tür</b>
                            <p style="margin-top:6px;color:var(--muted);">
                                ${entity.type}
                            </p>
                        </div>

                        <hr style="opacity:.12;">

                        <div>
                            <b>Kimlik</b>
                            <p style="margin-top:6px;color:var(--muted);word-break:break-all;">
                                ${entity.id}
                            </p>
                        </div>

                    </div>
                </div>

                <div class="grid grid-2" style="margin-top:${Theme.spacing.md}px;">

                    <div class="card" style="${Theme.card}">
                        <div class="eyebrow">TAKİPÇİ</div>
                        <h3 style="margin-top:8px;">0</h3>
                    </div>

                    <div class="card" style="${Theme.card}">
                        <div class="eyebrow">TAKİP EDİLEN</div>
                        <h3 style="margin-top:8px;">0</h3>
                    </div>

                    <div class="card" style="${Theme.card}">
                        <div class="eyebrow">SEVİYE</div>
                        <h3 style="margin-top:8px;">1</h3>
                    </div>

                    <div class="card" style="${Theme.card}">
                        <div class="eyebrow">XP</div>
                        <h3 style="margin-top:8px;">0 XP</h3>
                    </div>

                </div>

            </div>
        `;

    }

};
