const fetch = require("node-fetch");
const { SLACK_TOKEN } = process.env;

module.exports.getDataFromSlackRequest = event =>
  JSON.parse(
    '{"' + event.body.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    (key, value) =>
      key === ""
        ? value
        : decodeURIComponent(value)
            .replace(/\+/g, " ")
            .trim()
  );

module.exports.openSimpleModal = async ({ title, text, trigger_id }) =>
  fetch("https://slack.com/api/views.open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SLACK_TOKEN}`
    },
    body: JSON.stringify({
      trigger_id,
      view: {
        type: "modal",
        title: {
          type: "plain_text",
          text: title,
          emoji: true
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text
            }
          }
        ]
      }
    })
  });
