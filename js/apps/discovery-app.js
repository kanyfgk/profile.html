class DiscoveryApp {

    constructor() {

        this.storageKey =
            "vaero:discovery:draft:v2";

        this.container = null;

        const draft =
            this.loadDraft();

        this.currentStep =
            draft.currentStep;

        this.answers =
            draft.answers;

        this.steps = [
            {
                id: "purpose",
                type: "single",
                title: "VAERO’ya neden geldin?",
                description:
                    "Yolculuğunun başlangıç noktasını seç.",
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
                type: "multiple",
                title: "Seni hangi dünyalar çekiyor?",
                description:
                    "Bir veya daha fazla alan seçebilirsin.",
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
                type: "multiple",
                title: "Bu dünyaya ne katabilirsin?",
                description:
                    "Sana uyan güçlü yönleri seç.",
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
                type: "single",
                title: "Şu an ulaşmak istediğin nokta ne?",
                description:
                    "VAERO sana göstereceği yolu buna göre şekillendirecek.",
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
                type: "multiple",
                title: "Kimlerle karşılaşmak istersin?",
                description:
                    "Bir veya daha fazla insan grubunu seçebilirsin.",
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
                type: "single",
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

        if(
            this.currentStep < 0 ||
            this.currentStep >= this.steps.length
        ){
            this.currentStep = 0;
        }

    }

    loadDraft() {

        try {

            const saved =
                localStorage.getItem(
                    "vaero:discovery:draft:v2"
                );

            if(!saved){
                return {
                    currentStep: 0,
                    answers: {}
                };
            }

            const parsed =
                JSON.parse(saved);

            return {
                currentStep:
                    Number.isInteger(parsed.currentStep)
                        ? parsed.currentStep
                        : 0,

                answers:
                    parsed.answers &&
                    typeof parsed.answers === "object" &&
                    !Array.isArray(parsed.answers)
                        ? parsed.answers
                        : {}
            };

        } catch(error) {

            console.warn(
                "Discovery taslağı okunamadı:",
                error
            );

            return {
                currentStep: 0,
                answers: {}
            };

        }

    }

    saveDraft() {

        localStorage.setItem(
            this.storageKey,
            JSON.stringify({
                currentStep:
                    this.currentStep,

                answers:
                    this.answers
            })
        );

    }

    getSelectedAnswers(step) {

        const answer =
            this.answers[step.id];

        if(step.type === "multiple"){

            return Array.isArray(answer)
                ? answer
                : [];

        }

        return answer
            ? [answer]
            : [];

    }

    hasAnswer(step) {

        return (
            this.getSelectedAnswers(step)
                .length > 0
        );

    }

    render(container) {

        if(!container){
            return;
        }

        this.container = container;
        document.body.classList.add(
            "discovery-active"
            );

        const step =
            this.steps[this.currentStep];

        const selectedAnswers =
            this.getSelectedAnswers(step);

        const progress =
            (
                (this.currentStep + 1) /
                this.steps.length
            ) * 100;

        container.innerHTML = `
            <div class="discovery-screen">

                <main class="discovery-content">

                    <div class="discovery-navigation">

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
                                : `
                                    <span
                                        class="discovery-back-placeholder"
                                    ></span>
                                  `
                        }

                        <span class="discovery-count">
                            ${this.currentStep + 1}
                            /
                            ${this.steps.length}
                        </span>

                    </div>

                    <div class="discovery-progress">
                        <span
                            style="width:${progress}%"
                        ></span>
                    </div>

                    <header class="discovery-header">

                        <h1>${step.title}</h1>

                        <p class="discovery-description">
                            ${step.description}
                        </p>

                    </header>

                    <div class="discovery-options">

                        ${step.options
                            .map(option => {

                                const isSelected =
                                    selectedAnswers.includes(
                                        option
                                    );

                                return `
                                    <button
                                        type="button"
                                        class="discovery-option ${
                                            isSelected
                                                ? "is-selected"
                                                : ""
                                        }"
                                        data-discovery-option="${option}"
                                        aria-pressed="${isSelected}"
                                    >
                                        <span>
                                            ${option}
                                        </span>

                                        ${
                                            step.type === "multiple"
                                                ? `
                                                    <span
                                                        class="discovery-check"
                                                        aria-hidden="true"
                                                    >
                                                        ${isSelected ? "✓" : ""}
                                                    </span>
                                                  `
                                                : ""
                                        }
                                    </button>
                                `;

                            })
                            .join("")}

                    </div>

                    ${
                        step.type === "multiple"
                            ? `
                                <button
                                    type="button"
                                    class="discovery-continue"
                                    data-discovery-action="continue"
                                    ${
                                        this.hasAnswer(step)
                                            ? ""
                                            : "disabled"
                                    }
                                >
                                    Devam
                                </button>
                              `
                            : ""
                    }

                </main>

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

                    if(!actionButton){
                        return;
                    }

                    const action =
                        actionButton.dataset
                            .discoveryAction;

                    if(action === "back"){
                        this.goBack();
                    }

                    if(action === "continue"){
                        this.continueJourney();
                    }

                    if(action === "enter"){

    document.body.classList.remove(
    "discovery-active"
);

if(
    window.Engine &&
    typeof window.Engine.start === "function"
){
    window.Engine.start();
}
}

                }
            );

    }

    selectOption(answer) {

    const step =
        this.steps[this.currentStep];

    if(step.type === "multiple"){

        const discoveryStrengthOption =
            "Henüz güçlü yönümü keşfediyorum";

        let selected =
            this.getSelectedAnswers(step);

        if(
            step.id === "strength" &&
            answer === discoveryStrengthOption
        ){

            selected = [
                discoveryStrengthOption
            ];

        } else {

            if(
                step.id === "strength"
            ){
                selected =
                    selected.filter(
                        item =>
                            item !==
                            discoveryStrengthOption
                    );
            }

            if(selected.includes(answer)){

                selected =
                    selected.filter(
                        item => item !== answer
                    );

            } else {

                selected = [
                    ...selected,
                    answer
                ];

            }

        }

        this.answers[step.id] =
            selected;

        this.saveDraft();

        this.container
            .querySelectorAll(
                "[data-discovery-option]"
            )
            .forEach(button => {

                const isSelected =
                    selected.includes(
                        button.dataset
                            .discoveryOption
                    );

                button.classList.toggle(
                    "is-selected",
                    isSelected
                );

                button.setAttribute(
                    "aria-pressed",
                    String(isSelected)
                );

                const check =
                    button.querySelector(
                        ".discovery-check"
                    );

                if(check){
                    check.textContent =
                        isSelected ? "✓" : "";
                }

            });

        const continueButton =
            this.container.querySelector(
                "[data-discovery-action='continue']"
            );

        if(continueButton){
            continueButton.disabled =
                selected.length === 0;
        }

        return;
    }

    this.answers[step.id] =
        answer;

    this.saveDraft();
    this.advance();

}
    continueJourney() {

        const step =
            this.steps[this.currentStep];

        if(!this.hasAnswer(step)){
            return;
        }

        this.advance();

    }

    advance() {

        if(
            this.currentStep <
            this.steps.length - 1
        ){

            this.currentStep += 1;

            this.saveDraft();
            this.render(this.container);

            return;
        }

        this.complete();

    }

    goBack() {

        if(this.currentStep <= 0){
            return;
        }

        this.currentStep -= 1;

        this.saveDraft();
        this.render(this.container);

    }

    complete(){

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
    "vaero:welcome:completed:v2",
    "true"
);

        localStorage.setItem(
            "vaero:discovery:completedAt",
            String(completedAt)
        );

        localStorage.removeItem(
            this.storageKey
        );

        this.recordJourney(
            completedAt
        );

        this.renderCompletion();

    }

    recordJourney(completedAt) {

        if(
            typeof Evolution === "undefined" ||
            typeof Evolution.record !== "function"
        ){
            return;
        }

        const existingEvent =
            Evolution.history.find(event =>
                event.source === "discovery" &&
                event.title ===
                    "Discovery Journey tamamlandı"
            );

        if(existingEvent){

            existingEvent.payload = {
                ...existingEvent.payload,

                discoveryAnswers: {
                    ...this.answers
                },

                journeyVersion: 2
            };

            existingEvent.updatedAt =
                completedAt;

            Evolution.save();

            return;
        }

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

                    journeyVersion: 2,

                    occurredAt:
                        completedAt
                }
            );

        if(
            typeof Evolution.publishLifeEvent ===
            "function"
        ){
            Evolution.publishLifeEvent(
                event
            );
        }

    }

    renderCompletion() {

        if(!this.container){
            return;
        }

        this.container.innerHTML = `
            <div class="discovery-screen">

                <main
                    class="
                        discovery-content
                        discovery-completion
                    "
                >

                    <div class="discovery-completion-mark">
                        ✓
                    </div>

                    <p class="discovery-completion-label">
                        KEŞİF TAMAMLANDI
                    </p>

                    <h1>
                        Yolculuğun hazır.
                    </h1>

                    <p class="discovery-description">
                        VAERO ilk yönünü, ilgi alanlarını
                        ve bağlantı beklentilerini öğrendi.
                        Sistem bundan sonra seninle birlikte
                        gelişecek.
                    </p>

                    <button
                        type="button"
                        class="discovery-enter"
                        data-discovery-action="enter"
                    >
                        VAERO’ya Gir
                    </button>

                </main>

            </div>
        `;

        this.container
            .querySelector(
                "[data-discovery-action='enter']"
            )
            this.container
    .querySelector(
        "[data-discovery-action='enter']"
    )
    .addEventListener(
        "click",
        () => {

            const screen =
    this.container.querySelector(
        ".discovery-screen"
    );

if(screen){

    screen.classList.add(
        "is-leaving"
    );

}

            let transitionLayer = null;

            if(
        window.Engine &&
        typeof window.Engine.start === "function"
    ){

                const discoveryScreen =
    this.container.querySelector(
        ".discovery-screen"
    );

transitionLayer =
    discoveryScreen
        ? discoveryScreen.cloneNode(true)
        : null;

if(transitionLayer){

    transitionLayer.classList.add(
        "discovery-transition-layer"
    );

    document.body.appendChild(
        transitionLayer
    );

}
                
        window.Engine.start();
    }

window.setTimeout(() => {

    document.body.classList.remove(
        "discovery-active"
    );

    if(transitionLayer){
    transitionLayer.remove();
}

}, 450);

        }
    );

    }

}

window.DiscoveryApp =
    new DiscoveryApp();
