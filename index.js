'use strict';
const http = require ('http');
const pug = require ('pug');
const mysql = require ('promise-mysql');
const querystring = require('querystring');

const DB_NAME = 'phh_blog_system';
const DB_USER = process.env['PHH_DB_USER'] || 'root';
const DB_PASSWD = process.env['PHH_DB_PASSWD'] || '';

const server = http.createServer ((req, res) => {
  if (req.method == 'GET' && req.url == '/bootstrap.css') {
    res.writeHead (200, {
      'Content-Type': 'text/css; charset=utf-8'
    });
    const fs = require('fs');
    const rs = fs.createReadStream('./bootstrap.css');
    rs.pipe(res);
    return;
  }

  if (req.method == 'GET' && req.url == '/lifegame.js') {
    res.writeHead (200, {
      'Content-Type': 'text/javascript; charset=utf-8'
    });
    const fs = require('fs');
    const rs = fs.createReadStream('./lifegame.js');
    rs.pipe(res);
    return;
  }

  if (req.method == 'GET' && req.url == '/festisite_lego.png') {
    res.writeHead (200, {
      'Content-Type': 'image/png; charset=utf-8'
    });
    const fs = require('fs');
    const rs = fs.createReadStream('./festisite_lego.png');
    rs.pipe(res);
    return;
  }
    
  res.writeHead (200, {
    'Content-Type': 'text/html; charset=utf-8'
  });

  deleteOldLogs ();
  switch (req.method) {
  case 'GET':
    switch (req.url) {
    case '/':
      showTopPage (req, res);
      break;
    case '/profile':
      showProfilePage (req, res);
      break;
    case '/entry/post':
      showPostPage (req, res);
      break;
    default:
      res.end ();
      break;
    }
    break;
  case 'POST':
    switch (req.url) {
    case '/entry/post/add':
      postNewEntry (req, res);
      break;
    case '/entry/delete':
      req.on('data', (data) => {
        deleteDeleteLogs (req, res, data);
      });
      break;
    case '/profile/update':
      req.on('data', (data) => {
        profileUpdate (req, res, data);
      });
      break;
    case '/entry/edit':
      req.on('data', (data) => {
        postUpdate (req, res, data);
      });
      break;
    default:
      res.end ();
      break;
    }
    break;
  default:
    res.end ();
    break;
  }
}).on('error', (e) => {
  console.error ('[' + new Date() + '] Server Error', e);
}).on('clientError', (e) => {
  console.error ('[' + new Date() + '] Client Error', e);
});

// HTTP サーバーを立ち上げる
const port = 8000;
server.listen (port, () => {
  console.info ('[' + new Date() + '] Listening on ' + port);
});

// トップページを表示する
function showTopPage (req, res) {
  let connection;
  let entries;
  let tags = []

  mysql.createConnection({
    host: 'localhost',
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_NAME
  }).then ((conn) => {
    connection = conn;
    return connection.query ("SELECT * FROM entry ORDER BY updated_at DESC, id");
  }).then ((rows) => {
    entries = rows;
    return connection.query ('SELECT * FROM tag');
  }).then ((rows) => {
    for (let row of rows) {
      tags.push ({
        tag: row,
        query: querystring.stringify (row),
      });
    }

    res.write(pug.renderFile('./includes/top.pug', {
      entries: entries,
      tags: tags,
    }));

    connection.end ();
    res.end ();
  }).catch ((error) => {
    console.log (error);
  });
}

// プロフィールページを表示する
function showProfilePage  (req, res) {
  let connection;
  let user;
  let blood_types;
  let date;
  let blood_type_id;

  mysql.createConnection({
    host: 'localhost',
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_NAME
  }).then ((conn) => {
    connection = conn;
    return connection.query ('SELECT name, nickname, blood_type_id, birthday, updated_at FROM user');
  }).then ((rows) => {
    // console.log(rows);
    user = rows[0];
    
// 誕生日
    let oldDate = rows[0].birthday
    let y = oldDate.getFullYear();
    let m = oldDate.getMonth() + 1;
    let d = oldDate.getDate();

    if (m < 10) {
      m = '0' + m;
    }
    if (d < 10) {
      d = '0' + d;
    }
    date = y + "-" + m + "-" + d
    user.birthday = date;

    return connection.query ('SELECT * FROM blood_type;')
  }).then ((rows) => {
    blood_types = rows;
    // console.log(rows)
    // console.log(blood_types);

    res.write(pug.renderFile('./includes/profile.pug', {
      profile: user, blood_types: blood_types
    }));

    connection.end ();
    res.end ();

  }).catch ((error) => {
    console.log (error);
  });;
}

// 投稿ページを表示する
function showPostPage (req, res) {
  let connection;
  
  mysql.createConnection({
    host: 'localhost',
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_NAME
  }).then ((conn) => {
    connection = conn;
    return connection.query ('SELECT * FROM tag');
  }).then ((rows) => {
    res.write(pug.renderFile('./includes/post.pug',
                             {
                               tags: rows,
                             }));
    connection.end ();
    res.end ();

  }).catch ((error) => {
    console.log (error);
  });
}

// 新規投稿をする
function postNewEntry (req, res) {
  req.on('data', (data) => {
    // 入力内容を取得し、
    const decoded = decodeURIComponent(data);
    const querystring = require('querystring');
    let parsedResult = querystring.parse(decoded);
    let connection;

  // DBに登録する
  mysql.createConnection ({
    host: 'localhost',
    user: 'root',         // 'root'
    password: '',   // ''
    database: DB_NAME,
  }).then ((conn) => {
    connection = conn;
    return connection.query ('INSERT INTO `entry` (`user_id`,`title`,`tag_id`,`text`) VALUES(?,?,?,?)',
                      [
                        1,
                        parsedResult['title'],
                        parsedResult['tag'],
                        parsedResult['entry'],
                      ]);
  }).then ((result) => {
    connection.end ();

    // トップページに戻る
    showTopPage (req, res); 
    }).catch ((error) => {
      console.log (error);
    });
  });
}

// 投稿編集
function postUpdate (req, res, data) {
  let connection;

  const decoded = decodeURIComponent(data);
  const parsedResult = querystring.parse(decoded);
  const user_id = parsedResult['user_id'];
  const title = parsedResult['title'];
  const tag_id = parsedResult['tag_id'];

  mysql.createConnection ({
    host: 'localhost',
    user: 'root',         // 'root'
    password: '',   // ''
    database: DB_NAME,
  }).then ((conn) => {
    connection = conn;
    return connection.query ('UPDATE entry SET user_id = ?, title = ?, tag_id = ?',[user_id, title, tag_id]);
  }).then (() => {
    connection.end ();
    showTopPage(req, res);
  }).catch ((error) => {
    console.log (error);
  });
}

// 投稿削除
function deleteDeleteLogs (req, res, data) {
  let connection;
  const decoded = decodeURIComponent(data);
  const parsedResult = querystring.parse(decoded);
  const item = parsedResult['entryid'];
  
  mysql.createConnection ({
    host: 'localhost',
    user: 'root',         // 'root'
    password: '',   // ''
    database: DB_NAME,
  }).then ((conn) => {
    connection = conn;
    return connection.query ('DELETE FROM entry WHERE id = ?', [item]);
  }).then (() => {
    connection.end ();
    showTopPage(req, res);
  }).catch ((error) => {
    console.log (error);
  });
}

// 24時間で投稿削除
function deleteOldLogs () {
  let connection;
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);  
  mysql.createConnection ({
    host: 'localhost',
    user: 'root',         // 'root'
    password: '',   // ''
    database: DB_NAME,
  }).then ((conn) => {
    connection = conn;
    return connection.query ('DELETE FROM entry WHERE created_at < ?', [yesterday]);
  }).then (() => {
    connection.end ();
  }).catch ((error) => {
    console.log (error);
  });
}

// プロフィール変更
function profileUpdate (req, res, data) {
  let connection;

  const decoded = decodeURIComponent(data);
  const parsedResult = querystring.parse(decoded);
  const name = parsedResult['name'];
  const nickname = parsedResult['nickname'];
  const blood_type_id = parsedResult['blood_type_id'];
  const birthday = parsedResult['birthday'];

  mysql.createConnection ({
    host: 'localhost',
    user: 'root',         // 'root'
    password: '',   // ''
    database: DB_NAME,
  }).then ((conn) => {
    connection = conn;
    return connection.query ('UPDATE user SET name = ?, nickname = ?, blood_type_id = ?, birthday = ?',[name, nickname, blood_type_id, birthday]);
  }).then (() => {
    connection.end ();
    showProfilePage(req, res);
  }).catch ((error) => {
    console.log (error);
  });
}
