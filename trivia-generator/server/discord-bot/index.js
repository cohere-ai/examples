const { Client, Intents } = require("discord.js");
const { App } = require("@slack/bolt");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const FEEDBACK_CHANNEL_IDS = [
  "986652169845477457",
  "954421988783444045",
  "954428992339988561",
  "954431217560879134",
  "954426737155006485",
];

const SLACK_BOT_TOKEN = process.env.SLACK_TOKEN;
const SLACK_BOT_SECRET = process.env.SLACK_SECRET;

const PRODUCT_FEEDBACK_CHANNEL = "C03DKC77B0T";
const FEEDBACK_MODEL_ID = "4ca6a01c-1755-4deb-963e-86a7818d5154-ft";

const slack = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_BOT_SECRET,
});

const USER_MAP = {
  Growth: "U02L7MH28FM", // Elliot
  "Platform OS": "U02PUQAMTR7", // Elaine
  Eval: "U02KKFNR692", // Ellie
  "API-SDK": "U03CT3Y0J8J", // Adrian
};

const createFeedbackBot = (cohereClient) =>
  new Promise((resolve) => {
    const client = new Client({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
    });

    const classifyMessage = async (message) => {
      const response = await cohereClient.classify({
        model: FEEDBACK_MODEL_ID,
        inputs: [message],
      });

      if (
        !!response.body.classifications &&
        !!response.body.classifications[0]
      ) {
        let [prediction, best] = ["", 0];
        for (const { option, confidence } of response.body.classifications[0]
          .confidences) {
          if (confidence > best) {
            prediction = option;
            best = confidence;
          }
        }

        return [prediction, best];
      }
    };

    client.once("ready", () => {
      return resolve();
    });

    client.on("messageCreate", async (msg) => {
      const { author, channelId, content } = msg;
      if (FEEDBACK_CHANNEL_IDS.indexOf(channelId) !== -1) {
        const [prediction, confidence] = await classifyMessage(content);

        if (confidence > 0.8) {
          const tag = USER_MAP[prediction];
          const message = `${!!tag ? `<@${tag}> ` : ""}${
            author.username
          } just gave some product feedback for ${prediction} on Discord:\n\n${content}`;
          await slack.client.chat.postMessage({
            channel: PRODUCT_FEEDBACK_CHANNEL,
            text: message,
          });
          console.log(
            `message had label ${prediction} with score ${confidence}`
          );
        } else {
          console.log(
            `message had label ${prediction} with score ${confidence} so it was ignored:\n${content}`
          );
        }
      }
    });

    client.login(DISCORD_TOKEN);
  });

module.exports = { createFeedbackBot };
