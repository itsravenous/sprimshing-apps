const { appendToSheet } = require("@itsravenous/google-sheets-private");
const { fetchSheet } = require("@itsravenous/google-sheets-private");
const { getDataFromSlackRequest } = require("../utils");
const {
  INVENTORY_SHEET_ID: SHEET_ID,
  GOOGLE_SERVICE_ACCOUNT,
  GOOGLE_CREDENTIALS,
  GOOGLE_API_KEY
} = process.env;

const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
const credentials = JSON.parse(GOOGLE_CREDENTIALS);

exports.handler = async (event, context, callback) => {
  let { user_name, payload } = getDataFromSlackRequest(event);

  payload = JSON.parse(payload);
  console.log({ payload });
  //try {
  //await appendToSheet({
  //serviceAccount,
  //credentials,
  //sheetId: SHEET_ID,
  //sheetName,
  //data: itemNameAndDetail
  //});
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
