const Renderer = {

    mountId: "engine",

    render(){

        const root = document.getElementById(this.mountId);

        if(!root){
            console.error("Engine root not found");
            return;
        }

        root.innerHTML = `
            <main class="vaero-shell">
                <section class="hero-card">
                    <div class="eyebrow">VAERO ENGINE</div>
                    <h1>Living Digital Universe</h1>
                    <p>Brain, Engine and Interface are now separated.</p>
                </section>
            </main>
        `;

    }

};
