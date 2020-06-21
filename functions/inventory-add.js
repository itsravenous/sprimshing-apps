const fetch = require("node-fetch");
const { appendToSheet, fetchSheet, getSheetList } = require("../google-utils");
const { getDataFromSlackRequest } = require("../utils");
const {
  INVENTORY_SHEET_ID: SHEET_ID,
  GOOGLE_SERVICE_ACCOUNT,
  GOOGLE_CREDENTIALS,
  SLACK_TOKEN,
  GM_USERNAME
} = process.env;

const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
const credentials = JSON.parse(GOOGLE_CREDENTIALS);

const openPlayerModal = async ({ player, trigger_id }) => {
  const inventory = await fetchSheet({
    serviceAccount,
    credentials,
    sheetId: SHEET_ID,
    sheetName: player
  });
  const vessels = inventory[0];
  const res = await fetch("https://slack.com/api/views.open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SLACK_TOKEN}`
    },
    body: JSON.stringify({
      trigger_id,
      view: {
        callback_id: "inventory_add/add_item",
        type: "modal",
        submit: {
          type: "plain_text",
          text: "Add item",
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
            block_id: "item",
            element: {
              action_id: "item",
              type: "plain_text_input"
            },
            label: {
              type: "plain_text",
              text: "Item description",
              emoji: true
            }
          },
          {
            type: "input",
            block_id: "vessel",
            label: {
              type: "plain_text",
              text: "To which vessel do you wish to add this item?",
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
          }
        ]
      }
    })
  });

  console.log(await res.json());
};

const addItem = async ({ player, vessel, item }) => {
  // Get inventory to determine cell position to update at based on items in requested vessel
  const inventory = await fetchSheet({
    serviceAccount,
    credentials,
    sheetId: SHEET_ID,
    sheetName: player
  });
  const vessels = inventory[0];
  const vesselIndex = vessels.indexOf(vessel);
  const rowToInsert = Array(vessels.length).fill("");
  rowToInsert[vesselIndex] = item;
  const res = await appendToSheet({
    serviceAccount,
    credentials,
    sheetId: SHEET_ID,
    sheetName: player,
    data: rowToInsert
  });
};

exports.handler = async (event, context, callback) => {
  let { trigger_id, payload, text, user_name } = getDataFromSlackRequest(event);

  // Restrict use to GM user
  if (user_name !== GM_USERNAME) {
    return callback(null, {
      statusCode: 200,
      body: "Only the GM can use this command"
    });
  }

  payload = payload && JSON.parse(payload);

  console.log("called me", payload && payload.view.callback_id);
  if (!payload) {
    // Modal requested, show it
    openPlayerModal({ player: text, trigger_id });
    return callback(null, {
      statusCode: 200,
      body: ""
    });
  } else if (
    payload.type === "view_submission" &&
    payload.view.callback_id === "inventory_add/add_item"
  ) {
    // Item modal submitted, add the item
    const values = payload.view.state.values;
    const item = values.item.item.value;
    //const item = "A thing";
    const [player, vessel] = values.vessel.vessel.selected_option.value.split(
      "::"
    );
    console.log("adding", { player, vessel, item });
    addItem({ player, vessel, item });
    callback(null, {
      statusCode: 200,
      body: ""
    });
  }
};
