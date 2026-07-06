const BridgeApp = {

    render(entity){

        return `
            <div class="section" style="margin-top:24px;padding:24px;">

                ${UI.appHeader(
                    entity.name,
                    "BRIDGE APP",
                    "🌉" 
                )}

                ${UI.appCard(
                    "BAĞLANTILAR",
                    "Bu varlığın kişiler, şirketler, ürünler ve diğer varlıklarla olan bağlantıları burada yönetilir."
                )}

            </div>
        `;

    }

};
