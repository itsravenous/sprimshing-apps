const { getDataFromSlackRequest } = require("../utils");
const { handler: ritunaHandler } = require("./rituna");
const { handler: inventoryAddHandler } = require("./inventory-add");

const RITUNA_CALLBACK_IDS = ["from_vedich", "from_vanlic", "from_breinish"];

exports.handler = async (event, context, callback) => {
  let { text, payload } = getDataFromSlackRequest(event);
  if (!payload) {
    // Paylaod required, return error
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

  return handler(event, context, callback);
};
