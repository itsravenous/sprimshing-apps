const fetch = require("node-fetch");
const { appendToSheet, fetchSheet, getSheetList } = require("../google-utils");
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

const openPlayerModal = async ({ trigger_id }) => {
  const sheets = ["Player 1", "Player 2"];

  const res = await fetch("https://slack.com/api/views.open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SLACK_TOKEN}`
    },
    body: JSON.stringify({
      trigger_id,
      view: {
        callback_id: "inventory_add/select_player",
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
          }
        ]
      }
    })
  });

  console.log(await res.json());
};

const addItem = async ({ player, vessel, item }) => {
  const res = await appendToSheet({
    serviceAccount,
    credentials,
    sheetId: SHEET_ID,
    sheetName: player,
    insertAt: "B13",
    data: [item]
  });

  console.log({ res });
};

exports.handler = async (event, context, callback) => {
  let { trigger_id, payload } = getDataFromSlackRequest(event);
  payload = payload && JSON.parse(payload);

  console.log("called me", payload && payload.view.callback_id);
  if (!payload) {
    // Modal requested, show it
    console.log("opening player modal");
    openPlayerModal({ trigger_id });
    console.log("reached callback");
    return callback(null, {
      statusCode: 200,
      body: "open modal"
    });
  } else if (
    payload.type === "view_submission" &&
    payload.view.callback_id === "inventory_add/select_player"
  ) {
    // Player modal submitted, update modal to show vessels and item field
    const values = payload.view.state.values;
    const player = values.player.player.selected_option.value;
    const vessels = ["Attire", "Body"];

    const res = await fetch("https://slack.com/api/views.push", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SLACK_TOKEN}`
      },
      body: JSON.stringify({
        trigger_id: payload.trigger_id,
        view: {
          type: "modal",
          callback_id: "inventory_add/add_item",
          title: {
            type: "plain_text",
            text: "Add inventory item"
          },
          submit: {
            type: "plain_text",
            text: "Add"
          },
          blocks: [
            {
              type: "input",
              block_id: "vessel",
              label: {
                type: "plain_text",
                text: `To which of ${player}'s vessels do you wish to add an item?`,
                emoji: true
              },
              element: {
                action_id: "vessel",
                type: "static_select",
                placeholder: {
                  type: "plain_text",
                  text: "Select vessel",
                  emoji: true
                },
                options: vessels.map(vessel => ({
                  text: {
                    type: "plain_text",
                    text: vessel,
                    emoji: true
                  },
                  value: `${player}::${vessel}`
                }))
              }
            },
            {
              type: "input",
              block_id: "item",
              label: {
                type: "plain_text",
                text: "Item description"
              },
              element: {
                type: "plain_text_input",
                action_id: "item"
              }
            }
          ]
        }
      })
    });
    //console.log("slack says", await res.json());

    //callback(null, {
    //statusCode: 200,
    //body: ""
    //});
  } else if (
    payload.type === "view_submission" &&
    payload.view.callback_id === "inventory_add/add_item"
  ) {
    // Item modal submitted, add the item
    const values = payload.view.state.values;
    const item = values.item.item.value;
    const [player, vessel] = values.vessel.vessel.selected_option.value.split(
      "::"
    );
    console.log("adding", { player, vessel, item });
    addItem({ player, vessel, item });
    callback(null, {
      statusCode: 200,
      body: "Success!"
    });
  }
};
