class DiscoveryApp {

    constructor() {
        this.currentStep = 0;
        this.answers = {};
    }

    render(container) {

        container.innerHTML = `
            <div class="discovery-screen">

                <div class="discovery-content">

                    <h1>Discovery Journey</h1>

                    <p>
                        Burası geçici ekrandır.
                    </p>

                </div>

            </div>
        `;

    }

}

window.DiscoveryApp = DiscoveryApp;