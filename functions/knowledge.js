const fetch = require("node-fetch");
const { fetchSheet } = require("../google-utils");
const { getDataFromSlackRequest, openSimpleModal } = require("../utils");
const { KNOWLEDGE_SHEET_ID: SHEET_ID, KNOWLEDGE_TAB_NAME } = process.env;
const { itemNamesAreRoughlyEqual } = require('../utils')

const fetchKnowledge = async sheetName => {
  try {
    const rows = await fetchSheet({
      sheetId: SHEET_ID,
      sheetName
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

  const header = knowledge[0];
  const titleCol = header.findIndex(cell => cell === 'Title')
  return knowledge.slice(1).map(row => row[titleCol])
};

const detailKnowledge = async (sheetname, itemname) => {
  let knowledge;
  try {
    knowledge = await fetchKnowledge(sheetname);
  } catch {
    throw new Error("Nothing is known about the subject `" + sheetname + "`.");
  }

  const header = knowledge[0];
  const titleCol = header.findIndex(cell => cell === 'Title')
  const imageCol = header.findIndex(cell => cell === 'Image')
  const descriptionCol = header.findIndex(cell => cell === 'Description')
  let item = knowledge
    .slice(1)
    .find(element => itemNamesAreRoughlyEqual(element[titleCol], itemname));

  if (!item) {
    throw new Error(
      "Nothing is known about `" +
      itemname +
      "` (at least not in the topic of `" +
      sheetname +
      "`)."
    );
  }

  return {
    title: item[titleCol],
    image: item[imageCol],
    description: item[descriptionCol],
  }
};
exports.detailKnowledge = detailKnowledge;

exports.handler = async (event, context, callback) => {
  let { payload, text, trigger_id } = getDataFromSlackRequest(event);
  if (payload) trigger_id = JSON.parse(payload).trigger_id; // If we come from a menu shortcut, use trigger_id from that

  let dictionaryName, entryName;
  if (KNOWLEDGE_TAB_NAME) {
    dictionaryName = KNOWLEDGE_TAB_NAME
    entryName = text
  } else {
    ([dictionaryName, ...entryName] = text.split(" "));
    entryName = entryName.join(" ");
  }
  let response;
  if (entryName) {
    try {
      response = await detailKnowledge(dictionaryName, entryName);
    } catch (e) {
      await openSimpleModal({
        title: `Knowledge`,
        text: e.message,
        trigger_id
      });
    }
    await openModal({
      title: response.title,
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": response.description
          },
          "accessory": {
            "type": "image",
            "image_url": response.image,
            "alt_text": response.title
          }
        }
      ],
      trigger_id
    });
  } else {
    response = await listKnowledge(dictionaryName);
    const re = await openModal({
      title: `Knowledge`,
      blocks: response.map(title => (
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": title
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Find out more 👀",
              "emoji": true
            },
            "value": `knowledge_${title}`
          }
        })),
      trigger_id
    });

    console.log(await re.json())
  }


  callback(null, {
    statusCode: 200,
    body: ""
  });
};
