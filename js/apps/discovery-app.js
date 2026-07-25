class DiscoveryApp {

    constructor() {

        this.currentStep = 0;
        this.container = null;
        this.storageKey =
            "vaero:discovery:draft";

        this.answers =
            this.loadDraft();

        this.steps = [
            {
                id: "purpose",
                title: "VAERO’ya neden geldin?",
                description:
                    "Buradaki yolculuğunun başlangıç noktasını seç.",
                options: [
                    "Kendimi geliştirmek istiyorum",
                    "Bir fikir veya proje geliştirmek istiyorum",
                    "Doğru insanları bulmak istiyorum",
                    "Yeni fırsatları keşfetmek istiyorum",
                    "Yatırım yapmak veya destek olmak istiyorum"
                ]
            },
            {
                id: "interest",
                title: "Seni en çok hangi dünya çekiyor?",
                description:
                    "VAERO sana uygun alanları önceliklendirecek.",
                options: [
                    "Teknoloji",
                    "Girişimcilik",
                    "Tasarım ve yaratıcılık",
                    "Finans ve yatırım",
                    "Kişisel gelişim",
                    "Toplumsal etki"
                ]
            },
            {
                id: "strength",
                title: "Bu dünyaya ne katabilirsin?",
                description:
                    "Bugünkü en güçlü yönünü seç.",
                options: [
                    "Fikir geliştirebilirim",
                    "Üretebilir ve uygulayabilirim",
                    "Tasarım ve içerik oluşturabilirim",
                    "İnsanları ve ekipleri yönetebilirim",
                    "Bağlantılar kurabilirim",
                    "Sermaye veya kaynak sağlayabilirim",
                    "Henüz güçlü yönümü keşfediyorum"
                ]
            },
            {
                id: "goal",
                title: "Şu an ulaşmak istediğin nokta ne?",
                description:
                    "Bu seçim VAERO’nun sana göstereceği yolu belirleyecek.",
                options: [
                    "Bir proje başlatmak",
                    "Mevcut projemi büyütmek",
                    "Kariyerimi geliştirmek",
                    "Yeni şeyler öğrenmek",
                    "Güçlü bir çevre kurmak",
                    "Doğru yatırım fırsatını bulmak"
                ]
            },
            {
                id: "connection",
                title: "Kimlerle karşılaşmak istersin?",
                description:
                    "VAERO gelecekteki eşleşmelerini buna göre şekillendirecek.",
                options: [
                    "Kurucular ve girişimciler",
                    "Yatırımcılar",
                    "Uzmanlar ve mentorlar",
                    "Üreticiler ve yetenekler",
                    "İş birliği yapabileceğim insanlar",
                    "İlgi alanıma uygun topluluklar"
                ]
            },
            {
                id: "guidance",
                title: "VAERO sana nasıl eşlik etsin?",
                description:
                    "Kontrol her zaman sende kalacak.",
                options: [
                    "Bana yön göstersin",
                    "Gelişimimi takip etsin",
                    "Doğru insanlarla eşleştirsin",
                    "Fırsatları karşıma çıkarsın",
                    "Hepsini dengeli biçimde yapsın"
                ]
            }
        ];

    }

    loadDraft() {

        try {

            const saved =
                localStorage.getItem(
                    "vaero:discovery:draft"
                );

            if(!saved){
                return {};
            }

            const parsed =
                JSON.parse(saved);

            return (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            )
                ? parsed
                : {};

        } catch(error) {

            console.warn(
                "Discovery taslağı okunamadı:",
                error
            );

            return {};

        }

    }

    saveDraft() {

        localStorage.setItem(
            this.storageKey,
            JSON.stringify(this.answers)
        );

    }

    render(container) {

        if(!container){
            return;
        }

        this.container = container;

        const step =
            this.steps[this.currentStep];

        const selectedAnswer =
            this.answers[step.id] || null;

        const progress =
            (
                (this.currentStep + 1) /
                this.steps.length
            ) * 100;

        container.innerHTML = `
            <div class="discovery-screen">

                <div class="discovery-content">

                    <div class="discovery-progress">
                        <span
                            style="width:${progress}%"
                        ></span>
                    </div>

                    <p class="discovery-step">
                        ${this.currentStep + 1}
                        /
                        ${this.steps.length}
                    </p>

                    <h1>${step.title}</h1>

                    <p class="discovery-description">
                        ${step.description}
                    </p>

                    <div class="discovery-options">

                        ${step.options
                            .map(option => `
                                <button
                                    type="button"
                                    class="discovery-option ${
                                        selectedAnswer === option
                                            ? "is-selected"
                                            : ""
                                    }"
                                    data-discovery-option="${option}"
                                >
                                    ${option}
                                </button>
                            `)
                            .join("")}

                    </div>

                    ${
                        this.currentStep > 0
                            ? `
                                <button
                                    type="button"
                                    class="discovery-back"
                                    data-discovery-action="back"
                                >
                                    ← Geri
                                </button>
                              `
                            : ""
                    }

                </div>

            </div>
        `;

        container
            .querySelector(".discovery-screen")
            .addEventListener(
                "click",
                event => {

                    const optionButton =
                        event.target.closest(
                            "[data-discovery-option]"
                        );

                    if(optionButton){

                        this.selectOption(
                            optionButton.dataset
                                .discoveryOption
                        );

                        return;
                    }

                    const actionButton =
                        event.target.closest(
                            "[data-discovery-action]"
                        );

                    if(
                        actionButton &&
                        actionButton.dataset
                            .discoveryAction === "back"
                    ){
                        this.goBack();
                    }

                }
            );

    }

    selectOption(answer) {

        const step =
            this.steps[this.currentStep];

        this.answers[step.id] =
            answer;

        this.saveDraft();

        if(
            this.currentStep <
            this.steps.length - 1
        ){

            this.currentStep += 1;

            this.render(
                this.container
            );

            return;
        }

        this.complete();

    }

    goBack() {

        if(this.currentStep <= 0){
            return;
        }

        this.currentStep -= 1;

        this.render(
            this.container
        );

    }

    complete() {

        const completedAt =
            Date.now();

        localStorage.setItem(
            "vaero:discovery:answers",
            JSON.stringify(this.answers)
        );

        localStorage.setItem(
            "vaero:discovery:completed",
            "true"
        );

        localStorage.setItem(
            "vaero:discovery:completedAt",
            String(completedAt)
        );

        localStorage.removeItem(
            this.storageKey
        );

        if(
            typeof Evolution !== "undefined" &&
            typeof Evolution.record === "function"
        ){

            const alreadyRecorded =
                Evolution.history.some(event =>
                    event.source === "discovery" &&
                    event.title ===
                        "Discovery Journey tamamlandı"
                );

            if(!alreadyRecorded){

                const event =
                    Evolution.record(
                        "milestone",
                        "Kullanıcı ilk keşif yolculuğunu tamamladı.",
                        {
                            title:
                                "Discovery Journey tamamlandı",

                            status:
                                "completed",

                            importance:
                                "high",

                            source:
                                "discovery",

                            tags: [
                                "discovery",
                                "onboarding",
                                "ilk-yolculuk"
                            ],

                            effects: {
                                awareness: 8,
                                experience: 6,
                                connectionReadiness: 5
                            },

                            xp: 15,

                            organs: [
                                "identity",
                                "profile",
                                "memory",
                                "timeline",
                                "bridge",
                                "brain"
                            ],

                            discoveryAnswers: {
                                ...this.answers
                            },

                            journeyVersion: 1,

                            occurredAt:
                                completedAt
                        }
                    );

                if(
                    typeof Evolution
                        .publishLifeEvent ===
                    "function"
                ){
                    Evolution.publishLifeEvent(
                        event
                    );
                }

            }

        }

        window.location.reload();

    }

}

window.DiscoveryApp =
    new DiscoveryApp();
