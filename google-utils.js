const { google } = require("googleapis");
const { auth } = require("google-auth-library");
const sheets = google.sheets("v4");
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/documents"
];

const defaultServiceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// Create auth from service account
const authorize = async ({ serviceAccount }) => {
  const client = auth.fromJSON(serviceAccount);
  client.scopes = SCOPES;
  return client;
};

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

function authAppendToSheet({ auth, sheetId, sheetName, insertAt, data }) {
  const sheets = google.sheets({ version: "v4", auth });
  const range = insertAt ? `${sheetName}!${insertAt}` : sheetName;
  return sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    resource: {
      values: [data]
    },
    auth: auth
  });
}

const fetchSheet = async ({
  sheetId,
  sheetName,
  serviceAccount = defaultServiceAccount
}) => {
  const auth = await authorize({ serviceAccount });
  return authFetchSheet({ auth, sheetId, sheetName });
};

const appendToSheet = async ({
  sheetId,
  sheetName,
  insertAt,
  data,
  serviceAccount = defaultServiceAccount
}) => {
  const auth = await authorize({ serviceAccount });
  return authAppendToSheet({ auth, sheetId, sheetName, insertAt, data });
};

const getSheetList = async ({
  sheetId,
  serviceAccount = defaultServiceAccount
}) => {
  const authClient = await authorize({ serviceAccount });
  const request = {
    spreadsheetId: sheetId,
    ranges: [],
    includeGridData: true,
    auth: authClient
  };

  const response = (await sheets.spreadsheets.get(request)).data;
  return response.sheets.map(s => s.properties.title);
};

const createSheet = async ({
  sheetId,
  sheetName,
  headers,
  serviceAccount = defaultServiceAccount
}) => {
  const authClient = await authorize({ serviceAccount });
  const requestAdd = {
    spreadsheetId: sheetId,
    resource: {
      requests: [
        {
          addSheet: {
            properties: { title: sheetName }
          }
        }
      ]
    },
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
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: newSheetId,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                fields: "userEnteredFormat.textFormat.bold"
              }
            }
          ]
        },
        auth: authClient
      };

      const response2 = (await sheets.spreadsheets.batchUpdate(requestBold))
        .data;

      await appendToSheet({
        serviceAccount,
        sheetId,
        sheetName,
        data: headers
      });
    }

    return JSON.stringify(response);
  } catch (err) {
    return err.message;
  }
};

const getDocument = async ({
  documentId,
  serviceAccount = defaultServiceAccount
}) => {
  const auth = await authorize({ serviceAccount });
  const docs = google.docs({ version: "v1", auth });
  return docs.documents.get({
    documentId
  });
};

const appendToDocument = async ({
  documentId,
  text,
  serviceAccount = defaultServiceAccount
}) => {
  const auth = await authorize({ serviceAccount });
  const docs = google.docs({ version: "v1", auth });
  return docs.documents
    .batchUpdate({
      auth,
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: 1
              },
              text
            }
          }
        ]
      }
    })
    .catch(err => {
      console.log(err);
    });
};

module.exports = {
  fetchSheet,
  appendToSheet,
  getSheetList,
  createSheet,
  getDocument,
  appendToDocument
};

async function go() {
  const sheet = await fetchSheet({
    sheetId: "1kLziCv8F3EHIOjJFGSP4KzoCQAhqzmQBkvR9SJLyW5M",
    sheetName: "milric"
  });
  console.log(sheet);
}

go();
