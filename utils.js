module.exports.getDataFromSlackRequest = event =>
  JSON.parse(
    '{"' + event.body.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    (key, value) =>
      key === ""
        ? value
        : decodeURIComponent(value)
            .replace(/\+/g, " ")
            .trim()
  );
