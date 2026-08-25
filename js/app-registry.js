const OrganRegistry = {

    apps: [],

    register(app = {}){

        const id =
            String(app.id || "")
                .trim()
                .toLowerCase();

        if(!id){

            console.warn(
                "Organ kaydedilemedi: id eksik.",
                app
            );

            return null;

        }

        const normalizedApp = {

            id,

            icon:
                String(
                    app.icon ||
                    "◌"
                ),

            title:
                String(
                    app.title ||
                    id
                ),

            subtitle:
                String(
                    app.subtitle ||
                    ""
                ),

            action:
                String(
                    app.action ||
                    `entity:${id}`
                ),

            enabled:
                app.enabled !== false

        };

        const existingIndex =
            this.apps.findIndex(
                item =>
                    item.id === id
            );

        if(existingIndex >= 0){

            this.apps[existingIndex] = {
                ...this.apps[existingIndex],
                ...normalizedApp
            };

            return this.apps[
                existingIndex
            ];

        }

        this.apps.push(
            normalizedApp
        );

        return normalizedApp;

    },

    all(options = {}){

        const includeDisabled =
            options.includeDisabled ===
                true;

        const apps =
            includeDisabled
                ? this.apps
                : this.apps.filter(
                    app =>
                        app.enabled
                );

        return apps.map(
            app => ({
                ...app
            })
        );

    },

    find(id){

        const normalizedId =
            String(id || "")
                .trim()
                .toLowerCase();

        return (
            this.apps.find(
                app =>
                    app.id ===
                    normalizedId
            ) ||
            null
        );

    },

    has(id){

        return Boolean(
            this.find(id)
        );

    }

};

[
    {
        id:
            "identity",

        icon:
            "🪪",

        title:
            "Kimlik",

        subtitle:
            "Dijital kimliğini yönet",

        action:
            "entity:identity"
    },

    {
        id:
            "profile",

        icon:
            "👤",

        title:
            "Profil",

        subtitle:
            "Profilini ve yönünü görüntüle",

        action:
            "entity:profile"
    },

    {
        id:
            "memory",

        icon:
            "◫",

        title:
            "Hafıza",

        subtitle:
            "Kalıcı kayıtlarını görüntüle",

        action:
            "entity:memory"
    },

    {
        id:
            "timeline",

        icon:
            "◷",

        title:
            "Zaman Çizelgesi",

        subtitle:
            "Geçmiş olaylarını görüntüle",

        action:
            "entity:timeline"
    },

    {
        id:
            "bridge",

        icon:
            "⌁",

        title:
            "Köprü",

        subtitle:
            "Bağlantılarını yönet",

        action:
            "entity:bridge"
    },

    {
        id:
            "evolution",

        icon:
            "⌬",

        title:
            "Evrim",

        subtitle:
            "Gelişim olaylarını incele",

        action:
            "entity:evolution"
    },

    {
        id:
            "settings",

        icon:
            "⚙️",

        title:
            "Ayarlar",

        subtitle:
            "Sistem tercihlerini yönet",

        action:
            "entity:settings"
    },

    {
        id:
            "discovery",

        icon:
            "◇",

        title:
            "Discovery",

        subtitle:
            "Keşif cevaplarını yeniden değerlendir",

        action:
            "entity:discovery"
    },

    {
        id:
            "vaero",

        icon:
            "◉",

        title:
            "VAERO",

        subtitle:
            "Engine hizmetlerini yönet",

        action:
            "app:vaero"
    }

].forEach(
    app =>
        OrganRegistry.register(
            app
        )
);

window.OrganRegistry =
    OrganRegistry;
