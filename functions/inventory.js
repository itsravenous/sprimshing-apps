const { fetchSheet } = require("@itsravenous/google-sheets-public");
const { getDataFromSlackRequest } = require("../utils");
const {
  INVENTORY_SHEET_ID: SHEET_ID,
  GOOGLE_API_KEY,
  SLACK_TOKEN,
  GM_USERNAME
} = process.env;

const getInventory = async character => {
  try {
    const sheet = await fetchSheet({
      sheetId: SHEET_ID,
      tabName: character.toLowerCase(),
      apiKey: GOOGLE_API_KEY
    });
    const rows = sheet.values;
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
      acc += `*${receptacle}:*\n${items.join("\n")}\n\n`;
      return acc;
    },
    ""
  );

  return inventoryText;
};

exports.getInventory = getInventory;
exports.inventoryToText = inventoryToText;
exports.handler = async (event, context, callback) => {
  const { user_name } = getDataFromSlackRequest(event);

  console.log("===================================");
  console.log("Getting inventory for", user_name);
  console.log("===================================");

  const inventoryText = inventoryToText(await getInventory(user_name));
  callback(null, {
    statusCode: 200,
    body: `*Inventory for ${user_name}*\n\n${inventoryText}`
  });
};
