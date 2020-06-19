const fetch = require("node-fetch");
const {
  appendToSheet,
  fetchSheet,
  getSpreadSheetRaw
} = require("@itsravenous/google-sheets-private");
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
  const spreadSheet = await getSpreadSheetRaw({
    serviceAccount,
    credentials,
    sheetId: SHEET_ID
  });
  const sheets = spreadSheet.data.sheets.map(sheet => sheet.properties.title);

  const res = await fetch("https://slack.com/api/views.open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SLACK_TOKEN}`
    },
    body: JSON.stringify({
      trigger_id,
      view: {
        callback_id: "inventory_add",
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
            block_id: "player",
            label: {
              type: "plain_text",
              text: "To whose inventory do you wish to add an item?",
              emoji: true
            },
            element: {
              action_id: "player",
              type: "static_select",
              placeholder: {
                type: "plain_text",
                text: "Select player",
                emoji: true
              },
              options: sheets.map(sheet => ({
                text: {
                  type: "plain_text",
                  text: sheet,
                  emoji: true
                },
                value: sheet
              }))
            }
          },
          {
            type: "input",
            block_id: "item",
            element: {
              type: "plain_text_input",
              action_id: "item"
            },
            label: {
              type: "plain_text",
              text: "Item description",
              emoji: true
            }
          }
        ]
      }
    })
  });
};

const addItem = async (player, item) => {
  const res = await appendToSheet({
    serviceAccount,
    credentials,
    sheetId: SHEET_ID,
    sheetName: player,
    data: [item]
  });

  console.log({ res });
};

exports.handler = async (event, context, callback) => {
  let { trigger_id, payload } = getDataFromSlackRequest(event);
  payload = payload && JSON.parse(payload);

  if (!payload) {
    // Modal requested, show it
    openModal({ trigger_id });
    callback(null, {
      statusCode: 200,
      body: "open modal"
    });
  } else if (payload.type === "view_submission") {
    // Modal submitted, add the item
    const values = payload.view.state.values;
    const player = values.player.player.selected_option.value;
    const item = values.item.item.value;
    console.log({ item });
    addItem(player, item);
    callback(null, {
      statusCode: 200,
      body: "Success!"
    });
  }
  //try {
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
