const { fetchSheet } = require("@itsravenous/google-sheets-private");
const { getDataFromSlackRequest } = require("../utils");
const {
  KNOWLEDGE_SHEET_ID: SHEET_ID,
  GOOGLE_SERVICE_ACCOUNT,
  GOOGLE_CREDENTIALS,
  GOOGLE_API_KEY
} = process.env;

const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
const credentials = JSON.parse(GOOGLE_CREDENTIALS);

const fetchKnowledge = async sheetName => {
  try {
    const rows = await fetchSheet({
      sheetId: SHEET_ID,
      sheetName,
      serviceAccount,
      credentials
    });
    return (
      rows
        // Filter rows with nothing in col 1 (this should be the key)
        .filter(entry => entry[0])
    );
  } catch (err) {
    console.error({ err });
    return;
  }
};

const listKnowledge = async sheetname => {
  let knowledge;
  try {
    knowledge = await fetchKnowledge(sheetname);
  } catch (err) {
    console.error({ err });
    return "Nothing is known about the subject `" + sheetname + "`";
  }

  let header = knowledge[0][0];
  console.log({ header });
  let result = knowledge
    .slice(1)
    .map(element => element[0])
    .join(", ");
  return header + ": " + result;
};

const detailKnowledge = async (sheetname, itemname) => {
  let knowledge;
  try {
    knowledge = await fetchKnowledge(sheetname);
  } catch {
    return "Nothing is known about the subject `" + sheetname + "`";
  }

  let header = knowledge[0];
  let item = knowledge
    .slice(1)
    .find(element => element[0].toLowerCase() === itemname.toLowerCase());

  if (!item) {
    return (
      "Nothing is known about `" +
      itemname +
      "` (at least not in the topic of `" +
      sheetname +
      "`)"
    );
  }
  var r = "";
  var i;
  for (i = 0; i < header.length; i++) {
    r += header[i] + ": " + item[i] + "\n";
  }
  return r;
};

exports.handler = async (event, context, callback) => {
  const { text } = getDataFromSlackRequest(event);
  let [dictionaryName, ...entryName] = text.split(" ");
  entryName = entryName.join(" ");
  let response;
  if (entryName) {
    response = await detailKnowledge(dictionaryName, entryName);
  } else {
    response = await listKnowledge(dictionaryName);
  }

  callback(null, {
    statusCode: 200,
    body: response
  });
};
