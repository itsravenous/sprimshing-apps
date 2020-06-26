const fetch = require("node-fetch");
const { fetchSheet } = require("../google-utils");
const { getDataFromSlackRequest } = require("../utils");
const { INVENTORY_SHEET_ID: SHEET_ID, SLACK_TOKEN } = process.env;

const getInventory = async character => {
  try {
    const rows = await fetchSheet({
      sheetId: SHEET_ID,
      sheetName: character.toLowerCase()
    });
    if (!rows) throw "Sheet not found";
    const receptacles = rows[0];
    const items = receptacles.reduce((acc, receptacle, index) => {
      acc[receptacle] = [
        ...(acc[receptacle] || []),
        ...rows.slice(1).map(row => row[index])
      ];
      return acc;
    }, {});
    return items;
  } catch (e) {
    console.error(e);
    return ["No items"];
  }
};

const inventoryToText = inventory => {
  inventoryText = Object.entries(inventory).reduce(
    (acc, [receptacle, items]) => {
      acc += `*${receptacle}:*\n${items
        .filter(x => x)
        .map(x => "- " + x)
        .join("\n")}\n\n`;
      return acc;
    },
    ""
  );

  return inventoryText;
};

exports.getInventory = getInventory;
exports.inventoryToText = inventoryToText;
exports.handler = async (event, context, callback) => {
  const { trigger_id, user_name } = getDataFromSlackRequest(event);

  console.log("===================================");
  console.log("Getting inventory for", user_name);
  console.log("===================================");

  const inventoryText = inventoryToText(await getInventory(user_name));
  const modalRes = await fetch("https://slack.com/api/views.open", {
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
          text: `Inventory for ${user_name}`,
          emoji: true
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: inventoryText
            }
          }
        ]
      }
    })
  });
  callback(null, {
    statusCode: 200,
    body: ""
  });
};
