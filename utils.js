const fetch = require("node-fetch");
const { SLACK_TOKEN } = process.env;

getDataFromSlackRequest = event =>
  JSON.parse(
    '{"' + event.body.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    (key, value) =>
      key === ""
        ? value
        : decodeURIComponent(value)
          .replace(/\+/g, " ")
          .trim()
  );

openSimpleModal = async ({ title, text, trigger_id }) =>
  openModal({
    title,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text
        }
      }
    ],
    trigger_id
  });

pushModal = async ({ title, blocks, trigger_id }) =>
  fetch("https://slack.com/api/views.push", {
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
        blocks
      }
    })
  });

openModal = async ({ title, blocks, trigger_id }) =>
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
        blocks
      }
    })
  });

module.exports = {
  getDataFromSlackRequest,
  openSimpleModal,
  openModal
};
