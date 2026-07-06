const OrgansApp = {

    render(entity){
        const apps = [
    {
        icon: "🪪",
        title: "Kimlik",
        subtitle: "Kimliğini yönet",
        action: "entity:identity"
    },
    {
        icon: "👤",
        title: "Profil",
        subtitle: "Profilini yönet",
        action: "entity:profile"
    },
    {
        icon: "💾",
        title: "Hafıza",
        subtitle: "Hafızayı yönet",
        action: "entity:memory"
    },
    {
        icon: "🕓",
        title: "Timeline",
        subtitle: "Geçmişi görüntüle",
        action: "entity:timeline"
    },
    {
        icon: "🌉",
        title: "Bridge",
        subtitle: "Bağlantıları yönet",
        action: "entity:bridge"
    },
    {
        icon: "⚙️",
        title: "Ayarlar",
        subtitle: "Sistemi yönet",
        action: "entity:settings"
    }
];

        return `
            <div class="section" style="margin-top:24px;padding:24px;">

                <button
                    class="secondary-btn"
                    data-action="entity:dashboard"
                    style="margin-bottom:18px;">
                    ← Varlık Kontrol Paneli
                </button>

                <div class="card" style="padding:20px;">
                    <div class="eyebrow">ORGAN LAUNCHER</div>

                    <h2 style="margin-top:8px;">Organlar</h2>

                    <p style="margin-top:10px;color:var(--muted);line-height:1.7;">
                        Her organ bağımsız çalışan bir uygulamadır.
                    </p>
                </div>

                <div class="grid grid-2" style="margin-top:20px;">

                    ${apps.map(app => UI.launcherCard(app)).join("")}
</div>

                </div>

            </div>
        `;

    }

};
