const OrganRegistry = {

    apps: [],

    register(app){
        this.apps.push(app);
    },

    all(){
        return this.apps;
    },

    find(id){
        return this.apps.find(app => app.id === id);
    }

};

OrganRegistry.register({
    id: "identity",
    icon: "🪪",
    title: "Kimlik",
    subtitle: "Kimliğini yönet",
    action: "entity:identity"
});

OrganRegistry.register({
    id: "profile",
    icon: "👤",
    title: "Profil",
    subtitle: "Profilini yönet",
    action: "entity:profile"
});

OrganRegistry.register({
    id: "memory",
    icon: "💾",
    title: "Hafıza",
    subtitle: "Hafızayı yönet",
    action: "entity:memory"
});

OrganRegistry.register({
    id: "timeline",
    icon: "🕓",
    title: "Timeline",
    subtitle: "Geçmişi görüntüle",
    action: "entity:timeline"
});

OrganRegistry.register({
    id: "bridge",
    icon: "🌉",
    title: "Bridge",
    subtitle: "Bağlantıları yönet",
    action: "entity:bridge"
});

OrganRegistry.register({
    id: "evolution",
    icon: "🧬",
    title: "Evolution",
    subtitle: "Yaşam olaylarını yönet",
    action: "entity:evolution"
});

OrganRegistry.register({
    id: "settings",
    icon: "⚙️",
    title: "Ayarlar",
    subtitle: "Sistemi yönet",
    action: "entity:settings"
});

OrganRegistry.register({
    id: "discovery",
    icon: "🧭",
    title: "Discovery",
    subtitle: "Kendini keşfet",
    action: "entity:discovery"
});

window.OrganRegistry = OrganRegistry;
