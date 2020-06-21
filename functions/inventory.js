const { fetchSheet } = require("../google-utils");
const { getDataFromSlackRequest } = require("../utils");
const {
  INVENTORY_SHEET_ID: SHEET_ID,
  GOOGLE_SERVICE_ACCOUNT,
  GOOGLE_CREDENTIALS
} = process.env;

const getInventory = async character => {
  try {
    const rows = await fetchSheet({
      sheetId: SHEET_ID,
      sheetName: character.toLowerCase(),
      serviceAccount: JSON.parse(GOOGLE_SERVICE_ACCOUNT),
      credentials: JSON.parse(GOOGLE_CREDENTIALS)
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
