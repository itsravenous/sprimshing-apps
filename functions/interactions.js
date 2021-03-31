const { getDataFromSlackRequest } = require("../utils");
const { handler: ritunaHandler } = require("./rituna");
const { handler: inventoryAddHandler } = require("./inventory-add");
const { handler: inventoryHandler } = require("./inventory");
const { handler: knowledgeHandler, detailKnowledge } = require("./knowledge");
const { handler: scribbleHandler } = require("./scribble");
const { KNOWLEDGE_TAB_NAME } = process.env;

const RITUNA_CALLBACK_IDS = [
  "from_vedich",
  "from_vanlic",
  "from_breinish",
  "from_melan",
  "from_peric",
  "from_alinic",
  "from_dirahic",
];

exports.handler = async (event, context, callback) => {
  let {
    challenge,
    type,
    payload = "{}",
    event: eventData,
  } = getDataFromSlackRequest(event);
  console.log({ type, eventData, payload });

  // Respond to event subscription verification challenges
  if (type === "url_verification") {
    return callback(null, { statusCode: 200, body: challenge });
  }

  payload = JSON.parse(payload);
  let handler;

  // Determine which function to hand off to. TODO move this to config/routing
  // Scribbleshop
  if (eventData && eventData.type === "group_archive") {
    console.log("scribble!");
    handler = scribbleHandler;
  }
  // /inventory-add
  if (payload.view && payload.view.callback_id.startsWith("inventory_add")) {
    console.log("handling via inventory add");
    handler = inventoryAddHandler;
  }
  // Translate from message context menu
  if (
    payload.type === "message_action" &&
    RITUNA_CALLBACK_IDS.includes(payload.callback_id)
  ) {
    handler = ritunaHandler;
  }
  // Inventory menu action
  if (payload.callback_id === "inventory") {
    handler = inventoryHandler;
  }
  // Knowledge menu action
  if (payload.callback_id === "knowledge") {
    handler = knowledgeHandler;
  }
  // Knowledge modal action
  if (
    payload.type === "block_actions" &&
    payload.actions[0].value.startsWith("knowledge_")
  ) {
    callback(null, {
      statusCode: 200,
      body: "",
    });

    // TODO move this somewhere nicer
    const title = payload.actions[0].value.replace("knowledge_", "");
    const response = await detailKnowledge(KNOWLEDGE_TAB_NAME, title);
    await pushModal({
      title: response.title,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: response.description,
          },
          accessory: {
            type: "image",
            image_url: response.image,
            alt_text: response.title,
          },
        },
      ],
      trigger_id: payload.trigger_id,
    });

    return;
  }

  return handler(event, context, callback);
};
