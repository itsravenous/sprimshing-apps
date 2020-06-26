const fetch = require("node-fetch");
const { fetchSheet } = require("../google-utils");
const { getDataFromSlackRequest, openSimpleModal } = require("../utils");
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
        .filter(x => x && x.trim())
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
  let { trigger_id, user_name, payload } = getDataFromSlackRequest(event);

  // If coming from shortcut, user_name not included in top level data, parse out user_name from user in payload
  if (payload) {
    payload = JSON.parse(payload);
    user_name = payload.user.username;
    trigger_id = payload.trigger_id;
  }
  console.log("===================================");
  console.log("Getting inventory for", user_name);
  console.log("===================================");

  const inventoryText = inventoryToText(await getInventory(user_name));
  await openSimpleModal({
    title: `Inventory for ${user_name}`,
    text: inventoryText,
    trigger_id
  });
  callback(null, {
    statusCode: 200,
    body: ""
  });
};
