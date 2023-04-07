const fastify = require('fastify')({logger: true});
const {Configuration, OpenAIApi} = require("openai");
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
require('dotenv').config();


const configuration = new Configuration({
    apiKey: process.env.KEY,
});

const openai = new OpenAIApi(configuration);
const poemTypes = {
    1: "limerick",
    3: "elevenie",
    "elfje": "elevenie",
    5: "ollekebolleke",
    6: "snelsonnet",
    7: "haiku",
    8: "romantisch drama plot",
    9: "tragedie plot",
    10: "manifest",
    11: "essay"
}
let messages = [];

function generate(poemType, themes) {
    poemType = poemTypes[poemType]
    messages.push({
        "role": "user",
        "content": `Can you create part of a Dutch ${poemType} about these themes?: ${themes}`
    });


    switch (poemType) {
        case "limerick":
            messages.push({
                "role": "system",
                "content": "Schrijf een limerick van vijf regels met een metrum van twee regels met drie amfibrachen, " +
                    "twee regels met een amfibrachys en een jambe en afgesloten door weer een regel met drie amfibrachen met een rijmschema is a a b b a."
            });
            break;
        case "elevenie":
            messages.push({
                "role": "system",
                "content": "Schrijf een elfje van elf woorden op vijf dichtregels. " +
                    "De woorden worden als volgt verdeeld de eerste dichtregel: een woord de tweede regel: twee woorden de derde regel: " +
                    "drie woorden de vierde regel: vier woorden de vijfde regel: één woord, dat het gedicht samenvat. "
            });
            break;
        case "ollekebolleke":
            messages.push({
                "role": "system",
                "content": "Schrijf een Ollekebolleke met twee strofen van elk vier versregels met schema abcd efgd gebruik metrum dactylus met varianten"
            });
            break;
        case "snelsonnet":
            messages.push({
                "role": "system",
                "content": "Schrijf een snelsonnet met een kwatrijn van 4 regels, gevolgd door een distichon van 2 regels. " +
                    "Als metrum dient de vijfvoetige jambe met 10 of 11 lettergrepen, afwisselend onbeklemtoond en beklemtoond. " +
                    "Het rijm van het kwatrijn heeft rijmschema A-B-B-A en de regels van het distichon rijmen op elkaar met rijmschema: C-C " +
                    "maar nooit op een van beide reeds in het kwatrijn gebruikte rijmklanken. Na de laatste zin van het kwatrijn volgt een chute, " +
                    "zodanig dat het distichon de in het kwatrijn betrokken stelling relativeert."
            });
            break;
        case "haiku":
            messages.push({
                "role": "system",
                "content": "Schrijf een Haiku van drie regels waarvan de eerste regel 5, de tweede regel 7 en de derde regel weer 5 lettergrepen telt."
            });
            break;

        case "essay":
            messages.push({
                "role": "system",
                "content": "Schrijf een essay van max 500 woorden over het onderwerp"
            });
    }

    messages.push({
        "role": "system",
        "content": "Output format in a valid JSON like {paragraph: '...', keywords: [{keyword: lopen, alternatives: [rennen, springen, ...]}, ...]}." +
            "Use proper punctuation. Extract between 2 and 6 important adjectives, nouns and/or verbs from the text, " +
            "which are of importance for the text. Generate between 4 and 8 alternatives for each keyword."
            + "Output format in a valid JSON like {paragraph: '...', keywords: [{keyword: lopen, alternatives: [rennen, springen, ...]}, ...]}."
    });

    return messages;
}

function continuePoem(oldWord, newWord) {
    messages.push({
        "role": "user",
        "content": `Can you replace ${oldWord} with ${newWord} in this text? Try to make it fit and further continue the text.`
    });

    messages.push({
        "role": "system",
        "content": "Output format in a valid JSON like {paragraph: '...', keywords: [{keyword: lopen, alternatives: [rennen, springen, ...]}, ...]}." +
            "Use proper punctuation. Extract between 2 and 6 important adjectives, nouns and/or verbs from the text, " +
            "which are of importance for the text. Generate between 4 and 8 alternatives for each keyword."
            + "I only want the Output in a valid JSON format like {paragraph: '...', keywords: [{keyword: lopen, alternatives: [rennen, springen, ...]}, ...]}."
    });

    return messages;
}

fastify.register(require('@fastify/cookie'), {
    secret: [process.env.BLOOM, process.env.BLOOM2],
    hook: 'onRequest'
});

fastify.register(require('@fastify/view'), {
    engine: {
        eta: require("eta"),
    },
});

fastify.register(require('@fastify/formbody'))

fastify.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute'
});
fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).view('/views/error.eta', {title: 'Error | Stadsdichter'});
});

fastify.get('/', async (request, reply) => {
    const nonce = crypto.randomBytes(16).toString('base64');
    reply
        .cookie('__sesh', nonce, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: true,
            signed: true,
        })
        .view('/views/index.eta', {title: 'Home | Stadsdichter'});
});

function clean(jsonString) {
    let startIndex = jsonString.indexOf("{");
    if (startIndex === -1) {
        // no opening curly brace found, return empty string
        return "";
    }
    let endIndex = jsonString.lastIndexOf("}");
    if (endIndex === -1) {
        // no closing curly brace found, return empty string
        return "";
    }
    return jsonString.substring(startIndex, endIndex + 1);
}


fastify.post('/', async (request, reply) => {
    let cookie = request.cookies.__sesh;
    if (!cookie || !fastify.unsignCookie(cookie).valid) {
        reply.status(401).send({"message": "Unauthorized"});
    } else {
        let poemType = poemTypes[request.body["type"]] || Object.keys(poemTypes).find(key => poemTypes[key] === request.body["type"]);
        let theme = request.body["theme"];

        if (!poemType || !theme) {
            reply.status(400).send({"message": "Missing theme or poem type"});
        }

        let prompts = generate(poemType, theme);

        const completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: prompts,
        });

        let output = JSON.parse(completion.data.choices[0].message.content);

        // let output = JSON.parse(fs.readFileSync(path.join(__dirname, 'dummy.json')));

        return reply.view('/views/output.eta', {data: output});
    }
});

fastify.get('/cont', async (request, reply) => {
    let cookie = request.cookies.__sesh;
    if (!cookie || !fastify.unsignCookie(cookie).valid) {
        reply.status(401).send({"message": "Unauthorized"});
    } else {
        let oldWord = Object.keys(request.query)[0];
        let newWord = Object.values(request.query)[0];

        let prompts = continuePoem(oldWord, newWord);

        const completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: prompts,
        });

        console.log(completion.data.choices[0].message.content);

        let output = JSON.parse(clean(completion.data.choices[0].message.content));

        // let output = JSON.parse(fs.readFileSync(path.join(__dirname, 'dummy.json')));

        return reply.view('/views/output.eta', {data: output});
    }
});

const start = async () => {
    try {
        await fastify.listen({host: "0.0.0.0", port: process.env.PORT || 3000})
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()