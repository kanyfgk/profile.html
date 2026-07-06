const AppRegistry = {

    apps: [],

    register(app){
        this.apps.push(app);
    },

    all(){
        return this.apps;
    }

};

AppRegistry.register({
    id: "identity",
    icon: "🪪",
    title: "Kimlik",
    subtitle: "Kimliğini yönet",
    action: "entity:identity"
});

AppRegistry.register({
    id: "profile",
    icon: "👤",
    title: "Profil",
    subtitle: "Profilini yönet",
    action: "entity:profile"
});

AppRegistry.register({
    id: "memory",
    icon: "💾",
    title: "Hafıza",
    subtitle: "Hafızayı yönet",
    action: "entity:memory"
});

AppRegistry.register({
    id: "timeline",
    icon: "🕓",
    title: "Timeline",
    subtitle: "Geçmişi görüntüle",
    action: "entity:timeline"
});

AppRegistry.register({
    id: "bridge",
    icon: "🌉",
    title: "Bridge",
    subtitle: "Bağlantıları yönet",
    action: "entity:bridge"
});

AppRegistry.register({
    id: "settings",
    icon: "⚙️",
    title: "Ayarlar",
    subtitle: "Sistemi yönet",
    action: "entity:settings"
});
