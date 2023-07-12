const fastify = require('fastify')({logger: true});
const auth = require('@fastify/auth')
const bearerAuthPlugin = require('@fastify/bearer-auth')
const {Configuration, OpenAIApi} = require("openai");
const extractor = require("keyword-extractor");
const crypto = require('crypto');
require('dotenv').config();

fastify.register(require('@fastify/cookie'), {
    secret: [process.env.BLOOM, process.env.BLOOM2],
    hook: 'onRequest'
});

fastify.register(require('@fastify/view'), {
    engine: {
        eta: require("eta"),
    },
});

fastify.register(require('@fastify/formbody'));

fastify.register(require('@fastify/cors'));

fastify.register(require('@fastify/rate-limit'), {
    max: 1000,
    timeWindow: '1 minute'
});

fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).view('/views/error.eta', {title: 'Error | Consensus Machine', authenticated: false});
});

const configuration = new Configuration({
    apiKey: process.env.KEY,
});

const openai = new OpenAIApi(configuration);

const start = async () => {
    const keys = new Set([process.env.BK]);
    await fastify
        .register(auth)
        .register(bearerAuthPlugin, {addHook: false, keys, verifyErrorLogLevel: 'debug'});

    fastify.get('/', async (request, reply) => {
        const nonce = crypto.randomBytes(16).toString('base64');
        let statement = "Wij hebben met belangstelling kennisgenomen van de uitspraak van het college." +
            "Bij bijzondere omstandigheden zijn wij van mening dat het inzetten van proctoringsoftware bij high stake toetsing alsnog te gerechtvaardigd is.\n" +
            "Gedurende de coronaperiode hebben wij gebruik gemaakt van proctoringsoftware. Deze software hebben wij zorgvuldig in lijn met ons beleid op integrale veiligheid ingericht. Ons zijn geen problemen of klachten bekend zoals in deze zaak voorlagen.\n" +
            "In de toekomst zullen wij in vooraf bepaalde specifieke gevallen gebruik blijven maken van proctoringsoftware waarbij wij altijd zeer zorgvuldig zullen handelen"
        reply
            .cookie('__sesh', nonce, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: true,
                signed: true,
            })
            .view('/views/consensus.eta', {
                title: 'Consensus Machine',
                bk: process.env.BK,
                host: process.env.ENDPOINT,
                statement: statement
            });
    });

    fastify.post("/initarg", async (request, reply) => {
        let cookie = request.cookies.__sesh;
        if (!cookie || !fastify.unsignCookie(cookie).valid) {
            reply.status(401).send({"message": "Unauthorized"});
        } else {


            let statement = request.body.statement
            console.log(statement)

            let msgs = [];
            msgs.push({
                "role": "user",
                "content": `De stelling is : ${statement} Verzin vijf argumenten die kloppen met de stelling. Hou ze kort en in het nederlands! Max 15 woorden per argument. Begin met een kleine letter.
            Kun je in de prompt voor de argumenten verwerken dat hij de argumenten moet baseren op deze onderwijswaarden?: Onderwijswaarden: rechtvaardigheid (gelijke kansen, inclusiviteit, integriteit), 
            menselijkheid (sociale samenhang, respect, veiligheid, welzijn), 
            autonomie (zelfbeschikking, privacy, onafhankelijkheid, vrijheid).
            Maak de argumenten grammaticaal correct en passend in de context van de statement wanneer deze wordt geplaatst. Dus de argumenten moet passen op de plek
            van de ...
            Do not include any explanations, only provide a RFC8259 compliant JSON response  following this format without deviation.
                        Like {arguments: [arg1, arg2]}.`
            });

            const completion = await openai.createChatCompletion({
                model: "gpt-4",
                messages: msgs,
            });

            let data = JSON.parse(completion.data.choices[0].message.content)

            return `<div id="statement-text">
                    ${statement.split("…")[0]}
                    <select id="argument">
                    ${data.arguments.map((arg) => {
                return `<option value="${arg}">${arg}</option>`
            })}
                    </select>
                    <input type="hidden" id="statement-input" name="statement" value=\`\`>   
                    </div>
                    <script>
                        document.getElementById("argument").addEventListener("change", () => {
                        document.getElementById("statement-input").value = (document.getElementById("statement-text").innerHTML.split("<")[0] + document.getElementById("argument").value); 
                        });
                    </script>`
        }
    });


    fastify.post('/consensus', async (request, reply) => {
        let cookie = request.cookies.__sesh;
        if (!cookie || !fastify.unsignCookie(cookie).valid) {
            reply.status(401).send({"message": "Unauthorized"});
        } else {
            let statement = request.body.statement

            let msgs = [];
            msgs.push({
                "role": "user",
                "content": `De stelling is : ${statement} Kan jij een argument voor, tegen en voor gegeven een voorwaarde verzinnen bij deze stelling?.
            Verzin negen argumenten. Drie per voor, tegen, en voorwaarde. Hou ze kort en in het nederlands! Max 10 woorden per argument.
            Kun je in de prompt voor de argumenten verwerken dat hij de argumenten moet baseren op deze onderwijswaarden?: Onderwijswaarden: rechtvaardigheid (gelijke kansen, inclusiviteit, integriteit), 
            menselijkheid (sociale samenhang, respect, veiligheid, welzijn), 
            autonomie (zelfbeschikking, privacy, onafhankelijkheid, vrijheid).
            Maak de argumenten grammaticaal correct en passend in de context van de statement wanneer deze wordt geplaatst.
            Do not include any explanations, only provide a RFC8259 compliant JSON response  following this format without deviation.
                        Like {eens: ["eens argument"], oneens: ["oneens argument"], mits: ["mits argument"]}.`
            });

            let msgs2 = [];
            msgs2.push({
                "role": "user",
                "content": `${statement} \nSchrijf drie versies van deze statement die eens, oneens, of mits zijn met de originele statement. " +
                    "Probeer zo min mogelijk van de originele statement aan te passen, max drie woorden. " +
                    "Geef bij elk van deze statements een woordgroep met aaneengesloten woorden die per zin van elkaar verschillen " +
                    "en die het duidelijkst aangeven wat de opinie van de statement is. Geef alleen de zin"
                     Do not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.
                     Like {eens: {statement: "eens statement", replacement: "words to be replaced"}, 
                     oneens: {statement: "oneens statement", replacement: "words to be replaced"}, 
                     mits: {statement: "mits argument", replacement: "words to be replaced"}}.\``
            });

            const completion = await openai.createChatCompletion({
                model: "gpt-4",
                messages: msgs,
            });

            const completion2 = await openai.createChatCompletion({
                model: "gpt-4",
                messages: msgs2,
            }).then((res) => {
                console.log(res.data.choices[0].message.content)
            });

            let args = JSON.parse(completion.data.choices[0].message.content)
            return `<option disabled selected>Selecteer een argument</option>
                <optgroup label="eens">
                ${args.eens.map((arg) => `<option>${arg}</option>`)}
                </optgroup>
                <optgroup label="oneens">
                ${args.oneens.map((arg) => `<option>${arg}</option>`)}
                </optgroup>
                <optgroup label="mits">
                ${args.mits.map((arg) => `<option>${arg}</option>`)}
                </optgroup>`
        }
    });

    fastify.post('/consensusrewrite', async (request, reply) => {
        let cookie = request.cookies.__sesh;
        if (!cookie || !fastify.unsignCookie(cookie).valid) {
            reply.status(401).send({"message": "Unauthorized"});
        } else {
            let statement = request.body.statement;
            let msgs = [];
            msgs.push({
                "role": "user",
                "content": `Kan je deze tekst met de toegevoegde voor- en tegenargumenten herschrijven, zodat het lekker leest 
            en herschrijf de mening in de tekst gebaseerd op de hoeveelheid voor- en tegenargumenten? 
            Houdt het kort!: ${statement}.
            `
            });

            const completion = await openai.createChatCompletion({
                model: "gpt-4",
                messages: msgs,
            });

            return completion.data.choices[0].message.content
        }
    });


    try {
        await fastify.listen({host: "0.0.0.0", port: process.env.PORT || 3000})
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()