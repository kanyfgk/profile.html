const Brain = {

    /*
     * Brain’in çalışma anındaki teknik mesaj geçmişidir.
     * Kullanıcıya gösterilen kalıcı geçmiş actions-v2.js içindeki
     * brain.sessions üzerinden yönetilir.
     */
    history: [],

    maxHistoryItems: 100,

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

    normalizeMessage(message){
        return String(message || "")
            .toLowerCase()
            .trim()
            .replaceAll("ı", "i")
            .replaceAll("ğ", "g")
            .replaceAll("ü", "u")
            .replaceAll("ş", "s")
            .replaceAll("ö", "o")
            .replaceAll("ç", "c")
            .replace(/[?.!,;:]+$/g, "")
            .replace(/\s+/g, " ");
    },

    /*
     * brainIntent servisi yalnızca hedef önerir.
     * Bir kelimenin cümlede geçmesi navigasyon için yeterli değildir.
     */
    isExplicitNavigationCommand(message, intent){
        if(!intent || intent.type !== "navigate" || !intent.target){
            return false;
        }

        const command = this.normalizeMessage(message);

        const navigationVerbs = [
            "ac",
            "goster",
            "goruntule",
            "git",
            "gec",
            "beni gotur"
        ];

        return navigationVerbs.some(verb =>
            command === verb ||
            command.startsWith(`${verb} `) ||
            command.endsWith(` ${verb}`) ||
            command.includes(` ${verb} `)
        );
    },

    addHistoryRecord(record){
        this.history.push({
            id: crypto.randomUUID(),
            ...record,
            createdAt: record.createdAt || Date.now()
        });

        if(this.history.length > this.maxHistoryItems){
            this.history = this.history.slice(
                this.history.length - this.maxHistoryItems
            );
        }
    },

    receive(message, context){
        const cleanMessage = String(message || "").trim();

        if(cleanMessage === ""){
            return null;
        }

        const intentService = VAERO.get("brainIntent");

        const detectedIntent = intentService
            ? intentService.detect(cleanMessage)
            : {
                type: "chat",
                target: null
            };

        /*
         * brainIntent yanlışlıkla normal bir soruyu navigate olarak
         * algılayabilir. Yalnızca açık komutsa navigate kabul edilir.
         */
        const intent =
            detectedIntent.type === "navigate" &&
            !this.isExplicitNavigationCommand(
                cleanMessage,
                detectedIntent
            )
                ? {
                    type: "chat",
                    target: null,
                    detectedTarget: detectedIntent.target
                }
                : detectedIntent;

        this.addHistoryRecord({
            role: "user",
            text: cleanMessage,
            context: context || null,
            intent
        });

        const reply = this.reply(
            cleanMessage,
            context,
            intent
        );

        this.addHistoryRecord({
            role: "brain",
            text: reply,
            context: context || null,
            intent
        });

        console.log("Brain received:", cleanMessage);
        console.log("Brain intent:", intent);
        console.log("Brain reply:", reply);
        console.log(
            "Brain runtime history count:",
            this.history.length
        );

        return reply;
    },

analyzeMessage(message, context = null, intent = null){
    const normalizedMessage =
        this.normalizeMessage(message);

    const topicDefinitions = [
        {
            topic: "discovery",
            words: [
                "discovery",
                "kesif",
                "kesif yolculugu",
                "yolculugum",
                "gelis amacim",
                "ilgi alanim",
                "ilgi alanlarim",
                "guclu yonum",
                "guclu yonlerim",
                "hedefim",
                "baglanti beklentim",
                "kimlerle karsilasmak",
                "vaero tercihim",
                "bana nasil eslik"
            ]
        },
        {
            topic: "profile",
            words: [
                "profil",
                "profile"
            ]
        },
        {
            topic: "identity",
            words: [
                "kimlik",
                "identity"
            ]
        },
        {
            topic: "memory",
            words: [
                "hafiza",
                "memory"
            ]
        },
        {
            topic: "timeline",
            words: [
                "timeline",
                "zaman cizelgesi",
                "zaman akisi"
            ]
        },
        {
            topic: "bridge",
            words: [
                "kopru",
                "bridge"
            ]
        },
        {
            topic: "organs",
            words: [
                "organ",
                "organlar",
                "organs"
            ]
        },
        {
            topic: "settings",
            words: [
                "ayar",
                "ayarlar",
                "settings"
            ]
        },
        {
            topic: "brain",
            words: [
                "brain",
                "beyin"
            ]
        }
    ];

    const mentionedTopic =
        topicDefinitions.find(item =>
            item.words.some(word =>
                normalizedMessage.includes(word)
            )
        )?.topic || null;

    /*
     * Mesajda uygulama adı yoksa mevcut ekran,
     * yalnızca yardımcı konu olarak kullanılır.
     */
    const contextTopic =
        context?.app &&
        context.app !== "unknown"
            ? context.app
            : null;

    const topic =
        mentionedTopic ||
        contextTopic ||
        "unknown";

    /*
     * Mesajın hangi işlem hakkında olduğunu belirle.
     */
    let operation = "general";

    const operationDefinitions = [
        {
            operation: "delete",
            words: [
                "sil",
                "silebilir",
                "silebilirim",
                "kaldir",
                "temizle"
            ]
        },
        {
            operation: "create",
            words: [
                "olustur",
                "ekle",
                "kaydet",
                "yeni"
            ]
        },
        {
            operation: "edit",
            words: [
                "duzenle",
                "degistir",
                "guncelle"
            ]
        },
        {
            operation: "search",
            words: [
                "ara",
                "bul",
                "nerede"
            ]
        },
        {
            operation: "restore",
            words: [
                "geri getir",
                "geri yukle",
                "kurtar",
                "devam et"
            ]
        },
        {
            operation: "explain",
            words: [
                "bilgi ver",
                "nedir",
                "ne ise yarar",
                "anlat",
                "acikla",
                "hakkinda"
            ]
        },
        {
            operation: "purpose",
            words: [
                "neden",
                "niye",
                "ne icin",
                "neden kullan"
            ]
        },
        {
            operation: "open",
            words: [
                "ac",
                "acar misin",
                "acmani istiyorum",
                "goster",
                "goruntule",
                "git",
                "gec",
                "beni gotur"
            ]
        }
    ];

    for(const definition of operationDefinitions){
    const matched =
        definition.words.some(word => {
            if(word.includes(" ")){
                return normalizedMessage.includes(word);
            }

            const messageWords = normalizedMessage.split(" ");
            return messageWords.includes(word);
        });

        if(matched){
            operation =
                definition.operation;

            break;
        }
    }

    /*
     * Ana mesaj türünü belirle.
     */
    let messageType = "statement";

    if(
        intent?.type === "navigate" &&
        intent?.target
    ){
        messageType = "navigation";
        operation = "open";
    }else if(
        normalizedMessage.includes("?") ||
        normalizedMessage.startsWith("ne ") ||
        normalizedMessage.startsWith("nasil ") ||
        normalizedMessage.startsWith("neden ") ||
        normalizedMessage.startsWith("niye ") ||
        normalizedMessage.includes("bilir miyim") ||
        normalizedMessage.includes("mümkün mü") ||
        normalizedMessage.includes("mumkun mu")
    ){
        messageType = "question";
    }else if(operation !== "general"){
        messageType = "request";
    }

    /*
     * Mesajdaki hedef uygulama, açık ekrandan daha güvenilirdir.
     */
    const target =
        intent?.target ||
        mentionedTopic ||
        null;

    let confidence = 0.35;

    if(mentionedTopic){
        confidence += 0.25;
    }

    if(operation !== "general"){
        confidence += 0.20;
    }

    if(messageType !== "statement"){
        confidence += 0.15;
    }

    confidence =
        Math.min(confidence, 1);

    return {
        rawMessage: String(message || ""),
        normalizedMessage,
        messageType,
        topic,
        mentionedTopic,
        contextTopic,
        operation,
        target,
        confidence
    };
},

    reply(message, context, intent){
        const analysis =
    this.analyzeMessage(
        message,
        context,
        intent
    );

const app =
    analysis.topic ||
    context?.app ||
    "unknown";

        if(
            intent &&
            intent.type === "navigate" &&
            intent.target
        ){
            const targetNameMap = {
                profile: "Profil",
                identity: "Kimlik",
                memory: "Hafıza",
                timeline: "Timeline",
                bridge: "Bridge",
                organs: "Organlar",
                settings: "Ayarlar"
            };

            const targetName =
                targetNameMap[intent.target] ||
                intent.target;

            return `${targetName} açılıyor.`;
        }

        if(intent && intent.type === "clarify"){
            return "Ne yapmak istediğini biraz daha açık yazarsan bulunduğun bağlama göre yardımcı olabilirim.";
        }

        /*
         * Henüz gerçek düşünme motoru olmadığı için normal sorular
         * navigasyon komutu gibi cevaplanmaz.
         */
        switch(analysis.messageType){

    case "navigation":
        return this.getNavigationReply(
            analysis,
            app
        );

    case "question":
        return this.getQuestionReply(
            analysis,
            app
        );

    case "request":
        return this.getRequestReply(
            analysis,
            app
        );

    default:
        return this.getContextualGuidance(app);
}
    },

    getDiscoveryContext(){

    let answers = {};

    try {

        if(
            typeof Evolution !== "undefined"
        ){

            const event =
                Evolution.history.find(item =>
                    item.source === "discovery" &&
                    item.payload &&
                    item.payload.discoveryAnswers
                );

            if(event){
                answers = {
                    ...event.payload
                        .discoveryAnswers
                };
            }

        }

        if(
            Object.keys(answers).length === 0
        ){

            const saved =
                localStorage.getItem(
                    "vaero:discovery:answers"
                );

            if(saved){
                answers =
                    JSON.parse(saved) || {};
            }

        }

    } catch(error) {

        console.warn(
            "Brain Discovery bağlamını okuyamadı:",
            error
        );

    }

    const format = value => {

        if(Array.isArray(value)){
            return value.join(", ");
        }

        return String(
            value || "Henüz belirlenmedi"
        );

    };

    return {
        label:
            "Discovery",

        purpose:
            "Kullanıcının ilk yönünü, ilgi alanlarını, güçlü yönlerini, hedeflerini ve bağlantı beklentilerini taşır.",

        capabilities:
            "Brain bu verileri kişiselleştirilmiş yönlendirme, öneri ve eşleştirme bağlamı olarak kullanabilir.",

        completed:
            Object.keys(answers).length > 0,

        purposeAnswer:
            format(answers.purpose),

        interests:
            format(answers.interest),

        strengths:
            format(answers.strength),

        goal:
            format(answers.goal),

        connections:
            format(answers.connection),

        guidance:
            format(answers.guidance),

        answers: {
            ...answers
        }
    };

},

     getBrainKnowledge(){
    return {
        discovery:
            this.getDiscoveryContext(),
        profile: {
            label: "Profil",
            purpose:
                "Varlığın görünen kimliğini, adını, türünü, açıklamasını ve kendini nasıl ifade ettiğini yönetir.",
            capabilities:
                "Profil bilgilerini görüntüleme ve düzenleme alanıdır.",
            delete:
                "Profilin tamamını silme işlemi henüz tanımlı değil. Ancak profil alanlarının düzenlenmesi veya temizlenmesi desteklenebilir.",
            create:
                "Profil bilgileri ilgili alanlar üzerinden oluşturulabilir ve geliştirilebilir.",
            edit:
                "Profil ekranındaki bilgiler düzenlenebilir. Değişiklikler varlığın görünen yüzünü günceller.",
            search:
                "Profil içindeki bilgiler, profil ekranı ve ileride bağlanacak arama katmanı üzerinden bulunabilir.",
            restore:
                "Profilin eski bir sürümünü geri yükleme özelliği henüz bağlı değil."
        },

        identity: {
            label: "Kimlik",
            purpose:
                "Varlığın VAERO Evreni içindeki temel ve doğrulanabilir kimlik kaydını taşır.",
            capabilities:
                "VA kimliği, doğrulamalar, yetkiler ve ileride EA gibi gelişmiş kimlik katmanlarını yönetir.",
            delete:
                "Temel VA kimliği silinmemelidir. Çünkü bu kimlik varlığın sistem içindeki sürekliliğini temsil eder.",
            create:
                "Temel kimlik varlık oluşturulurken meydana gelir. Gelişmiş kimlik katmanları sonradan eklenebilir.",
            edit:
                "Değiştirilebilir kimlik alanları güncellenebilir; temel kimlik numarası ise değişmez kalmalıdır.",
            search:
                "Kimlik kayıtları doğrulama ve yetki katmanları üzerinden incelenebilir.",
            restore:
                "Doğrulama katmanları sayesinde kaybolan erişimin geri kazanılması hedeflenir."
        },

        memory: {
            label: "Hafıza",
            purpose:
                "Varlığın geçmiş kayıtlarını, önemli konuşmalarını, devam noktalarını ve kalıcı bilgilerini saklar.",
            capabilities:
                "Kayıt oluşturma, geçmişi koruma, devam noktası kaydetme ve ileride arama, arşivleme ve geri yükleme işlemlerini destekler.",
            delete:
                "Kalıcı hafıza kayıtlarını doğrudan silme sistemi henüz tamamlanmadı. Güvenli yaklaşım; silme, arşivleme ve geri yükleme seçeneklerini birbirinden ayırmaktır.",
            create:
                "Yeni hafıza kaydı; konuşma, yaşam olayı, devam noktası veya doğrulanmış sistem hareketinden oluşturulabilir.",
            edit:
                "Hafıza kayıtlarının içeriğini değiştirmek yerine yeni sürüm oluşturmak daha güvenli olacaktır.",
            search:
                "Hafıza kayıtları tarih, konu, uygulama, kişi ve olay türüne göre aranabilir hâle getirilecektir.",
            restore:
                "Arşivlenen veya eski sürümü bulunan kayıtların geri yüklenmesi Hafıza katmanının temel görevlerinden biridir."
        },

        timeline: {
            label: "Timeline",
            purpose:
                "Varlığın zaman içindeki olaylarını ve gelişimini kronolojik olarak gösterir.",
            capabilities:
                "Yaşam olaylarını, uygulama hareketlerini, kilometre taşlarını ve değişimleri tarih sırasıyla tutar.",
            delete:
                "Timeline olaylarını tamamen silmek yerine düzeltme, gizleme veya geçersiz işaretleme daha güvenilir olacaktır.",
            create:
                "Yeni bir olay tarih, saat, açıklama, kaynak ve ilgili organ bilgisiyle oluşturulabilir.",
            edit:
                "Bir olayın açıklaması güncellenebilir; doğrulanmış geçmiş değişiklikleri ayrıca kaydedilmelidir.",
            search:
                "Olaylar tarih, dönem, uygulama ve olay türüne göre bulunabilir.",
            restore:
                "Eski olay kayıtları arşivden yeniden görünür hâle getirilebilir."
        },

        bridge: {
            label: "Köprü",
            purpose:
                "Varlıklar, dünyalar, insanlar, uygulamalar ve sistemler arasındaki bağlantıları yönetir.",
            capabilities:
                "Yeni bağlantı kurma, bağlantıların durumunu görme ve bilgi akışını kontrollü biçimde taşıma amacıyla kullanılır.",
            delete:
                "Bir köprü tamamen silinmeden önce bağlantının kesilmesi, arşivlenmesi veya geçmişinin korunması değerlendirilmelidir.",
            create:
                "Yeni köprü, iki taraf ve bağlantının amacı tanımlanarak oluşturulabilir.",
            edit:
                "Köprünün adı, amacı, izinleri ve bağlantı durumu güncellenebilir.",
            search:
                "Bağlantılar taraf, dünya, uygulama veya bağlantı türüne göre aranabilir.",
            restore:
                "Daha önce kapatılan bir köprü, izinler uygunsa yeniden etkinleştirilebilir."
        },

        organs: {
            label: "Organlar",
            purpose:
                "VAERO içindeki işlevsel uygulamaları tek merkezden gösteren ve yöneten sistemdir.",
            capabilities:
                "Kimlik, Profil, Hafıza, Timeline, Köprü ve Ayarlar gibi organlara erişim sağlar.",
            delete:
                "Temel organlar silinmek yerine devre dışı bırakılmalı veya görünürlüğü değiştirilmelidir.",
            create:
                "Yeni bir organ, sisteme yeni bir işlev kazandıran bağımsız modül olarak eklenebilir.",
            edit:
                "Organların davranışı, izinleri ve diğer organlarla ilişkileri geliştirilebilir.",
            search:
                "Organlar işlevlerine, durumlarına ve bağlı oldukları sistemlere göre bulunabilir.",
            restore:
                "Devre dışı bırakılmış organlar yeniden etkinleştirilebilir."
        },

        settings: {
            label: "Ayarlar",
            purpose:
                "Sistem davranışlarını, kullanıcı tercihlerini, görünümü ve izinleri yönetir.",
            capabilities:
                "Kişiselleştirme, güvenlik, bildirim ve uygulama davranışı ayarlarını kontrol eder.",
            delete:
                "Ayarlar silinmez; gerektiğinde varsayılan değerlere sıfırlanır.",
            create:
                "Yeni ayar seçenekleri sistem geliştikçe eklenebilir.",
            edit:
                "Mevcut tercihler Ayarlar ekranından güncellenebilir.",
            search:
                "Ayar seçenekleri kategori veya isim üzerinden bulunabilir.",
            restore:
                "Tercihler varsayılan değerlere veya önceki yapılandırmaya döndürülebilir."
        },

        brain: {
            label: "Brain",
            purpose:
                "VAERO’nun kullanıcıyla konuşan, bağlamı yorumlayan, uygulamaları yöneten ve sistemler arasında koordinasyon sağlayan düşünme katmanıdır.",
            capabilities:
                "Sohbeti kaydeder, komutları algılar, uygulamalara yönlendirir ve zamanla kullanıcı alışkanlıklarına göre şekillenir.",
            delete:
                "Brain’in kendisi silinmez; sohbet geçmişi ve hafıza kayıtları ayrı politikalarla yönetilir.",
            create:
                "Brain yeni bağlamlar, araçlar ve bilgi katmanlarıyla geliştirilebilir.",
            edit:
                "Brain’in davranışları, izinleri ve cevap üretme kuralları geliştirilebilir.",
            search:
                "Brain geçmiş konuşmaları ve bağlı hafıza kayıtlarını arayabilecek şekilde geliştirilecektir.",
            restore:
                "Brain durumu, saklanan oturumlar ve devam noktaları üzerinden yeniden kurulabilir."
        }
    };
},

getNavigationReply(analysis, fallbackApp = null){
    const topic =
        analysis?.target ||
        analysis?.topic ||
        fallbackApp ||
        "unknown";

    const knowledge =
        this.getBrainKnowledge()[topic];

    const label =
        knowledge?.label ||
        "Uygulama";

    return `${label} açılıyor.`;
},

getQuestionReply(analysis, fallbackApp = null){

    const topic =
        analysis?.topic ||
        fallbackApp ||
        "unknown";

    const operation =
        analysis?.operation ||
        "general";

    const knowledge =
        this.getBrainKnowledge()[topic];

    if(!knowledge){
        return "Sorunun konusunu anladım ancak bu alanın bilgi katmanı henüz oluşturulmadı.";
    }

    if(topic === "discovery"){

        if(!knowledge.completed){
            return "Discovery Journey henüz tamamlanmadı. Yolculuğu tamamladığında hedeflerini, ilgi alanlarını ve bağlantı beklentilerini birlikte değerlendirebilirim.";
        }

        return [
            "Discovery Journey sonuçlarına göre:",
            "",
            `• VAERO’ya geliş amacın: ${knowledge.purposeAnswer}`,
            `• İlgi alanların: ${knowledge.interests}`,
            `• Güçlü yönlerin: ${knowledge.strengths}`,
            `• Şu anki hedefin: ${knowledge.goal}`,
            `• Karşılaşmak istediğin kişiler: ${knowledge.connections}`,
            `• VAERO’dan beklentin: ${knowledge.guidance}`,
            "",
            "Bu bilgileri sana yön gösterirken, fırsatları değerlendirirken ve uygun bağlantıları belirlerken kullanacağım."
        ].join("\n");

    }

    if(operation === "explain"){
        return `${knowledge.label}, ${knowledge.purpose} ${knowledge.capabilities}`;
    }

    if(operation === "purpose"){
        return `${knowledge.label} şu nedenle kullanılır: ${knowledge.purpose}`;
    }

    if(operation === "delete"){
        return knowledge.delete;
    }

    if(operation === "create"){
        return knowledge.create;
    }

    if(operation === "edit"){
        return knowledge.edit;
    }

    if(operation === "search"){
        return knowledge.search;
    }

    if(operation === "restore"){
        return knowledge.restore;
    }

    return `${knowledge.label} hakkında hangi işlemi yapmak istediğini biraz daha açık yazabilirsin. Bu alanın temel amacı: ${knowledge.purpose}`;

},

getRequestReply(analysis, fallbackApp = null){
    const topic =
        analysis?.topic ||
        fallbackApp ||
        "unknown";

    const operation =
        analysis?.operation ||
        "general";

    const knowledge =
        this.getBrainKnowledge()[topic];

    if(!knowledge){
        return "İsteğini aldım ancak bu alanın işlem bilgisi henüz Brain’e eklenmedi.";
    }

    if(operation === "open"){
        return `${knowledge.label} açılıyor.`;
    }

    if(operation === "explain"){
        return `${knowledge.label}, ${knowledge.purpose} ${knowledge.capabilities}`;
    }

    if(operation === "delete"){
        return knowledge.delete;
    }

    if(operation === "create"){
        return knowledge.create;
    }

    if(operation === "edit"){
        return knowledge.edit;
    }

    if(operation === "search"){
        return knowledge.search;
    }

    if(operation === "restore"){
        return knowledge.restore;
    }

    if(operation === "purpose"){
        return `${knowledge.label} şu amaçla kullanılır: ${knowledge.purpose}`;
    }

    return `${knowledge.label} ile ilgili isteğini aldım. Yapmak istediğin işlemi biraz daha açık yazarsan doğru adımı belirleyebilirim.`;
},
    
    getContextualQuestionReply(app){
        const replyMap = {
            organs:
                "Organlar bağlamındaki sorunu aldım. Gerçek düşünme katmanı henüz bağlı olmadığı için şu an yalnızca bağlamı kaydedebiliyorum.",

            identity:
                "Kimlik bağlamındaki sorunu aldım. Kimlik kayıtları, doğrulamalar ve güvenlik katmanı üzerinden ilerleyeceğiz.",

            profile:
                "Profil bağlamındaki sorunu aldım. Profilin görünen bilgiler ve varlığın kendini ifade etme katmanı olduğunu dikkate alacağım.",

            memory:
                "Hafıza bağlamındaki sorunu aldım. Kayıtlar ve devam noktaları üzerinden ilerleyeceğiz.",

            timeline:
                "Timeline bağlamındaki sorunu aldım. Olayların sırası ve geçmiş gelişmeler üzerinden değerlendirme yapılacak.",

            bridge:
                "Bridge bağlamındaki sorunu aldım. Varlıklar, dünyalar ve sistemler arasındaki bağlantıları dikkate alacağım.",

            settings:
                "Ayarlar bağlamındaki sorunu aldım. Sistem tercihleri ve davranış kuralları üzerinden ilerleyeceğiz.",

            unknown:
                "Sorunu aldım. Gerçek düşünme katmanı henüz bağlı olmadığı için şu an mesajı kaydediyor ve bulunduğun bağlamı koruyorum."
        };

        return replyMap[app] || replyMap.unknown;
    },

    getContextualGuidance(app){
        const guidanceMap = {
            organs:
                "Organ Launcher ekranındasın. Buradan Kimlik, Profil, Hafıza, Timeline, Bridge ve Ayarlar uygulamalarına geçebilirsin.",

            identity:
                "Kimlik ekranındasın. Bu alan varlığın VAERO Evreni içindeki temel kimlik kaydını gösterir.",

            profile:
                "Profil ekranındasın. Burada varlığın görünen adı, türü ve tanımı yönetilir.",

            memory:
                "Hafıza ekranındasın. Bu alan varlığın geçmiş kayıtlarını ve hatırlamalarını taşır.",

            timeline:
                "Timeline ekranındasın. Burada varlığın zaman içindeki olay akışı görüntülenir.",

            bridge:
                "Bridge ekranındasın. Bu alan varlıklar ve dünyalar arasındaki bağlantıları yönetir.",

            settings:
                "Ayarlar ekranındasın. Burada sistem davranışları ve varlık tercihleri yönetilir.",

            unknown:
                "VAERO Brain aktif. Bir uygulama açabilir veya ne yapmak istediğini yazabilirsin."
        };

        return guidanceMap[app] || guidanceMap.unknown;
    },

    boot(){
        const status = this.report();

        console.log("VAERO Brain Online");
        console.log(status);

        const events = VAERO.get("events");

        if(events){
            events.on("engine.started", data => {
                console.log("Brain received engine event:", data);
            });

            events.emit("brain.online", status);
        }

        return status;
    }

};

VAERO.register("brain", Brain); 
