var express = require('express');
var router = express.Router();
var mysql = require('../mysql');


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/process_get', function (request, response) {
  //sql字符串和参数
  var fetchSql = "select url,source_name,title,publish_date from fetches where";
  var end = false; //判断是否已经结束
  if (request.query.title == "true") {
    if (!end) {
      end = true;
    } else {
      fetchSql += " or";
    }
    fetchSql += " title like '%" + request.query.words + "%'";
  }

  if (request.query.keywords == "true"){
    if(!end){
      end = true;
    }else {
      fetchSql += " or";
    }
    fetchSql += " keywords like '%" + request.query.words + "%'";
  }

  if (request.query.content == "true"){
    if (!end){
      end = true;
    }else {
      fetchSql += "or";
    }
    fetchSql += " content like '%" + request.query.words + "%'";
  }

  fetchSql += " ORDER BY publish_date DESC;";

  // var fetchSql = "select url,source_name,title,author,publish_date " + "from fetches where title like '%" + request.query.title + "%';";

  
  
  console.log("查询语句为"+fetchSql);

  mysql.query(fetchSql, function (err, result, fields) {
    if (err) throw err;
    // console.log(result);
    if (result == undefined) return;
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(result));
  });
});



// 后端实现获取相关数据 
router.get('/timehot', function(request, response) {
  console.log(request);
  //sql字符串和参数
  var fetchSql = "select source_name,count(*) as num " +
      "from fetches where keywords like '%" + request.query.keywords + "%' group by source_name;";
      
  console.log(fetchSql);
  console.log("*****");
  mysql.query(fetchSql, function(err, result, fields) {
    if (err) throw err;
    console.log("*****");
      response.writeHead(200, {
          "Content-Type": "application/json"
      });
      response.write(JSON.stringify(result));
      response.end();
  });
});


module.exports = router;
