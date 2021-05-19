const fetch = require("node-fetch");
const { getDataFromSlackRequest } = require("../utils");
const { appendToDocument } = require("../google-utils");
const { SLACK_TOKEN, SCRIBBLE_DOCUMENT_ID, GM_USERNAME, USER_SCRIBBLE_DOCUMENT_ID, PRIVILEGED_USERNAME } = process.env;

const main = async (channel_id, destination) => {
  // Get channel name
  const { channel } = await (
    await fetch(
      `https://slack.com/api/conversations.info?channel=${channel_id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
        },
      }
    )
  ).json();

  // Get all messages in channel
  let messagesRes = await fetch(
    `https://slack.com/api/conversations.history?channel=${channel_id}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
      },
    }
  );

  let messages = await messagesRes.json();

  console.log({ messagesRes, messages });

  // Ensure chronological order
  messages = messages.messages.sort((a, b) => a.ts - b.ts);

  // Fetch every user present in the channel (messages contain user IDs, not names)
  const usersToLookup = messages
    .map((message) => message.user)
    .filter((user, index, users) => user && users.indexOf(user) === index);
  let userIdsToNames = await Promise.all(
    usersToLookup.map(async (user) => {
      const res = await fetch(`https://slack.com/api/users.info?user=${user}`, {
        headers: {
          Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
        },
      });
      return await res.json();
    })
  );

  // Create map of user IDs to display names
  userIdsToNames = userIdsToNames.reduce((acc, user) => {
    acc[user.user.id] = user.user.profile.real_name;
    return acc;
  }, {});

  console.log({ userIdsToNames });

  // Replace user IDs with display names
  let lines = [
    channel.name,
    "==================================================================",
    ...messages.map((message) => {
      const date = new Date(message.ts * 1000);
      return `${date.getFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()} ${
        message.username || userIdsToNames[message.user]
      }: ${message.text}`;
    }),
  ].join("\n");
  Object.keys(userIdsToNames).forEach((userId) => {
    const re = new RegExp(`<@${userId}>`, "g");
    lines = lines.replace(re, userIdsToNames[userId]);
  });

  // Send text to google doc
  const docRes = await appendToDocument({
    documentId: destination,
    text:
      lines +
      "\n\n==========================================================\n\n",
  });
  console.log({ docRes });
  return `This morsel of history has arrived at the scribbleshop for posteritisation ✉️`;
};

exports.handler = async (event, context, callback) => {
  const slackData = getDataFromSlackRequest(event);

  console.log('username!', slackData.user_name)
  if (slackData.user_name && slackData.user_name !== GM_USERNAME && slackData.user_name !== PRIVILEGED_USERNAME) {
    return callback(null, {
      statusCode: 200,
      body: "Only the GM can use this command",
    });
  }

  // Get channel ID from channel archive event if exists. Otherwise from main data (i.e. manual invocation)
  const channel_id = slackData.event
    ? slackData.event.channel
    : slackData.channel_id;

  console.log("scribbling channel", channel_id);
  console.log("**************************");

  const destination = slackData.user_name === GM_USERNAME ? SCRIBBLE_DOCUMENT_ID : USER_SCRIBBLE_DOCUMENT_ID
  callback(null, {
    statusCode: 200,
    body: await main(channel_id, destination),
  });
};
