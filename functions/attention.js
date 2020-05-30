const fetch = require("node-fetch");
const { SLACK_TOKEN } = process.env;

const sendMessage = async (body) => {
  return await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SLACK_TOKEN}`,
    },
    body: JSON.stringify({
      link_names: true,
      ...body,
    }),
  });
};

// Export sendMessage for testing
exports.sendMessage = sendMessage;

// This is a specially-named function automatically called by AWS
exports.handler = async (event, context, callback) => {
  console.log({ body: event.body });
  // Parse out data passed by Slack
  const { channel_id } = JSON.parse(
    '{"' + event.body.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    (key, value) =>
      key === "" ? value : decodeURIComponent(value).replace(/\+/g, " ")
  );

  await sendMessage({
    channel: channel_id,
    username: "Tall Young Man Brandishing a Kelbow",
    icon_url:
      "https://avatars.slack-edge.com/2019-12-16/875487561396_19ba4faf3f132435cf73_192.png",
    blocks: {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Tall Young Man Brandishing a Kelbow*",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Attention 👀",
              },
              style: "primary",
              value: "attention",
            },
          ],
        },
      ],
    },
  });

  // Send response back to Slack
  callback(null, {
    statusCode: 200,
    body: "",
  });
};

sendMessage({
  channel: "#sandbox",

  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Tall Young Man Brandishing a Kelbow*",
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Attention 👀",
          },
          style: "primary",
          value: "attention",
        },
      ],
    },
  ],
})
  .then((res) => res.json())
  .then((res) => console.log(res))
  .catch((e) => console.error(e));
