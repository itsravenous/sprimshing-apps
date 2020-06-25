const { appendToSheet } = require("../google-utils");
const { getDataFromSlackRequest } = require("../utils");
const { RITUNA_SHEET_ID: SHEET_ID } = process.env;

exports.handler = async (event, context, callback) => {
  const { text } = getDataFromSlackRequest(event);
  let [sheetName, ...item] = text.split(" ");
  let itemNameAndDetail = item.join(" ").split("|");

  try {
    await appendToSheet({
      sheetId: SHEET_ID,
      sheetName,
      data: itemNameAndDetail
    });
    callback(null, {
      statusCode: 200,
      body: `Successfully added translation for \`${itemNameAndDetail[0]}\` to lore store for language \`${sheetName}\``
    });
  } catch (err) {
    console.error({ err });
    callback(null, {
      statusCode: 200,
      body:
        "Sorry, failed to add that translation. Maybe that language doesn't have a lore store yet?"
    });
  }
};
