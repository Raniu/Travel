//path 라이브러리 사용(폴더경로 연산)
const path = require('path')
const crypto = require('crypto');
const fs = require('fs');

//서버로써 express 프레임 워크 사용
const express = require('express')
require('dotenv').config();

// 기본 라우터
const pageRouter = require('./routes/users');

//express 서버 1개를 생성
const app = express()

// Express 서버 포트 설정
const port = 3100

//쿠키를 사용하기 위한 모듈
const cookieParser = require('cookie-parser');
const session = require('express-session');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('project1-master'));
app.use(cookieParser());

// session
app.use(session({
  secret: 'travel',
  resave: false,
  saveUninitialized: true,
  secret: process.env.COOKIE_SECRET,
  cookie: {
      httpOnly: true,
      secure: false,
  },
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const fetch = require('node-fetch');
async function getPopularLocation() {
  const serviceKey = 'WGp4zeCx9%2FHbRXwaXdgbca4Nbvmvp6C4gbWEFlPkCnPBZuh4Ozm7bZndkes7pjNcveiI%2BVvQtq3vGF026k3PiA%3D%3D';
  let areaCodes = JSON.parse(fs.readFileSync('areaCode.json').toString());
  let randLocation = Math.floor(Math.random() * areaCodes.length);
  let keyword = areaCodes[randLocation].name;

  var url = 'http://api.visitkorea.or.kr/openapi/service/rest/KorService/searchKeyword';
  var queryParams = '?' + encodeURIComponent('ServiceKey') + '=' + serviceKey; /* Service Key*/
  queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('10'); /* */
  queryParams += '&' + encodeURIComponent('MobileOS') + '=' + encodeURIComponent('ETC'); /* */
  queryParams += '&' + encodeURIComponent('MobileApp') + '=' + encodeURIComponent('AppTest'); /* */
  queryParams += '&' + encodeURIComponent('keyword') + '=' + encodeURIComponent(keyword);
  queryParams += '&' + encodeURIComponent('arrange') + '=' + encodeURIComponent('B');
  queryParams += '&' + encodeURIComponent('_type') + '=' + encodeURIComponent('json');

  let locations = await fetch(url+queryParams).then(res => res.json());
  return {area: keyword, item: locations.response.body.items.item};
}

app.get('/', async function (req, res) {
  let locations = await getPopularLocation();
  res.render('index', {area: locations.area, location: locations.item});
})

//지도에서 도시 선택하면 나오는 페이지
app.get('/region/:id', function (req, res) {
  let h
  console.log(req.params.id)

  if(req.params.id == 'seoul'){
    h = '서울'
  } else if(req.params.id == 'incheon'){
    h = '인천'
  } else if(req.params.id == 'Gyeonggi'){
    h = '경기도'
  } else if(req.params.id == 'sejong'){
    h = '세종'
  } else if(req.params.id == 'gangwon'){
    h = '강원도'
  } else if(req.params.id == 'daejeon'){
    h = '대전'
  } else if(req.params.id == 'chungnam'){
    h = '충청남도'
  } else if(req.params.id == 'chungbuk'){
    h = '충청북도'
  } else if(req.params.id == 'daegu'){
    h = '대구'
  } else if(req.params.id == 'gyeongbuk'){
    h = '경상북도'
  } else if(req.params.id == 'jeonbuk'){
    h = '전라북도'
  } else if(req.params.id == 'busan'){
    h = '부산'
  } else if(req.params.id == 'ulsan'){
    h = '울산'
  } else if(req.params.id == 'gyeongnam'){
    h = '경상남도'
  } else if(req.params.id == 'gwangju'){
    h = '광주'
  } else if(req.params.id == 'jeonnam'){
    h = '전라남도'
  } else if(req.params.id == 'jeju'){
    h = '제주도'
  }
  res.render('seoul',{name:encodeURIComponent(h)})
})

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname + '/search.html'))
})

app.use("/", express.static(__dirname))
app.use("/public", express.static(__dirname + '/public'))
app.use("/css", express.static(__dirname + '/css'))
app.use("/js", express.static(__dirname + '/js'))
app.use("/images", express.static(__dirname + '/images'))
app.use("/fonts", express.static(__dirname + '/fonts'))

app.use("/public", express.static(__dirname + '/public'));

app.use('/', pageRouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
