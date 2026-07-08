const Brain = {

    history: [],

    report(){

        const identity = VAERO.get("identity"); 
        const memory = VAERO.get("memorySystem");
        const guardian = VAERO.get("guardian");
        const bridge = VAERO.get("bridge");
        const evolution = VAERO.get("evolution");

        return {
            identity: identity ? "OK" : "MISSING",
            memory: memory ? "OK" : "MISSING",
            guardian: guardian ? "OK" : "MISSING",
            bridge: bridge ? "OK" : "MISSING",
            evolution: evolution ? "OK" : "MISSING",
            integrity: "100%"
        };

    },

    receive(message, context){

        const cleanMessage = String(message || "").trim();

        if(cleanMessage === "") return null;

        this.history.push({
            role: "user",
            text: cleanMessage,
            context: context || null,
            createdAt: Date.now()
        });

        const reply = this.reply(cleanMessage, context);

        this.history.push({
            role: "brain",
            text: reply,
            context: context || null,
            createdAt: Date.now()
        });

        console.log("Brain received:", cleanMessage);
        console.log("Brain reply:", reply);
        console.log("Brain history:", this.history);

        return reply;

    },

    reply(message, context){

        const app = context?.app || "unknown";

        if(app === "organs"){
            return "Organ Launcher ekranındasınız. Buradan Kimlik, Profil, Hafıza, Timeline, Bridge ve Ayarlar uygulamalarına geçebilirsiniz.";
        }

        if(app === "identity"){
            return "Kimlik ekranındasınız. Bu alan varlığın VAERO Evreni içindeki temel kimlik kaydını gösterir.";
        }

        if(app === "profile"){
            return "Profil ekranındasınız. Burada varlığın görünen adı, türü ve tanımı yönetilir.";
        }

        if(app === "memory"){
            return "Hafıza ekranındasınız. Bu alan varlığın geçmiş kayıtlarını ve hatırlamalarını taşır.";
        }

        if(app === "timeline"){
            return "Timeline ekranındasınız. Burada varlığın zaman içindeki olay akışı görüntülenir.";
        }

        if(app === "bridge"){
            return "Bridge ekranındasınız. Bu alan varlıklar ve dünyalar arasındaki bağlantıları yönetir.";
        }

        if(app === "settings"){
            return "Ayarlar ekranındasınız. Burada sistem davranışları ve varlık tercihleri yönetilir.";
        }

        return "VAERO Brain aktif. Bulunduğunuz ekrana göre size rehberlik edebilirim.";

    },

    boot(){

        const status = this.report();

        console.log("VAERO Brain Online");
        console.log(status);

        const events = VAERO.get("events");

        if(events){
            events.on("engine.started", (data) => {
                console.log("Brain received:", data);
            });

            events.emit("brain.online", status);
        }

        return status;

    }

};

VAERO.register("brain", Brain);
