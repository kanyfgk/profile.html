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

        localStorage.setItem(
            "vaero:discovery:answers",
            JSON.stringify(
                this.answers
            )
        );

        localStorage.setItem(
            "vaero:discovery:completed",
            "true"
        );

        window.location.reload();

    }

}

window.DiscoveryApp =
    new DiscoveryApp();
