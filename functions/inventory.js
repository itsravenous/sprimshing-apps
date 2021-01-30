const fetch = require("node-fetch");
const { fetchSheet } = require("../google-utils");
const { getDataFromSlackRequest, openSimpleModal } = require("../utils");
const { INVENTORY_SHEET_ID: SHEET_ID, SLACK_TOKEN, GM_USERNAME } = process.env;

const getInventory = async character => {
  try {
    const rows = await fetchSheet({
      sheetId: SHEET_ID,
      sheetName: character.toLowerCase()
    });
    if (!rows)
      throw new Error(
        "Inventory sheet missing - please contact the Games Master"
      );

    const headers = rows[0];
    const itemIndex = headers.indexOf("Item");
    const vesselIndex = headers.indexOf("Vessel");
    const imageIndex = headers.indexOf("Image");
    if (itemIndex === -1 || vesselIndex === -1 || imageIndex === -1) {
      throw new Error(
        "Inventory sheet malformatted - please contact the Games Master"
      );
    }

    const itemsByVessel = rows.slice(1).reduce((acc, row) => {
      const item = row[itemIndex];
      const vessel = row[vesselIndex];
      const image = row[imageIndex];
      acc[vessel] = acc[vessel] || [];
      acc[vessel] = [
        ...acc[vessel],
        {
          item,
          image
        }
      ];
      return acc;
    }, {});
    return itemsByVessel;
  } catch (e) {
    console.error("ERROR================\n", e);
    return ["No items"];
  }
};

const inventoryToText = inventory => {
  inventoryText = Object.entries(inventory).reduce(
    (acc, [receptacle, items]) => {
      const itemsText = items
        .map(item => `${item.item}, ![](${item.image})`)
        .join("\n");
      acc += `*${receptacle}:*\n${itemsText}\n\n`;
      return acc;
    },
    ""
  );

  return inventoryText;
};

const inventoryToBlocks = inventory => {
  return Object.entries(inventory).reduce((acc, [vessel, items]) => {
    return [
      ...acc,
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${vessel}*`
        }
      },
      ...items.map(item => {
        let elements = [{ type: "mrkdwn", text: item.item }];
        if (item.image) {
          elements = [
            ...elements,
            {
              type: "mrkdwn",
              text: " "
            },
            {
              type: "image",
              image_url: item.image,
              alt_text: item.item
            },
            {
              type: "mrkdwn",
              text: " "
            },
            { type: "mrkdwn", text: `<${item.image}|Examine>` }
          ];
        }

        return {
          type: "context",
          elements
        };
      })
    ];
  }, []);
};

exports.getInventory = getInventory;
exports.inventoryToText = inventoryToText;
exports.handler = async (event, context, callback) => {
  let { trigger_id, user_name, payload, text } = getDataFromSlackRequest(event);

  // Restrict use to GM user
  if ((true || user_name === GM_USERNAME) && text.length) {
    user_name = text
  }

  // If coming from shortcut, user_name not included in top level data, parse out user_name from user in payload
  if (payload) {
    payload = JSON.parse(payload);
    user_name = payload.user.username;
    trigger_id = payload.trigger_id;
  }
  console.log("===================================");
  console.log("Getting inventory for", user_name);
  console.log("===================================");
  const inventory = await getInventory(user_name);
  console.log({inventory})
  const inventoryBlocks = inventoryToBlocks(inventory);
  console.log({inventoryBlocks})
  const modalRes = await openModal({
    title: `Inventory for ${user_name}`,
    blocks: inventoryBlocks,
    trigger_id
  });
  callback(null, {
    statusCode: 200,
    body: ""
  });
};
