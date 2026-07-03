const Engine = {

    start(){

        VAERO.engine = this;

        Renderer.render();

        console.log("VAERO Engine Started");

    }

};

Engine.start();
