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
  const time0 = new Date().getMilliseconds();
  const sheets = await getSheetList({
    serviceAccount,
    credentials,
    sheetId: SHEET_ID
  });
  console.log("sheets fetch took", new Date().getMilliseconds() - time0, "ms");
  //const sheets = ["tom", "bob", "taylon"];
  //const sheets = [
  //"sprimshing",
  //"Recepticals",
  //"Milric",
  //"leeholden",
  //"danpker",
  //"leeholdenold",
  //"tylerrl97",
  //"Otfred",
  //"Sheet9",
  //"Eydra",
  //"Cat",
  //"eplin",
  //"qbman1011",
  //"asa.forsell01",
  //"warlordmorg",
  //"vidya_stuff",
  //"zoomafoom28"
  //];
  console.log("player sheets", sheets.join());

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
    console.log("opening player modal");
    openPlayerModal({ trigger_id });
    console.log("reached callback");
    return callback(null, {
      statusCode: 200,
      body: "open modal"
    });
  } else if (
    payload.type === "view_submission" &&
    callback_id === "inventory_add/select_player"
  ) {
    // Player modal submitted, update modal to show vessels and item field
    const values = payload.view.state.values;
    const player = values.player.player.selected_option.value;
    const inventorySheet = await fetchSheet({
      serviceAccount,
      credentials,
      sheetId: SHEET_ID,
      sheetName: player
    });

    const vessels = inventorySheet.values[0];

    console.log("got vessels", vessels);

    callback(null, {
      statusCode: 200,
      body: {
        response_action: "update",
        view: {
          callback_id: "inventory_add/add_item",
          type: "modal",
          title: {
            type: "plain_text",
            text: "Updated title"
          },
          blocks: [
            {
              type: "section",
              text: {
                type: "plain_text",
                text: vessels.join()
              }
            }
          ]
        }
      }
    });
  } else if (
    payload.type === "view_submission" &&
    callback_id === "inventory_add/add_item"
  ) {
    // Item modal submitted, add the item
    const values = payload.view.state.values;
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
