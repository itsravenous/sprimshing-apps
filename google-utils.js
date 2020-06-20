const { google } = require("googleapis");
//const { sheets } = require("googleapis/build/src/apis/sheets");
const sheets = google.sheets('v4');
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

//create a temporary auth token using JWT, reading from the service account config
async function authorize({ serviceAccount, credentials }) {
  const { client_secret, client_id } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    "postmessage"
  );

  const jwt = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    SCOPES
  );

  const tokens = await jwt.authorize();
  oAuth2Client.setCredentials({
    access_token: tokens.access_token
  });
  return oAuth2Client;
}

function authFetchSheet({ auth, sheetId, sheetName }) {
  const sheets = google.sheets({ version: "v4", auth });
  return sheets.spreadsheets.values
    .get({
      spreadsheetId: sheetId,
      range: sheetName
    })
    .then(res => {
      return res.data.values;
    });
}

function authAppendToSheet({ auth, sheetId, sheetName, data }) {
  const sheets = google.sheets({ version: "v4", auth });

  return sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: sheetName,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    resource: {
      values: [data]
    },
    auth: auth
  });
}

const fetchSheet = async ({
  serviceAccount,
  credentials,
  sheetId,
  sheetName
}) => {
  const auth = await authorize({ serviceAccount, credentials });
  return authFetchSheet({ auth, sheetId, sheetName });
};

const appendToSheet = async ({
  serviceAccount,
  credentials,
  sheetId,
  sheetName,
  data
}) => {
  const auth = await authorize({ serviceAccount, credentials });
  return authAppendToSheet({ auth, sheetId, sheetName, data });
};

const getSheetList = async ({
  serviceAccount,
  credentials,
  sheetId
}) => {
  const authClient = await authorize({ serviceAccount, credentials });
  const request = {
    spreadsheetId: sheetId,
    ranges: [],
    includeGridData: true,
    auth: authClient,
  };

  const response = (await sheets.spreadsheets.get(request)).data;
  return response.sheets.map(s => s.properties.title);
}

const createSheet = async ({
  serviceAccount,
  credentials,
  sheetId,
  sheetName,
  headers
}) => {
  const authClient = await authorize({ serviceAccount, credentials });
  const requestAdd = {
    spreadsheetId: sheetId,
    resource: {
      requests: [{
        "addSheet": {
          "properties": { "title": sheetName }
        }
      }]},
    auth: authClient
  };


  try {
    const response = (await sheets.spreadsheets.batchUpdate(requestAdd)).data;
    var newSheetId = response.replies[0].addSheet.properties.sheetId;

    if (headers) {
      const numHeaders = headers.length;
      const requestBold = {
        spreadsheetId: sheetId,
        resource: {
          requests: [{
            "repeatCell": {
              "range": {
                "sheetId": newSheetId,
                "startRowIndex": 0,
                "endRowIndex": 1
              },
              "cell": {
                "userEnteredFormat": {
                  "textFormat": {
                    "bold": true
                  }
                }
              },
              "fields": "userEnteredFormat.textFormat.bold"
            }
          }]
        },
        auth: authClient,
      };
      
      const response2 = (await sheets.spreadsheets.batchUpdate(requestBold)).data;

      await appendToSheet({
        serviceAccount,
        credentials,
        sheetId,
        sheetName,
        data: headers
      });
    }

    return JSON.stringify(response);
  } catch (err) {
    return err.message;
  }
}


exports.fetchSheet = fetchSheet;
exports.appendToSheet = appendToSheet;
exports.getSheetList = getSheetList;
exports.createSheet = createSheet;
