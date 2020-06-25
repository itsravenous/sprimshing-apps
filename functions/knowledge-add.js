const { appendToSheet } = require("../google-utils");
const { fetchSheet } = require("../google-utils");
const { getDataFromSlackRequest } = require("../utils");
const { KNOWLEDGE_SHEET_ID: SHEET_ID } = process.env;

exports.handler = async (event, context, callback) => {
  const { text } = getDataFromSlackRequest(event);
  let [sheetName, ...item] = text.split(" ");
  let itemNameAndDetail = item.join(" ").split("|");

  try {
    const existingdata = await fetchSheet({
      sheetId: SHEET_ID,
      sheetName
    });

    if (existingdata.find(x => x[0] == itemNameAndDetail[0]))
      throw `lore store \`${sheetName}\` already knows about \`${itemNameAndDetail[0]}\``;

    await appendToSheet({
      sheetId: SHEET_ID,
      sheetName,
      data: itemNameAndDetail
    });
    callback(null, {
      statusCode: 200,
      body: `Successfully added knowledge about \`${itemNameAndDetail[0]}\` to lore store \`${sheetName}\``
    });
  } catch (err) {
    console.error({ err });
    callback(null, {
      statusCode: 200,
      body: `Sorry, failed to add that knowledge. ${err}`
    });
  }
};
