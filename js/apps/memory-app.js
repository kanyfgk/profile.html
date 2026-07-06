const MemoryApp = {

    render(entity){

        return `
            <div class="section" style="margin-top:24px;padding:24px;"> 

                <button
                    class="secondary-btn"
                    data-action="entity:dashboard"
                    style="margin-bottom:18px;">
                    ← Varlık Kontrol Paneli
                </button>

                <div class="eyebrow">MEMORY APP</div> 

                <h2 style="margin-top:10px;">
                    ${entity.name}
                </h2>

                <div class="card" style="margin-top:18px;padding:18px;">

                    <div class="eyebrow">HAFIZA</div>

                    <p style="
                        margin-top:12px;
                        color:var(--muted);
                        line-height:1.7;
                    ">
                        Bu varlığın kayıtları, notları ve geçmiş izleri burada tutulacak.
                    </p>

                </div>

            </div>
        `;

    }

};
