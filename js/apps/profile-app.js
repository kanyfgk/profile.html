const ProfileApp = {

    render(entity){
        VAERO.get("brainAwareness").enter("profile");

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

                    ${UI.infoRow("İsim", entity.name)}

                    <hr style="opacity:.12;">

                    ${UI.infoRow("Tür", entity.type)}

                    <hr style="opacity:.12;">

                    ${UI.infoRow("Kimlik", entity.id)}
                </div>

                <div class="grid grid-2" style="margin-top:${Theme.spacing.md}px;">

                    ${UI.statsCard("TAKİPÇİ", "0")}

                    ${UI.statsCard("TAKİP EDİLEN", "0")}

                    ${UI.statsCard("SEVİYE", "1")}

                    ${UI.statsCard("XP", "0 XP")}

                </div>

                ${UI.brainPanel()}

            </div>
        `;

    }

};
