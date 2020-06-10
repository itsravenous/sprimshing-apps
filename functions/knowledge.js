const axios = require("axios");
const { fetchSheet } = require("@itsravenous/google-sheets-public");
const { KNOWLEDGE_SHEET_ID: SHEET_ID, GOOGLE_API_KEY } = process.env;

const fetchKnowledge = async sheetName => {
  const { values } = await fetchSheet({
    sheetId: SHEET_ID,
    tabName: sheetName,
    apiKey: GOOGLE_API_KEY
  });
  return (
    values
      // Filter rows with nothing in row 1 (this should be the key)
      .filter(entry => entry[0])
  );
};

const listKnowledge = async sheetname => {
  let knowledge;
  try {
    knowledge = await fetchKnowledge(sheetname);
  } catch {
    return "Nothing is known about the subject `" + sheetname + "`";
  }

  let header = knowledge[0][0];
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
  let { text } = JSON.parse(
    '{"' + event.body.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    (key, value) =>
      key === ""
        ? value
        : decodeURIComponent(value)
            .replace(/\+/g, " ")
            .trim()
  );
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
