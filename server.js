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

const poemTypes = {
    1: "limerick",
    2: "elevenie",
    "elfje": "elevenie",
    3: "ollekebolleke",
    4: "snelsonnet",
    5: "haiku",
    6: "romantisch drama plot",
    7: "tragedie plot",
    8: "manifest",
    9: "essay",
    10: "six word story",
    11: "toneel opening tragedie",
    12: "toneel opening komedie",
    13: "sinterklaasgedicht",
}
let messages = [];

function clean(jsonString) {
    let startIndex = jsonString.indexOf("{");
    if (startIndex === -1) {
        return "";
    }
    let endIndex = jsonString.lastIndexOf("}");
    if (endIndex === -1) {
        return "";
    }
    return jsonString.substring(startIndex, endIndex + 1);
}

function continuePoem(oldWord, newWord) {
    messages.push({
        "role": "user",
        "content": `Can you replace ${oldWord} with ${newWord} in the paragraph text?: Try to make it fit and rewrite the text starting from the replaced word. Change it up a bit, make something cool. Output in Dutch please and the text needs to be the same poem type as the original text.`
    });

    messages.push({
        "role": "system",
        "content": "Output format in a valid JSON like {paragraph: '...', keywords: [{keyword: lopen, alternatives: [rennen, springen, ...]}, ...]}." +
            "Also use proper punctuation, no weird characters like newlines. Extract between 2 and 6 keywords from the text, " +
            "which are of importance for the text. Can you generate some other words for each keyword. these keywords need to be completely unrelated. For example voetbal: honkbal, schilderen, koken. or lopen: schilderen, zwemmen, zeuren, praten or mooi: lang, kort, lelijk, goed." +
            "I only want the Output in a valid JSON format like {paragraph: '...', keywords: [{keyword: lopen, alternatives: [rennen, springen, ...]}, ...]}."
    });

    return messages;
}

function api_generate(poemType, themes) {
    let msgs = [];
    poemType = poemTypes[poemType] || poemType;
    msgs.push({
        "role": "user",
        "content": `Can you create part of a Dutch ${poemType} about these themes?: ${themes}`
    });


    switch (poemType) {
        case "limerick":
            msgs.push({
                "role": "system",
                "content": "Schrijf een limerick van vijf regels met een metrum van twee regels met drie amfibrachen, " +
                    "twee regels met een amfibrachys en een jambe en afgesloten door weer een regel met drie amfibrachen met een rijmschema is a a b b a."
            });
            break;
        case "elevenie":
            msgs.push({
                "role": "system",
                "content": "Schrijf een elfje van elf woorden op vijf dichtregels. " +
                    "De woorden worden als volgt verdeeld de eerste dichtregel: een woord de tweede regel: twee woorden de derde regel: " +
                    "drie woorden de vierde regel: vier woorden de vijfde regel: één woord, dat het gedicht samenvat. "
            });
            break;
        case "ollekebolleke":
            msgs.push({
                "role": "system",
                "content": "Schrijf een Ollekebolleke met twee strofen van elk vier versregels met schema abcd efgd gebruik metrum dactylus met varianten."
            });
            break;
        case "snelsonnet":
            msgs.push({
                "role": "system",
                "content": "Schrijf een snelsonnet met een kwatrijn van 4 regels, gevolgd door een distichon van 2 regels. " +
                    "Als metrum dient de vijfvoetige jambe met 10 of 11 lettergrepen, afwisselend onbeklemtoond en beklemtoond. " +
                    "Het rijm van het kwatrijn heeft rijmschema A-B-B-A en de regels van het distichon rijmen op elkaar met rijmschema: C-C " +
                    "maar nooit op een van beide reeds in het kwatrijn gebruikte rijmklanken. Na de laatste zin van het kwatrijn volgt een chute, " +
                    "zodanig dat het distichon de in het kwatrijn betrokken stelling relativeert."
            });
            break;
        case "haiku":
            msgs.push({
                "role": "system",
                "content": "Schrijf een Haiku van drie regels waarvan de eerste regel 5, de tweede regel 7 en de derde regel weer 5 lettergrepen telt."
            });
            break;

        case "essay":
            msgs.push({
                "role": "system",
                "content": "Schrijf een essay van max 500 woorden over het onderwerp."
            });
            break;
        case "six word story":
            msgs.push({
                "role": "system",
                "content": "Schrijf een six word story van maximaal 6 woorden."
            });
            break;
        case "toneel opening tragedie":
            msgs.push({
                "role": "system",
                "content": "Schrijf een toneel openings dialoog van een tragedie voor de eerste akte. So this is a script dialogue between one or more characters, I want this to be like for example bobby: blablabla, susan: blablabla."
            });
            break;
        case "toneel opening komedie":
            msgs.push({
                "role": "system",
                "content": "Schrijf een toneel openings dialoog van een komedie voor de eerste akte. So this is a script dialogue between one or more characters, I want this to be like for example bobby: blablabla, susan: blablabla."
            });
            break;

        case "sinterklaasgedicht":
            msgs.push({
                "role": "system",
                "content": "Write a Dutch saint nicholas poem. This poem has to tease the recipient a bit. Rhyme scheme is aa bb cc. It is mandatory for this to rhyme IN DUTCH based on the last word of the sentence!" +
                    "Exactly 2 lines please. A line has to end with a period. I want a newline character for each line."
            });
            break;
    }

    msgs.push({
        "role": "system",
        "content": "Output format in a valid JSON like {\"paragraph\": \"this is a paragraph\"}. This JSON has to be parsable! Also use proper punctuation."
    });


    return msgs;
}

function api_alt_gen(keywords) {
    let msgs = [];
    msgs.push({
        "role": "user",
        "content": `Can you generate some other words for each keyword these keywords need to be completely unrelated. 
        For example voetbal: honkbal, schilderen, koken. or lopen: schilderen, zwemmen, zeuren, praten or mooi: lang, kort, lelijk, goed. Here are the keywords: ${keywords}`
    });

    msgs.push({
        "role": "system",
        "content": "Between 3 and 10 alternatives for each keyword. The output format in a valid JSON like {keywords: [{keyword: lopen, alternatives: [bakken, huilen, ...]}]}"
    });

    return msgs;
}

async function getCompletion(prompts, isTurbo) {
    const completion = await openai.createChatCompletion({
        model: isTurbo ? "gpt-3.5-turbo" : "gpt-4",
        messages: prompts,
    });

    let output = clean(completion.data.choices[0].message.content);
    return JSON.parse(output);
}

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

            const completion = await openai.createChatCompletion({
                model: "gpt-4",
                messages: msgs,
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