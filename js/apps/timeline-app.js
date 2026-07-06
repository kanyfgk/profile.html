const TimelineApp = {

    render(entity){

        return `
            <div class="section" style="margin-top:24px;padding:24px;">

                ${UI.appHeader(
                    entity.name,
                    "TIMELINE APP",
                    "🕓"
                )}

                ${UI.appCard(
                    "ZAMAN AKIŞI",
                    "Bu varlığa ait olaylar kronolojik olarak burada gösterilir."
                )}

            </div>
        `;

    }

};
