const SettingsApp = {

    render(entity){

        return `
            <div class="section" style="margin-top:24px;padding:24px;">

                ${UI.appHeader(
                    entity.name, 
                    "SETTINGS",
                    "⚙️"
                )}

                ${UI.appCard(
                    "AYARLAR",
                    "Bu varlığın görünümü, izinleri, güvenlik ayarları ve uygulama tercihleri burada yönetilecektir."
                )}

            </div>
        `;

    }

};
