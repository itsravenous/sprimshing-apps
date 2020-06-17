const { appendToSheet } = require("@itsravenous/google-sheets-private");
const { getTextFromSlackRequest } = require("../utils.js");
const {
  RITUNA_SHEET_ID: SHEET_ID,
  GOOGLE_SERVICE_ACCOUNT,
  GOOGLE_CREDENTIALS
} = process.env;

const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
const credentials = JSON.parse(GOOGLE_CREDENTIALS);

exports.handler = async (event, context, callback) => {
  const text = getTextFromSlackRequest(event);
  let [sheetName, ...item] = text.split(" ");
  let itemNameAndDetail = item.join(" ").split("|");

  try {
    await appendToSheet({
      serviceAccount,
      credentials,
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
