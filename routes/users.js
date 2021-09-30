const express = require('express');
const path = require('path');
const url = require('url');
const fs = require('fs');
const router = express.Router();

// sequelize 초기화
const { Sequelize, DataTypes, Model } = require('sequelize');

// 연결할 DB 설정 (DB schema, ID, PW, 위치)
const sequelize = new Sequelize('travel', 'ranna', 'asdfg', {
  host: 'localhost',
  dialect: 'mysql'
});

const fetch = require('node-fetch');

//인기 여행지 API
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

// 읽어들일 Table 모양(schema) 정의
const usersTable = sequelize.define('users', {
  _id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(45),
    allowNull: false,
    primaryKey: true
  },
  password: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  telephone: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
}, {
  tableName: 'users',
  timestamps: false,
});
sequelize.sync()

//회원가입창
router.get('/signup', (req, res) => {
  res.render('user/signup');
});

//회원가입 데이터
router.post('/signup', async (req, res) => {
  let body = req.body;

  // DB 연결 체크
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    res.send('<script type="text/javascript">alert("서버 에러");location.href="/sign_up";</script>');
    return;
  }
  
  // 새로운 item 생성
  try {
    await usersTable.create({
      name: body.name,
      email: body.email,
      password: body.password,
      telephone: body.telephone,
    });
  }catch (err) {
    console.log(err);
    res.send('<script type="text/javascript">alert("회원가입 실패");location.href="/signup";</script>');
    return;
  }
  res.send('<script type="text/javascript">alert("가입 성공");location.href="/users";</script>');
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//로그인 창(화면) - ejs는 무조 건 render
router.get('/users', async (req, res) => {
  if (req.session.email == null) {
    res.render('user/login');
  } else {
    let user = {
      email: req.session.email,
      name: req.session.name
    }
    try {
      myCart = await cartTable.findAll({
        where: {
          userId: req.session.userId
        }
      });
      // myCartWithName = await cartTable.findAll({
      //   include: [
      //     {
      //       model: usersTable,
      //       required: true
      //     }
      //   ],
      //   where: {
      //     userId:  req.session.userId
      //   }
      // })
      myCart.reverse();
      console.log(myCart);
      // console.log(myCartWithName);
      // myCartWithName.reverse();
      res.render('profile', {user: user, cart: myCart});
    } catch (err) {
      console.log(err)
      res.render('profile', {user: user, cart: []});
    }
    // res.render('profile', {user: user, cart: cart});
  }
});

//로그인 데이터용
router.post('/users', async (req, res) => {
  let body = req.body;
  console.log(body)
  //id나 password가 빈칸이면
  if (body.email == null || body.password == null) {
    res.send('<script type="text/javascript">alert("잘못된 ID 혹은 비밀번호입니다.");location.href="/users";</script>');
    return;
  }
  // DB 연결 체크
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    res.send('<script type="text/javascript">alert("서버 에러");location.href="/signup";</script>');
    return;
  }
  
  let user;
  try {
    user = await usersTable.findOne({
      where: {
        email: body.email,
        password: body.password
      }
    });
    
    if (user == null) {
      res.send('<script type="text/javascript">alert("잘못된 ID 혹은 비밀번호입니다.");location.href="/users";</script>');
      return;
    }
    else {
      // 세션 설정
      req.session.email = user.email;
      req.session.name = user.name;
      req.session.telephone = user.telephone;
      req.session.userId = user._id;
      res.send('<script type="text/javascript"> location.href = "/" </script>');
      return;
    }
  } catch (err) {
    res.send('<script type="text/javascript">alert("서버 에러");location.href="/users";</script>');
  }
});

// 로그아웃
router.get("/logout", async function(req,res, next){
  let locations = await getPopularLocation();
  if(req.session.name) {
    req.session.name = undefined;
    req.session.destroy(function(err) { //세션을 삭제하는 메서드 destroy
      if(err) {
        console.log(err);
      }else{
        res.render('index', {area: locations.area, location: locations.item});
      }
    })
  } else{
    res.render('index', {area: locations.area, location: locations.item});
  }
});

//profile
router.get('/profiles', (req, res) => {
  if (req.session.email == null) {
    res.render('user/login');
  } else {
    let user = {
      email: req.session.email,
      name: req.session.name,
      telephone: req.session.telephone,
    }
    res.render('profile_s', {user: user});
  }
});

//cart
const cartTable = sequelize.define('cart', {
  userId: { //게시글 아이디
    type: DataTypes.INTEGER,
    // allowNull: true, // Not NULL (NN)
    primaryKey: true // PK
  },
  id: {
    type: DataTypes.STRING(45),
    // allowNull: false, // Not NULL (NN)
    primaryKey: true, // PK
    unique: true
  },
  place_name: {
    type: DataTypes.STRING(45),
    allowNull: false, // Not NULL (NN)
    primaryKey: false // PK
  },
  phone: {
    type: DataTypes.STRING(45),
    allowNull: false, // Not NULL (NN)
    primaryKey: false // PK
  },
  x: {
    type: DataTypes.STRING(45),
    allowNull: false, // Not NULL (NN)
    primaryKey: false // PK
  },
  y: {
    type: DataTypes.STRING(45),
    allowNull: false, // Not NULL (NN)
    primaryKey: false // PK
  }
}, {
  tableName: 'cart',
  timestamps: true,
});

usersTable.hasMany(cartTable, {foreignKey: 'userId', sourceKey: '_id'});
cartTable.belongsTo(usersTable, {foreignKey: 'userId', targetKey: '_id'});
sequelize.sync()

// router.get('/cart', (req, res) => {
//   res.render('profile');
// });

router.post('/cart', async (req, res) => {
  let body = req.body;
  console.log(body) //place에 문자를 담은게 나옴
  let place = JSON.parse(decodeURIComponent(body.place)); //문자열을 객체화 
  
  // DB 연결 체크
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    res.send('<script type="text/javascript">alert("서버 에러");location.href="/profiles";</script>');
    return;
  }
  
  // 새로운 item 생성 (새로운 사용자 생성)
  try {
    place.userId = req.session.userId;
    console.log(place);
    await cartTable.create(place);
  } catch (err) {
    console.log(err);
    res.send(null);
    return;
  }
  res.send('<script type="text/javascript">alert("추가 성공");location.href="/profiles";</script>');
});

////////////cart_get
router.get('/cart', async (req, res) => {
  if (req.session.email == null) {
    res.render('login');
  } else {
    // DB 연결 체크
    try {
      await sequelize.authenticate();
      console.log('Connection has been established successfully.');
    } catch (err) {
      console.error('Unable to connect to the database:', err);
      res.send('<script type="text/javascript">alert("서버 에러");location.href="/sign_up";</script>');
      return;
    }
    let user = {
      email: req.session.email,
      name: req.session.name
    }

    let myCart;
    try {
      myCart = await cartTable.findAll({
        where: {
          userId: req.session.userId
        }
      });
      myCartWithName = await cartTable.findAll({
        include: [
          {
            model: usersTable,
            required: true
          }
        ],
        where: {
          userId:  req.session.userId
        }
      })
      myCart.reverse();
      console.log(myCart);
      console.log(myCartWithName);
      myCartWithName.reverse();
      res.render('profile', {user: user, cart: myCartWithName});
    } catch (err) {
      console.log(err)
      res.render('profile', {user: user, cart: []});
    }
  }
});

router.post('/deleteCartItem', async (req, res) => {
  let id = req.body.id;
  console.log(id)
  
  // DB 연결 체크
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    res.send('<script type="text/javascript">alert("서버 에러");location.href="/profiles";</script>');
    return;
  }
  
  // 새로운 item 생성 (새로운 사용자 생성)
  try {

    await cartTable.destroy({
      where: {
        userId: req.session.userId,
        id: id
      }
    });
  } catch (err) {
    console.log(err);
    res.send(null);
    return;
  }
  res.send('<script type="text/javascript">alert("추가 성공");location.href="/profiles";</script>');
});

module.exports = router;
