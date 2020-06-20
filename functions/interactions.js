const fetch = require("node-fetch");
const { fetchSheet } = require("@itsravenous/google-sheets-public");
const { getDataFromSlackRequest } = require("../utils");
const { handler: ritunaHandler } = require("./rituna");
const { handler: inventoryAddHandler } = require("./inventory-add");

const RITUNA_CALLBACK_IDS = ["from_vedich", "from_vanlic", "from_breinish"];

exports.handler = async (event, context, callback) => {
  let { text, payload } = getDataFromSlackRequest(event);
  payload = JSON.parse(payload);
  let handler;

  if (payload.view && payload.view.callback_id === "inventory_add") {
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
