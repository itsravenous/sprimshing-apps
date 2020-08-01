const { getDataFromSlackRequest } = require("../utils");
const { handler: ritunaHandler } = require("./rituna");
const { handler: inventoryAddHandler } = require("./inventory-add");
const { handler: inventoryHandler } = require("./inventory");
const { detailKnowledge } = require("./knowledge");
const { KNOWLEDGE_TAB_NAME } = process.env;

const RITUNA_CALLBACK_IDS = ["from_vedich", "from_vanlic", "from_breinish"];

exports.handler = async (event, context, callback) => {
  let { text, payload } = getDataFromSlackRequest(event);
  if (!payload) {
    // Payload required, return error
    return callback(null, {
      statusCode: 200,
      body:
        "The Sprimshing interaction handler received a request without a payload. This shouldn't happen."
    });
  }

  payload = JSON.parse(payload);
  let handler;

  if (payload.view && payload.view.callback_id.startsWith("inventory_add")) {
    console.log("handling via inventory add");
    handler = inventoryAddHandler;
  }
  if (
    payload.type === "message_action" &&
    RITUNA_CALLBACK_IDS.includes(payload.callback_id)
  ) {
    handler = ritunaHandler;
  }
  if (payload.callback_id === "inventory") {
    handler = inventoryHandler;
  }
  if (payload.type === 'block_actions' && payload.actions[0].value.startsWith('knowledge_')) {
    callback(null, {
      statusCode: 200,
      body: ""
    });

    const title = payload.actions[0].value.replace('knowledge_', '')
    const response = await detailKnowledge(KNOWLEDGE_TAB_NAME, title)
    const res = await pushModal({
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
      trigger_id: payload.trigger_id
    });

    return
  }

  return handler(event, context, callback);
};
