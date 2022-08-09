const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001;
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

// 국가 등록
app.post('/addTrip', async(req,res) => {
    const { cityImg, cityContinent, cityNational, cityDesc, cityDesc2, cityDesc3, cityMapImg} = req.body;
    connection.query("insert into trip(`cityImg`, `cityContinent`, `cityNational`, `cityDesc`, `cityDesc2`, `cityDesc3`, `citymapImg`) values(?,?,?,?,?,?,?)",
    [cityImg, cityContinent, cityNational, cityDesc, cityDesc2, cityDesc3, cityMapImg],
    (err, result, fields) => {
        res.send("등록되었습니다.");
        console.log(err);
    })
})


// gallery get 요청
app.get("/trip", async (req, res)=> {
    connection.query("select * from trip",
    (err, result, fields)=> {
        res.send(result)
    })
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
                connection.query("insert into members(userId, userPass, userName, userPost, userAdd, userAdd2, userTel, userPhone, userMail, userYear, userMonth, userDay, regdate, userCoupon) values(?,?,?,?,?,?,?,?,?,?,?,?,DATE_FORMAT(now(),'%Y-%m-%d'),1)",
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

// 검색 기능 (나중에 구현하기)
app.get('/search', async (req, res)=> {
    connection.query(
        `select * from trip where=`,
        // where `{$_POST['search_m']}` Like '%{$_POST['search']}%'
        (err, rows, fields)=> {
            res.send(rows)
        }
    )
})

// 서버실행
app.listen(port, () => {
    console.log("서버가 돌아가고 있습니다.")
})