const fetch = require("node-fetch");
const { fetchSheet } = require("@itsravenous/google-sheets-public");
const { RITUNA_SHEET_ID: SHEET_ID, GOOGLE_API_KEY } = process.env;
const { getDataFromSlackRequest } = require("../utils");

const escapeForRegex = s => s.replace(/[-\/\\^$*+?.()|[\]{}\_]/g, "\\$&");

const fetchDictionary = async dictionaryName => {
  const { values } = await fetchSheet({
    sheetId: SHEET_ID,
    tabName: dictionaryName,
    apiKey: GOOGLE_API_KEY
  });
  return (
    values
      // Remove header row
      .slice(1)
      // Filter incompleye/empty rows
      .filter(entry => entry[0] && entry[1])
  );
};

const translate = ({ dictionary, text, reverse }) => {
  const fromIndex = reverse ? 1 : 0;
  const toIndex = reverse ? 0 : 1;
  text = text.replace("_", "");
  let result = dictionary.find(
    entry =>
      //entry[fromIndex].trim() && entry[fromIndex].trim().toLowerCase() === text.toLowerCase()
      entry[fromIndex].trim().toLowerCase() === text.toLowerCase()
  );
  if (result) return result[toIndex];

  // If no exact match, translate as much as we can
  return (
    dictionary
      // Sort source strings by length, descending, to ensure we replace them in the right order (i.e. "hello there" before "hello")
      .sort((a, b) => b[fromIndex].length - a[fromIndex].length)
      // Now loop over every source string with a known translation and translate it if found in the provided text
      .reduce(
        (acc, entry) =>
          //console.log(entry[fromIndex], entry[toIndex], text) ||
          acc.replace(
            new RegExp(
              `\\b${escapeForRegex(entry[fromIndex].trim())}\\b`,
              "gi"
            ),
            entry[toIndex]
          ),
        text
      )
  );
};

exports.debug = async name => {
  console.log(`Hello ${name}`);
  console.log(`SHEET_ID: ${SHEET_ID}`);
  console.log(`API_KEY: ${GOOGLE_API_KEY}`);
};

exports.debug2 = async () => {
  const dictionary = await fetchDictionary("vedich");
  const a = translate({ dictionary, text: "_panyawil qemod?", reverse: true });

  console.log("-------------");
  console.log("from vedich: ", a);
};

exports.batchTranslate = async () => {
  const lookup = await fetchDictionary("vedich2");
  const dictionary = await fetchDictionary("vedich");
  return lookup.map(element => {
    return [
      element[1],
      translate({ dictionary, text: element[1], reverse: true })
    ];
  });
};

exports.handler = async (event, context, callback) => {
  let { text, payload } = getDataFromSlackRequest(event);
  // Payload property indicates request is from a context menu "action"
  // We split the action by underscore to get the direction and dictionary
  let direction, dictionaryName, words;
  if (payload) {
    payload = JSON.parse(payload);
    [direction, dictionaryName] = payload.callback_id.split("_");
    words = [payload.message.text];
  } else {
    [direction, dictionaryName, ...words] = text.split(" ");
  }
  const dictionary = await fetchDictionary(dictionaryName);
  const response = translate({
    dictionary,
    text: words.join(" "),
    reverse: direction === "from"
  });

  if (payload) {
    console.log('responding to menu item with', response)
    const res = await fetch(payload.response_url, {
      method: "post",
      body: JSON.stringify({ text: response }),
      response_type: "ephemeral"
    });
    callback(null, 200); // Send acknowledgment response (see https://api.slack.com/interactivity/handling#acknowledgment_response)
  } else {
    callback(null, {
      statusCode: 200,
      body: response
    });
  }
};
