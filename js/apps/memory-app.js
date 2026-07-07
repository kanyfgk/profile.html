const MemoryApp = {

    render(entity){
        VAERO.get("brainAwareness").enter("memory");

        return `
            <div class="section" style="margin-top:24px;padding:24px;"> 

                ${UI.appHeader(
                    entity.name,
                    "MEMORY APP",
                    "💾"
                )}

                ${UI.appCard(
                    "HAFIZA",
                    "Bu varlığın kayıtları, notları ve geçmiş izleri burada tutulur."
                )}

            </div>
        `;

    }

};
