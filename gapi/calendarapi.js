const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto'); // 加密
const {google} = require('googleapis');
const secretkey="cay0rrz490udct=u0cd108m"; // for AES

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = '../token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
const authorize = (credentials, callback, res, data) => {
  const {client_secret, client_id, redirect_uris} = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback, res, data);

    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, res, data);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback, res, data) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client, res, data);
    });
  });
}


/**
 * 讀取 credentials.json 丟到 authorize 驗證身份
 * @param {function} Evnet action
 */
function makeAuthorize(callback, res, data) {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);

    authorize(JSON.parse(content), callback, res, data);
  });
}


/**
 * Make eventList id crypto
 * @param {array} include evnet object.
 * @return {array} makes event id crypto
 */
function eventEnbaseId(events) {
  for (var i = events.length - 1; i >= 0; i--) {
    events[i].id = enBaseId(events[i].id)
  }
  return events;
}


/**
 * AES 加密
 * @param {string} evnet id
 * @return {string} evnet id AES crypto
 */
function enBaseId(eventId) {
  const encipher = crypto.createCipher('aes192', secretkey);
  return (encipher.update(eventId, "utf8", "hex") + encipher.final('hex'));
}

/**
 * AES解密
 * @param {string} evnet id AES crypto
 * @return {string} evnet id
 */
function deBaseId(eventId) {
  const decipher = crypto.createDecipher('aes192', secretkey);
  return (decipher.update(eventId,"hex", "utf8") + decipher.final("utf8"));
}

/**
 * datetime to iso
 * @param {string} datetime
 * @return {string} datetime ISO
 */
function dateTime2ISO(dateTime) {
  return (new Date(dateTime)).toISOString();
}

/**
 * 撈取 calendar event list api 資料，預設8筆
 * @param {object} oAuth2Client
 * @res {json} event list 所有資料
 */
const listEvents = (auth, res) => {
  const calendar = google.calendar({version: 'v3', auth});

  const condition = {
    'calendarId': 'primary',
    'timeMin': (new Date()).toISOString(),
    'maxResults': 8,
    'singleEvents': true,
    'orderBy': 'startTime',
  };

  // call calendat api event.list for showing list
  calendar.events.list(condition, (err, response) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = response.data.items;

    if (events.length) {
      console.log('Upcoming 8 events:');
      const eventItems = eventEnbaseId(events)

      // 轉json type 丟回前端
      res.json(eventItems);
    } else {
      // given json type, sent some msg to view
      res.json({'result': '0', 'msg':'No upcoming events found, please create.'});
      console.log('No upcoming events found.');
    }
  });
};


/**
 * 使用 calendar event insert api，新增事件
 * @param {object} oAuth2Client
 * @param {object} event data
 */
const storeEvent = (auth, res, event) => {
  const calendar = google.calendar({version: 'v3', auth});
  const condition = {
    'calendarId': 'primary',
    'resource': event
  };

  calendar.events.insert(condition, (err, response) => {
    if (err) {
      console.log('Error: ', err);
      res.json({'result': '0', 'msg': 'Create event fault.'});
    }
    console.log('新增成功');
    res.json({'result': '1', 'msg':'Create event success.'});
  });
};


/**
 * 使用 calendar event update api，更新事件內容
 * @param {object} oAuth2Client
 * @param {object} eventPack 將 eventId 與 eventUpdate 資料分開
 */
const updateEvent = (auth, res, eventPack) => {
  const calendar = google.calendar({version: 'v3', auth});
  const eventId = eventPack.eventId;
  const event = eventPack.eventContent;

  const condition = {
    'eventId': eventId,
    'calendarId': 'primary',
    'resource': event,
  };

  calendar.events.update(condition, (err, response) => {
    if (err) {
      console.log('Error: ', err);
      res.json({'result': '0', 'msg': 'Update event fault.'});
    }
    console.log('更新成功');
    res.json({'result': '1', 'msg':'Update event success.'});
  });
};


/**
 * 使用 calendar event get api 取得 event 資料.
 * get info from api, then render with parameter to view.
 * @param {object} oAuth2Client
 * @param {string} event id
 */
const editEvent = (auth, res, eventId) => {
  const calendar = google.calendar({version: 'v3', auth});

  const condition = {
    'calendarId': 'primary',
    'eventId': eventId
  };

  calendar.events.get(condition, (err, response) => {
    const eventData = response.data;

    if (err) {
        console.log('The API returns an error: ', err);
    }

    var isAllday = true;
    if (eventData.start.date) {
      var startdate = eventData.start.date;
      var enddate = eventData.end.date;
      var starttime = "";
      var endtime = "";
    } else {
      var startdate = eventData.start.dateTime.split('T')[0];
      var enddate = eventData.end.dateTime.split("T")[0];
      var starttime = eventData.start.dateTime.split("T")[1];
      var endtime = eventData.end.dateTime.split("T")[1];
      isAllday = false
    }

    // 將日期字串中的 '-' 依序取帶為、年、月及加日
    startdate = startdate.replace('-','年').replace('-','月')+"日";
    enddate = enddate.replace('-','年').replace('-','月')+"日";

    var renderData = {
      'title': 'Edit items',
      'eid': enBaseId(eventData.id),
      'summary': eventData.summary,
      'isallday': isAllday,
      'startdate': startdate,
      'enddate': enddate,
      'starttime': starttime || "",
      'endtime': endtime || "",
      'location': eventData.location || "",
      'description': eventData.description || ""
    }

    res.render('edit', renderData);
  });
};


/**
 * 使用 calendar event delete api to delete event.
 * @param {object} oAuth2Client
 * @param {string} event id
 */
const destroyEvent = (auth, res, event) => {
  const calendar = google.calendar({version: 'v3', auth});
  const condition = {
    'calendarId': 'primary',
    'eventId': event.id
  };

  calendar.events.delete(condition, (err) => {
    if (err) {
      console.log('Error: ', err);
      res.json({'result': '0', 'msg': 'Deleted event fault.'});
    }
    console.log('刪除成功');
    res.json({'result': '1', 'msg': 'Deleted event success.'});
  });
};

// call listEvents
exports.loadList = (req, res) => {
  makeAuthorize(listEvents, res);
};

// call storeEvent
exports.store = (req, res) => {
  if (!req.body.datepicker1) return res.json({'result': '0', 'msg':'日期欄位為必填'});

  // reg add 'g' to travel string
  // 將年月轉'-'號
  const startDate = req.body.datepicker1.replace(/年|月/g, '-').replace('日','');
  const endDate = req.body.datepicker2.replace(/年|月/g, '-').replace('日','');;

  const startTime = req.body.timepicker1 || "";
  const endTime = req.body.timepicker2 || "";

  // 轉UTC
  const startDateTime = dateTime2ISO(startDate +' '+ startTime);
  const endDateTime = dateTime2ISO(endDate +' '+ endTime);

  // 檢查是否為全天
  if (req.body.allday) {
    var date = {
      'start': {'date': startDate},
      'end': {'date': endDate}
    };
  } else {
    var date = {
      'start': {'dateTime': startDateTime},
      'end': {'dateTime': endDateTime}
    };
  }

  const detail = {
    'summary': req.body.summary || 'No Summary',
    'location': req.body.location,
    'description': req.body.description,
  };

  // 用 object.assign merge 兩物件
  const data = Object.assign(detail, date);

  makeAuthorize(storeEvent, res, data);
};

// call editEvent
exports.edit = (req, res) => {
  // 從 editEvent 取得資料丟回頁面
  makeAuthorize(editEvent, res, deBaseId(req.params.eventId));
};

// call updateEvent
exports.update = (req, res) => {
  if (!req.body.datepicker1) return res.json({'result': '0', 'msg':'日期欄位為必填'});

  // reg add 'g' to travel string
  // 將年月轉'-'號
  const startDate = req.body.datepicker1.replace(/年|月/g, '-').replace('日','');
  const endDate = req.body.datepicker2.replace(/年|月/g, '-').replace('日','');;

  const startTime = req.body.timepicker1 || "";
  const endTime = req.body.timepicker2 || "";

  const startDateTime = dateTime2ISO(startDate +' '+ startTime);
  const endDateTime = dateTime2ISO(endDate +' '+ endTime);

  // check if whole days
  if (req.body.allday) {
    var date = {
      'start': {'date': startDate},
      'end': {'date': endDate}
    };
  } else {
    var date = {
      'start': {'dateTime': startDateTime},
      'end': {'dateTime': endDateTime}
    };
  }

  const detail = {
    'summary': req.body.summary || 'No Summary',
    'location': req.body.location,
    'description': req.body.description,
  };

  // object.assign merge both objects
  // eventid 另外放
  const data = {
    'eventId': deBaseId(req.body.eventId),
    'eventContent': Object.assign(detail, date)
  };

  makeAuthorize(updateEvent, res, data)
};

// call destroyEvent
exports.destroy = (req, res) => {
  const data = {'id': deBaseId(req.body.id)}
  makeAuthorize(destroyEvent, res, data)
};