// server/index.js
const path = require("path");
const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();
const cohere = require("cohere-ai");
const { createFeedbackBot } = require("./discord-bot");

const startApp = async () => {
  console.log("Creating cohere client");
  cohere.init(process.env.COHERE_API_KEY, "2021-11-08");
  console.log("Cohere client created");

  console.log("Starting feedback bot...");
  await createFeedbackBot(cohere);
  console.log("Feedback bot started");

  app.use(express.static(path.resolve(__dirname, "../client/build")));

  app.get("/health", (_, res) => {
    res.json({ message: "healthy" });
  });

  app.get("/api", async (req, res) => {
    const prompt =
      `This is a trivia question generation tool. It generates questions related to a given topic.\n-\nTopic: History\nQ: Who invented penicillin?\n-\nTopic: Entertainment\nQ: What was the first toy to be advertised on television?\n-\nTopic: Sports\nQ: Which two countries have not missed one of the modern-day Olympics?\n-\nTopic: Geography\nQ: What is the smallest country in the world?\n-\nTopic: Food \nQ: What is the rarest M&M color?\n-\nTopic: Switzerland\nQ: What country consumes the most chocolate per capita? \n- \nTopic: India\nQ: What is the name given to Indian food cooked over charcoal in a clay oven?\n-\nTopic: Space\nQ: What was the first soft drink in space?\n-\nTopic: Cheese\nQ: From which country does Gouda cheese originate?\n-\nTopic: Disney\nQ: What was the first feature-length animated movie ever released?\n-\nTopic: Books\nQ: Who authored Sherlock Holmes? \n-\nTopic: Entertainment\nQ: What awards has an EGOT winner won?\n-\nTopic: Music\nQ: Which member of the Beatles married Yoko Ono?\n-\nTopic: Soccer\nQ: Which country won the first-ever soccer World Cup in 1930?\n-\nTopic: Basketball\nQ: Which Former NBA Player Was Nicknamed Agent Zero?\n-\nTopic: Gymnastics \nQ: Who was the first gymnast to score a perfect 10 score?\n-\nTopic: Volleyball\nQ: Dump, floater, and wipe are terms used in which team sport?\n-\nTopic: Formula 1\nQ: Who was the first female driver to score points in a Grand Prix?\n-\nTopic: United States\nQ: In which state is Area 51 located? \n-\nTopic: Animals\nQ: How long do elephant pregnancies last?\n-\nTopic: Science\nQ: In what type of matter are atoms most tightly packed?\n-\nTopic: Anatomy\nQ: How many teeth does an adult human have?\n-\nTopic: Etymology\nQ: Who invented the word vomit?\n-\nTopic: ${req.query.prompt}` ||
      "";
    const response = await cohere.generate({
      model: "large",
      prompt,
      max_tokens: 50,
      temperature: 0.5,
      k: 0,
      p: 0.75,
      stop_sequences: ["-"],
    });
    response.body.prompt = prompt;
    res.json(response.body);
  });

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
};

startApp();
