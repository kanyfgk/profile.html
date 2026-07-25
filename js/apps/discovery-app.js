class DiscoveryApp {

    constructor() {

        this.currentStep = 0;
        this.answers = {};
        this.container = null;

        this.steps = [
            {
                id: "identity",
                title: "Seni nasıl tanıyalım?",
                description:
                    "VAERO yolculuğunu sana göre şekillendirecek.",
                options: [
                    "Kendimi keşfetmek istiyorum",
                    "Bir hedefe ulaşmak istiyorum",
                    "Yeni bağlantılar kurmak istiyorum"
                ]
            },
            {
                id: "focus",
                title:
                    "Şu an hayatında en çok neye odaklanıyorsun?",
                options: [
                    "Kariyer",
                    "Kişisel gelişim",
                    "İlişkiler",
                    "Finans",
                    "Sağlık"
                ]
            },
            {
                id: "direction",
                title:
                    "VAERO sana nasıl eşlik etsin?",
                options: [
                    "Beni yönlendirsin",
                    "Gelişimimi takip etsin",
                    "Doğru insanlarla eşleştirsin"
                ]
            }
        ];

    }

    render(container) {

        if(!container){
            return;
        }

        this.container = container;

        const step =
            this.steps[this.currentStep];

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

                    <h1>
                        ${step.title}
                    </h1>

                    ${
                        step.description
                            ? `
                                <p class="discovery-description">
                                    ${step.description}
                                </p>
                              `
                            : ""
                    }

                    <div class="discovery-options">

                        ${step.options
                            .map(option => `
                                <button
                                    type="button"
                                    class="discovery-option"
                                    data-discovery-option="${option}"
                                >
                                    ${option}
                                </button>
                            `)
                            .join("")}

                    </div>

                </div>

            </div>
        `;

        const options =
            container.querySelector(
                ".discovery-options"
            );

        options.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-discovery-option]"
                    );

                if(!button){
                    return;
                }

                this.selectOption(
                    button.dataset.discoveryOption
                );

            }
        );

    }

    selectOption(answer) {

        const step =
            this.steps[this.currentStep];

        this.answers[step.id] =
            answer;

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

    complete() {

    const completedAt = Date.now();

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

            const event = Evolution.record(
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
                        awareness: 5,
                        experience: 5
                    },

                    xp: 10,

                    organs: [
                        "identity",
                        "profile",
                        "memory",
                        "timeline",
                        "brain"
                    ],

                    discoveryAnswers: {
                        ...this.answers
                    },

                    occurredAt:
                        completedAt
                }
            );

            if(
                typeof Evolution.publishLifeEvent ===
                "function"
            ){
                Evolution.publishLifeEvent(event);
            }

        }

    }

    window.location.reload();

}

}

window.DiscoveryApp =
    new DiscoveryApp();
