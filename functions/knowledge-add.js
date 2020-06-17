const { appendToSheet } = require("@itsravenous/google-sheets-private");
const {
  KNOWLEDGE_SHEET_ID: SHEET_ID,
  GOOGLE_SERVICE_ACCOUNT,
  GOOGLE_CREDENTIALS,
  GOOGLE_API_KEY
} = process.env;

const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
const credentials = JSON.parse(GOOGLE_CREDENTIALS);

exports.handler = async (event, context, callback) => {
  let { text } = JSON.parse(
    '{"' + event.body.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    (key, value) =>
      key === ""
        ? value
        : decodeURIComponent(value)
            .replace(/\+/g, " ")
            .trim()
  );
  let [sheetName, item] = text.split(" ");
  let itemNameAndDetail = item.split("|");

  let response;
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
      body: `Successfully added knowledge about \`${itemNameAndDetail[0]}\` to lore store \`${sheetName}\``
    });
  } catch (err) {
    console.error({ err });
    callback(null, {
      statusCode: 500,
      body:
        "Sorry, failed to add that knowledge. Maybe that subject doesn't have a lore store?"
    });
  }
};
