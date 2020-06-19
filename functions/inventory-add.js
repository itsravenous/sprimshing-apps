const fetch = require("node-fetch");
const { appendToSheet } = require("@itsravenous/google-sheets-private");
const { fetchSheet } = require("@itsravenous/google-sheets-private");
const { getDataFromSlackRequest } = require("../utils");
const {
  INVENTORY_SHEET_ID: SHEET_ID,
  GOOGLE_SERVICE_ACCOUNT,
  GOOGLE_CREDENTIALS,
  GOOGLE_API_KEY,
  SLACK_TOKEN
} = process.env;

const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
const credentials = JSON.parse(GOOGLE_CREDENTIALS);

const openModal = async ({ trigger_id }) => {
  const res = await fetch("https://slack.com/api/views.open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SLACK_TOKEN}`
    },
    body: JSON.stringify({
      trigger_id,
      callback_id: "inventory_add",
      view: {
        type: "modal",
        submit: {
          type: "plain_text",
          text: "Submit",
          emoji: true
        },
        close: {
          type: "plain_text",
          text: "Cancel",
          emoji: true
        },
        title: {
          type: "plain_text",
          text: "Add item to inventory",
          emoji: true
        },
        blocks: [
          {
            type: "divider"
          },
          {
            type: "input",
            label: {
              type: "plain_text",
              text: "To whose inventory do you wish to add an item?",
              emoji: true
            },
            element: {
              type: "static_select",
              placeholder: {
                type: "plain_text",
                text: "Select player",
                emoji: true
              },
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "Milric",
                    emoji: true
                  },
                  value: "milric"
                },
                {
                  text: {
                    type: "plain_text",
                    text: "Fernoca",
                    emoji: true
                  },
                  value: "fernoca"
                },
                {
                  text: {
                    type: "plain_text",
                    text: "Sydrel",
                    emoji: true
                  },
                  value: "sydrel"
                }
              ]
            }
          }
        ]
      }
    })
  });

  console.log("res", await res.json());
};

exports.handler = async (event, context, callback) => {
  let { trigger_id, payload } = getDataFromSlackRequest(event);

  if (!payload) {
    // Modal requested, show it
    openModal({ trigger_id });
    callback(null, {
      statusCode: 200,
      body: "open modal"
    });
  } else if (payload.type === "view_submission") {
    // Modal submitted, add the item
    // addItem()
    callback(null, {
      statusCode: 200,
      body: "Success!"
    });
  }
  //try {
  //await appendToSheet({
  //serviceAccount,
  //credentials,
  //sheetId: SHEET_ID,
  //sheetName,
  //data: itemNameAndDetail
  //});
  //callback(null, {
  //statusCode: 200,
  //body: `Successfully added knowledge about \`${itemNameAndDetail[0]}\` to lore store \`${sheetName}\``
  //});
  //} catch (err) {
  //console.error({ err });
  //callback(null, {
  //statusCode: 200,
  //body: `Sorry, failed to add that knowledge. ${err.message}`
  //});
  //}
};
