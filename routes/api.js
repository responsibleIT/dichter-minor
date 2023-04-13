const { Router } = require("express");

const fetch = require("node-fetch");

require("dotenv").config();

const router = Router();

const endpoint = process.env.ENDPOINT;
const apiKey = process.env.KEY;

const headers = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "text/plain",
};

const fetchKeywords = async (paragraph) => {
  try {
    const response = await fetch(`${endpoint}/keywords`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          paragraph,
        },
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

router.post("/poetry", async (req, res) => {
  const { type, theme } = req.body;

  try {
    const response = await fetch(
      `${endpoint}/poetry?type=${type}&theme=${theme}`,
      {
        headers,
      }
    );

    console.log(response);
    const data = await response.json();

    console.log(data);

    const {
      data: { paragraph },
    } = data;

    const keywords = await fetchKeywords(paragraph);
    res.send(keywords);
  } catch (error) {
    console.error(error);
    return error;
  }
});

router.post("/rewrite", async (req, res) => {
  const { oldWord, newWord, paragraph } = req.body;

  try {
    const response = await fetch(
      `${endpoint}/rewrite?old=${oldWord}&new=${newWord}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: {
            paragraph,
          },
        }),
      }
    );
    const data = await response.json();
    const {
      data: { paragraph: newParagraph },
    } = data;

    const keywords = await fetchKeywords(newParagraph);
    res.send(keywords);
  } catch (error) {
    console.error(error);
    return error;
  }
});

module.exports = router;
