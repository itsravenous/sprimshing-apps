const fetch = require('node-fetch');
const { getDataFromSlackRequest } = require('../utils');
const { fetchSheet } = require('../google-utils');
const { NPC_SHEET_ID: SHEET_ID, GOOGLE_API_KEY, SLACK_TOKEN, GM_USERNAME } = process.env;
console.log(process.env);
// Fetches NPCs from shared Google sheet
const fetchNpcs = async () => {
	const rows = await fetchSheet({ sheetId: SHEET_ID });
	return (
		rows
			// Remove header row
			.slice(1)
			// Filter incomplete/empty rows
			.filter((entry) => entry[0] && entry[1])
	);
};

const sendMessage = ({ channel, name, image, text }) =>
	fetch('https://slack.com/api/chat.postMessage', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${SLACK_TOKEN}`,
		},
		body: JSON.stringify({
			channel,
			text,
			icon_url: image,
			username: name,
			link_names: true,
		}),
	});

// Export sendMessage for testing
exports.sendMessage = sendMessage;

// This is a specially-named function automatically called by AWS
exports.handler = async (event, context, callback) => {
	// Parse out data passed by Slack
	const { user_name, text, channel_id } = getDataFromSlackRequest(event);

	// Restrict use to GM user if defined
	if (GM_USERNAME && user_name !== GM_USERNAME) {
		return callback(null, {
			statusCode: 200,
			body: 'Only the GM can use this command',
		});
	}

	// Parse NPC name and message
	const [npcName, ...words] = text.split(' ');

	// Fetch NPCs stored in Google sheet
	const npcs = await fetchNpcs();

	// Find requested NPC in sheet
	const npc = npcs.find((entry) => entry[0].toLowerCase() === npcName.toLowerCase());

	let body = '';
	if (npc) {
		// NPC found, send message
		const [_, fullName, image] = npc;
		const res = await sendMessage({
			channel: channel_id,
			name: fullName,
			image,
			text: words.join(' '),
		});
	} else {
		// NPC not found, tell user
		body = 'No such NPC!';
	}

	// Send response back to Slack
	callback(null, {
		statusCode: 200,
		body,
	});
};
