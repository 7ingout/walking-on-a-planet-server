const express = require("express");
const cors = require("cors");
const app = express();
// const port = 3001;
const port = process.env.PORT || 3001;
const mysql = require("mysql");
const fs = require("fs")
const bcrypt = require('bcrypt');
const saltRounds = 10;
const dbinfo = fs.readFileSync('./database.json');
const conf = JSON.parse(dbinfo);
const multer = require("multer");

const connection = mysql.createConnection({
    host: conf.host,
    user: conf.user,
    password: conf.password,
    port: conf.port,
    database:  conf.database
})
app.use(express.json());
app.use(cors());
app.use("/upload", express.static("upload"));
app.use("/upload2", express.static("upload"));


// 파일 요청시 파일이 저장될 경로와 파일이름(요청된 원본파일이름) 지정
const storage = multer.diskStorage({
    destination:"./upload",
    filename: function(req, file, cb) {
        cb(null, file.originalname); // 원본 파일 이름과 똑같이 저장하겠다
    }
})

// 업로드 객체
const upload = multer({
    storage: storage,
    limits: { fieldSize: 1000000 }
})

// upload 경로로 post 요청이 왔을 경우 응답
app.post("/upload", upload.single("cityImg"), function(req, res, next){
    res.send({
        cityImg: req.file.filename
    })
})
app.post("/upload2", upload.single("cityMapImg"), function(req, res, next){
    res.send({
        cityMapImg: req.file.filename
    })
})

app.post("/upload3", upload.single("productImg"), function(req, res, next){
    res.send({
        productImg: req.file.filename
    })
})

app.post("/upload4", upload.single("eventImg"), function(req, res, next){
    res.send({
        eventImg: req.file.filename
    })
})

// trip 모아보기 get 요청
app.get("/trip", async (req, res)=> {
    connection.query("select * from trip order by cityNational ASC",
    (err, result, fields)=> {
        res.header("Access-Control-Allow-Origin", "*");
        res.send(result)
    })
})

// 중고거래 모아보기 get 요청
app.get("/usedtrade", async (req, res)=> {
    connection.query("select * from shop order by todayDate desc",
    (err, result, fields)=> {
        res.send(result)
    })
})

// 국가 등록
app.post('/addTrip', async(req,res) => {
    const { cityImg, cityContinent, cityNational, cityDesc, cityDesc2, cityDesc3, cityMapImg } = req.body;
    connection.query("insert into trip(`cityImg`, `cityContinent`, `cityNational`, `cityDesc`, `cityDesc2`, `cityDesc3`, `citymapImg`) values(?,?,?,?,?,?,?)",
    [cityImg, cityContinent, cityNational, cityDesc, cityDesc2, cityDesc3, cityMapImg],
    (err, result, fields) => {
        res.send("등록되었습니다.");
        console.log(err);
    })
})

// 국가 정보 수정
app.put('/editTrip/:cityNational', async (req,res)=>{
    // 파라미터 값을 가지고 있는 객체
    const params = req.params;
    const { cityNational } = params;
    const body = req.body;
    const { cityImg, cityContinent, cityDesc, cityDesc2, cityDesc3, cityMapImg } = body;
    connection.query(
        `update trip set cityImg='${cityImg}', cityContinent='${cityContinent}', cityDesc='${cityDesc}', cityDesc2='${cityDesc2}', cityDesc3='${cityDesc3}', cityMapImg='${cityMapImg}' where cityNational= '${cityNational}'`,
        (err, rows, fields)=>{
            res.send(err);
        }
    )
})

// 국가 삭제
app.delete('/deleteTrip/:cityNational', async (req,res)=>{
    const params = req.params;
    const { cityNational } = params;
    connection.query(
        `delete from trip where cityNational='${cityNational}'`,
        (err, rows, fields)=>{
            res.send(rows);
        }
    )
})

// 상세보기
app.get('/destinations/:cityNational', async (req,res)=>{
    const params = req.params;
    const { cityNational } = params;
    connection.query(
        `select * from trip where cityNational='${cityNational}'`,
        (err, rows, fields)=>{
            res.send(rows[0]);
        }
    )
})

// 중고거래 등록
app.post('/addGoods', async(req,res) => {
    const { productImg, productName, productSeller, productPrice, productDesc, todayDate } = req.body;
    connection.query("insert into shop(`productImg`, `productName`, `productSeller`, `productPrice`, `productDesc`, `todayDate`) values(?,?,?,?,?,?)",
    [productImg, productName, productSeller, productPrice, productDesc, todayDate],
    (err, result, fields) => {
        res.send("등록되었습니다.");
        console.log(err);
    })
})


// 중고거래 상세보기
app.get('/usedtrade/:no', async (req,res)=>{
    const params = req.params;
    const { no } = params;
    connection.query(
        `select no, productImg, productName, productSeller, productPrice, productDesc, DATE_FORMAT(todayDate, "%Y-%m-%d") as todayDate, reserve from shop where no=${no}`,
        (err, rows, fields)=>{
            res.send(rows[0]);
        }
    )
})

// 중고거래 수정
app.put('/editGoods/:no', async (req,res)=>{
    // 파라미터 값을 가지고 있는 객체
    const params = req.params;
    const { no } = params;
    const body = req.body;
    const { productImg, productName, productSeller, productPrice, productDesc, todayDate } = req.body;
    connection.query(
        `update shop set productImg='${productImg}', productName='${productName}', productSeller='${productSeller}', productPrice='${productPrice}', productDesc='${productDesc}', todayDate='${todayDate}' where no= ${no}`,
        (err, rows, fields)=>{
            res.send(err);
        }
    )
})

// 중고거래 삭제
app.delete('/deleteGoods/:no', async (req,res)=>{
    const params = req.params;
    const { no } = params;
    connection.query(
        `delete from shop where no=${no}`,
        (err, rows, fields)=>{
            res.send(rows);
        }
    )
})

// 장바구니에 추가
app.post('/cart', async (req,res)=>{
    const body = req.body;
    const {userId, productName, productImg, productPrice, productSeller} = body;
    connection.query(
        `select * from cart where userId='${userId}' and productName='${productName}'`,
        (err, rows, fields)=>{
            if(rows.length == 1) {
                res.send('있음')
            } else {
                connection.query(
                    "insert into cart(userId, productName, productImg, productPrice, productSeller) values(?,?,?,?,?)",
                    [userId, productName, productImg, productPrice, productSeller],
                    (err, rows, fields)=>{
                        res.send(rows);
                    }
                )
            }
        }
    )
})

// 장바구니 담아놓은 사람 증가 업데이트
app.put('/cart/:no', async (req,res)=>{
    const params = req.params;
    const { no } = params;
    connection.query(
        `update shop set reserve = reserve + 1 where no= ${no}`,
        (err, rows, fields)=>{
            res.send(err);
        }
    )
})

// 장바구니 담아놓은 사람 삭제 업데이트
app.put('/minusCart/:name', async (req,res)=>{
    const params = req.params;
    const { name } = params;
    connection.query(
        `update shop set reserve = reserve - 1 where productName= '${name}'`,
        (err, rows, fields)=>{
            res.send(err);
        }
    )
})

// 마이페이지
app.get('/mypage/:userId', async (req,res)=>{
    const params = req.params;
    const { userId } = params;
    connection.query(
        `select * from cart where userId='${userId}'`,
        (err, rows, fields)=>{
            res.send(rows);
        }
    )
})

// 장바구니 가격 합계
app.get('/total/:userId', async (req,res)=>{
    const params = req.params;
    const { userId } = params;
    connection.query(
        `select sum(productPrice) as total from cart where userId='${userId}'`,
        (err, rows, fields)=>{
            res.send(rows[0]);
        }
    )
})

// 장바구니 물건 삭제
app.delete('/deleteCarts/:no', async (req,res)=>{
    const params = req.params;
    const { no } = params;
    connection.query(
        `delete from cart where no=${no}`,
        (err, rows, fields)=>{
            res.send(rows);
        }
    )
})

// 담은 물건 못담게 하기
app.get('/double/:userId/:productName', async (req,res)=>{
    const params = req.params;
    const { userId } = params;
    const { productName } = params;
    connection.query(
        `select count(*) as count from cart, shop where cart.productName = shop.productName and cart.userId='${userId}' and shop.productName='${productName}'`,
        (err, rows, fields)=>{
            res.send(rows[0]);
        }
    )
})

// 이벤트 모아보기 get 요청
app.get("/event", async (req, res)=> {
    connection.query("select * from event order by good desc",
    (err, result, fields)=> {
        res.send(result)
    })
})

// 이벤트 사진 크게보기
app.get('/event/:userId', async (req,res)=>{
    const params = req.params;
    const { userId } = params;
    connection.query(
        `select * from event where userId='${userId}'`,
        (err, rows, fields)=>{
            res.send(rows[0]);
        }
    )
})

// 이벤트 등록
app.post('/addEvent', async(req,res) => {
    const { userId, eventImg, eventTitle, eventDesc, todayDate } = req.body;
    connection.query("insert into event(`userId`, `eventImg`, `eventTitle`, `eventDesc`, `regdate`) values(?,?,?,?,?)",
    [userId, eventImg, eventTitle, eventDesc, todayDate],
    (err, result, fields) => {
        res.send("등록되었습니다.");
        console.log(err);
    })
})

// 이벤트 삭제
app.delete('/deleteEvent/:userId2', async (req,res)=>{
    const params = req.params;
    const { userId2 } = params;
    connection.query(
        `delete from event where userId='${userId2}'`,
        (err, rows, fields)=>{
            res.send(rows);
        }
    )
})

// 이벤트 좋아요 누르기
app.put('/good/:userId', async (req,res)=>{
    const params = req.params;
    const { userId } = params;
    connection.query(
        `update event set good = good + 1 where userId= '${userId}'`,
        (err, rows, fields)=>{
            res.send(err);
        }
    )
})

// 회원가입 요청
app.post("/join", async (req,res)=> {
    let myPlaintextPass = req.body.userPass;
    let myPass = "";
    if(myPlaintextPass != '' && myPlaintextPass != undefined) {
        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(myPlaintextPass, salt, function(err, hash) {
                // Store hash in your password DB.
                myPass = hash;
                console.log(myPass);
                // 쿼리 작성
                const { userId, userName, userPost, userAdd, userAdd2, userTel, userPhone, userMail, userYear, userMonth, userDay } = req.body;
                // connection.query 인자 첫번째: 쿼리문, 두번째: 쿼리문에 들어갈 값, 세번째: 처리 되면 하는 애
                connection.query("insert into members(userId, userPass, userName, userPost, userAdd, userAdd2, userTel, userPhone, userMail, userYear, userMonth, userDay, regdate) values(?,?,?,?,?,?,?,?,?,?,?,?,DATE_FORMAT(now(),'%Y-%m-%d'))",
                    [userId, myPass, userName, userPost, userAdd, userAdd2, userTel, userPhone, userMail, userYear, userMonth, userDay],
                    (err, result, fields) => {
                        console.log(result)
                        console.log(err)
                        res.send("등록되었습니다.")
                    }
                )
            });
        });
    }
})

// 회원가입 id 중복 확인
app.get('/idCh', async (req,res)=>{
    connection.query(
        "select userId from members",
        (err, rows, fields)=> {
            res.send(rows)
        }
    )
})

// 로그인
app.get('/getId/:id', async (req,res)=>{
    const params = req.params;
    const { id } = params;
    connection.query(
        `select userId from members where userId='${id}'`,
        (err, rows, fields)=>{
            res.send(rows);
        }
    )
})

// 로그인 요청
app.post('/login', async (req, res)=> {
    const {userId, userPass} = req.body;
    connection.query(`select * from members where userId = '${userId}'`,
        (err, rows, fileds)=>{
            if(rows != undefined) {
                if(rows[0] == undefined) {
                    res.send(null)
                } else {
                    // Load hash from your password DB.
                    bcrypt.compare(userPass, rows[0].userPass, function(err, result) {
                        // result == true
                        if(result == true) {
                            res.send(rows[0])
                        } else {
                            res.send('실패')
                        }
                    });
                }
            } else {
                res.send('실패')
            }
        }
    )
})

// 메인에 보내기 
// visual
app.get('/visuals', async (req, res)=> {
    connection.query(
        "select * from visual",
        (err, rows, fields)=> {
            res.send(rows)
        }
    )
})
// recommand
app.get('/recommands', async (req, res)=> {
    connection.query(
        "select * from recommand",
        (err, rows, fields)=> {
            res.send(rows)
        }
    )
})
// pic
app.get('/pics', async (req, res)=> {
    connection.query(
        "select * from pics",
        (err, rows, fields)=> {
            res.send(rows)
        }
    )
})

// 검색 기능
app.get('/search/:searchInput', async (req, res)=> {
    const params = req.params;
    const { searchInput } = params;
    connection.query(
        `SELECT * FROM trip where cityNational Like '%${searchInput}%'`,
        (err, rows, fields)=> {
            // res.send(rows[0])
            res.send(rows);
            console.log(rows);
        }
    )
})

// 내가 내놓은 상품들
app.get('/my/:userId', async (req,res)=>{
    const params = req.params;
    const { userId } = params;
    connection.query(
        `select * from shop where productSeller='${userId}'`,
        (err, rows, fields)=>{
            res.send(rows);
        }
    )
})

// 서버실행
app.listen(port, () => {
    console.log("서버가 돌아가고 있습니다.")
})